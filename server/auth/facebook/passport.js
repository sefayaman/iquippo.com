var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

var jwt = require('jsonwebtoken');
var UserModel = null;
var configObj = null;

exports.setup = function (User, config) {
UserModel = User;
configObj = config;
passport.use('facebook', new FacebookStrategy({
  clientID: config.facebook.clientID,
  clientSecret: config.facebook.clientSecret,
  callbackURL: config.facebook.callbackURL,
  profileFields: ['id', 'displayName','name' ,'link', 'photos', 'email']
},
  function(access_token, refresh_token, profile, done) {
    //console.log(profile);
    process.nextTick(function() {
        findByFacebookId(User,profile,access_token,done);
    });
  }));
};

exports.login = function(req,res){
  var bodyData = req.body;
  var profile = {};
  profile.id = bodyData.id;
  if(bodyData.email){
     profile.emails = [{}];
     profile.emails[0].value = bodyData.email;
  }
  profile.name = {};
  profile.name.givenName = bodyData.first_name;
  profile.name.familyName = bodyData.last_name;
  findByFacebookId(UserModel,profile,"",function(err,user){
    if(err){
        return handleError(res,err);
    }else{
      var token = jwt.sign({_id: user._id }, configObj.secrets.session, { expiresInMinutes: 60*5 });
      res.json({ token: token });
    }
  });
}

function findByFacebookId(User,profile,token,done){
   User.findOne({ 'facebook.id' : profile.id,deleted:false }, function(err, user) {
        if (err)
          return done(err);
          if (user) {
            return done(null, user); 
          } else {
            if(profile.emails && profile.emails.length > 0 && profile.emails[0].value)
                findByEmailId(User,profile,token,done);
            else
              createUser(User,profile,token,done);
         } 
      });
}

function findByEmailId(User,profile,token,done){
   User.findOne({ email : profile.emails[0].value,deleted:false}, function(err, user) {
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
    if(profile.emails && profile.emails.length > 0 && profile.emails[0].value)
      newUser.email = profile.emails[0].value;
    newUser.profileStatus = 'incomplete';
    newUser.facebook    = {};
    newUser.facebook.id    = profile.id;                  
    newUser.facebook.firstName  = profile.name.givenName;
    newUser.facebook.lastName = profile.name.familyName;
    if(profile.emails && profile.emails.length > 0 && profile.emails[0].value)
      newUser.facebook.email = profile.emails[0].value; 
    newUser.facebook.token = token;
    newUser.provider = "facebook";    
    newUser.save(function(err) {
      if (err){ return done(err);}
       return done(null, newUser);
    });

}

