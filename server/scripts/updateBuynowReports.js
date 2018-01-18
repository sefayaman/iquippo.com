process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var _ = require('lodash');
var Negotiation = require('./../api/negotiation/negotiation.model');
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
    findSB();
    function findSB() {
        Negotiation.find({ticketId: { $in: [/^SB/, /^GN/, /^BN/] } }, function (err, reports) {
            if (err)
                return processCb(err);
            //console.log(reports.ticketId); return;
            async.eachLimit(reports, 3, processBids, function (err, result) {
                return processCb();
            });
        });
    }

    function processBids(nego, cb) {
        var old = 'O';
        var TicketId = old + nego.ticketId;
        console.log('Ticket ID: ', nego.ticketId);
        Negotiation.update({ticketId: nego.ticketId}, {$set: {ticketId: TicketId}}, function (error, resultData) {
            if (error) {
                console.log("##########", error);
            }
            return cb();
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
