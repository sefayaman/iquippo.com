process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var _ = require('lodash');
var UserModel = require('./../api/user/user.model');
var AssetSale = require('./../api/assetsale/assetsalebid.model');  
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
    findSellerCustomerId();
    function findSellerCustomerId() {
        AssetSale.find({"product.seller.customerId": { $exists: false}}, function (err, products) {
            if (err){
                return processCb(err);
            }
            console.log('Number of Records to update:-',products.length);
            async.eachLimit(products, 3, updateBidsCustomerIds, function (err, result) {
                if (err) {
                    console.log("##########", err);
                }
            return processCb();
            });
        });
    }

    function updateBidsCustomerIds(callback, cb) {
        Mobile = callback.product.seller.mobile; 
        //console.log(callback.quote.mobile);console.log(Mobile);return;
        if ( !callback.product.seller.customerId ) {
            UserModel.find({mobile:Mobile,deleted:false},function(err,users){
                if ( err ) {
                    return cb(); 
                }
                if (!users.length) {
                    return cb();
                }
                var setUserCustomerId = users[0].customerId;
                
                AssetSale.update({_id:callback._id}, {$set: {"product.seller.customerId": setUserCustomerId}}, function (error, resultData) {
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
