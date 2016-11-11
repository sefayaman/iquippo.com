(function(){
'use strict';

angular.module('sreizaoApp').factory("BiddingSvc",BiddingSvc);
function BiddingSvc($http,$q,notificationSvc,Auth){
  var bidSvc = {};
    var path = "/api/bid";
    var HomeBiddingCache = [];
    
    bidSvc.getAll = getAll;
    bidSvc.save = save;
    bidSvc.update = update;
    bidSvc.getOnFilter = getOnFilter;
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

    /*function getHomeBanner(){

        var deferred = $q.defer();
        if(HomeBannerCache.length > 0){
          deferred.resolve(HomeBannerCache);
        }else{
          var filter = {};
          filter.valid = 'y';
          $http.post(path + "/onfilter",filter)
          .then(function(res){
            for(var i =0 ; i < 5 ; i++){
              if(res.data[i]){
                HomeBannerCache[HomeBannerCache.length] = res.data[i];  
              }else
                HomeBannerCache[HomeBannerCache.length] = HOME_BANNER[i];
            }
             deferred.resolve(HomeBannerCache);
          })
          .catch(function(err){
            deferred.reject(err);
          })
        }

        return deferred.promise;
        
    };*/

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
          return res.data
        })
        .catch(function(err){
          throw err
        }) 
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

