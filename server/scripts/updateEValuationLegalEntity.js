process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var _ = require('lodash');
var UserModel = require('./../api/user/user.model');
var EnterpriseValuation = require('./../api/enterprise/enterprisevaluation.model'); 
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
    var query = EnterpriseValuation.find({deleted:false});
    query.exec(function(err,valReqs){
        if (err){
             return processCb(err);
        }
        if(!valReqs || !valReqs.length){
            return processCb("No valuation requests found");
        }
        async.eachLimit(valReqs,5,iterator,function(err){
            return processCb(err);   
        })
    });

    function iterator(valReq,cb){
        if(!valReq.createdBy || !valReq.createdBy._id)
            return cb();
        UserModel.find({_id:valReq.createdBy._id},function(err,users){
            if(err || !users.length){
                console.log("User not found for ucn - ",valReq.uniqueControlNo);
                return cb();
            }
            valReq.legalEntityName = users[0].company || "";
            valReq.save(function(err){
                if(err)
                    console.log("Error in updating ucn - ",valReq.uniqueControlNo);
                return cb();
            })

        });
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
