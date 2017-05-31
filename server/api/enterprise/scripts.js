 "use strict";
var enterprisevaluation = require('./enterprisevaluation.model');
var User = require('./../user/user.model');
exports.script = function(req, res) {
	enterprisevaluation.find({},function(err,arr){
		arr.forEach(function(x){
			var userId=x.createdBy._id;
			User.find({_id:userId},function(err,User){
				var mobile=User[0].mobile;
				enterprisevaluation.findOneAndUpdate({"_id":x._id},{$set:{"customerPartyNo":mobile}},function(err,updateuser){
					if(err) throw err;
					console.log("updated---",updateuser);
				});
			});
		});
	});
};