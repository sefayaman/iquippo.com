var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;

exports.setup = function (User, config) {

passport.use('twitter', new TwitterStrategy({
  consumerKey: config.twitter.clientID,
  consumerSecret: config.twitter.clientSecret,
  callbackURL: config.twitter.callbackURL
},
  function(access_token, refresh_token, profile, done) {

    process.nextTick(function() {
      findUserByTwitterId(User,profile,access_token,done);
    });
  }));
};

function findUserByTwitterId(User,profile,token,done){
  User.findOne({
      'twitter.id': profile.id
    }, function(err, user) {
      if (!user) {
        createUser(User,profile,token,done);
      } else {
        return done(err, user);
      }
    });
}

function createUser(User,profile,token,done){
    var userObj = {};

    userObj["fname"] = profile.displayName;
    userObj.profileStatus = "incomplete";

     userObj['twitter'] = {};
    userObj.twitter.id          = profile.id;
    userObj.twitter.token       = token;
    userObj.twitter.username = profile.username;
    userObj.twitter.displayName = profile.displayName;

    userObj.provider = "google";
    userObj.createdAt = new Date();
    userObj.updatedAt = new Date();
    user = new User(userObj);
    user.save(function(err) {
      if (err){ 
        console.log('error in creating user');
       return done(err)
      };
      return done(err, user);
    });
}
