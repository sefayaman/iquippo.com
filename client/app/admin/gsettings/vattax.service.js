(function(){
  'use strict';
angular.module('admin').factory("VatTaxSvc",VatTaxSvc);
 function VatTaxSvc($http, $q,$httpParamSerializer){
    var svc = {};
    var svcPath = '/api/common/vattax';

    svc.get = get;
    svc.search = search;
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
        return $http.post(svcPath,data)
        .then(function(res){
          console.log("res",res);
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