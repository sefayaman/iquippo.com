'use strict';

var _ = require('lodash');
var Seq = require('seq');
var User = require('./user.model');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var  xlsx = require('xlsx');
var Product = require('../product/product.model');
var Vendor = require('../vendor/vendor.model');
var ManpowerUser = require('../manpower/manpower.model');

var validationError = function(res, err) {
  return res.status(422).json(err);
};

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function(req, res) {
  User.find({}, '-salt -hashedPassword', function (err, users) {
    if(err) return res.status(500).send(err);
    res.status(200).json(users);
  });
};

/**
 * Creates a new user
 */
exports.signUp = function (req, res, next) {
  var newUser = new User(req.body);
  console.log("username::::" + req.body.name);
 newUser.createdAt = new Date();
 newUser.updatedAt = new Date();
 newUser.save(function(err, user) {
  if (err) return validationError(res, err);
  var token = jwt.sign({_id: user._id }, config.secrets.session, { expiresInMinutes: 60*5 });
  res.json({ token: token });
  });
};

exports.validateSignup = function(req, res){
  var filter = {}
  if(!req.body.mobile)
    return res.status(401).send('Insufficient data');
  if(req.body.userid)
     filter['_id'] = {$ne:req.body.userid}; 
  if(req.body.mobile)
    filter['mobile'] = req.body.mobile;
  filter['deleted'] = false;
  User.find(filter,function(err,users){
    if(err){ return handleError(res, err); }
    else if(users.length > 0){
      return res.status(200).json({errorCode:1,message:"Mobile number is already in used"});
    }
    else {
          if(!req.body.email) 
            return res.status(200).json({errorCode:0,message:""});

          filter = {}
          if(req.body.userid)
            filter['_id'] = {$ne:req.body.userid}; 
          // if(req.body.email)
          filter['email'] = req.body.email;
          filter['deleted'] = false;
          User.find(filter,function(err,usrs){
             if(err){ return handleError(res, err); }
             else if(usrs.length > 0){
                return res.status(200).json({errorCode:2,message:"Email is already in used"});
             }
           else
          return res.status(200).json({errorCode:0,message:""});
        })
    }
  });
}


exports.create = function (req, res, next) {
  console.log("----create[---",req.body);
  //console.log(req.body);
  var newUser = new User(req.body);
  newUser.createdAt = new Date();
  newUser.updatedAt = new Date();
   


  newUser.save(function(err, user) {
  if (err) return validationError(res, err);
  res.json(user);
  });
};


/**
 * Get a single user
 */
exports.show = function (req, res, next) {
  var userId = req.params.id;
  User.findById(userId, function (err, user) {
    if (err) return next(err);
    if (!user) return res.status(401).send('Unauthorized');
    res.json(user.profile);
  });
};

//search based on user userType
exports.getUser = function(req, res) {
  var searchStrReg = new RegExp(req.body.searchstr, 'i');
  var filter = {};
  filter["deleted"] = false;
  //filter["isManpower"] = false;
  if(req.body.status)
    filter["status"] = true;
  var arr = [];
  
  /*if(req.body.notManpower) {
    arr[arr.length] = { isManpower: false};
    arr[arr.length] = { isPartner: true};
  }
  if(req.body.notManpower) {
    arr[arr.length] = { isPartner: true, isManpower:false};
    arr[arr.length] = { isPartner: true, isManpower:true};
    arr[arr.length] = { isPartner: false, isManpower:false};
  }*/

  if(req.body.searchstr){
    console.log("req.body.searchstr", req.body.searchstr);
    arr[arr.length] = { fname: { $regex: searchStrReg }};
    arr[arr.length] = { lname: { $regex: searchStrReg }};
    arr[arr.length] = { mobile: { $regex: searchStrReg }};
    arr[arr.length] = { email: { $regex: searchStrReg }};
    arr[arr.length] = { role: { $regex: searchStrReg }};
    arr[arr.length] = { company: { $regex: searchStrReg }};
    arr[arr.length] = { city: { $regex: searchStrReg }};
    arr[arr.length] = { state: { $regex: searchStrReg }};
    arr[arr.length] = { userType: { $regex: searchStrReg }};
  }
  
  if(req.body.userId)
    filter["createdBy._id"] = req.body.userId;
  
  if(req.body.userType)
    filter["userType"] = req.body.userType;

  /*if(req.body._id)
    filter["_id"] = req.body._id;
  else {*/
    if(req.body.role)
      filter["role"] = req.body.role;
    else {
    var typeFilter = {};
    typeFilter['$ne'] = "admin";
    //typeFilter['$nin'] = ['admin','manpower'];
    filter["role"] = typeFilter;    
    }
  //}
  if(arr.length > 0)
    filter['$or'] = arr;

console.log("Filter User", filter);
  var result = {};
  if(req.body.pagination){
    paginatedUser(req,res,filter,result);
    return;    
  }

  var sortObj = {}; 
  if(req.body.sort)
    sortObj = req.body.sort;
  sortObj['createdAt'] = -1;

var query = User.find(filter).sort(sortObj);
    Seq()
    .par(function(){
      var self = this;
      User.count(filter,function(err, counts){
        result.totalItems = counts;
        self(err);
      })
    })
    .par(function(){
      var self = this;
      query.exec(function (err, users) {
          if(err) { return handleError(res, err); }
          result.users = users;
          self();
         }
      );

    })
    .seq(function(){
      return res.status(200).json(result.users);
    })
};

