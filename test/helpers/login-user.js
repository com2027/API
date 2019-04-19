const jwt = require('jsonwebtoken');

//import database models
const db = require('../../models');

const loginUser = function(user) {
  //hash the password "test"
  return jwt.sign({id:user.id}, process.env.SECRET_KEY || 'dev', {expiresIn:'1 min'});
}

module.exports = loginUser;
