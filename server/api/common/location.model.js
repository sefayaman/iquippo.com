'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var StateSchema = new Schema({
  name: String,
  country: String,
  user:{},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

var CitySchema = new Schema({
  name: String,
  user:{},
  state:{},
  createdAt: {type:Date,default:Date.now},
  updatedAt: {type:Date,default:Date.now}
});

var location = {};
location['State'] = mongoose.model('State', StateSchema);
location['City'] = mongoose.model('City', CitySchema);
module.exports = location;