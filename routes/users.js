//import express and express router
const express = require('express');
const router = express.Router();
//import the database models.
const db = require('../models');
const Sequelize = require('sequelize');
const PushNotifications = require('@pusher/push-notifications-server');

//import bcrypt and jsonwebtoken and nodemailer
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mailer = require('../lib/mailer');

//import useful middleware
const checkAuth = require('../middleware/check-auth');
const checkUserMatch = require('../middleware/check-matching-user');

//get the beams client for pusher
const beamsClient = new PushNotifications({
  instanceId: '271b1eac-1469-406c-97c8-632da3eb6367',
  secretKey: process.env.PUSHER_KEY
});

//ROUTES BEGIN HERE
////////////////////////////////////////////////////

//Register user route
router.post('/', (req,res) => {
  //Try and hash the password
  bcrypt.hash(req.body.password, 10)
    //if able to hash password
    .then((hash) => {
      //make a new user object
      const newUser = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        username: req.body.username,
        email: req.body.email,
        password: hash,
      }
      //try and create the user in the database
      db.User.create(newUser)
        //if able to create user
        .then((createdUser) => {
          //send response with created user object
          res.status(201).json({created:createdUser});
        })
        //if unable to create user
        .catch((err) => {
          //send response with error information
          res.status(500).json({error: err});
        });
    })
    .catch((err) => {
        res.status(500).json({error: "Unable to create user"});
    })
});

//Login user route
router.post('/login', (req,res) => {
  //get all the users from the database where the username is the same as the user trying to log in
  db.User.findAll({where:{username:req.body.username}})
    .then((users) => {
        //if the list of users return is not empty
        if(users.length > 0){
          //check the provided password against hashed password in database
          bcrypt.compare(req.body.password, users[0].password)
            .then((result) => {
              //if the password matched
              if(result){
                //generate a 4 week JWT which stores the user's ID and uses the SECRET_KEY env variable or dev to sign.
                const token = jwt.sign({id:users[0].id}, process.env.SECRET_KEY || 'dev', {expiresIn:'4 weeks'});
                //send respose with token in
                res.status(200).json({token:token});
              }else{ //if the password did not match
                //send incorrect password error
                res.status(401).json({error:"Incorrect Password"});
              }
            })
            .catch(() => {
              res.status(500).json({error:"Unable to log user in"});
            })
        }else{ //if the list of users returned is empty
          //send incorrect username error
          res.status(404).json({error:"Username not found"});
        }
    })
    .catch(() => {
        res.status(500).json({error: "DB error"});
    })
});

//API route for server to check email for password reset
router.patch('/resetpassword', (req,res) => {
  const BASE_URL = req.protocol + "://" + req.get('host') + "/";
  //check if user exists
  db.User.findAll({where:{email:req.body.email}})
    .then((users) => {
      //if user exists
      if(users.length > 0){
        //generate a jwt valid for 15 minutes
        const token = jwt.sign({id:users[0].id,pw_reset:true}, process.env.SECRET_KEY || 'dev', { expiresIn:'15m' });
        const url = BASE_URL + "users/resetpassword?token="+token;
        const now = new Date();
        //send an email to user with link containing token
        if(!mailer.sendMail("Bounty Hunter <info@bountyhunt.me>",req.body.email,"Reset your password", "Your url is " + url, false, "./assets/emails/forgotpassword.html",{URL:url, firstName:users[0].firstName, year: now.getFullYear()})){
          res.status(200).json({message: "Password reset sent to email"});
        }else{
          res.status(500).json({message: "Unable to send email"});
        }
      }else{ //if user doesn't exist
        res.status(404).json({error:"User not found"});//throw 404 error
      }
    });
});

//UI Route for user to reset password
router.get('/resetpassword', (req,res) => {
    //render a reset password form
    res.render('resetpassword',{token: req.query.token});
});

router.post('/resetpassword/:token', (req,res) => {
  //attempt to verify token
  try{ //if verifiable
    const token = req.params.token;
    const decoded = jwt.verify(token, process.env.SECRET_KEY || 'dev');
    //try and hash the new password
    bcrypt.hash(req.body.newpassword, 10)
      .then((hash) => { //if hashable
        //find the user in the database using the decoded JWT
        db.User.findAll({where: {id: decoded.id}})
          .then((users) => {
            //Check if the user exists
            if(users.length > 0){
              //if the user exists then update the hashed password in the database
              users[0].update({password:hash});
              //send the success response
              res.status(200).json({message:"Password reset"});
            }else{ //if user is not found
              //send a 404 error
              res.status(404).json({error:"User not found"});
            }
          })
          .catch(() => { // If db throws an error then handle it
            res.status(500).json({error:"Unable to connect to DB"});
          })
      })
      .catch(() => { //if we can't hash the new password
        res.status(500).json({error:"Unable to set new password"});
      });
  }catch(err){ //if the token could not be verified
    res.status(401).json({error:"Invalid token"});
  }
});

//Get me route
router.get('/me', checkAuth, (req,res) => {
  //search for user in database where the id is the id in the JWT
  db.User.findAll({where:{id:req.userData.id}})
    .then((users) => {
      //if the list of users is not empty then
      if(users.length > 0){
        //return the user
        res.status(200).json(users[0]);
      }else{ //if list is empty
        //return user not found error
        res.status(404).json({error:"User not found"});
      }
    })
    .catch(() => {
        res.status(500).json({error: "DB error"});
    })
});

