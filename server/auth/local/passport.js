var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

exports.setup = function (User, config) {
  passport.use(new LocalStrategy({
      usernameField: 'userId',
      passwordField: 'password' // this is the virtual field on the model
    },
    function(userId, password, done) {
      //email: email.toLowerCase(),
      var dataToSend ={};
      
      if (/^\d{10}$/.test(userId)) {
        dataToSend['mobile'] = userId;
      } else {
        dataToSend['email'] = userId.toLowerCase();
      }
      dataToSend['deleted'] = false;
      User.findOne(dataToSend, function(err, user) {
        if (err) return done(err);

        if (!user) {
          return done(null, false, { message: 'This user is not registered.' });
        }

        if (!user.status) {
          return done(null, false, { message: 'This user is Deactived.' });
        }

        if (!user.authenticate(password)) {
          return done(null, false, { message: 'This password is not correct.' });
        }
        return done(null, user);
      });
    }
  ));
};