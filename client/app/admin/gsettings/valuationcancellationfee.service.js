(function(){
  'use strict';
angular.module('admin').factory("ValuationCancellationSvc",ValuationCancellationSvc);
 function ValuationCancellationSvc($http, $q,$httpParamSerializer){
    var svc = {};
    var svcPath = '/api/common/valuationcancellationfee';

    svc.get = get;
    svc.getCancellationFee = getCancellationFee;
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
       return $http.get(path)
          .then(function(res){
            return res.data;
          })
          .catch(function(err){
            throw err;
          })
     }

     function getCancellationFee(filter){
      var path = '/api/common/findcancellationfee'; 
      var queryParam = "";
        if(filter)
          queryParam = $httpParamSerializer(filter);
        if(queryParam)
          path  = path + "?" + queryParam;
       return $http.get(path)
          .then(function(res){
            return res.data;
          })
          .catch(function(err){
            throw err;
          })
     }

     function save(data){
        return $http.post(svcPath,data)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err;
        })
     }

     function update(data){
        return $http.put(svcPath + "/" + data._id,data)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err;
        })
     }

     function destroy(id){
        return $http.delete(svcPath + "/" + id)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err;
        })
     }
    return svc;
  }

})();