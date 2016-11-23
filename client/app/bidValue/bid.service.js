(function(){
'use strict';

angular.module('sreizaoApp').factory("BiddingSvc",BiddingSvc);
function BiddingSvc($http,$q,notificationSvc,Auth){
  var bidSvc = {};
    var path = "/api/bid";
    var HomeBiddingCache = [];
    var biddingCache = [];
    
    bidSvc.getAll = getAll;
    bidSvc.save = save;
    bidSvc.update = update;
    bidSvc.getOnFilter = getOnFilter;
    bidSvc.getHighestBids = getHighestBids;
    //bidSvc.getHomeTickerList = getHomeTickerList;
    
    function getAll(){

        return $http.get(path)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
         throw err;
        })
    }

    function getHighestBids(filter){
      var deferred = $q.defer();
        if(HomeBiddingCache.length > 0){
          deferred.resolve(HomeBiddingCache);
        }else{
          $http.post(path + "/gethighestbids", filter)
          .then(function(res){
            var bidValuesArr = [];
            for(var i =0 ; i < res.data.length; i++){
              var objVal = {};
              objVal.name = res.data[i]._id;
              objVal.bidValuesStr = getFormatedData(res.data[i].valueperunits);
              bidValuesArr[bidValuesArr.length] = objVal;  
            }
            HomeBiddingCache = bidValuesArr;
            deferred.resolve(HomeBiddingCache);
          })
          .catch(function(err){
            deferred.reject(err);
          })
        }
        return deferred.promise;
    }

    function getFormatedData(bidValues){
      if(!bidValues)
        return;
      bidValues.sort(function(a,b){
        return b.valueperunit - a.valueperunit;
      });
      
      var tempArr = [];
      for (var i in bidValues){
        if(i < 10)
          tempArr.push(bidValues[i].valueperunit + " ( " + bidValues[i].total_count + " )");
        else
          break;
      }
      return tempArr.join(); 
  }

    function save(data){
      return $http.post(path,data)
        .then(function(res){
          HomeBiddingCache = [];
          return res.data;
        })
        .catch(function(err){
          throw err
        })
    }

    function getOnFilter(data){
     return $http.post(path + "/onfilter",data)
        .then(function(res){
          // if(data.pagination)
          //       updateCache(res.data.items);
          //   else
          //     updateCache(res.data);
          return res.data
        })
        .catch(function(err){
          throw err
        }) 
    }
    
    function updateCache(dataArr){
        dataArr.forEach(function(item,index){
          biddingCache[item._id] = item;
        });
      }

    function update(bidData){
      var stsObj = {};
      stsObj.createdAt = new Date();
      stsObj.userId = Auth.getCurrentUser()._id;
      stsObj.status = bidData.status;
      bidData.statuses[bidData.statuses.length] = stsObj;
      return $http.put(path + "/" + bidData._id, bidData)
      .then(function(res){
        HomeBiddingCache = [];
          return res.data;
      })
      .catch(function(err){
        throw err;
      });
    }

    return bidSvc;
}
})();

