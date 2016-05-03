var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

exports.setup = function (User, config) {

passport.use('facebook', new FacebookStrategy({
  clientID: config.facebook.clientID,
  clientSecret: config.facebook.clientSecret,
  callbackURL: config.facebook.callbackURL,
  profileFields: ['id', 'displayName','name' ,'link', 'photos', 'email']
},
  function(access_token, refresh_token, profile, done) {
    console.log(profile);
    process.nextTick(function() {

      User.findOne({ 'facebook.id' : profile.id }, function(err, user) {
 
        if (err)
          return done(err);
          if (user) {
            return done(null, user); 
          } else {
            var newUser = new User();
            newUser.password = "12345";
            newUser.fname  = profile.name.givenName;
            newUser.lname = profile.name.familyName;
            newUser.email = profile.emails[0].value;
            newUser.facebook    = profile._json;                
            newUser.facebook.access_token = access_token;    
            newUser.save(function(err) {
              if (err){ return done(err);}
               return done(null, newUser);
            });
         } 
      });
    });
  }));
};
