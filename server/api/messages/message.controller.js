'use strict';

var Message = require('./message.model');
var _ = require('lodash');

var validationError = function(res, err) {
  return res.status(422).json(err);
};

exports.create = function (req, res, next) {
console.log('param ::>', req.params.message);  
console.log('param ::>', req.param('message'));
  var mail = {};
  mail.to = req.param('to');
  mail.message = req.param('message');
  mail.from = req.param('from');
  mail.subject = req.param('subject');
// console.log('body ::>', req.body);  
  var newMess = new Message(mail);
  newMess.save(function(err, mess) {
		  if (err) return validationError(res, err);
		  res.status(200).json({mess: 'OK'});
  });
};

exports.getmail = function(req, res, next){

  // console.log( 'getusersmails >>>>>> ',req.user);

  Message.findById(req.params.emailid).exec( function(err, mess){
        if(err) { return handleError(res, err); }
        return res.status(200).json({'mail': mess});
  });
};

exports.updatemail = function(req, res, next){

// console.log( 'updatemails ---> ', req.body.mail);

  Message.findByIdAndUpdate(req.params.emailid, {$push: {'replies': req.body.mail.reply }}, {safe: true, upsert: true}, function(err, data) {

        if (err) return validationError(res, err);
        else {
            res.status(200).json({ 'message': 'OK'});
        }
    });  
};

exports.getusersmails = function(req, res, next){

  // console.log( 'getusersmails >>>>>> ',req.user);
  var boj = {};
  // boj.replies = {};
  var arr = [];
  if(req.param('fromto') === 'to'){

    // arr.push( { 'to': req.user.email} );
    // arr.push( { 'replies.to': req.user.email} );
    boj = { 'to': req.user.email};

  }else if(req.param('fromto') === 'from'){
    // arr.push ( { 'from': req.user.email} );
    // arr.push ( { 'replies.from': req.user.email} );
    boj = { 'from': req.user.email};
  }
  // var koj = { $or : arr };
console.log( JSON.stringify(boj) );


	Message.find(boj).sort({createdAt: 'descending'}).exec( function(err, mess){
        var tt = [];
        // for (var i = 0; i < mess.replies.length; i++) {
        //   mess.replies[i]
        // };
        for (var i = 0; i < mess.length; i++) {
          // tt = _.find(mess[i].replies, {'to': req.user.email});
          // mess.filtreplies = tt;
          mess[i].find({'replies.to': req.user.email}).sort({createdAt: 'descending'}).exec( function(err, filteredreplies){
              tt = filteredreplies;
console.log('tt >>>. ', tt);       
          });

        }
 
		    if(err) { return handleError(res, err); }
		    return res.status(200).json({'messages': mess});
	});
};

exports.insertreply = function(req, res, next){
	// console.log(req.params.messid);
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