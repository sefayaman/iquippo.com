process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var _ = require('lodash');
var UserModel = require('./../api/user/user.model');
var Product = require('./../api/product/product.model'); 
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
    EnterpriseValuation.find({deleted:false},function(err,entrpriseVals){
        if (err){
                return processCb(err);
        } else {
            async.each(entrpriseVals,function(entrpriseVal, cb){
                var data = {
                    valuationAssessedValue: entrpriseVal.assessedValue,
                    valuationOverallGeneralCondition: entrpriseVal.overallGeneralCondition
                };
                Product.update({assetId: entrpriseVal.assetId}, {$set:data} , function (err, res) {
                    if (err) {
                        cb();
                    } else {
                        console.log("Updated:",res.nModified);
                        cb();
                    }
                });
            },function(){
               return processCb(); 
            })
        }
    })
}

if (require.main === module) {
    console.log("Started Product Schema Update Evalution Field At:-- " + new Date());
    (function () {
        init(function (err, errList) {
            if (err) {
                util.log(err);
                return process.exit(1);
            }
            console.log("Product Schema Update Evalution Field Done without error:-- " + new Date());
            return process.exit(0);
        });
    }());
}
