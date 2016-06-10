'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var taskSchema = new Schema({
  taskType: String,
  taskInfo:{},
  user:{},
  counter:String,
  createdAt: {type:Date,default:Date.now}
});

var Task = mongoose.model('Task', taskSchema, 'task');

exports.create = function(req,res){
  var bodyData = req.body;
  bodyData['createdAt'] = new Date();
  bodyData.counter = 0;
  Task.create(bodyData, function(err, data){
    if(err) { return handleError(res, err); }
    else
      return res.status(200).json(data);
  });
}

function handleError(res, err){
  //console.log("-------",err)
  return res.status(500).send(err);
}

exports.task = Task;
