'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var uIdSchema = new Schema({
  uidNumber:Number
});

module.exports = mongoose.model('uId', uIdSchema);