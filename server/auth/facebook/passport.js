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
    process.nextTick(function() {
        findByFacebookId(User,profile,access_token,done);
    });
  }));
};

function findByFacebookId(User,profile,token,done){
   User.findOne({ 'facebook.id' : profile.id }, function(err, user) {
        if (err)
          return done(err);
          if (user) {
            return done(null, user); 
          } else {
            if(profile.emails.length > 0 && profile.emails[0].value)
                findByEmailId(User,profile,token,done);
            else
              createUser(User,profile,token,done);
         } 
      });
}

function findByEmailId(User,profile,token,done){
   User.findOne({ email : profile.emails[0].value}, function(err, user) {
        if (err)
          return done(err);
          if (user) {
            user.facebook    = {};
            user.facebook.id    = profile.id;                  
            user.facebook.fname  = profile.name.givenName;
            user.facebook.lname = profile.name.familyName;
            user.facebook.email = profile.emails[0].value; 
            user.facebook.token = token;    
            user.save(function(err) {
              if (err){ return done(err);}
               return done(null, user);
            });
          } else {
            createUser(User,profile,token,done);
         } 
    });
}

function createUser(User,profile,token,done){
    
    var newUser = new User();
    newUser.fname  = profile.name.givenName;
    newUser.lname = profile.name.familyName;
    if(profile.emails.length > 0 && profile.emails[0].value)
      newUser.email = profile.emails[0].value;
    newUser.profileStatus = 'incomplete';
    newUser.facebook    = {};
    newUser.facebook.id    = profile.id;                  
    newUser.facebook.firstName  = profile.name.givenName;
    newUser.facebook.lastName = profile.name.familyName;
    if(profile.emails.length > 0 && profile.emails[0].value)
      newUser.facebook.email = profile.emails[0].value; 
    newUser.facebook.token = token;
    newUser.provider = "facebook";    
    newUser.save(function(err) {
      if (err){ return done(err);}
       return done(null, newUser);
    });

}

