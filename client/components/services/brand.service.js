(function(){
  'use strict';

  angular.module('sreizaoApp')
  .factory("brandSvc",['$http', '$rootScope','$q',function($http, $rootScope,$q){
      var brandService = {};
      var path = '/api/brand';
      brandService.getAllBrand = getAllBrand;
      brandService.getBrandOnFilter = getBrandOnFilter;
      
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
  }])
})();