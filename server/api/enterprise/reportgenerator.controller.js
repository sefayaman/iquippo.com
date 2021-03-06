'use strict';

var async = require("async");
var _ = require('lodash');
var ValuationModel = require('./enterprisevaluation.model');
var AppSettingModel = require("./../common/setting.model");
var User = require('../user/user.model');
var fs = require("fs");
var Utility = require('./../../components/utility.js');
var config = require('./../../config/environment');
var EnterpriseValuationStatuses = ['Valuation Report Submitted','Invoice Generated'];
var fileNamePrefix = "Ent_Valuation_Report_";
var Setting_Key = "Ent_Valuation_Report";
var Field_MAP = require("./fieldsConfig").Report_Field_MAP;
 
//qpvalURL
exports.generateReport = function(req,res){

    User.find({ enterprise:true,deleted:false,status:true,
                role:'enterprise',valuationReport:true
              },
            function(err,enterprisers){
            if(err) return handleError(err);
            getEnterpriseRequest(enterprisers);
    });

    var dt = new Date();
    dt.setDate(dt.getDate() -1);
    var dateStr = dt.getDate()+ "" + (dt.getMonth() + 1)+ "" + dt.getFullYear();
    var fileName = fileNamePrefix + dateStr + ".xml";
    var localFilePath = config.uploadPath + "temp/" + fileName; 

  function getEnterpriseRequest(enterprisers){

    if( !enterprisers || !enterprisers.length){
      return res.status(404).send("No enterprises found");
    }
    var enterpriseIds = [];
    enterprisers.forEach(function(user){
      enterpriseIds.push(user.enterpriseId);
    });  
    var fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 2);
    fromDate.setHours(24,0,0);

    var toDate = new Date();
    toDate.setDate(toDate.getDate() - 1);
    toDate.setHours(24,0,0);

    var dateFilter = {};
    dateFilter.$gte = fromDate;
    dateFilter.$lt = toDate;
    ValuationModel.find({'enterprise.enterpriseId':{$in:enterpriseIds},status:{$in:EnterpriseValuationStatuses},
      reportDate:dateFilter,deleted:false,cancelled:false,onHold:false}
      ,function(err,entReqs){
        if(err) return handleError(err);
        console.log("ent reqs",entReqs.length);   
        _createXML(entReqs);
    });
  }

function _createXML(entReqs) {
    var xmlStr = '<?xml version="1.0" encoding="UTF-8"?>';
    xmlStr += "<document>";
    var headers = Object.keys(Field_MAP);
    entReqs.forEach(function (item) {
      xmlStr += "<Valuation>";
      headers.forEach(function (key) {
        var val = _.get(item, Field_MAP[key], "");
        if (key === "ASSET_DETAILS") {
          val = getAssetDetail(item);
        }
        if(key === 'GPSID' && val){
          var isValid = /^RCR/i.test(val);
          if(!isValid)
            val = "";
        }

        if(key === 'MAKE' && val && val === 'Other'){
          val = _.get(item,'otherBrand', "");
        }

        if(key === 'MODEL' && val && val === 'Other'){
          val = _.get(item,'otherModel', "");
        }

        xmlStr += "<" + key + ">" + val + "</" + key + ">";
      });
      xmlStr += "</Valuation>";
    });

    xmlStr += "</document>";
    var dt = new Date();
    dt.setDate(dt.getDate() - 1);
    var dateStr = dt.getDate() + "" + (dt.getMonth() + 1) + "" + dt.getFullYear();
    var fileName = fileNamePrefix + dateStr + ".xml";
    var localFilePath = config.uploadPath + "temp/" + fileName;
    try {

      fs.writeFileSync(localFilePath, xmlStr);
      async.parallel([uploadFileonS3, uploadFileOnFtp, updateSetting], function (err) {
        if(err) return  handleError(err);
        return res.status(200).send("Report generarted and uploaded successfully.");
      });
    } catch (e) {
      handleError(e);
    }
  }

  function uploadFileonS3(cb){
      var opts = {
        localFile: localFilePath,
        key: "assets/uploads/valuationreport/" + fileName,
      };
      var files = [{
        path:localFilePath
      }];
      Utility.uploadMultipartFileOnS3(opts.localFile,opts.key,files,function(err, s3res) {
        cb(err);
      },true);
  }

  function uploadFileOnFtp(cb){
    Utility.uploadFileOnFtp(localFilePath,config.valuationReportRemotePath + fileName,function(err){
      cb(err);
    });
  }

function updateSetting(cb){
    AppSettingModel.findOneAndUpdate({key:Setting_Key},
        {key:Setting_Key,value:fileName},{upsert:true},
        function(err){
          cb(err);
      });
}

function getAssetDetail(item){
  var valStr = "";
  valStr += item.assetCategory;
  
  if(item.brand){
    if(item.brand == "Other")
      valStr += " " + item.otherBrand;
    else
      valStr += " " + item.brand;
  }

  if(item.model){
    if(item.model == "Other")
      valStr += " " + item.otherModel;
    else
      valStr += " " + item.model;
  }
  return valStr;
}

  function handleError(err){
    console.log("Error in valuation report generation",err);
    res.status(500).send(err);
  }

}
