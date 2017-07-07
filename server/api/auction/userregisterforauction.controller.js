'use strict';

var _ = require('lodash');
var Model = require('./userregisterforauction.model');
var ApiError = require('../../components/_error');
var User = require('./../user/user.model');
var Utility = require('./../../components/utility.js');
var  xlsx = require('xlsx');

exports.getFilterOnRegisterUser = function(req, res) {
  var filter = {};
  var orFilter = [];
  if (req.body.searchstr) {
    var term = new RegExp(req.body.searchstr, 'i');
    orFilter[orFilter.length] = {
      "auction.auctionId": {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      "auction.name": {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      "user.fname": {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      "user.lname": {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      "user.email": {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      "user.countryCode": {
        $regex: term
      }
    };
    orFilter[orFilter.length] = {
      "user.mobile": {
        $regex: term
      }
    };
  }

  if (orFilter.length > 0) {
    filter.$or = orFilter;
  }
  if(req.body.auctionOwnerMobile)
    filter['auction.auctionOwnerMobile'] = req.body.auctionOwnerMobile;

  filter.status = true;

  if (req.body.pagination) {
    Utility.paginatedResult(req, res, Model, filter, {});
    return;
  }

  var query = Model.find(filter).sort({createdAt: -1});
  query.exec(
    function(err, auctions) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json(auctions);
    }

  );
};

exports.validateUser = function(req, res){
  var filter = {};
  filter.deleted = false;
  if(req.body.userId) {
    if (/^\d+$/.test(req.body.userId)) {
      filter.mobile = req.body.userId;
    } else {
      filter.email = req.body.userId.toLowerCase();
    }
  }
  
  if(req.body.email)
      filter.email = req.body.email;
  if(req.body.mobile)
    filter.mobile = req.body.mobile;
  User.find(filter,function(err,users){
    if(err){ return handleError(res, err); }
    if(users.length === 0) return res.status(200).json({errorCode:1,message:"User not found"});
    else if(users.length == 1)
      return res.status(200).json({errorCode:0,user:users[0]});
    else
      return res.status(200).json({errorCode:2,message:"More than one user found"});
  });
};

exports.create = function(req, res,next) {

   _getRecord(req.body,function(err,result){
    if(err) { return handleError(res, err); }
    if(result.length > 0)
      return  next(new ApiError(409,"You have already register for this auction!!!"));
    else
      create();
  });

  function create(){
    var model = new Model(req.body);
     model.save(function(err, st) {
        if(err) { return handleError(res, err); }
         return res.status(200).json({message:"Your request has been successfully submitted!"});
      });
  }
};

function _getRecord(data,cb){
  var filter = {};
  if(data.auction.dbAuctionId)
    filter['auction.dbAuctionId'] = data.auction.dbAuctionId;
  if(data.user._id)
    filter['user._id'] = data.user._id;
  if(data.user.mobile)
    filter['user.mobile'] = data.user.mobile;
  Model.find(filter,function(err,result){
    cb(err,result);
  });
}

//data export

var USER_REQUEST_FOR_AUCTION_FIELD_MAP = {
                              'Auction Id' : 'auction.auctionId',
                              'Auction Name' : 'auction.name',
                              'EMD Amount' : 'auction.emdAmount',
                              'User Name' : 'fullName',
                              'Mobile' : 'mobileNo',
                              'Email' : 'user.email',
                              'Date of Request' : 'createdAt'
                            };
exports.exportData = function(req,res){
  var filter = {};
  if(req.body.auctionOwnerMobile)
    filter['auction.auctionOwnerMobile'] = req.body.auctionOwnerMobile;

  var query = Model.find(filter).sort({createdAt:-1});
  query.exec(
     function (err, data) {
        if(err) { return handleError(res, err); }
        var dataArr = [];
        var headers = Object.keys(USER_REQUEST_FOR_AUCTION_FIELD_MAP);
        dataArr.push(headers);
        data.forEach(function(item,idx){
          dataArr[idx + 1] = [];
          headers.forEach(function(header){
            if(USER_REQUEST_FOR_AUCTION_FIELD_MAP[header] == 'fullName')
              dataArr[idx + 1].push(_.get(item, 'user.fname', '') + ' ' + _.get(item, 'user.lname', ''));
            else if(USER_REQUEST_FOR_AUCTION_FIELD_MAP[header] == 'mobileNo') {
              if(item.user.mobile)
                dataArr[idx + 1].push('+' + _.get(item, 'user.countryCode', '') + '-' + _.get(item, 'user.mobile', ''));
              else
                dataArr[idx + 1].push('');
            }else if(USER_REQUEST_FOR_AUCTION_FIELD_MAP[header] == 'createdAt') {
              dataArr[idx + 1].push(Utility.toIST(_.get(item, 'createdAt', '')));
            }else
              dataArr[idx + 1].push(_.get(item,USER_REQUEST_FOR_AUCTION_FIELD_MAP[header],''));            
          });

        });

        var ws = Utility.excel_from_data(dataArr,headers);
        var ws_name = "User_Request_For_Auction_Report_" + new Date().getTime();
        var wb = Utility.getWorkbook();
        wb.SheetNames.push(ws_name);
        wb.Sheets[ws_name] = ws;
        var wbout = xlsx.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
        res.end(wbout);
     });
};
/*exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  req.body.updatedAt = new Date();
  Model.update({_id:req.params.id},{$set:req.body},function(err){
    if (err) { return handleError(res, err); }
    return res.status(200).json(req.body);
  });
};

exports.destroy = function(req, res,next) {
  Model.findById(req.params.id, function (err, oneRow) {
    if(err) { return handleError(res, err); }
    if(!oneRow) { return next(new ApiError(404,"Not found")); }
    oneRow.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send({message:"Record deleted sucessfully!!!"});
    });
  });
};*/

function handleError(res, err) {
  return res.status(500).send(err);
}