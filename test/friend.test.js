//import all necessary librarys
const chai =  require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');

//import database models
const db = require('../models');

//import helpers
const createUser = require('./helpers/create-user');
const loginUser = require('./helpers/login-user');
const createFriend = require('./helpers/create-friends');
//import data
const Users = require('./data/users');

//configure chai
chai.use(chaiHttp);
chai.should();

describe("Friends", () => {

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

  describe("Add Friends", () =>{
    it('should get the list of players that user1 is following', (done) => {
      //load user test data
      const user1 = Users.user1;
      const user2 = Users.user2;
      //create user 2
      createUser(user2)
        .then((created_user2) => {
          //create user 1
          createUser(user1)
            .then((created_user1) =>{
              //create user 1 following user 2
              createFriend(created_user1, created_user2,0)
                .then(() => {
                  //log in user 1
                  const token = loginUser(created_user1);
                  //attempt to get friends using the API
                  chai.request(app)
                    .get('/users/friends/'+created_user1.id+"/following") //GET /users/friends/:id/following
                    .set('Authorization', 'Bearer ' + token) //set authorization token to the token
                    .end((err,res) => {
                      res.should.have.status(200); //should have 200 response code
                      res.body.should.be.a('object'); //body should be a JSON object
                      res.body.should.have.property('users'); //and have property users
                      done();
                    });
                });
            });
        })
    });

    //...

  });

  describe("Remove Friends", () =>{

  });

  describe("Add Block", () =>{

  });

  describe("Remove Block", () =>{

  });
});