function paginatedUser(req,res,filter,result){
    var pageSize = req.body.itemsPerPage;
    var first_id = req.body.first_id;
    var last_id = req.body.last_id;
    var currentPage = req.body.currentPage;
    var prevPage = req.body.prevPage;
    var isNext = currentPage - prevPage >= 0?true:false;
    Seq()
    .par(function(){
      var self = this;
      User.count(filter,function(err,counts){
        result.totalItems = counts;
        self(err);
      })
    })
    .par(function(){

        var self = this;
        var sortFilter = {_id : -1};
        if(last_id && isNext){
          filter['_id'] = {'$lt' : last_id};
        }
        if(first_id && !isNext){
          filter['_id'] = {'$gt' : first_id};
          sortFilter['_id'] = 1;
        }

        var query = null;
        var skipNumber = currentPage - prevPage;
        if(skipNumber < 0)
          skipNumber = -1*skipNumber;

        query = User.find(filter).sort(sortFilter).limit(pageSize*skipNumber);
        query.exec(function(err,users){
            if(!err && users.length > pageSize*(skipNumber - 1)){
                  result.users = users.slice(pageSize*(skipNumber - 1),users.length);
            }else
              result.users = [];
            if(!isNext && result.users.length > 0)
             result.users.reverse();
             self(err);
      });
    })
    .seq(function(){
        return res.status(200).json(result);
    })
    .catch(function(err){
      handleError(res,err);
    }) 
  }

//get products count on User Ids
exports.getProductsCountOnUserIds = function(req, res) {
  var filter = {};
    filter['deleted'] = false;
    filter['status'] = true;
    if(req.body.userIds)
      filter['seller._id'] = {$in:req.body.userIds};
    Product.aggregate(
    { $match:filter},
    { $group: 
      { _id: '$seller._id', total_products: { $sum: 1 } } 
    },
    {$sort:{count:-1}},
    function (err, result) {
      if (err) return handleError(err);
      return res.status(200).json(result);
    }
  );
}

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function(req, res) {

  var userId = req.params.id;
  Product.find({'seller._id':userId,deleted:false,isSold:false},function(err,prds){
    if(err){ return handleError(res, err); }
    if(prds.length > 0){
      return res.status(200).json({errorCode:1,message:"User has products."})
    }else{
      User.find({'createdBy._id':userId,deleted:false},function(err,usrs){
          if(err){ return handleError(res, err); }
          if(usrs.length > 0){
            return res.status(200).json({errorCode:1,message:"User has customers."})  
          }else{
            User.update({_id:userId},{$set:{deleted:true,status:false}},function(err,user){
              if(err){ return handleError(res, err); }
              return res.status(200).json({errorCode:0,message:""})
            })
          }
      })
    }
  })

};

// Updates an existing user in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  req.body.updatedAt = new Date();
  User.findById(req.params.id, function (err, user) {
    if (err) { return handleError(res, err); }
    if(!user) { return res.status(404).send('Not Found'); }
    User.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        var dataObj = {};
        dataObj['user.fname'] = req.body.fname;
          if(req.body.mname)
        dataObj['user.mname'] = req.body.mname;
        dataObj['user.lname'] = req.body.lname;
        if(req.body.email)
          dataObj['user.email'] = req.body.email;
        dataObj['user.mobile'] = req.body.mobile;
        if(req.body.phone)
          dataObj['user.phone'] = req.body.phone;
        dataObj['user.city'] = req.body.city;
        if(req.body.state)
          dataObj['user.state'] = req.body.state;
        if(req.body.imgsrc)
          dataObj['user.imgsrc'] = req.body.imgsrc;
        if(req.body.isPartner) {
          updateVendor(dataObj, req.params.id);
        }
        if(req.body.isManpower) {
          updateManpower(dataObj, req.params.id);
        }
        return res.status(200).json(req.body);
    });
  });
};

