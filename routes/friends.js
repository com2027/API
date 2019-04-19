//import express and express router
const express = require('express');
const router = express.Router();
//import the database models.
const db = require('../models');
const Sequelize = require('sequelize');

//import useful middleware
const checkAuth = require('../middleware/check-auth');
const checkUserMatch = require('../middleware/check-matching-user');

//ROUTES START HERE
////////////////////////////////////////////////////

router.get('/:id/followers', checkAuth, (req,res) => {
  //search for friends where the sender is the id in url and include the Users model
  db.Friends.findAll({where:{receiver : req.params.id}, include: [{model: db.User, as: 'followedBy'}]})
    .then((users)=>{
        res.status(200).json({users: users}); //if we could get the users followers then return the followers
    })
    .catch(() => { //if we couldn't connect to the db then throw an error
      res.status(500).json({error:"Unable to retrieve followers"});
    });
});

router.get('/:id/following', checkAuth, (req,res) => {
  //search for friends where the sender is the id in url and include the Users model
  db.Friends.findAll({where:{sender :req.params.id}, include: [{model: db.User, as: 'followingUser'}]})
    .then((users)=>{
        res.status(200).json({users: users}); //if we could get the users followers then return the followers
    })
    .catch(() => { //if we couldn't connect to the db then throw an error
      res.status(500).json({error:"Unable to retrieve followers"});
    });
});


router.post('/:id/friend', checkAuth, (req,res) => {
  //sender and recipient ids
  var sender_id = req.userData.id
  var receiver_id = req.params.id

  db.Friends.findAll( { where : { [Sequelize.Op.and] : {sender: sender_id, receiver: receiver_id } }} )
    .then((friends) => {
      if(friends.length == 0){
      //try and get the sender from the users table
      db.User.findAll({where:{id:sender_id}})
        .then((senders) => {
          if(senders.length > 0){ // if the list of senders is not empty
            db.User.findAll({where:{id:receiver_id}})//try and get the receiver from the users table
              .then((receivers) => {
                if(receivers.length > 0){ // if the list of receivers is not empty
                  //create the record in the friends table
                  senders[0].createFollowing({ sender: sender_id, receiver: receiver_id, blocked:0})
                    .catch((err) => console.log("Error " + err));
                  //send success response
                  res.status(200).json({message: "User friended"});
                }else{ //if the list of the receivers is empty
                  res.status(404).json({error:"User not found"}); //throw a 404
                }
              });
          }else{ //if the list of the senders is empty
            res.status(404).json({error:"User not found"}); //throw a 404
          }
        });
      }else{
        res.status(500).json({error:"Already following user"}); //throw a 404
      }
    });
});

router.delete('/:id/friend', checkAuth, (req, res) => {
  //sender and recipient ids
  var sender_id = req.userData.id
  var receiver_id = req.params.id
  //try and get the relationship from the friends table
  db.Friends.findAll( { where : { [Sequelize.Op.and] : {sender: sender_id, receiver: receiver_id } }} )
    .then((friends) => {
      if(friends.length > 0){ //if the length of the array is greater than 0 then
        friends[0].destroy() //delete friend
          .then(() => {
            res.status(200).json({message:"User unfriended"}); //send success if deleted successfully
          })
          .catch(() =>{
            res.status(500).json({error:"Unable to unfriend user"}); //throw a 500 if not deleted
          });
      }else{
        res.status(500).json({error:"Unable to unfriend user"}); //throw a 500 if unable to get friends
      }
    })
});

router.post('/:id/block', checkAuth, (req,res) => {
  //sender and recipient ids
  var sender_id = req.userData.id
  var receiver_id = req.params.id

  //try and get the relationship from the friends table
  db.Friends.findAll( { where : { [Sequelize.Op.and] : {sender: sender_id, receiver: receiver_id } }} )
    .then((friends) => {
      if(friends.length > 0){ //if the relationship is found
        friends[0].update({blocked:true}) //update the user setting blocked to true
          .then((updatedFriend) => { //if updated then
            res.status(200).json({message:"User blocked"}); //send success
          })
          .catch(() => { //if not updated then
            res.status(500).json({error:"Unable to block user"}); //throw a 404
          })
      }else{
        res.status(404).json({error:"Friends not found"}); //throw a 404
      }
    });
});

router.delete('/:id/block', checkAuth, (req,res) => {
  //sender and recipient ids
  var sender_id = req.userData.id
  var receiver_id = req.params.id

  //try and get the relationship from the friends table
  db.Friends.findAll( { where : { [Sequelize.Op.and] : {sender: sender_id, receiver: receiver_id } }} )
    .then((friends) => {
      if(friends.length > 0){ //if the relationship is found
        friends[0].update({blocked:false}) //update the user setting blocked to false
          .then((updatedFriend) => { //if updated then
            res.status(200).json({message:"User unblocked"}); //send success
          })
          .catch(() => { //if not updated then
            res.status(500).json({error:"Unable to unblock user"}); //throw a 404
          })
      }else{
        res.status(404).json({error:"Friends not found"}); //throw a 404
      }
    });
});

//ROUTES END HERE
////////////////////////////////////////////////////

module.exports = router;
