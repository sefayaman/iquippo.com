'use strict';

var _ = require('lodash');
var User = require('./../user/user.model');
var auth = require('./../../auth/externalauth.service.js');

var config = require('./../../config/environment');

exports.setCustomerData = function(req,res){

   res.cookie("sourcing_user_type",'EC',{ domain: '.iquippo.com' });
   res.cookie("sourcing_user_name","",{ domain: '.iquippo.com' });
   res.cookie("sourcing_user_mobile","",{ domain: '.iquippo.com' });
   res.cookie("email","",{ domain: '.iquippo.com' });
   res.cookie("location","",{ domain: '.iquippo.com' });
   res.cookie("dealership_name","",{ domain: '.iquippo.com' });
   res.cookie("access_token","",{ domain: '.iquippo.com' });
   if(req.query._id){
    User.findById(req.query._id,function(err,user){
      if(err){return handleError(res,err);}
      if(!user)return res.status(404).send("User Not Found");
      var userEmail = user.email;
      var isCpDesk = false;
      if(userEmail){
        var emailParts = userEmail.split('@');
        if(emailParts.length && emailParts.length === 2 && emailParts[0].indexOf('cpdesk') !== -1 && emailParts[1] === 'iquippo.com')
          isCpDesk = true;
      }
      if(isCpDesk)
        res.cookie("sourcing_user_type",'CD',{ domain: '.iquippo.com' });
      else if(user.role === 'admin')
        res.cookie("sourcing_user_type",'AD',{ domain: '.iquippo.com' });
      else if(user.role === 'enterprise' && isServiceAvailed(user,'Finance'))
        res.cookie("sourcing_user_type",'EU',{ domain: '.iquippo.com' });
      else if(user.role === 'channelpartner')
        res.cookie("sourcing_user_type",'CP',{ domain: '.iquippo.com' });
      else
        res.cookie("sourcing_user_type",'EC',{ domain: '.iquippo.com' });

    var userName = user.fname;
        if(user.mname)
          userName += " " + user.mname;
        userName += " " + user.lname;
        res.cookie("sourcing_user_name",userName,{ domain: '.iquippo.com'});
    res.cookie("sourcing_user_mobile",user.mobile,{ domain: '.iquippo.com' });
    res.cookie("email",user.email || "",{ domain: '.iquippo.com' });
    res.cookie("location",user.city || "",{ domain: '.iquippo.com' });
    res.cookie("dealership_name",user.company || "",{ domain: '.iquippo.com' });
    var token = auth.signToken(user._id,user.role,20);
    res.cookie("access_token",token,{ domain: '.iquippo.com' });
      res.status(200).send(config.REDIRECT_URL);
    });
   }else
    return res.status(200).send(config.REDIRECT_URL);

  function isServiceAvailed(user,service){
    if(user.availedServices && user.availedServices.length > 0){
          for(var i=0;i<user.availedServices.length;i++){
           if(user.availedServices[i].code === service)
            return true;
          }
        }
        return false;
  }
};

function handleError(res, err) {
  return res.status(500).send(err);
}