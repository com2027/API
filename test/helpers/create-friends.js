//import database models
const db = require('../../models');

const createFriends = async function(sender,receiver,blocked) {
    return sender.createFollowing({
      sender: sender.id,
      receiver:receiver.id,
      blocked: blocked
    });
}

module.exports = createFriends;
