'use strict';
var Seq = require('seq');

exports.paginatedResult = paginatedResult;

function paginatedResult(req,res,modelRef,filter,result){

  var pageSize = req.body.itemsPerPage;
  var first_id = req.body.first_id;
  var last_id = req.body.last_id;
  var currentPage = req.body.currentPage;
  var prevPage = req.body.prevPage;
  var isNext = currentPage - prevPage >= 0?true:false;
  Seq()
  .par(function(){
    var self = this;
    modelRef.count(filter,function(err,counts){
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
      //console.log("1111111111filter",filter);
      query = modelRef.find(filter).sort(sortFilter).limit(pageSize*skipNumber);
      query.exec(function(err,items){
          if(!err && items.length > pageSize*(skipNumber - 1)){
                result.items = items.slice(pageSize*(skipNumber - 1),items.length);
          }else
            result.items = [];
          if(!isNext && result.items.length > 0)
           result.items.reverse();
           self(err);
    });

  })
  .seq(function(){
      return res.status(200).json(result);
  })
  .catch(function(err){
    console.log("######",err);
    handleError(res,err);
  })
 
}