'use strict';

var User = require('../api/user/user.model');
var config = require('../config/environment');
var commonController = require('../api/common/common.controller');
//var notification = require('./notification.js');
var USER_EXPORT_FILE_NAME = "userList";
var _ = require('lodash');
var Seq = require('seq');
//var User = require('./user.model');
var passport = require('passport');
//var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var xlsx = require('xlsx');
var Utility = require('./utility.js');
//var userFieldsMap = require('../../config/user_temp_field_map');
//var Utillity = require('./../../components/utility');
var commonController = require('../api/common/common.controller');
var notification = require('./notification.js');
var async = require('async');
var APIError = require('./_error');
var USER_REG_REQ="userRegEmailFromAdminChannelPartner";
var Seqgen = require('./seqgenerator').sequence();
var validationError = function(res, err) {
  return res.status(422).json(err);
};  
var $http = require('http');
var fs = require('fs');
var dateFormat = require('dateformat');  
var AppSetting = require('../api/common/setting.model');
var path = require('path');

function createExportsFile(){
  
  setInterval(function () { 
   exportUsers();
  }, 600000);
}
//set timer for delete file
function deleteExportsFile(){
  setInterval(function () { 
    deleteLocalExportFile();
    deleteS3ExportFile();
  }, 900000);//1*24*60*60*1000 for 1 day
}

function exportUsers(res) {
  var filter = {};
  var query = User.find(filter).sort({
    createdAt: -1
  });
  query.exec(
    function(err, users) {
      if (err) {
        return handleError(res, err);
      }
      var userIds = [];
      users.forEach(function(item) {
        userIds[userIds.length] = item._id + "";
      });
      var ws_name = "users"
      var wb = new Workbook();
      var ws = excel_from_data(users);
      wb.SheetNames.push(ws_name);
      wb.Sheets[ws_name] = ws;
      var wbout = xlsx.write(wb, {
        bookType: 'xlsx',
        bookSST: true,
        type: 'binary'
      });
      
      var date =dateFormat(new Date(), "yyyy-mm-dd-h:MM:ss");
      var data = {};
      var filename = USER_EXPORT_FILE_NAME+'_'+date+".xlsx"
      data.key = 'user_list_file_name';
      data.value = filename;
      var dirName = 'downloads/user-exports/'+filename;
      var localDir = config.uploadPath+'user-exports';
      var localFilePath = config.uploadPath+'user-exports/'+filename;

      var localDir = config.uploadPath+'user-exports';
      if (!fs.existsSync(localDir)){
          fs.mkdirSync(localDir);
        }

      fs.writeFile(localFilePath, wbout,"binary",function(err) {
            if (err) {
                console.log(err);
            } else {
               
                Utility.uploadMultipartFileOnS3(localFilePath, dirName, function(err, val){
                  if (err) {
                    console.log(err)
                    //return cb(err);
                  }else{
                    saveFileName(data);
                  }
                
              })
            }
      });
    });
}
function saveFileName(data ,res){
var key = data.key;
	if (!key)
		return res.status(400).send("Invalid request");
	AppSetting.find({
		key: key
	}, function(err, dt) {
		if (err) {
			return handleError(res, err)
		} else if (dt.length == 0) {
			AppSetting.create(data, function(err, val) {
				if (err) {
					return handleError(res, err)
				} else {
					//res.status(200).send("done");
				}
			});
		} else {
			var setObj = {};
			if (data.value) {
				setObj.value = data.value
				setObj.updatedAt = new Date();
			} else {
				//setObj.valueObj = req.body.valueObj
				setObj.updatedAt = new Date();
			}
			AppSetting.update({
				key: key
			}, {
				$set: setObj
			}, function(err, val) {
				if (err) {
					return handleError(res, err)
				} else {
					//console.log("updated", dt);
					//res.status(200).send("done");
				}
			})
		}
	});
  }
function deleteLocalExportFile(){
  var uploadsDir = config.uploadPath+'user-exports';
    fs.readdir(uploadsDir, function(err, files) {
      files.forEach(function(file, index) {
        fs.stat(path.join(uploadsDir, file), function(err, stat) {
          var endTime, now;
          if (err) {
            return console.error(err);
          }
          now = new Date().getTime();
          endTime = new Date(stat.ctime).getTime() + 3600000;
          if (now > endTime) {
            fs.unlink(uploadsDir+'/'+file, function(error) {
                if (error) {
                    throw error;
                }
            });
          }
        });
      });
    });

}
//delete s3 file
function deleteS3ExportFile(){
  var uploadsDir = config.uploadPath+'user-exports';
   Utility.getListObjectS3();
}

