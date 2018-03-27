'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EventSchema = new Schema({
    name: String,
    start: Date,
    end: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);