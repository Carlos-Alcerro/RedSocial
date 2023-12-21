const Follow = require("../models/follow");
const followUsersId = async (IdentutyUserId) => {
  try {
    let following = await Follow.find({ user: IdentutyUserId })
      .select({ _id: 0, __v: 0, password: 0 })
      .exec();
    let followers = await Follow.find({ followed: IdentutyUserId })
      .select({ user: 1 })
      .exec();

    let followinClean = [];
    following.map((follow) => {
      followinClean.push(follow.followed);
    });

    let followersClean = [];
    followers.map((follow) => {
      followersClean.push(follow.user);
    });

    return {
      following: followinClean,
      followers: followersClean,
    };
  } catch (error) {
    console.log(error);
  }
};

const followThisUser = async (IndentutyUserId, profileUserId) => {
  let following = await Follow.findOne({
    user: IndentutyUserId,
    followed: profileUserId,
  });

  let followers = await Follow.findOne({
    user: profileUserId,
    followed: IndentutyUserId,
  });

  return {
    following,
    followers,
  };
};

module.exports = { followUsersId, followThisUser };
