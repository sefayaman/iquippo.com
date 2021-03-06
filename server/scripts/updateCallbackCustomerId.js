process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var _ = require('lodash');
var UserModel = require('./../api/user/user.model');
var Callback = require('./../api/callback/callback.model');  
var config = require('./../config/environment');
var async = require("async");
var util = require('util');
var mongoose = require('mongoose');

// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function (err) {
    util.error('MongoDB connection error: ' + err);
    process.exit(-1);
});

function init(processCb) {
    findCallbackCustomerId();
    function findCallbackCustomerId() {
        Callback.find({"customerId": { $exists: false}}, function (err, callbacks) {
            if (err){
                return processCb(err);
            }
            console.log('Number of Records to update:-',callbacks.length);
            async.eachLimit(callbacks, 3, updateCustomerIds, function (err, result) {
                if (err) {
                    console.log("##########", err);
                }
            return processCb();
            });
        });
    }

    function updateCustomerIds(callback, cb) {
        Mobile = callback.mobile;
        //console.log(sellerEmail);
        if ( !callback.customerId ) {
            UserModel.find({mobile:Mobile,deleted:false},function(err,users){
                if ( err ) {
                    return cb(); 
                }
                if (!users.length) {
                    return cb();
                }
                var setUserCustomerId = users[0].customerId;
                
                Callback.update({_id:callback._id}, {$set: {"customerId": setUserCustomerId}}, function (error, resultData) {
                    if (error) {
                        console.log("##########", error);
                    }
                    console.log('Ticket ID: ', callback.ticketId, 'User_ID: ',setUserCustomerId , 'Response: ', resultData);
                });
                return cb();
            });
        }
        else {
            return cb();
        }
    }

}

if (require.main === module) {
    console.log("Started At:-- " + new Date());
    (function () {
        init(function (err, errList) {
            if (err) {
                util.log(err);
                return process.exit(1);
            }
            console.log("Done without error:-- " + new Date());
            return process.exit(0);
        });
    }());
}