//update partner
  function updateVendor(userData, userId){
    userData.updatedAt = new Date();
    
    Vendor.update({'user.userId':userId},{$set:userData},function(err,userObj){
      if(err){return handleError(res, err);}
    });
  };

  //update manpower
  function updateManpower(userData, userId){
    userData.updatedAt = new Date();
    
    ManpowerUser.update({'user.userId':userId},{$set:userData},function(err,userObj){
      if(err){return handleError(res, err);}
    });
  };

/**
 * Change a users password
 */
exports.changePassword = function(req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  User.findById(userId, function (err, user) {
    if(user.authenticate(oldPass)) {
      user.password = newPass;
      user.updatedAt = new Date();
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.status(200).send('OK');
      });
    } else {
      res.status(403).send('Forbidden');
    }
  });
};

exports.resetPassword = function(req, res) {
  var userId = req.body.userId;
  var newPass = String(req.body.password);
  User.findById(userId, function (err, user){
      user.password = newPass;
      user.updatedAt = new Date();
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.status(200).send('OK');
      }); 
  });
};


/**
 * Get my info
 */
exports.me = function(req, res, next) {
  var userId = req.user._id;
  User.findOne({
    _id: userId,
    deleted:false
  }, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user) return res.status(401).send('Unauthorized');
    user = user.toObject();
    if(user.isPartner){
        getPartenerDetail(req,res,user);
    } else {
      if(user.isManpower) {
        getManpowerDetail(req,res,user);
      } else {
        addNoCacheHeader(res)
        res.json(user);
      }
    }
  });
};

function getPartenerDetail(req,res,user){
   var filter = {};
      filter["deleted"] = false;
      filter["status"] = true;
      if(user._id)
        filter['user.userId'] = "" + user._id;
      Vendor.findOne(filter, function (err, partnerData) {
        if(err) { return handleError(res, err); }
        if(!partnerData) { console.log("Not Exist!!!"); }
        user.partnerInfo = partnerData;
        if(user.isManpower) {
          getManpowerDetail(req,res,user);
        } else {
          addNoCacheHeader(res)
          res.json(user);
        }
      });
}

function getManpowerDetail(req,res,user){
   var filter = {};
      filter["deleted"] = false;
      filter["status"] = true;
      if(user._id)
        filter['user.userId'] = "" + user._id;
      ManpowerUser.findOne(filter, function (err, manpowerData) {
        if(err) { return handleError(res, err); }
        if(!manpowerData) { console.log("Not Exist!!!"); }
        user.manpowerInfo = manpowerData;
        addNoCacheHeader(res)
        res.json(user);
      });
}
/**
 * Authentication callback
 */
exports.authCallback = function(req, res, next) {
  res.redirect('/');
};

//validate user on email or mobile

exports.validateUser = function(req, res){
  var filter = {}
  filter['deleted'] = false;
  if(!req.body.mobile && !req.body.email)
    return res.status(401).send('Unauthorized');
  if(req.body.email)
      filter['email'] = req.body.email;
  if(req.body.mobile)
    filter['mobile'] = req.body.mobile;
  User.find(filter,function(err,users){
    if(err){ return handleError(res, err); }
    if(users.length == 0) return res.status(200).json({errorCode:1,message:"User not found"});
    else if(users.length == 1)
      return res.status(200).json({errorCode:0,user:users[0]});
    else
      return res.status(200).json({errorCode:2,message:"More than one user found"});
  });
}

exports.validateOtp = function(req,res){
  var otp = req.body.otp;
  if(!otp)
     return res.status(401).send('Unauthorized');
   //console.log("otp filetr",{'otp.otp':otp})
   User.findOne({'otp.otp':otp},function(err,user){
      if(err){ return handleError(res, err); }
      if(!user){return res.status(404).send('Invalid OTP');}
      else{
        var otpTime = new Date(user.otp.createdAt).getTime();
        var currTime = new Date().getTime();
        User.update({_id:user._id},{$set:{otp:{}}},function(err,user){
           if(err){ return handleError(res, err); }
           if(currTime - otpTime >= 15*60*1000){
              return res.status(404).send('OTP has been expired.Please get another otp');
            }else{
              return res.status(200).send(user);
            }
        })
      }
   });
}

