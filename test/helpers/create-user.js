const bcrypt = require('bcrypt');

//import database models
const db = require('../../models');

const createUser = async function(user) {
  //hash the password "test"
  return bcrypt.hash(user.password, 10)
    .then((hash) => {
      //create the user object
      return db.User.create({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        password: hash
      });
    });
}

module.exports = createUser;
