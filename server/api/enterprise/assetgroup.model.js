'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var AssetGroupSchema = new Schema({
  valuerGroupId: String,
  valuerAssetId: String,
  valuerName: String,
  valuerCode: String,
  assetCategory: String,
  enterpriseName: String,
  enterpriseId: String,
  createdBy: {},
  updatedBy: {},
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: Boolean,
    default: 1
  },
  deleted: {
    type: Boolean,
    default: 0
  }

});

AssetGroupSchema.pre('save', function(next) {
  // get the current date
  var currentDate = new Date();

  // change the updated_at field to current date
  this.updatedAt = currentDate;

  // if created_at doesn't exist, add to that field
  if (!this.createdAt)
    this.createdAt = currentDate;

  next();
});

module.exports = mongoose.model('AssetGroup', AssetGroupSchema);

/*

Valuer Group ID 
Valuer Asset ID 
Valuer Name 
Valuer Code 
ASSET_CATEGORY  
Enterprise Name 
Enterprise ID


*/