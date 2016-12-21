'use strict';

var _ = require('lodash');
var Seq = require("seq");
var AuctionRequest = require('./auction.model');
var AuctionMaster = require('./auctionmaster.model');

var  xlsx = require('xlsx');
var Utility = require('./../../components/utility.js');
var ApiError = require('./../../components/_error.js');
var config = require('./../../config/environment');
var importPath = config.uploadPath + config.importDir + "/";
var Product = require('./../product/product.model');
// Get list of auctions
exports.getAll = function(req, res) {
  AuctionRequest.find(function (err, auctions) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(auctions);
  });
};

// Get a single auction
exports.getOnId = function(req, res) {
  AuctionRequest.findById(req.params.id, function (err, auction) {
    if(err) { return handleError(res, err); }
    if(!auction) { return res.status(404).send('Not Found'); }
    return res.json(auction);
  });
};

// Creates a new valuation in the DB.
exports.create = function(req, res,next) {
  
  var assetIdExist = false;
  if(!req.body.product.assetId)
    return next(new ApiError(400,"Asset Id is mandatory"));

  Seq()
  .par(function(){
    var self = this;
    Product.find({assetId:req.body.product.assetId},function(err,prds){
      if(err){return self(err)}
      if(prds.length > 0){assetIdExist = true;}
      self();

    });
  })
  .par(function(){
    var self = this;
    AuctionRequest.find({"product.assetId":req.body.product.assetId},function(err,acts){
      if(err){self(err)}
      if(acts.length > 0){assetIdExist = true;}
      self();
    });
  })
  .seq(function(){

    if(assetIdExist)
      return res.status(201).json({errorCode:1,message:"Duplicate asset id found."});
    req.body.createdAt = new Date();
    req.body.updatedAt = new Date();
    AuctionRequest.create(req.body, function(err, auction) {
          return res.status(201).json({errorCode:0,message:"Success."});;
    });

  })
  .catch(function(err){
    return handleError(res, err);
  })
  
};

//search based on filter
exports.getOnFilter = function(req, res) {
  
  var filter = {};
   var orFilter = [];
  
  if(req.body.searchStr){

     var term = new RegExp(req.body.searchStr, 'i');
     orFilter[orFilter.length] = {"product.name":{$regex:term}};
     orFilter[orFilter.length] = {"product.assetId":{$regex:term}};
     orFilter[orFilter.length] = {"product.productId":{$regex:term}};
     orFilter[orFilter.length] = {auctionId:{$regex:term}};
     orFilter[orFilter.length] = {status:{$regex:term}};
     orFilter[orFilter.length] = {"valuation.status":{$regex:term}};
      orFilter[orFilter.length] = {"seller.name":{$regex:term}};
  }

  if(orFilter.length > 0){
    filter['$or'] = orFilter;
  }

  if(req.body._id)
    filter["_id"] = req.body._id;
  if(req.body.userId)
    filter["user._id"] = req.body.userId;
  if(req.body.valuationId)
      filter["valuation._id"] = req.body.valuationId;
   if(req.body.tid)
    filter["transactionId"] = req.body.tid;

  if(req.body.pagination){
    Utility.paginatedResult(req,res,AuctionRequest,filter,{});
    return;
  }
  var query = AuctionRequest.find(filter);
  query.exec(
               function (err, auctions) {
                      if(err) { return handleError(res, err); }
                      return res.status(200).json(auctions);
               }
  );
};

// Updates an existing auction in the DB.
exports.update = function(req, res) {
  
  if(req.body._id) { delete req.body._id; }
  req.body.updatedAt = new Date();
  AuctionRequest.find({"product.assetId":req.body.product.assetId}, function (err, auctions) {
    if (err) { return handleError(res, err); }
    if(auctions.length == 0){return res.status(404).send("Not Found.");}
    if(auctions.length > 1 || auctions[0]._id != req.params.id){
      return res.status(201).json({errorCode:1,"Duplicate asset id found."});
    }
      
     AuctionRequest.update({_id:req.params.id},{$set:req.body},function(err){
        if (err) { return handleError(res, err); }
        return res.status(200).json(req.body);
      });
    });
};

