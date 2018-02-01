process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var _ = require('lodash');
var UserModel = require('./../api/user/user.model');
var Enterprice = require('./../api/enterprise/enterprisevaluation.model'); 
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
    findEnterpriceUserId();
    function findEnterpriceUserId() {
        Enterprice.find({"createdBy.userCustomerId": { $exists: false}}, function (err, enterprice) {
            if (err){
                return processCb(err);
            }
            console.log('Number of Records to update:-',enterprice.length);
            async.eachLimit(enterprice, 3, updateEnterpriceUserIds, function (err, result) {
                if (err) {
                    console.log("##########", err);
                }
            return processCb();
            });
        });
    }

    function updateEnterpriceUserIds(valuation, cb) {
        userMobile = valuation.createdBy.mobile;
        if ( !valuation.createdBy.userCustomerId ) {
            UserModel.find({mobile:userMobile},function(err,users){
                if ( err ) {
                    return cb(); 
                }
                if (!users.length) {
                    return cb();
                }
                var setUserCustomerId = users[0].customerId;
                
                Enterprice.update({_id:valuation._id}, {$set: {"createdBy.userCustomerId": setUserCustomerId}}, function (error, resultData) {
                    if (error) {
                        console.log("##########", error);
                    }
                    console.log('UC Number: ', valuation.uniqueControlNo, 'User_ID: ',setUserCustomerId , 'Response: ', resultData);
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
