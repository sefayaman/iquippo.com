
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

exports.setup = function (User, config) {
  passport.use(new GoogleStrategy({
      clientID: config.google.clientID,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackURL
    },
    function(accessToken, refreshToken, profile, done) {
      //console.log("google profile",profile);
      User.findOne({
        'google.id': profile.id
      }, function(err, user) {
        if (!user) {
          console.log('user not found');
          var userObj = {};
          var names = profile.displayName.split(" ");
          userObj["fname"] = names[0];
          if(names[1])
            userObj["lanme"] = names[1];
          userObj["email"] = profile.emails[0].value;
          userObj["password"] = "1234";
          userObj["google"] = profile._json;
          userObj.createdAt = new Date();
          userObj.updatedAt = new Date();
          user = new User(userObj);
          user.save(function(err) {
            if (err){ 
              console.log('error in creating user');
              done(err)
            };
            return done(err, user);
          });
        } else {
          return done(err, user);
        }
      });
    }
  ));
};
