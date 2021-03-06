(function(){
  'use strict';
angular.module('admin').factory("TechSpecMasterSvc",TechSpecMasterSvc);
 function TechSpecMasterSvc($http, $q, $httpParamSerializer){
    //var assetSaleHost = "http://localhost:7000";
    var svc = {};
    var svcPath = 'api/techspec';

    svc.get = get;
    svc.save = save;
    svc.saveField = saveField;
    svc.update = update;
    svc.destroy = destroy;
    svc.search = search;
    svc.getFieldData = getFieldData;
    svc.fieldUpdate = fieldUpdate;
    svc.getGroupByData = getGroupByData;
    svc.destroyFieldValue = destroyFieldValue;
    
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
     function getFieldData(filter){console.log("filter=",filter);
      var path = svcPath+'/fielddata'; 
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
      function getGroupByData(filter){
      var path = svcPath+'/groupbydata'; 
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

     function save(data){
        return $http.post(svcPath, data)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err;
        });
     }

     function saveField(data){
        return $http.post(svcPath+'/field', data)
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
     function fieldUpdate(data){
        return $http.put(svcPath + "/fieldupdate/" + data._id,data)
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

     function destroyFieldValue(id){
        return $http.delete(svcPath + "/fieldvalue/" + id)
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