(function(){
  'use strict';
angular.module('manpower').factory("ManpowerSvc",ManpowerSvc)

 function ManpowerSvc($http, $q, $rootScope){
    var manpowerCache = [];
    var manpowerService = {};
    var path = '/api/manpower';
      
    manpowerService.getAllUser = getAllUser;
    manpowerService.getManpowerDataOnUserId = getManpowerDataOnUserId;
    manpowerService.clearCache = clearCache;
    manpowerService.validateSignup = validateSignup;
    manpowerService.getProductOnFilter = getProductOnFilter;
    manpowerService.getManpowerUserOnFilter = getManpowerUserOnFilter;
    manpowerService.createUser = createUser;
    manpowerService.updateUser = updateUser;
    manpowerService.createManpower = createManpower;
    manpowerService.updateManpower = updateManpower;
    

    function getProductOnFilter(filter){
      return $http.post(path + "/getequipment",filter)
        .then(function(res){
          return res.data;
        })
        .catch(function(res){
          throw res;
        })
    };

    function getManpowerUserOnFilter(filter){
      return $http.post(path + "/getmanpoweruserfilter",filter)
        .then(function(res){
          return res.data;
        })
        .catch(function(res){
          throw res;
        })
    };

  function getManpowerDataOnUserId(id){
    var deferred = $q.defer();
      $http.get(path + "/" + id)
      .then(function(res){
        deferred.resolve(res.data);
      })
      .catch(function(res){
        deferred.reject(res);
      })
    return deferred.promise;
  };

    function getAllUser(){
      var deferred = $q.defer();
      if(manpowerCache && manpowerCache.length > 0){
        deferred.resolve(manpowerCache);
      }else{
        $http.get(path).then(function(res){
            manpowerCache = res.data;
            //sortVendors(res.data);
            deferred.resolve(res.data);
        },function(errors){
          console.log("Errors in fetch list :"+ JSON.stringify(errors));
          deferred.reject(errors);
        });
      }
     
        return deferred.promise; 
    };

    function createManpower(data){
      return $http.post(path + '/create', data)
      .then(function(res){
        manpowerCache = [];
        return res.data;
      })
      .catch(function(err){
        throw err
      })
    };

    function createUser(data){
      return $http.post('/api/users/register', data)
      .then(function(res){
        manpowerCache = [];
        return res.data;
      })
      .catch(function(err){
        throw err
      })
    };

    function updateUser(user){
      return $http.put("/api/users/update/" + user._id, user)
      .then(function(res){
        return res.data;
      })
      .catch(function(err){
        throw err;
      });
    };

    function updateManpower(user){
      return $http.put(path + "/update/" + user._id, user)
      .then(function(res){
        return res.data;
      })
      .catch(function(err){
        throw err;
      });
    };

    function validateSignup(data){
          return $http.post(path + '/validatesignup', data)
          .then(function(res){
            return res.data;
          })
          .catch(function(err){
            throw err
          });
      }

      /*function sortVendors(data){

      for(var i=0; i < data.length; i++)
      {
        for(var j=0; j < data[i].services.length; j++)
        {
            var vd = {};
            vd._id =  data[i]._id;
            vd.name =  data[i].entityName;
            vd.imgsrc = data[i].imgsrc;
          if(data[i].services[j] == 'Shipping'){
              shippingVendorList.push(vd);
          }
          else if(data[i].services[j] == "Valuation"){
            valuationVendorList.push(vd);
          }
          else if(data[i].services[j] == 'CertifiedByIQuippo'){
            certifiedByIQuippoVendorList.push(vd);
          }
        }
      }
  }*/

  function clearCache(){
    manpowerCache = [];
    shippingVendorList = [];
    valuationVendorList = [];
    certifiedByIQuippoVendorList = [];
  }

      return manpowerService;
  }
})();