//Get user route
router.get('/:id', checkAuth, (req,res) => {
  //search for user in database where the id is the id provided
  db.User.findAll({where:{id:req.params.id}})
    .then((users) => {
      //if the list of users is not empty then
      if(users.length > 0){
        //return the user
        res.status(200).json(users[0]);
      }else{ //if list is empty
        //return user not found error
        res.status(404).json({error:"User not found"});
      }
    })
    .catch(() => {
        res.status(500).json({error: "DB error"});
    })
});

//Search user route
router.get('/search/:username', checkAuth, (req,res) => {
  //search for user in database where username is like the username provided
  db.User.findAll({where:{username:{[Sequelize.Op.like]:`%`+req.params.username+`%`}}})
    .then((users) => {
      if(users.length > 0){ //if the users list is not empty
        res.status(200).json({users:users}); //send response with users array
      }else{ //if the users listis empty
        res.status(404).json({error:"Users not found"}); //send 404 error no users exist
      }
    })
    .catch(() => {
        res.status(500).json({error: "DB error"});
    })
});

//Route to grant user their beam authentication token
router.get('/pusher/beams-auth', checkAuth, (req,res)=> {
  const beamsToken = beamsClient.generateToken(req.userData.id);
  res.status(200).json(beamsToken);
});

//Update user route
router.put('/:id', checkAuth, checkUserMatch, (req,res) => {
  //search for user in database where id is the id provided
  db.User.findAll({where:{id:req.params.id}})
    .then((users) => {
      //if the list of users is not empty then
      if(users.length > 0){
        //check if the user is trying to update their password
        if(typeof req.body.password !== 'undefined' || typeof req.body.id !== 'undefined' || typeof req.body.createdAt !== 'undefined' || typeof req.body.updatedAt !== 'undefined' || typeof req.body.active !== 'undefined' || typeof req.body.verified !== 'undefined'){
          res.status(400).json({error:"Cannot update that field"}); //send the response with the updated user
        }else{ //if user is not trying to update their password
          //update the user without worrying about the password
          users[0].update(req.body)
            .then((updatedUser) => { //if the user can be updated
              res.status(201).json(updatedUser); //send the response with the updated user
            })
            .catch((err) => { //if the user can't be updated
              res.status(500).json({error:"Unable to update user"}); //send a response with the error message
            })
        }
      }else{ //if list is empty
        //return user not found error
        res.status(404).json({error:"User not found"});
      }
    })
    .catch(() => {
        res.status(500).json({error: "DB error"});
    })
});

//Change passsword user route
router.put('/:id/changepassword', checkAuth, checkUserMatch, (req,res) => {
  //search for user in database where id is the id provided
  db.User.findAll({where:{id:req.params.id}})
    .then((users) => {
      //if the list of users is not empty then
      if(users.length > 0){
        //check the user has entered their password correctly
        bcrypt.compare(req.body.password, users[0].password)
          .then((result) => {
            if(result){
              //make new password hash
              bcrypt.hash(req.body.newPassword, 10)
                //if able to hash password
                .then((hash) => {
                  //try to delete user
                  users[0].update({password:hash})
                    .then((updatedUser) => { //if the user can be deleted
                      res.status(200).json(updatedUser); //send response with deleted user
                    })
                    .catch(() => { //if the user can't be deleted
                      res.status(500).json({error:"Unable to update password"}); //send response with error message
                    });
                })
                .catch(() => {
                  res.status(500).json({error:"Unable to hash new password"}); //send response with error message
                });
            }else{ //if the user hasn't entered their password correctly
              res.status(401).json({error:"Authorization failed"});
            }
          })
          .catch(() => { //if we can't hash the password
            res.status(500).json({error:"Unable to update password"});
          });
      }else{ //if list is empty
        //return user not found error
        res.status(404).json({error:"User not found"});
      }
    })
    .catch(() => {
        res.status(500).json({error: "DB error"});
    })
});

//Delete user route
router.delete('/:id', checkAuth, checkUserMatch, (req,res) => {
  //search for user in database where id is the id provided
  db.User.findAll({where:{id:req.params.id}})
    .then((users) => {
      //if the list of users is not empty then
      if(users.length > 0){
        //check the user has entered their password correctly
        bcrypt.compare(req.body.password, users[0].password)
          .then((result) => {
            if(result){
              //try to delete user
              users[0].destroy()
                .then((deletedUser) => { //if the user can be deleted
                  res.status(204).json(deletedUser); //send response with deleted user
                })
                .catch((err) => { //if the user can't be deleted
                  console.log("DB ERROR: " + err)
                  res.status(500).json({error:"Unable to delete user"}); //send response with error message
                });
            }else{ //if the user hasn't entered their password correctly
              res.status(401).json({error:"Authorization failed"});
            }
          })
          .catch((err) => { //if we can't hash the password
            // console.log("HASH ERROR: " + err)
            res.status(500).json({error:"Unable to delete user"});
          });
      }else{ //if list is empty
        //return user not found error
        res.status(404).json({error:"User not found"});
      }
    })
    .catch((err) => {
      console.log("DB ERROR: " + err)
        res.status(500).json({error: "DB error"});
    })
});


//ROUTES END HERE
////////////////////////////////////////////////////

module.exports = router;
