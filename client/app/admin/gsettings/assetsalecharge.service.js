(function(){
  'use strict';
angular.module('admin').factory("AssetSaleChargeSvc",AssetSaleChargeSvc);
 function AssetSaleChargeSvc($http, $q, $httpParamSerializer){
    var assetSaleHost = "http://localhost:7000";
    var svc = {};
    var svcPath = '/assetsale/kyc';

    svc.get = get;
    svc.save = save;
    svc.update = update;
    svc.destroy = destroy;
     
   function get(filter){
      var path = assetSaleHost + svcPath; 
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
          });
     }

     function save(data){
        return $http.post(assetSaleHost + svcPath, data)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err;
        });
     }

     function update(data){
        return $http.put(assetSaleHost + svcPath + "/" + data._id,data)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err;
        });
     }

     function destroy(id){
        return $http.delete(assetSaleHost + svcPath + "/" + id)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err;
        });
     }
    return svc;
  }

})();