(function(){
  'use strict';
angular.module('admin').factory("ValuationPurposeSvc",ValuationPurposeSvc);
 function ValuationPurposeSvc($http, $q,$httpParamSerializer){
    var cachedData = [];
    var svc = {};
    var svcPath = '/api/common/valuationpurpose';

    svc.get = get;
    svc.save = save;
    svc.update = update;
    svc.destroy = destroy;
     
   function get(filter){
      var path = svcPath; 
        var queryParam = "";
        if(filter)
          queryParam = $httpParamSerializer(filter);
        if(queryParam)
          path  = path + "?" + queryParam;
        var deferred = $q.defer();
        if(cachedData && cachedData.length > 0)
          deferred.resolve(cachedData);
        else{
          $http.get(path)
          .then(function(res){
            cachedData = res.data;
            deferred.resolve(cachedData);
          })
          .catch(function(err){
            deferred.reject(err);
          })
        }
        return deferred.promise;
     }

     function save(data){
        return $http.post(svcPath,data)
        .then(function(res){
           cachedData = [];
          return res.data;
        })
        .catch(function(err){
          throw err;
        })
     }

     function update(data){
        return $http.put(svcPath + "/" + data._id,data)
        .then(function(res){
          cachedData = [];
          return res.data;
        })
        .catch(function(err){
          throw err;
        })
     }

     function destroy(id){
        return $http.delete(svcPath + "/" + id)
        .then(function(res){
          cachedData = [];
          return res.data;
        })
        .catch(function(err){
          throw err;
        })
     }
    return svc;
  }

})();