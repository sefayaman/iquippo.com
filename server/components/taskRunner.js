'use strict';

var Task = require('./task').task;
var debug = require('debug')("Task Runner");
var config = require('../config/environment');
var bulkProductUpload = require('./bulkProductUpload');
var commonController = require('../api/common/common.controller');
var bulkUpload = require('./bulkUpload')
var notification = require('./notification.js');
var util = require('util');
var utility = require('./utility.js'); 


var Uploaded_TEMPLATE_NAME = "BulkProductUploaded"


function getTask() {
        util.log('Starting Tasks');
        Task.find({
          counter: {
            $lte: 3
          }
        }).exec(function(err, data) {
          if (err) {
            console.error(err);
            setTimeout(function() {
              getTask();
            }, 6 * 1000); //sleep 
          } else {
            if (data.length > 0) {
                //console.log(data[0]);          
              executeTask(data[0]);
            } else
              setTimeout(function() {
                getTask();
              }, 6 * 1000);
          }
        });
}
/*function getTask() {
    util.log('Starting Tasks');
    var opts = {
        localDir : config.uploadPath + '/temp',
        prefix : 'assets/uploads/temp'
    };

    utility.downloadFromS3(opts ,function(err, s3res) {
        if(err){
            console.error(err);
            return setTimeout(function() {
                getTask();
            }, 6 * 1000); 
        }
        
        Task.find({
          counter: {
            $lte: 3
          }
        }).exec(function(err, data) {
          if (err) {
            console.error(err);
            setTimeout(function() {
              getTask();
            }, 6 * 1000); //sleep 
          } else {
            if (data.length > 0) {
                //console.log(data[0]);          
              executeTask(data[0]);
            } else
              setTimeout(function() {
                getTask();
              }, 6 * 1000);
          }
        });
    });
}
*/
function executeTask(taskData) {
  switch (taskData.taskType) {
    case "bulkproduct":
      try{
         bulkProductUpload.initTask(taskData, updateTask);
       }catch(e){
        console.log("Error in bulk product upload " + e);
        setTimeout(function() {
          getTask();
        }, 6 * 1000); //sleep
         }
      //bulkProductUpload.commitProduct(taskData, updateTask);
      break;
    case "bulkauction":
      bulkUpload.init(taskData, updateTask);
      break;
    case "bulkSpare" :
      bulkUpload.init(taskData,updateTask);
      break;
  }
}

function updateTask(result, data) {
  if (result) {
    Task.remove({
      _id: data._id
    }, function(err) {
      if (err) {
        console.log("Error in removing task");
      }
      pushNotification(data);
      setTimeout(function() {
        getTask();
      }, 6 * 1000); //sleep
    });
  } else {
    Task.findOneAndUpdate({
      _id: data._id
    }, {
      counter: parseInt(data.counter) + 1
    }, function(err) {
      if (err) {
        console.log("Error in while updating task");
      }
      pushNotification(data);
      setTimeout(function() {
        getTask();
      }, 6 * 1000); //sleep
    })
  }
}

function pushNotification(taskData) {
  if (taskData.uploadedProducts && taskData.uploadedProducts.length == 0)
    return;
  if (taskData.user && !taskData.user.email)
    return;

  var subject = 'Product uploaded Notification';

  if(taskData.taskType === 'bulkSpare'){
    Uploaded_TEMPLATE_NAME = 'BulkSpareUpload';
    subject  = 'Spare uploaded Notification';
  }
  var emailData = {};
  emailData.to = taskData.user && taskData.user.email;
  var tmplName = Uploaded_TEMPLATE_NAME;
  emailData.notificationType = "email";
  emailData.subject = subject;

  commonController.compileTemplate(taskData, config.serverPath, tmplName, function(ret, res) {
    if (!ret) {
      console.log("error in template");
    } else {
      emailData.content = res;
      notification.pushNotification(emailData);
    }
  });
}

module.exports.startTaskRunner = function() {
  console.log("task runner service started");
  getTask();
}


if(require.main === module){
  (function(){
    //setInterval(function(){
      console.log("hi");
      getTask();
    //},5000);
  }())
}