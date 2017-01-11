var passport = require('passport');
var LinkedInStrategy = require('passport-linkedin').Strategy;

exports.setup = function (User, config) {

passport.use('linkedin', new LinkedInStrategy({
  consumerKey: config.linkedIn.clientID,
  consumerSecret: config.linkedIn.clientSecret,
  callbackURL: config.linkedIn.callbackURL
},
  function(access_token, refresh_token, profile, done) {
    //console.log("profile data",profile);
    process.nextTick(function() {
      findUserByLinkedInId(User,profile,access_token,done);
    });
  }));
};

function findUserByLinkedInId(User,profile,token,done){
  User.findOne({
      'linkedin.id': profile.id,
      deleted:false
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

    userObj.fname  = profile.name.givenName;
    userObj.lname = profile.name.familyName;
    userObj.profileStatus = "incomplete";
     userObj['linkedin'] = {};
    userObj.linkedin.id          = profile.id;
    userObj.linkedin.token       = token;
    userObj.linkedin.fname = profile.firstName;
    userObj.linkedin.lname = profile.lastName;

    userObj.provider = "linkedin";
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
