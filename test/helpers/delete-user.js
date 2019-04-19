const bcrypt = require('bcrypt');

//import database models
const db = require('../../models');

const createUser = async function(user) {
  //create the user object
  return db.User.findAll({
    where: {
      id: user.id
    }
  }).then((foundUser) => {
    return foundUser[0].destroy();
  });
}

module.exports = createUser;
