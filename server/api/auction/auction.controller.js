'use strict';

var _ = require('lodash');
var AuctionRequest = require('./auction.model');
var  xlsx = require('xlsx');

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
exports.create = function(req, res) {
  console.log("buyer created");
  req.body.createdAt = new Date();
  req.body.updatedAt = new Date();
  AuctionRequest.create(req.body, function(err, auction) {
        return res.status(201).json(auction);
  });
};

//search based on filter
exports.getOnFilter = function(req, res) {
  
  var filter = {};
  if(req.body._id)
    filter["_id"] = req.body._id;
  if(req.body.userId)
    filter["user._id"] = req.body.userId;

   if(req.body.tid)
    filter["transactionId"] = req.body.tid;
  var query = AuctionRequest.find(filter);
  console.log("filetr ",filter);
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
  AuctionRequest.findById(req.params.id, function (err, auction) {
    if (err) { return handleError(res, err); }
    if(!auction) { return res.status(404).send('Not Found'); }
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
  range = {s: {c:0, r:0}, e: {c:11, r:data.length }};

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
        cell =  {v: auction.product.assetId};
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

function handleError(res, err) {
  return res.status(500).send(err);
}
