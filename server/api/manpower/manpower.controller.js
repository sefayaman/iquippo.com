'use strict';

var _ = require('lodash');
var Seq = require('seq');
var ManpowerUser = require('./manpower.model');
var SubCategory = require('./../category/subcategory.model');
var User = require('./../user/user.model');
var Utility = require('./../../components/utility.js');
var moment = require('moment');
var async = require('async');

// Get list of services
exports.getAll = function(req, res, next) {
  debugger;
  var filter = {};
  filter['deleted'] = false;
  ManpowerUser.find(filter, function(err, users) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(users);
  });
};

exports.renderXlsx = function(req, res, next) {
  var filter = {};
  filter['deleted'] = false;
  ManpowerUser.find(filter, function(err, users) {
    if (err) {
      return handleError(res, err);
    }

    var xlsxHeaders = ['Name', 'Mobile Number', 'Email id', 'Product', 'Status']

    var xlsxData = [];
    var json = {};
    var arr = [];
    users.forEach(function(x) {
      json = {};
      arr = [];
      arr.push((x.user.fname || '') + ' ' + (x.user.mname || '') + ' ' + (x.user.lname || ''),
        x.user.mobile,
        x.user.email,
        x.assetOperated.join(','),
        x.status
      )
      for (var i = 0; i < xlsxHeaders.length; i++) {
        json[xlsxHeaders[i]] = arr[i];
      }
      xlsxData.push(json);
    });

    res.xls('manpowerData.xlsx', xlsxData);
    //res.end();

  });
};


// Get a single services
/*exports.getOnId = function(req, res) {
  ManpowerUser.findById(req.params.id, function (err, user) {
    if(err) { return handleError(res, err); }
    if(!user) { return res.status(404).send('Not Found'); }
    return res.json(user);
  });
};*/

exports.statusWiseCount = function(req, res) {
  var filter = {};
  filter['deleted'] = false;
  ManpowerUser.aggregate({
      $match: filter
    }, {
      $group: {
        _id: '$status',
        count: {
          $sum: 1
        }
      }
    }, {
      $sort: {
        count: -1
      }
    },
    function(err, result) {
      if (err) return handleError(err);
      return res.status(200).json(result);
    }
  );
}

exports.getOnId = function(req, res) {
  ManpowerUser.findOne({
    'user.userId': req.params.id
  }, function(err, data) {
    if (err) {
      return handleError(res, err);
    }
    if (!data) {
      return res.status(200).json({
        errorCode: 1,
        message: "Not Exist!!!"
      });
    }
    return res.json(data);
  });
};

// Creates a new service in the DB.
//var ADMIN_EMAIL = "bharat.hinduja@bharatconnect.com";

exports.create = function(req, res) {
  ManpowerUser.create(req.body, function(err, user) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(user);
  });
};

// Updates an existing user in the DB.
exports.update = function(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  req.body.updatedAt = new Date();
  ManpowerUser.findById(req.params.id, function(err, user) {
    if (err) {
      return handleError(res, err);
    }
    if (!user) {
      return res.status(404).send('Not Found');
    }
    ManpowerUser.update({
      _id: req.params.id
    }, {
      $set: req.body
    }, function(err) {
      if (err) {
        return handleError(res, err);
      }
      updateUser(req.body, req.body.user.userId);

      return res.status(200).json(req.body);
    });
  });
};

exports.bulkUpdate = function(req,res){
  if(!req.body || !req.body.ids)
    return res.status(404).json({res:'Nothing to update'}); 
  
  var updateIds;
  
  if(Array.isArray(req.body.ids)){
    updateIds = req.body.ids;
  }else{
    updateIds = req.body.ids.split(',');
  }

  if(!updateIds.length)
    return res.status(404).json({res:'Nothing to update'}); 

  var updateStatus = req.body.status || false;
  var successIds = [],
    failed_ids = [];
  async.eachLimit(updateIds,10,intialize,finalize);

  function finalize(err){
    if(err){
      console.log(err);
      return res.status(500).json({res:'Error while updating...Please try again'});
    }

    res.json({res:successIds.length + ' records updated from ' + updateIds.length + ' records'});
  }

  function intialize(id,cb){
    ManpowerUser.findByIdAndUpdate(id,{$set:{status:updateStatus}}).exec(updateManPower);
    function updateManPower(err,doc){
      if(err){
        failed_ids.push(id);
        return cb(); 
      }
      User.findByIdAndUpdate(doc.user.userId,{$set:{status:updateStatus,isManpower :updateStatus}}).exec(updateUser);

      function updateUser(err,doc){
        if(err || !doc){
          failed_ids.push(id);
          return cb();
        }
        successIds.push(id);
        return cb();
      }
    }
  }
}



