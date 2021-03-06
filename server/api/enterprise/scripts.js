 "use strict";
var enterprisevaluation = require('./enterprisevaluation.model');
var User = require('./../user/user.model');
var async = require('async');
exports.script = function(req, res) {
	enterprisevaluation.find({},function(err,arr){
		arr.forEach(function(x){
			var userId=x.createdBy._id;
			User.find({_id:userId},function(err,User){
				if(User[0] && User[0].mobile) {
					var mobile=User[0].mobile;
					enterprisevaluation.update({"_id":x._id},{$set:{"customerPartyNo":mobile}},function(err,updateuser){
						if(err) throw err;
						//console.log("updated---",updateuser);
					});
				} else {
					console.log("uniqueControlNo not updated####", x.uniqueControlNo);
				}	
			});
		});
	});
};

exports.userRemapping = function(req,res){
	
	var bodyData = req.body;
	if(!bodyData.length)
		return res.status(200).send("No Data provided");
	var errorArr = [];
	var successArr = [];

	async.eachLimit(bodyData,5,initialize,onComplete);

	function initialize(item,callback){
		
		if(!item.mobile){
			item.msg = "Mobile no is missing";
			errorArr.push(item);
			return callback();
		}
		async.parallel({user:validateUser,enterprise:validateEnterprise},middleManProcessing);

	 	function validateUser(cb){
	 		User.find({mobile:item.mobile,deleted:false},function(err,users){
	 			if(err || !users.length)return cb("Error in finding user");
	 			return cb(null,users[0]);
	 		});
	 	}

	 	function validateEnterprise(cb){
	 		User.find({enterpriseId:item.enterpriseId,enterprise:true},function(err,enterprises){
	 			if(err || !enterprises.length)
	 				return cb("Error in finding enterprise");
	 			return cb(null,enterprises[0]);
	 		});
	 	}

	   function middleManProcessing(err,result){
		   	if(err){
		   		item.msg = err;
		   		errorArr.push(item);
		   		return callback();
		   	}

	   		async.parallel([updateUser,updateTransaction],onProcessingDone);

	   		function updateUser(processingCallback){
	   			User.update({_id:result.user._id},{$set:{enterpriseId:result.enterprise.enterpriseId,enterprise:false}},function(err,retData){
	   				if(err){return processingCallback("Error in user update");}
	   				return processingCallback();
	   			});
	   		}

	   		function updateTransaction(processingCallback){
			   	var updateData = {
		          email : result.enterprise.email,
		          mobile : result.enterprise.mobile,
		          _id : result.enterprise._id + "",
		          enterpriseId : result.enterprise.enterpriseId,
		          employeeCode : result.enterprise.employeeCode,
		          name : (result.enterprise.fname || "") + " "+ (result.enterprise.lname || "")
		        };
		        var custName = (result.enterprise.fname || "") + " " + (result.enterprise.mname || "") + " "+ (result.enterprise.lname || "");
		        enterprisevaluation.update({'createdBy._id':result.user._id + ""},{$set:{enterprise:updateData,customerPartyName:custName}},{multi:true},function(err,retData){
		        	if(err){return processingCallback("Error in updating transaction");}
		        	console.log(retData);
	   				return processingCallback();
		        });
	   		}

	   		function onProcessingDone(err){
	   			if(err){
			   		item.msg = err;
			   		errorArr.push(item);
			   		return callback();
			   	}
			   item.msg = "Updated successfully";
			   successArr.push(item);
			   return callback();
	   		}

	   }
	}

	function onComplete(){
		res.status(200).json({errorList:errorArr,success:successArr});
	}
};

exports.updateLegalEntityInRequest = function(req,res){
	var errorArr = [];
	var successArr = [];

	if(req.body.data) {
		enterprisevaluation.find({},function(err,enterpriseData){
		    if (err) { 
		    	return res.status(200).send("No Data");
		    }
		    else {
		    	async.eachLimit(enterpriseData,5,initialize,onComplete);
			}
		});
	}
	
	function initialize(item,callback){
		if(!item.enterprise.enterpriseId){
			item.msg = "enterpriseId is missing";
			errorArr.push(item);
			return callback();
		}
		async.parallel({enterprise:validateEnterprise}, middleManProcessing);

	 	function validateEnterprise(cb){
	 		User.find({_id: item.createdBy._id, deleted:false},function(err,enterprises){
	 			if(err || !enterprises.length) {
	 				return cb("Error in finding enterprise");
	 			}
	 			return cb(null, enterprises[0]);
	 		});
	 	}

	   function middleManProcessing(err,result){
	   	   	if(err){
		   		item.msg = err;
		   		errorArr.push(item.createdBy._id);
		   		return callback();
		   	}

	   		async.parallel([updateTransaction],onProcessingDone);

	   		function updateTransaction(processingCallback){
		        var entityName = result.enterprise.company || "";
		        enterprisevaluation.update({uniqueControlNo:item.uniqueControlNo + ""},{$set: {"legalEntityName" : entityName} },function(err,retData){
		        	if(err){return processingCallback("Error in updating transaction");}
		        	console.log(retData);
	   				return processingCallback();
		        });
	   		}

	   		function onProcessingDone(err){
	   			if(err){
			   		item.msg = err;
			   		errorArr.push(item.uniqueControlNo);
			   		return callback();
			   	}
			   item.msg = "Updated successfully";
			   successArr.push(item.uniqueControlNo);
			   return callback();
	   		}

	   }
	}

	function onComplete(){
		res.status(200).json({errorList:errorArr,success:successArr});
	}
	
};