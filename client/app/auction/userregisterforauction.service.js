(function(){
  'use strict';
angular.module('admin').factory("userRegForAuctionSvc", userRegForAuctionSvc);
 function userRegForAuctionSvc($http, $q,$httpParamSerializer){
    var svc = {};
    var svcPath = '/api/auction/userregforauction';

    svc.get = get;
    svc.save = save;
    svc.exportData = exportData;
    svc.getFilterOnRegisterUser = getFilterOnRegisterUser;
    svc.sendUserData=sendUserData;
    svc.saveOfflineRequest=saveOfflineRequest;
    //svc.update = update;
    //svc.destroy = destroy;
    svc.checkUserRegis = checkUserRegis;
    svc.generateKit = generateKit;
    
   function sendUserData(filter){
     return $http.post(svcPath + '/senddata',filter)
     .then(function(res){
       return res.data;
     })
     .catch(function(err){
       throw err;
     });
   }

   function generateKit(tns){
     var deferred = $q.defer();
      var filter = {
        auctionId:tns.auction_id,
        transactionId:tns._id,
        userId:tns.user._id
      };

      if(tns.registrationKit && tns.undertakingKit){
        deferred.resolve({
          registrationKit:tns.registrationKit,
          undertakingKit : tns.undertakingKit
        });
      }else{
          $http.post(svcPath + '/generatekit',filter)
         .then(function(res){
            deferred.resolve(res.data);
         })
         .catch(function(err){
          deferred.reject(err);
         });
      }
      

       return deferred.promise;
   }


   function get(filter){
      var path = svcPath + '/getdata'; 
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

     function checkUserRegis(data){
         // var path = '/api/auction/checkUserRegis';

          return $http.post(svcPath + '/checkUserRegis',data)
          .then(function(res){
            return res.data;
          })
          .catch(function(err){
            throw err;
          });
      }

      function saveOfflineRequest(data){
        // var path = '/api/auction/checkUserRegis';
         return $http.post(svcPath + '/saveOfflineRequest',data)
         .then(function(res){
           return res.data;
         })
         .catch(function(err){
           throw err;
         });
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