(function(){
  'use strict';
angular.module('admin').factory("CountSvc",CountSvc);
 function CountSvc($http, $q,$httpParamSerializer){
    var svc = {};
    var svcPath = '/api/common';

    svc.getData = getData;
    svc.saveassetlisted = saveassetlisted;
   svc.updateassetlisted = updateassetlisted;
   // svc.destroy = destroy;
  
     function saveassetlisted(data){


        return $http.post(svcPath+ "/assetlisted",data)
        .then(function(res){
          return res.data; 
        })
        .catch(function(err){
          throw err;
        });
     }

     function updateassetlisted(data){
        return $http.put(svcPath + "/assetlisted/" + data._id,data)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err;
        });
     }


     function getData(filter){
      var path = svcPath +"/assetlisted"; 
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
    
    return svc;
  }

})();