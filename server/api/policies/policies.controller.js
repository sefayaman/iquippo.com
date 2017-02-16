'use strict';


var fs=require('fs');
var path=require('path');
var config = require('../../config/environment');

var writePath = config.templatePath +  '/generalEditing/privacyPolicy.html';

exports.update=function(req,res){

	req.body.createdAt = new Date();
	fs.writeFile(writePath,req.body.content,'utf8', function (err,data) {
	  if (err){ return handleError(res, err); }
	   return res.status(200).send("succesfully updated");
	});
}

exports.getData=function(req,res){
	fs.readFile(writePath,'utf8',function(err,data){
		if (err){ return handleError(res, err); }
	   return res.status(200).send(data);
	})
}

function handleError(res, err) {
console.log(err);
  return res.status(500).send(err);
}
