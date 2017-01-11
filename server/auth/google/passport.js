
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var jwt = require('jsonwebtoken');
var UserModel = null;
var configObj = null;


exports.setup = function (User, config) {
  UserModel = User;
  configObj = config;
  passport.use(new GoogleStrategy({
      clientID: config.google.clientID,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackURL
    },
    function(accessToken, refreshToken, profile, done) {
      findUserByGoogleId(User,profile,accessToken,done);
    }
  ));
};

exports.login = function(req,res){
  var bodyData = req.body;
  var profile = {};
  profile.id = bodyData.id;
  profile.emails = [{}];
  profile.emails[0].value = bodyData.email;
  profile.name = bodyData.name;
  profile.givenName = bodyData.given_name;
  profile.familyName = bodyData.family_name;
  findUserByGoogleId(UserModel,profile,"",function(err,user){
    if(err){
        return handleError(res,err);
    }else{
      var token = jwt.sign({_id: user._id }, configObj.secrets.session, { expiresInMinutes: 60*5 });
      res.json({ token: token });
    }
  });
}

function findUserByGoogleId(User,profile,token,done){
  User.findOne({
      'google.id': profile.id,
      deleted:false
    }, function(err, user) {
      if (!user) {
        findUserByEmail(User,profile,token,done);
      } else {

        return done(err, user);
      }
    });
}

function findUserByEmail(User,profile,token,done){
  User.findOne({
      'email': profile.emails[0].value,
      deleted:false
    }, function(err, user) {
      if (!user) {
        createUser(User,profile,token,done);
      } else {
        user.google = {};
        user.google.id = profile.id;
        user.google.name = profile.name;
        user.google.token = token;
        user.provider = "google";
        user.updatedAt = new Date();
        user.save(function(err){
          if (err){ 
            console.log('error in creating user');
            return done(err)
          };
          return done(err, user);
        });
      }
    });
}

function createUser(User,profile,token,done){
    var userObj = {};
    userObj["fname"] = profile.name.givenName;
    userObj["lanme"] = profile.name.familyName;
    userObj["email"] = profile.emails[0].value; 
    userObj.google = {};
    userObj.google.id = profile.id;
    userObj.google.name = profile.name;
    userObj.google.token = token;
    userObj.provider = "google";
    userObj.profileStatus = 'incomplete';
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

function handleError(res, err) {
  return res.status(500).send(err);
}