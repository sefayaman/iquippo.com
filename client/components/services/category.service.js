(function(){
  'use strict';
  angular.module('sreizaoApp').factory("categorySvc",CategorySvc);

  function CategorySvc($http, $rootScope,$q,productSvc,$httpParamSerializer){
      var catService = {};
      var categoryCache = [];
      var homeCategoryCache = [];
      var path = '/api/category/category';
      catService.getAllCategory = getAllCategory;
      catService.getCategoryForMain = getCategoryForMain;
      catService.getCategoryOnId = getCategoryOnId;
      catService.getCategoryOnFilter = getCategoryOnFilter;
      catService.getCategoryByName = getCategoryByName;
      catService.clearCache = clearCache;
      catService.updateCategory = updateCategory;
      catService.getCount = getCount;
      
      function getAllCategory(){
        var deferred = $q.defer();
        if(categoryCache && categoryCache.length > 0){
          deferred.resolve(categoryCache);
        }else{
          $http.get(path).then(function(res){
          var allCategory = _.sortBy(res.data, function(n) {
              return n.name == 'Other';
          });
          categoryCache = allCategory;
          deferred.resolve(allCategory);

          },function(errors){
            console.log("Errors in Category fetch list :"+ JSON.stringify(errors));
          });
          
        }
        return deferred.promise; 
      };

      function getCategoryForMain(){
        var filter = {};
        filter.isForUsed = true;
        filter.visibleOnUsed = true;
        filter.productCount = true;
        filter.categoryCount = true;
        var deferred = $q.defer();
        if(homeCategoryCache && homeCategoryCache.length > 0){
          deferred.resolve(homeCategoryCache);
        }else{

            getCategoryOnFilter(filter)
            .then(function(resData){
              homeCategoryCache = resData;
              deferred.resolve(homeCategoryCache);
            })
            .catch(function(res){
               console.log("Errors in Category fetch list :"+ JSON.stringify(res));
               deferred.reject(res);
            });
          }
          return deferred.promise;
        }

        function getCategoryOnFilter(filter){
            var serPath = path;
            var queryParam = "";
           if(filter)
            queryParam = $httpParamSerializer(filter);
          if(queryParam)
            serPath += "?" + queryParam;
          return $http.get(serPath).
                  then(function(res){
                    return res.data;
                  })
                  .catch(function(res){
                     throw res;
                  });
          }

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

      function getCategoryOnId(id){
        var cat;
        for(var i = 0; i < categoryCache.length ; i++){
          if(categoryCache[i]._id == id){
            cat = categoryCache[i];
            break;
          }
        }
        return cat;
      };

      function getCategoryByName(name){
        var cat;
        for(var i = 0; i < categoryCache.length ; i++){
          if(categoryCache[i].name == name){
            cat = categoryCache[i];
            break;
          }
        }
        return cat;
      };

      function updateCategory(category){
        return $http.put( path + "/" + category._id,category)
        .then(function(res){
          clearCache();
          return res.data;
        })
        .catch(function(res){
          throw res;
        })
      }

      function clearCache(){
        categoryCache = [];
        homeCategoryCache = [];
      }
      return catService;
  }

})();