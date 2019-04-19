//import database models
const db = require('../../models');

const createStat = async function(type, user, stat) {
  if(type === "fugitive"){
    return db.FugitiveStat.create({
      gid: stat.gid,
      uid: user.id,
      points: stat.points,
      challengesComplete: stat.challengesComplete,
      challengesFailed: stat.challengesFailed,
      won: stat.won
    });
  }else if(type==="bountyhunter"){
    return db.BountyHunterStat.create({
      gid: stat.gid,
      uid: user.id,
      points: stat.points,
      captures: stat.captures,
      won: stat.won
    });
  }else{
    throw Error("Invalid statistic type (should be either 'fugitive' or 'bountyhunter')")
  }
}

module.exports = createStat;