//update user collection 

function updateUser(userData, userId) {
  var dataObj = {};
  dataObj.updatedAt = new Date();
  User.findById(userId, function(err, user) {
    if (err) {
      return handleError(res, err);
    }
    if (!userData.status) {
      if (user.isManpower && user.isPartner) {
        if (userData.status)
          dataObj['isManpower'] = true;
        else
          dataObj['isManpower'] = false;
      } else if (user.isManpower) {
        if (userData.status) {
          //dataObj['deleted'] = false;
          dataObj['isManpower'] = true;
          dataObj['status'] = userData.status;
        } else {
          //dataObj['deleted'] = true;
          dataObj['status'] = userData.status;
          dataObj['isManpower'] = false;
        }
      }
    } else {
      //dataObj['deleted'] = false;
      dataObj['isManpower'] = true;
      dataObj['status'] = userData.status;
    }

    User.update({
      _id: userId
    }, {
      $set: dataObj
    }, function(err, userObj) {
      if (err) {
        return handleError(res, err);
      }
    });
  });
}
// Get concat list
exports.getConcatCatSubCat = function(req, res) {
  var filter = {};
  var arr = [];

  if (req.body.searchStr) {
    var term = new RegExp(req.body.searchStr, 'i');
    arr[arr.length] = {
      name: {
        $regex: term
      }
    };
    arr[arr.length] = {
      "category.name": {
        $regex: term
      }
    };
  }
  if (arr.length > 0)
    filter['$or'] = arr;

  //console.log("Filter###", filter);
  var query = SubCategory.find(filter);
  query.exec(
    function(err, categories) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json(categories);
    }
  );
};

//search based on service type
exports.getSearchedUser = function(req, res) {
  var searchStrReg = new RegExp(req.body.searchstr, 'i');
  var filter = {};
  if (req.body.status)
    filter["status"] = true;
  filter["deleted"] = false;
  var arr = [];
  if (req.body.location) {
    var locRegEx = new RegExp(req.body.location, 'i');
    arr[arr.length] = {
      "user.city": {
        $regex: locRegEx
      }
    };
    arr[arr.length] = {
      "user.state": {
        $regex: locRegEx
      }
    };
  }

  if (req.body.searchstr) {
    arr[arr.length] = {
      "user.fname": {
        $regex: searchStrReg
      }
    };
    arr[arr.length] = {
      "user.lname": {
        $regex: searchStrReg
      }
    };
    arr[arr.length] = {
      "user.mobile": {
        $regex: searchStrReg
      }
    };
    arr[arr.length] = {
      "user.email": {
        $regex: searchStrReg
      }
    };
    arr[arr.length] = {
      "assetOperated": {
        $regex: searchStrReg
      }
    };
    //  arr[arr.length] = { status: { $regex: searchStrReg }};
  }

  if (arr.length > 0)
    filter['$or'] = arr;

  /*if(req.body.searchStr){
    //var term = new RegExp("^" + req.body.searchStr, 'i');
    var term = req.body.searchStr;
   //filter['assetOperated'] = { $elemMatch : {$eq: { $regex: term }}};
   filter['assetOperated'] = { $elemMatch : {$eq: term }};
  }*/

  if (req.body.cityName) {
    var cityRegex = new RegExp(req.body.cityName, 'i');
    filter['user.city'] = {
      $regex: cityRegex
    };
  }

  if (req.body.stateName) {
    var stateRegex = new RegExp(req.body.stateName, 'i');
    filter['user.state'] = {
      $regex: stateRegex
    };
  }

  if (req.body.searchStr) {
    var term = new RegExp(req.body.searchStr, 'i');
    filter['assetOperated'] = {
      $regex: term
    };
  }
  if (req.body.experience) {
    var expFilter = {};
    if (req.body.experience.min)
      expFilter['$gt'] = Number(req.body.experience.min);
    if (req.body.experience.max == 'plus')
      delete req.body.experience.max;
    else
      expFilter['$lte'] = Number(req.body.experience.max);
    filter["experience"] = expFilter;
  }

  var result = {};
  if (req.body.pagination) {
    Utility.paginatedResult(req, res, ManpowerUser, filter, {});
    return;
  }

  var sortObj = {};
  if (req.body.sort)
    sortObj = req.body.sort;
  sortObj['createdAt'] = -1;

  var query = ManpowerUser.find(filter).sort(sortObj);
  query.exec(
    function(err, users) {
      if (err) {
        return handleError(res, err);
      }
      //console.log(users);
      return res.status(200).json(users);
    }
  );
};

function handleError(res, err) {
  console.log(err);
  return res.status(500).send(err);
}