// Deletes a auction from the DB.
exports.destroy = function(req, res) {
  AuctionRequest.findById(req.params.id, function (err, auction) {
    if(err) { return handleError(res, err); }
    if(!auction) { return res.status(404).send('Not Found'); }
    auction.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

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

function setCell(ws,cell,R,C){
    setType(cell);
    var cell_ref = xlsx.utils.encode_cell({c:C,r:R}) 
    ws[cell_ref] = cell;
}

function excel_from_data(data, isAdmin) {
  var ws = {};
  var range;
  range = {s: {c:0, r:0}, e: {c:14, r:data.length }};

  for(var R = 0; R != data.length + 1 ; ++R){
    var C = 0;
    var auction = null;
    if(R != 0)
      auction = data[R-1];
    var cell = null;
    if(R == 0)
      cell = {v: "Auction Id"};
    else{
      if(auction)
        cell =  {v: auction.auctionId};
    }

    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "Asset Id"};
    else{
      if(auction)
        cell =  {v: auction.product.assetId || ""};
    }
    setCell(ws,cell,R,C++);


    if(R == 0)
      cell = {v: "Product Id"};
    else{
      if(auction)
        cell =  {v: auction.product.productId || ""};
    }
    setCell(ws,cell,R,C++);

     if(R == 0)
      cell = {v: "Seller Name"};
    else{
      if(auction && auction.seller)
        cell =  {v: auction.seller.name || ""};
      else
        cell =  {v: ""};
    }
    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "Asset Name"};
    else{
      if(auction)
        cell =  {v: auction.product.name};
    }
    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "Manufacturer"};
    else{
      if(auction)
        cell =  {v: auction.product.brand};
    }
    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "Model"};
    else{
      if(auction)
        cell =  {v: auction.product.model};
    }
    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "Manufaturing Year"};
    else{
      if(auction)
        cell =  {v: auction.product.mfgYear};
    }
    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "City"};
    else{
      if(auction)
        cell =  {v: auction.product.city};
    }
    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "Machine Serial No."};
    else{
      if(auction)
        cell =  {v: auction.product.serialNumber || ""};
    }
    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "Price (Excl. Tax)"};
    else{
      if(auction)
        cell =  {v: auction.product.grossPrice || ""};
    }
    setCell(ws,cell,R,C++);

    if(R == 0)
      cell = {v: "Start Date"};
    else{
      if(auction)
        cell =  {v: auction.startDate};
    }

    setCell(ws,cell,R,C++);
    if(R == 0)
      cell = {v: "End Date"};
    else{
      if(auction)
        cell =  {v: auction.endDate};
    }
    setCell(ws,cell,R,C++);
    
  }
  ws['!ref'] = xlsx.utils.encode_range(range);
  return ws;
}

exports.exportAuction = function(req,res){
  var filter = {};
  var isAdmin = true;
  if(req.body.userid){
    filter["user._id"] = req.body.userid;
    isAdmin = false;
  }
  if(req.body.ids)
    filter['_id'] = {$in:req.body.ids};
  var query = AuctionRequest.find(filter).sort({auctionId:1});
  query.exec(
     function (err, auctions) {
        if(err) { return handleError(res, err); }
        var ws_name = "auction"
        var wb = new Workbook();
        var ws = excel_from_data(auctions,isAdmin);
        wb.SheetNames.push(ws_name);
        wb.Sheets[ws_name] = ws;
        var wbout = xlsx.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
        res.end(wbout);
     });
}

//Auction master services

