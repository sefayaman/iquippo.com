(function(){
  'use strict';
angular.module('admin').factory("userRegForAuctionSvc", userRegForAuctionSvc);
 function userRegForAuctionSvc($http, $q,$httpParamSerializer){
    var svc = {};
    var svcPath = '/api/auction/userregforauction';

    svc.get = get;
    svc.save = save;
    svc.validateUser = validateUser;
    svc.exportData = exportData;
    svc.getFilterOnRegisterUser = getFilterOnRegisterUser;
    //svc.update = update;
    //svc.destroy = destroy;
    
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

     function save(data){
        return $http.post(svcPath,data)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err;
        });
     }

     function validateUser(data) {
      return $http.post(svcPath + '/validateuser',data);
     }

     function exportData(data) {
      return $http.post(svcPath + "/export", data)
        .then(function(res) {
          return res.data;
        })
        .catch(function(err) {
          throw err;
        });
    }

    function getFilterOnRegisterUser(data){
     return $http.post(svcPath + "/filterregisteruser",data)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err;
        });
    }

    /*function update(data){
      return $http.put(svcPath + "/" + data._id,data)
      .then(function(res){
        return res.data;
      })
      .catch(function(err){
        throw err;
      });
     }*/

    /*function destroy(id){
      return $http.delete(svcPath + "/" + id)
      .then(function(res){
        return res.data;
      })
      .catch(function(err){
        throw err;
      });
    }*/

    return svc;
  }

})();