//export data into excel
function Workbook() {
  if(!(this instanceof Workbook)) return new Workbook();
  this.SheetNames = [];
  this.Sheets = {};
}

function datenum(v, date1904) {
  if(date1904) v+=1462;
  var epoch = Date.parse(v);
  return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}
 
function setType(cell){
  if(typeof cell.v === 'number')
    cell.t = 'n';
  else if(typeof cell.v === 'boolean')
      cell.t = 'b';
  else if(cell.v instanceof Date)
   {
        cell.t = 'n'; cell.z = xlsx.SSF._table[14];
        cell.v = datenum(cell.v);
    }
    else cell.t = 's';
}

function excel_from_data(data) {
  var ws = {};
  var range;
  range = {s: {c:0, r:0}, e: {c:11, r:data.length }};

  for(var R = 0; R != data.length + 1 ; ++R){
    
    var C = 0;
    var user = null;
    var cell = null;
    if(R != 0)
      user = data[R-1];

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
  }
  ws['!ref'] = xlsx.utils.encode_range(range);
  return ws;
}

  function isStatus(status, deleted) {
  if(status && !deleted)
    return "Active";
  else if(!status && !deleted)
    return "Deactive";
  else if(!status && deleted)
    return "Deleted";
   else
    return "";
  } 

  function getRegisteredBy(user){
    if(!user.createdBy)
      return user.fname + " " + user.lname + ' (Self)';

    if(user.createdBy.role == 'admin')
      return user.createdBy.fname + " " + user.createdBy.lname + ' (Admin)';
    else if(user.createdBy.role == 'channelpartner') 
      return user.createdBy.fname + " " + user.createdBy.lname + ' (Channel Partner)';
    else 
      return user.createdBy.fname + " " + user.createdBy.lname + ' (Self)';
  }

exports.exportUsers = function(req,res){
  var filter = {};
  filter['deleted'] = false;
  if(req.body.userId) {
    filter["createdBy._id"] = req.body.userId;
  }
  if(req.body.filter)
    filter = req.body.filter;
  var query = User.find(filter).sort({fname:1});
  query.exec(
     function (err, users) {
        if(err) { return handleError(res, err); }
        var userIds = [];
        users.forEach(function(item){
          userIds[userIds.length] = item._id + "";
        });
        getProductData(req, res, users, userIds);
        // var ws_name = "users"
        // var wb = new Workbook();
        // var ws = excel_from_data(users);
        // wb.SheetNames.push(ws_name);
        // wb.Sheets[ws_name] = ws;
        // var wbout = xlsx.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
        // res.end(wbout);
     });
}

function getProductData(req, res, users, userIds){
  var filter = {};
    filter['deleted'] = false;
    filter['status'] = true;
    if(userIds)
      filter['seller._id'] = {$in:userIds};
    Product.aggregate(
    { $match:filter},
    { $group: 
      { _id: '$seller._id', total_products: { $sum: 1 } } 
    },
    {$sort:{count:-1}},
    function (err, products) {
      if (err) return handleError(err);;
      for(var i=0; i < users.length; i++) {
        var countFlag = false;
        for(var j=0; j < products.length; j++){
          if(users[i]._id == products[j]._id) {
            countFlag = true;
            users[i].total_products = products[j].total_products;
            users[i].have_products = "Yes";
            break;
          }
        }
        if(!countFlag) {
          users[i].total_products = 0;
          users[i].have_products = "No";
        }
        //console.log("users[" + i +"]" + users[i]._id + " # " + users[i].total_products+ "#" + users[i].have_products);
      }
      var ws_name = "users"
      var wb = new Workbook();
      var ws = excel_from_data(users);
      wb.SheetNames.push(ws_name);
      wb.Sheets[ws_name] = ws;
      var wbout = xlsx.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
      res.end(wbout);
    }
  );
} 
function handleError(res, err) {
  return res.status(500).send(err);
}

function addNoCacheHeader(res) {
   res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
   res.header('Expires', '-1');
   res.header('Pragma', 'no-cache');
}
