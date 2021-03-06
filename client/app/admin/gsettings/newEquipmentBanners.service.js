(function(){
  'use strict';
angular.module('admin').factory("NewEquipmentBannersSvc",NewEquipmentBannersSvc);
 function NewEquipmentBannersSvc($http, $q, $httpParamSerializer){
    //var assetSaleHost = "http://localhost:7000";
    var svc = {};
    var svcPath = 'api/newequipmentbanners';

    svc.get = get;
    svc.save = save;
    svc.update = update;
    svc.destroy = destroy;
    svc.search = search;
    svc.check = check;
     
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
          });
     }

     function search(filter){
       return $http.post(svcPath+'/search',filter)
          .then(function(res){
            return res.data;
          })
          .catch(function(err){
            throw err;
          });
     }
     
     function check(filter){
      var path = svcPath; 
      var queryParam = "";
        if(filter)
          queryParam = $httpParamSerializer(filter);
        if(queryParam)
          path  = path + "/check/?" + queryParam;
       return $http.get(path)
          .then(function(res){
            return res.data;
          })
          .catch(function(err){
            throw err;
          });
     }

     function save(data){
        return $http.post(svcPath, data)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err;
        });
     }

     function update(data){
        return $http.put(svcPath + "/" + data._id,data)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err;
        });
     }

     function destroy(id){
        return $http.delete(svcPath + "/" + id)
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