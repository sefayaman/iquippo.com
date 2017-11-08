(function(){
  'use strict';
  angular.module('sreizaoApp')
  .factory("modelSvc",['$http','$rootScope','$q',function($http, $rootScope,$q){
      var modelService = {};
      var path = '/api/model';
      modelService.getAllModel = getAllModel;
      modelService.getModelOnFilter = getModelOnFilter;
      function getAllModel(){
        var deferred = $q.defer();
         $http.get(path).then(function(res){
            deferred.resolve(res.data);

          },function(errors){
            console.log("Errors in brand fetch list :"+ JSON.stringify(errors));
            deferred.reject(errors);
          });
          return deferred.promise;
      };
     function getModelOnFilter(filter){
         return $http.post(path + "/search",filter)
                .then(function(res){
                  var models = _.sortBy(res.data, function(n) {
                        return n.name == 'Other';
                    });
                  return models;
                })
                .catch(function(ex){
                  throw ex;
                })
      };
      return modelService;
  }])

})();