// Creates a new AuctionMaster in the DB.
exports.createAuctionMaster = function(req, res) {
  var filter = {}
  if(!req.body.auctionId)
    return res.status(401).send('Insufficient data');
  
  //if(req.body.entityName)
  filter['auctionId'] = req.body.auctionId;
  //var term = new RegExp("^" + req.body.entityName + "$", 'i');
  AuctionMaster.find(filter,function(err, auctionData){
    if(err) return handleError(res, err); 
    if(auctionData.length > 0){
      return res.status(200).json({errorCode:1, message:"Auction Id already exist."});
    }else{
      AuctionMaster.create(req.body, function(err, auctionData) {
        if(err) { return handleError(res, err); }
        return res.status(201).json({errorCode:0, message:""});
      });
    }
  })
  
};

// Creates a AuctionMaster in the DB.
exports.updateAuctionMaster = function(req, res) {
  var _id = req.body._id;
  if(req.body._id) { delete req.body._id;}
  //if(req.body.user) { delete req.body.user; }
  req.body.updatedAt = new Date();
  var filter = {}
  if(!req.body.auctionId)
    return res.status(401).send('Insufficient data');
  if(_id)
     filter['_id'] = {$ne:_id}; 
  if(req.body.auctionId)
    filter['auctionId'] = req.body.auctionId;
  AuctionMaster.find(filter,function(err,auctionData){
    if(err) return handleError(res, err); 
    if(auctionData.length > 0){
      return res.status(200).json({errorCode:1, message:"Auction Id already exist."});
    } else {
      AuctionMaster.update({_id:_id},{$set:req.body},function (err) {
        if (err) {return handleError(res, err); }
        return res.status(200).json({errorCode:0, message:"Success"});
      });
    }
  });
}

//search AucyionMaster based on filter 
exports.getFilterOnAuctionMaster = function(req, res) {
  console.log("req.body.searchstr", req.body.searchstr);
  var searchStrReg = new RegExp(req.body.searchstr, 'i');

  var filter = {};
  if(req.body._id)
    filter["_id"] = req.body._id;
  if(req.body.userId)
    filter["user._id"] = req.body.userId;
  if(req.body.mobile)
    filter["user.mobile"] = req.body.mobile;
  var arr = [];
  if(req.body.searchstr){
    arr[arr.length] = { name: { $regex: searchStrReg }};
    arr[arr.length] = { auctionId: { $regex: searchStrReg }};
    arr[arr.length] = { auctionOwner: { $regex: searchStrReg }};
    arr[arr.length] = { city: { $regex: searchStrReg }};
    arr[arr.length] = { auctionAddr: { $regex: searchStrReg }};
    arr[arr.length] = { auctionType: { $regex: searchStrReg }};
    arr[arr.length] = { docType: { $regex: searchStrReg }};
    //arr[arr.length] = { regCharges: { $regex: searchStrReg }};
    
  }

  if(arr.length > 0)
    filter['$or'] = arr;

  var result = {};
  if(req.body.pagination){
    Utility.paginatedResult(req,res,AuctionMaster,filter,{});
    return;    
  }

  var sortObj = {}; 
  if(req.body.sort)
    sortObj = req.body.sort;
  sortObj['createdAt'] = -1;

  var query = AuctionMaster.find(filter).sort(sortObj); 
  query.exec(
               function (err, users) {
                      if(err) { return handleError(res, err); }
                      return res.status(200).json(users);
               }
  );
};

exports.getAuctionMaster = function(req,res){
  var filter = {};
  var queryObj = req.query;
  if(queryObj.yetToStartDate)
    filter['startDate'] = {'$gt' : new Date(queryObj.yetToStartDate)}
  var query = AuctionMaster.find(filter).sort({createdAt:-1})
   query.exec(function (err, auctions) {
      if(err) { console.log("err", err);
       return handleError(res, err); }
      return res.status(200).json(auctions);
    });
}

