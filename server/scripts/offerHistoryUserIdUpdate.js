process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var _ = require('lodash');
var User = require("./../api/user/user.model");
var OfferReqModel = require("./../api/common/newofferrequest.model");
var config = require('./../config/environment');
var async = require("async");

var mongoose = require('mongoose');

// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function(err) {
  util.error('MongoDB connection error: ' + err);
  process.exit(-1);
});




function init(processCb) {
  OfferReqModel.find({},function(err,offerReqs){
    if(err)
      return processCb(err);
    async.eachLimit(offerReqs,4,processData,function(errRes){
      return processCb(errRes);
    });
  });

  function processData(dt,cb){
    if(!dt.user._id)
      return cb();
    User.findById(dt.user._id,function(err,user){
      if(err || !user){
        console.log("error in getting user---",err);
        return cb();
      }
      OfferReqModel.update({_id:dt._id},{$set:{"user.customerId":user.customerId}},function(error){
        if(error)
          console.log("error in updating offer request---",error);
        return cb();
      });
    });
  }

}

 

if (require.main === module) {
  console.log("Offer request update script Started At --- " + new Date());
	(function() {
		init(function(err, errList) {
			if (err) {
				util.log(err);
				return process.exit(1);
			}
      console.log("Offer request updated  --- " + new Date());
			return process.exit(0);
		});
	}());
}