function handleError(res, err) {
  return res.status(500).send(err);
}
//export data into excel
function Workbook() {
  if (!(this instanceof Workbook)) return new Workbook();
  this.SheetNames = [];
  this.Sheets = {};
}

function datenum(v, date1904) {
  if (date1904) v += 1462;
  var epoch = Date.parse(v);
  return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}

function setType(cell) {
  if (typeof cell.v === 'number')
    cell.t = 'n';
  else if (typeof cell.v === 'boolean')
    cell.t = 'b';
  else if (cell.v instanceof Date) {
    cell.t = 'n';
    cell.z = xlsx.SSF._table[14];
    cell.v = datenum(cell.v);
  } else cell.t = 's';
}


function excel_from_data(data) {
  var ws = {};
  var range;
  range = {s: {c:0, r:0}, e: {c:18, r:data.length }};

  for(var R = 0; R != data.length + 1 ; ++R){
    
    var C = 0;
    var user = null;
    var cell = null;
    if(R != 0)
      user = data[R-1];

    if(R === 0)
      cell = {v: "Customer Id"};
    else {
      if(user)
        cell = {v: user.customerId || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}); 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Name"};
    else{
      if(user)
        cell =  {v: (user.fname || "") + " " + (user.mname || "") + " " + (user.lname || "")};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Email"};
    else {
      if(user)
        cell = {v: user.email || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "PAN Number"};
    else {
      if(user)
        cell = {v: user.panNumber || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "AADHAAR Number"};
    else {
      if(user)
        cell = {v: user.aadhaarNumber || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Role"};
    else {
      if(user)
        cell = {v: user.role || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

     if(R == 0)
      cell = {v: "UserType"};
    else {
      if(user)
        cell = {v: user.userType || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Employee Code"};
    else {
      if(user)
        cell = {v: user.employeeCode || "NA"};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Company Name"};
    else {
      if(user)
        cell = {v: user.company || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

     if(R == 0)
      cell = {v: "Mobile No."};
    else {
      if(user)
        cell = {v: user.mobile || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

     if(R == 0)
      cell = {v: "Phone No."};
    else {
      if(user)
        cell = {v: user.phone || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

     if(R == 0)
      cell = {v: "Country"};
    else {
      if(user)
        cell = {v: user.country || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "State"};
    else {
      if(user)
        cell = {v: user.state || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Location"};
    else {
      if(user)
        cell = {v: user.city || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Registered By"};
    else {
      //if(user)
        cell = {v: getRegisteredBy(user) || ""};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Product Uploaded"};
    else {
      if(user)
        cell = {v: user.have_products};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;

    if(R == 0)
      cell = {v: "Counts"};
    else {
      if(user)
        cell = {v: user.total_products};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell; 

    if(R == 0)
      cell = {v: "Status"};
    else {
      if(user)
        cell = {v: isStatus(user.status, user.deleted)};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell; 

    if(R == 0)
      cell = {v: "Creation Date"};
    else {
      if(user)
        cell = {v: Utility.toIST(_.get(user, 'createdAt', ''))};
    }
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C++,r:R}) 
    ws[cell_ref] = cell;
  }
  ws['!ref'] = xlsx.utils.encode_range(range);
  return ws;
}

function isStatus(status, deleted) {
  if (status && !deleted)
    return "Active";
  else if (!status && !deleted)
    return "Deactive";
  else if (!status && deleted)
    return "Deleted";
  else
    return "";
}


function getRegisteredBy(user) {
  if (!user.createdBy)
    return user.fname + " " + user.lname + ' (Self)';

  if (user.createdBy.role == 'admin')
    return user.createdBy.fname + " " + user.createdBy.lname + ' (Admin)';
  else if (user.createdBy.role == 'channelpartner')
    return user.createdBy.fname + " " + user.createdBy.lname + ' (Channel Partner)';
  else
    return user.createdBy.fname + " " + user.createdBy.lname + ' (Self)';
}

function addNoCacheHeader(res) {
   res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
   res.header('Expires', '-1');
   res.header('Pragma', 'no-cache');
}
exports.start = function(){
  //console.log("Save Search service started");
  createExportsFile();
  deleteExportsFile();
}





















