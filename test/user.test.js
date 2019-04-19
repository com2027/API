//import all necessary librarys
const chai =  require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');
const bcrypt = require('bcrypt');

//import database models
const db = require('../models');

//import helper functions
const createUser = require('./helpers/create-user');
const loginUser = require('./helpers/login-user');
const deleteUser = require('./helpers/delete-user');
//import test data
const Users = require('./data/users');

//configure chai
chai.use(chaiHttp);
chai.should();

describe("User", () => {

  //before each test for the users function
  beforeEach(function(){
    //delete all data
    return db.BountyHunterStat.truncate({})
      .then(() => {
        return db.FugitiveStat.truncate({})
          .then(() => {
            return db.Friends.truncate({})
            .then(() => {
              return db.User.truncate({});
            });
          });
      });
  });


  //Register user Tests
  describe("Register", () =>{
    it("should register a user", (done) => {
      chai.request(app)
        .post('/users') //post request
        .set('content-type', 'application/json') //sets the request body to json
        .send(Users.user1) //send user details
        .end((err, res) => {
          res.should.have.status(201); //response should have status code 201
          res.body.should.be.a('object'); //response should be an object
          res.body.should.have.property('created'); //response should equal created
          done();
        });
    });
    it("should not register a user", (done) => {
      chai.request(app)
        .post('/users') //post request
        .set('content-type', 'application/json') //sets the request body to json
        .end((err, res) => {
          res.should.have.status(500); //response should have status code 500
          res.body.should.be.a('object'); //response should be an object
          res.body.should.have.property('error'); //response should have the property error
          res.body.error.should.equal('Unable to create user'); //response should equal unable to create user
          done();
        });
    });
  });


  //Login Tests
  describe("Login", () => {
    it('should login a user', (done) => {
      createUser(Users.user2).then(() => { //create user using user2 details from data/users.js
        var LoginCredentials = {username:Users.user2.username, password: Users.user2.password}; //creates loginCredentials equal to user1's username and password
        chai.request(app)
          .post('/users/login') //post request
          .set('Content-Type', 'application/json') //sets the request body to json
          .send(LoginCredentials) //send user login credentials
          .end((err,res) => {
            res.should.have.status(200); //response should have status code 200
            res.body.should.be.a('object'); //response should be an object
            res.body.should.have.property('token'); //response should have the property token
            done();
        });
      })
      .catch((err) => {
        console.log(err);
      })
    });
    it('should not login with an invalid username', (done) => {
      createUser(Users.user1).then(() => { //create user using user1 details from data/users.js
        var LoginCredentials = {username: "notauser", password: Users.user1.password}; //creates loginCredentials equal to user1's password and unknown username
        chai.request(app)
          .post('/users/login') //post request
          .set('content-type', 'application/json') //sets the request body to json
          .send(LoginCredentials) //send user login credentials
          .end((err,res) => {
            res.should.have.status(404); //response should have status code 404
            res.body.should.be.a('object');  //response should be an object
            res.body.should.have.property('error'); //response should have the property error
            res.body.error.should.equal('Username not found'); //response should equal username not found
            done();
          });
      });
    });
    it('should not login with an invalid password', (done) => {
      createUser(Users.user1).then(()=>{ //create user using user1 details from data/users.js
        var LoginCredentials = {"username":Users.user1.username, "password": "example1"}; //creates loginCredentials equal to user1's username and unknown password
        chai.request(app)
          .post('/users/login') //post request
          .set('content-type', 'application/json') //sets the request body to json
          .send(LoginCredentials) //send user login credentials
          .end((err,res) => {
            res.should.have.status(401); //response should have status code 401
            res.body.should.be.a('object'); //response should be an object
            res.body.should.have.property('error'); //response should have the property error
            res.body.error.should.equal('Incorrect Password'); //response should equal incorrect password
            done();
          });
      });
    });
  });


  //Get logged in user Tests
  describe("Get logged in user", () => {
    it("should get the logged in user from database", (done) => {
      createUser(Users.user1).then((user) => { //create user using user1 details from data/users.js
        const token = loginUser(user); //logs in created user1
        chai.request(app)
          .get('/users/me') //get request
          .set('Authorization', 'Bearer ' + token) //sets the logged in user to authorized
          .set('content-type', 'application/json') //sets the request body to json
          .end((err,res) => {
            res.should.have.status(200); //response should have status code 200
            res.body.should.be.a('object'); //response should be an object
            res.body.should.have.property('firstName');
            res.body.should.have.property('lastName');
            res.body.should.have.property('email');
            res.body.should.have.property('username');
            res.body.should.have.property('password');
            res.body.should.have.property('id');
            done();
          });
      });
    });
    it("shouldn't get user if user is not found", (done) => {
      createUser(Users.user2).then((user) => { //create user using user2 details from data/users.js
        const token = loginUser(user); //logs in created user1
        deleteUser(user) //deletes user1
          .then(function() {
            chai.request(app)
            .get('/users/me') //get request
            .set('Authorization', 'Bearer ' + token) //sets the logged in user to authorized
            .set('content-type', 'application/json') //sets the request body to json
            .end((err,res) => {
              res.should.have.status(404); //response should have status code 404
              res.body.should.be.a('object'); //response should be an object
              res.body.should.have.property('error'); //response should have the property error
              res.body.error.should.equal('User not found'); //response should equal user not found
              done();
            });
          });
      });
    });
    it("shouldn't get user if user is not authenticated", (done) => {
      createUser(Users.user1).then((user) => { //create user using user1 details from data/users.js
        const token = loginUser(user); //logs in created user1
        chai.request(app)
          .get('/users/me') //get request
          .set('content-type', 'application/json') //sets the request body to json
          .end((err,res) => {
            res.should.have.status(401); //response should have status code 401
            res.body.should.be.a('object'); //response should be an object
            res.body.should.have.property('error'); //response should have the property error
            res.body.error.should.equal('Authorization failed'); //response should equal authorization failed
            done();
          });
      });
    });
  });


  //Get user by user id Tests
  describe("Get a specific user by id", () => {
    it("should get the user from database", (done) => {
      const user1 = Users.user1; //sets user1 equal to user1 details from data/users.js
      createUser(user1) //creates user1
        .then(function(created_user1) {
          const token = loginUser(created_user1); //logs in created user1
          chai.request(app)
            .get('/users/' + created_user1.id) //get request
            .set('Authorization', 'Bearer ' + token) //sets the logged in user to authorized
            .set('content-type', 'application/json') //sets the request body to json
            .end((err,res) => {
            res.should.have.status(200); //response should have status code 200
            res.body.should.be.a('object'); //response should be an object
            res.body.should.have.property('firstName');
            res.body.should.have.property('lastName');
            res.body.should.have.property('email');
            res.body.should.have.property('username');
            res.body.should.have.property('password');
            res.body.should.have.property('id');
            done();
          });
        });
    });
    it("shouldn't get user if user is not found", (done) => {
      const user1 = Users.user1; //sets user1 equal to user1 details from data/users.js
      createUser(user1) //creates user1
        .then(function(created_user1) {
          const token = loginUser(created_user1); //logs in created user1
          deleteUser(created_user1) //deletes user1
            .then(function() {
              chai.request(app)
                .get('/users/' + created_user1.id) //get request
                .set('Authorization', 'Bearer ' + token) //sets the logged in user to authorized
                .set('content-type', 'application/json') //sets the request body to json
                .end((err,res) => {
                res.should.have.status(404); //response should have status code 404
                res.body.should.be.a('object'); //response should be an object
                res.body.should.have.property('error'); //response should have the property error
                res.body.error.should.equal('User not found'); //response should equal user not found
                done();
              });
            });
        });
    });
    it("shouldn't get user if user is not authorized", (done) => {
      const user1 = Users.user1; //sets user1 equal to user1 details from data/users.js
      createUser(user1) //creates user1
        .then(function(created_user1) {
          const token = loginUser(created_user1); //logs in created user1
          chai.request(app)
            .get('/users/' + created_user1.id) //get request
            .set('content-type', 'application/json') //sets the request body to json
            .end((err,res) => {
            res.should.have.status(401); //response should have status code 401
            res.body.should.be.a('object'); //response should be an object
            res.body.should.have.property('error'); //response should have the property error
            res.body.error.should.equal('Authorization failed'); //response should equal authorization failed
            done();
          });
        });
    });
  });


  //Update user Tests
  describe("Update User", () => {
    it("should allow user to update", (done) => {
      const user1 = Users.user1; //sets user1 equal to user1 details from data/users.js
      createUser(user1) //creates user1
        .then(function(created_user1){
          const token = loginUser(created_user1); //logs in created user1
          chai.request(app)
            .put('/users/' + created_user1.id) //put request
            .set('Authorization', 'Bearer ' + token) //sets the logged in user to authorized
            .set('content-type', 'application/json') //sets the request body to json
            .end((err,res) => {
              res.should.have.status(201); //response should have status code 201
              res.body.should.be.a('object'); //response should be an object
              res.body.should.have.property('firstName');
              res.body.should.have.property('lastName');
              res.body.should.have.property('email');
              res.body.should.have.property('username');
              res.body.should.have.property('password');
              res.body.should.have.property('id');
              done();
            });
        });
    });
    it("shouldn't update unfound user", (done) => {
      const user1 = Users.user1; //sets user1 equal to user1 details from data/users.js
      createUser(user1) //creates user1
        .then(function(created_user1){
          const token = loginUser(created_user1); //logs in created user1
          deleteUser(created_user1) //deletes user1
            .then(function() {
              chai.request(app)
                .put('/users/' + created_user1.id) //put request
                .set('Authorization', 'Bearer ' + token) //sets the logged in user to authorized
                .set('content-type', 'application/json') //sets the request body to json
                .end((err,res) => {
                  res.should.have.status(404); //response should have status code 404
                  res.body.should.be.a('object'); //response should be an object
                  res.body.should.have.property('error'); //response should have the property error
                  res.body.error.should.equal("User not found"); //response should equal user not found
                  done();
                });
            });
        });
    });
    it("shouldn't allow a user to update another user", (done) => {
      const user1 = Users.user1; //sets user1 equal to user1 details from data/users.js
      const user2 = Users.user2; //sets user2 equal to user2 details from data/users.js
      createUser(user1) //creates user1
        .then(function(created_user1){
          createUser(user2) //creates user2
            .then(function(created_user2){
              const token = loginUser(created_user1); //logs in created user1
              chai.request(app)
                .put('/users/' + created_user2.id) //put request
                .set('Authorization', 'Bearer ' + token) //sets the logged in user to authorized
                .set('content-type', 'application/json') //sets the request body to json
                .end((err,res) => {
                  res.should.have.status(401); //response should have status code 401
                  res.body.should.be.a('object'); //response should be an object
                  res.body.should.have.property('error'); //response should have the property error
                  res.body.error.should.equal("Authorization failed"); //response should equal authorization failed
                  done();
                });
            });
          });
    });
  });


  //Get user by username Tests
  describe("Get a specific user by username", () => {
    it("should get the user from database", (done) => {
      const user1 = Users.user1; //sets user1 equal to user1 details from data/users.js
      createUser(user1) //creates user1
        .then(function(created_user1) {
          const token = loginUser(created_user1); //logs in created user1
          chai.request(app)
            .get('/users/search/' + created_user1.username) //get request
            .set('Authorization', 'Bearer ' + token) //sets the logged in user to authorized
            .set('content-type', 'application/json') //sets the request body to json
            .end((err,res) => {
            res.should.have.status(200); //response should have status code 200
            res.body.users.should.be.an('array'); //response should be an array
            done();
          });
        });
    });
    it("should not get user if user is not found", (done) => {
      const user1 = Users.user1; //sets user1 equal to user1 details from data/users.js
      createUser(user1) //creates user1
        .then(function(created_user1) {
          const token = loginUser(created_user1); //logs in created user1
          deleteUser(created_user1) //deletes user1
            .then(function() {
              chai.request(app)
                .get('/users/search/' + created_user1.username) //get request
                .set('Authorization', 'Bearer ' + token) //sets the logged in user to authorized
                .set('content-type', 'application/json') //sets the request body to json
                .end((err,res) => {
                res.should.have.status(404); //response should have status code 404
                res.body.should.have.property('error'); //response should have the property error
                res.body.error.should.equal('Users not found'); //response should equal user not found
                done();
              });
            });
        });
    });
    it("should not get user if user is not authorized", (done) => {
      const user1 = Users.user1; //sets user1 equal to user1 details from data/users.js
      createUser(user1) //creates user1
        .then(function(created_user1) {
          const token = loginUser(created_user1); //logs in created user1
          chai.request(app)
            .get('/users/search/' + created_user1.username) //get request
            .set('content-type', 'application/json') //sets the request body to json
            .end((err,res) => {
            res.should.have.status(401); //response should have status code 401
            res.body.should.be.a('object'); //response should be an object
            res.body.should.have.property('error'); //response should have the property error
            res.body.error.should.equal('Authorization failed'); //response should equal authorization failed
            done();
          });
        });
    });
  });


  //Delete users Tests
  describe("Delete users", () => {
    it("should delete user", (done) => {
      const user1 = Users.user1; //sets user1 equal to user1 details from data/users.js
      createUser(user1) //creates user1
        .then(function(created_user1) {
          const token = loginUser(created_user1); //logs in created user1
          var LoginCredentials = {username:Users.user1.username, password: Users.user1.password}; //creates loginCredentials equal to user1's username and password
          chai.request(app)
            .delete('/users/' + created_user1.id) //delete request
            .set('Authorization', 'Bearer ' + token) //sets the logged in user to authorized
            .set('content-type', 'application/json') //sets the request body to json
            .send(LoginCredentials) //send user login credentials
            .end((err,res) => {
            res.should.have.status(204); //response should have status code 204
            done();
          });
        });
    });
    it("shouldn't delete user", (done) => {
      const user1 = Users.user1; //sets user1 equal to user1 details from data/users.js
      createUser(user1) //creates user1
        .then(function(created_user1) {
          const token = loginUser(created_user1); //logs in created user1
          chai.request(app)
            .delete('/users/' + created_user1.id) //delete request
            .set('Authorization', 'Bearer ' + token) //sets the logged in user to authorized
            .set('content-type', 'application/json') //sets the request body to json
            .end((err,res) => {
            res.should.have.status(500); //response should have status code 500
            res.body.should.have.property('error'); //response should have the property error
            done();
          });
        });
    });
    it("shouldn't delete user if user cannot be found", (done) => {
      const user1 = Users.user1; //sets user1 equal to user1 details from data/users.js
      createUser(user1) //creates user1
        .then(function(created_user1) {
          const token = loginUser(created_user1); //logs in created user1
          var LoginCredentials = {username: Users.user1.username, password: Users.user1.password}; //creates loginCredentials equal to user1's username and password
          deleteUser(created_user1) //deletes user1
            .then(function() {
              chai.request(app)
                .delete('/users/' + created_user1.id) //delete request
                .set('Authorization', 'Bearer ' + token) //sets the logged in user to authorized
                .set('content-type', 'application/json') //sets the request body to json
                .send({password: Users.user1.password}) //send user1 password
                .end((err,res) => {
                res.should.have.status(404); //response should have status code 404
                res.body.should.have.property('error'); //response should have the property error
                res.body.error.should.equal('User not found'); //response should equal user not found
                done();
              });
            });
        });
    });
    it("shouldn't delete user if user is not authenticated", (done) => {
      const user1 = Users.user1; //sets user1 equal to user1 details from data/users.js
      createUser(user1) //creates user1
        .then(function(created_user1) {
          const token = loginUser(created_user1); //logs in created user1
          chai.request(app)
            .delete('/users/' + created_user1.id) //delete request
            .set('content-type', 'application/json') //sets the request body to json
            .end((err,res) => {
            res.should.have.status(401); //response should have status code 401
            res.body.should.have.property('error'); //response should have the property error
            res.body.error.should.equal('Authorization failed'); //response should equal authorization failed
            done();
          });
        });
    });
  });


  //Change user password Tests
  describe("Change user password", () => {
    it("should change user password", (done) => {
      const user1 = Users.user1; //sets user1 equal to user1 details from data/users.js
      createUser(user1) //creates user1
        .then(function(created_user1) {
          const token = loginUser(created_user1); //logs in created user1
          var LoginCredentials = {username:Users.user1.username, password: Users.user1.password}; //creates loginCredentials equal to user1's username and password
          chai.request(app)
            .put('/users/' + created_user1.id + '/changepassword') //put request
            .set('Authorization', 'Bearer ' + token) //sets the logged in user to authorized
            .set('content-type', 'application/json') //sets the request body to json
            .send({password: Users.user1.password, newPassword: "password123"}) //send user1 password and user1's new password
            .end((err,res) => {
            res.should.have.status(200); //response should have status code 200
            res.body.should.be.a('object'); //response should be an object
            done();
          });
        });
    });
    it("shouldn't change user password if user cannot be found", (done) => {
      const user1 = Users.user1; //sets user1 equal to user1 details from data/users.js
      createUser(user1) //creates user1
        .then(function(created_user1) {
          const token = loginUser(created_user1); //logs in created user1
          var LoginCredentials = {username:Users.user1.username, password: Users.user1.password}; //creates loginCredentials equal to user1's username and password
          deleteUser(created_user1) //deletes user1
            .then(function() {
              chai.request(app)
                .put('/users/' + created_user1.id + '/changepassword') //put request
                .set('Authorization', 'Bearer ' + token) //sets the logged in user to authorized
                .set('content-type', 'application/json') //sets the request body to json
                .send({password: Users.user1.password, newPassword: "password123"}) //send user1 password and user1's new password
                .end((err,res) => {
                res.should.have.status(404); //response should have status code 404
                res.body.should.be.a('object'); //response should be an object
                res.body.should.have.property('error'); //response should have the property error
                res.body.error.should.equal('User not found'); //response should equal user not found
                done();
              });
            });
        });
    });
    it("should change user password if current password is incorrect", (done) => {
      const user1 = Users.user1; //sets user1 equal to user1 details from data/users.js
      createUser(user1) //creates user1
        .then(function(created_user1) {
          const token = loginUser(created_user1); //logs in created user1
          var LoginCredentials = {username:Users.user1.username, password: Users.user1.password}; //creates loginCredentials equal to user1's username and password
          chai.request(app)
            .put('/users/' + created_user1.id + '/changepassword') //put request
            .set('Authorization', 'Bearer ' + token) //sets the logged in user to authorized
            .set('content-type', 'application/json') //sets the request body to json
            .send({password: "incorrect", newPassword: "password123"}) //send incorrect password and user1's new password
            .end((err,res) => {
            res.should.have.status(401); //response should have status code 401
            res.body.should.be.a('object'); //response should be an object
            res.body.should.have.property('error'); //response should have the property error
            res.body.error.should.equal('Authorization failed'); //response should equal authorization failed
            done();
          });
        });
    });
    it("should change user password", (done) => {
      const user1 = Users.user1; //sets user1 equal to user1 details from data/users.js
      createUser(user1) //creates user1
        .then(function(created_user1) {
          const token = loginUser(created_user1); //logs in created user1
          var LoginCredentials = {username:Users.user1.username, password: Users.user1.password}; //creates loginCredentials equal to user1's username and password
          chai.request(app)
            .put('/users/' + created_user1.id + '/changepassword') //put request
            .set('Authorization', 'Bearer ' + token) //sets the logged in user to authorized
            .set('content-type', 'application/json') //sets the request body to json
            .end((err,res) => {
            res.should.have.status(500); //response should have status code 500
            res.body.should.be.a('object'); //response should be an object
            res.body.should.have.property('error'); //response should have the property error
            res.body.error.should.equal('Unable to update password'); //response should be equal to unable to update password
            done();
          });
        });
    });
  });
});
