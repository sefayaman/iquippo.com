'use strict';

var Message = require('./message.model');

var validationError = function(res, err) {
  return res.status(422).json(err);
};

exports.create = function (req, res, next) {
  var newMess = new Message(req.body);
  newMess.save(function(err, mess) {
		  if (err) return validationError(res, err);
		  res.status(200).json({mess: 'OK'});
  });
};

exports.getusersmails = function(req, res, next){
	console.log(req.params.emailid);

	Message.find({'to': req.params.emailid}).sort({updatedAt: 'descending'}).exec( function(err, mess){
		    if(err) { return handleError(res, err); }
		    return res.status(200).json(mess);
	});
};

exports.insertreply = function(req, res, next){
	console.log(req.params.messid);
    Message.findByIdAndUpdate(req.params.messid, {$push: {'replies': req.body }}, {safe: true, upsert: true}, function(err, data) {

        if (err) return validationError(res, err);
        else {
            res.status(200).json({ 'message': 'OK'});
        }
    })	
};

function handleError(res, err) {
  return res.status(500).send(err);
}