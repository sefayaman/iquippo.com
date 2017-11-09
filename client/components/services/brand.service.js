(function(){
  'use strict';

  angular.module('sreizaoApp').factory("brandSvc",BrandSvc);
  function BrandSvc($http, $rootScope,$q,$httpParamSerializer){
      var brandService = {};
      var path = '/api/brand';
      brandService.getAllBrand = getAllBrand;
      brandService.getBrandOnFilter = getBrandOnFilter;
      brandService.getCount = getCount;
      brandService.getHelp = getHelp;
      
      function getAllBrand(){
          var deferred = $q.defer();
         $http.get(path).then(function(res){
            deferred.resolve(res.data);

          },function(errors){
            console.log("Errors in brand fetch list :"+ JSON.stringify(errors));
            deferred.reject(errors);
          });
          return deferred.promise;
      };

      function getCount(filter){
         var serPath = path + "/count";
            var queryParam = "";
           if(filter)
            queryParam = $httpParamSerializer(filter);
          if(queryParam)
            serPath += "?" + queryParam;
         return $http.get(serPath).then(function(res){
            return res.data;
          })
         .catch(function(err){
            throw err;
         });
      };

      function getHelp(searchText) {
        var serData = {};
        serData['searchStr'] = searchText;
        return getBrandOnFilter(serData)
        .then(function(result){
          var cache = {};
          var uniqueRes = [];
          result.forEach(function(item){
            if(cache[item.name])
              return;
            uniqueRes.push(item);
            cache[item.name] = 1;
          })
           return uniqueRes.map(function(item){
                return item.name;
          });
        })
      };


      function getBrandOnFilter(filter){
          return $http.post(path + "/search",filter)
                .then(function(res){
                   var brands = _.sortBy(res.data, function(n) {
                        return n.name == 'Other';
                    });
                  return brands;
                })
                .catch(function(ex){
                  throw ex;
                })
      };
      return brandService;
  }
})();