exports.deleteAuctionMaster = function(req, res) {
  AuctionMaster.findById(req.params.id, function (err, auctionData) {
    if(err) { return handleError(res, err); }
    if(!auctionData) { return res.status(404).send('Payment master Found'); }
    auctionData.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send({errorCode:0,message:"Payment master deleted sucessfully!!!"});
    });
  });
};

exports.importAuctionMaster = function(req,res){
  var fileName = req.body.fileName;
    var workbook = null;
  try{
    workbook = xlsx.readFile(importPath + fileName);
  }catch(e){
    console.log(e);
    return  handleError(res,"Error in file upload")
  }
  if(!workbook)
    return res.status(404).send("Error in file upload");
  var worksheet = workbook.Sheets[workbook.SheetNames[0]];
  //console.log("data",worksheet);
  var data = xlsx.utils.sheet_to_json(worksheet);
  if(data.length == 0){
    return res.status(500).send("There is no data in the file.");
  }
  var headers = ['Auction_Title*','Start_Date*','End_Date*',"Auction_Id*"];
  var hd = getHeaders(worksheet);
  if(!validateHeader(hd,headers)){
    return res.status(500).send("Wrong template");
  }
  var ret = false;
  var errorMessage = "";
  for(var i=0;i < data.length; i++){
    var title = data[i]['Auction_Title*'];
    var startDate = new Date(data[i]['Start_Date*']);
    var endDate = new Date(data[i]['End_Date*']);
    var auctionId = data[i]['Auction_Id*'];
    if(!title){
      ret = true;
      errorMessage += "Title is empty in row " + (i+2);
      break;
    }
    if(!auctionId){
      ret = true;
      errorMessage += "Auction Id is empty in row " + (i+2);
      break;
    }
    if(!startDate ||!isValid(startDate)){
      ret = true;
      errorMessage += "Start_Date is empty  or invalid format in row " + (i+2);
      break;
    }
    if(!endDate || !isValid(endDate)){
      ret = true;
      errorMessage += "End_Date is empty or invalid format in row " + (i+2);
      break;
    }
  } 

  if(ret){
    return res.status(201).json({errorCode:1,message:errorMessage});
  }

  //console.log("data",data);
  req.counter = 0;
  req.numberOfCount = data.length;
  req.successCount = 0;
  req.groupId = new Date().getTime();
  importAuctionMaster(req,res,data);
}

function getHeaders(worksheet){
  var headers = [];
  for(var z in worksheet) {
        if(z[0] === '!') continue;
        //parse out the column, row, and value
        var col = z.substring(0,1);
        var row = parseInt(z.substring(1));
        var value = worksheet[z].v;
        //store header names
        if(row == 1) {
            headers[headers.length] = value;
        }
    }
    console.log("gggg",headers);
  return headers;
}

function validateHeader(headersInFile,headers){
  var ret = true;
  ret = headersInFile.length == headers.length;
  if(!ret)
    return ret;
  for(var i=0; i < headersInFile.length;i++){
    var hd = headers[i];
    if(headers.indexOf(hd) == -1){
      ret = false;
      break;
    }
  }

  return ret;
}

function isValid(d) {
  return d.getTime() === d.getTime();
}

function importAuctionMaster(req,res,data){
  if(req.counter < req.numberOfCount){
    var auctionData = {};
    auctionData.name = data[req.counter]['Auction_Title*'];
      auctionData.startDate = new Date(data[req.counter]['Start_Date*']);
      auctionData.endDate = new Date(data[req.counter]['End_Date*']);
      auctionData.auctionId = data[req.counter]['Auction_Id*'];
      auctionData.groupId = req.groupId;
      AuctionMaster.create(auctionData,function(err,act){
        if(err){return handleError(res,err)}
        else{
          req.counter ++;
          importAuctionMaster(req,res,data);
        }
      })
  }else{
    res.status(200).json({errorCode:0,message:"Auction master imported successfully"});
  }
}
/* end of auctionmaster */
function handleError(res, err) {
  return res.status(500).send(err);
}
