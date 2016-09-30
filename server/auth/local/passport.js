var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

exports.setup = function (User, config) {
  passport.use(new LocalStrategy({
      usernameField: 'userId',
      passwordField: 'password', // this is the virtual field on the model
      passReqToCallback: true
    },
    function(req, userId, password, done) {
      var dataToSend ={};
      
      if (/^\d{10}$/.test(userId)) {
        dataToSend['mobile'] = userId;
      } else {
        dataToSend['email'] = userId.toLowerCase();
      }
      dataToSend['deleted'] = false;
      //dataToSend['status'] = true;
      User.findOne(dataToSend, function(err, user) {
        if (err) return done(err);

        if (!user) {
          return done(null, false, { message: 'This user is not registered.' });
        }

        /*if (req.body.isManpower && !user.isManpower) {
          return done(null, false, { message: 'Not valid crediential.' });
        }*/
        /*var isManpower = false;
        if(req.body.isManpower)
          var isManpower = true;
        else
          var isManpower = false;
        if(!(user.isPartner && user.isManpower)) {
          if ((!isManpower && user.isManpower) || (isManpower && !user.isManpower)) {
            return done(null, false, { message: 'Not valid crediential.' });
          }
        }*/

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