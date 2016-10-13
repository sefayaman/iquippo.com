(function(){
 'use strict';
 angular.module("spare").factory("spareSvc",spareSvc);

 function spareSvc($http,$rootScope,$q,Auth){
      var spareService = {};
      var path = '/api/spare';
      
      var spareCache = {};
      var searchFilter = null;

      //public methods
      spareService.getSpareOnId = getSpareOnId;
      spareService.addSpare = addSpare;
      spareService.updateSpare = updateSpare;
      spareService.deleteSpare = deleteSpare;
      //spareService.getProductOnCategoryId = getProductOnCategoryId;
      spareService.getSpareOnFilter = getSpareOnFilter;
      //spareService.getSearchResult = getSearchResult;
      //spareService.setSearchResult = setSearchResult;
      
      function getSpareOnId(id,fromServer){

        var deferred = $q.defer();
        if(spareCache[id] && !fromServer){
          deferred.resolve(spareCache[id]);
        }else{

          $http.get(path + "/" + id)
          .then(function(res){
            addToCache(res.data);
            deferred.resolve(res.data);
          })
          .catch(function(res){
            deferred.reject(res);
          })
        }
        return deferred.promise;
      };

      function getSpareOnFilter(filter){
        return $http.post(path + "/searchspare", filter)
          .then(function(res){
            updateCache(res.data);
            return res.data;
          })
          .catch(function(res){
            throw res;
          })
      };

      function addSpare(spareData){
        return $http.post(path, spareData)
        .then(function(res){
          return res.data;
        })
        .catch(function(res){
          throw res;
        });
      };
      
      function updateSpare(spareData){

        return $http.put(path + "/" + spareData._id, spareData).
                then(function(res){
                   deleteFromCache(spareData);
                   return res.data;
                })
                .catch(function(res){
                    throw res;
                });
      };

      function deleteSpare(spareData){
        return $http.delete(path + "/" + spareData._id)
              .then(function(res){
                  deleteFromCache(spareData);
                  return res.data;
              })
              .catch(function(res){
                throw res;
              });
      };

      
      function addToCache(spare){
        spareCache[spare._id] = spare;
      }

      function updateCache(dataArr){
        dataArr.forEach(function(item,index){
          spareCache[item._id] = item;
        });
      }

      function deleteFromCache(prd){
          if(spareCache[prd._id])
            delete spareCache[prd._id];
     }

      /*function getSearchResult(){
        return searchResult;
      }

      function setSearchResult(result){
         searchResult = result;
      }

      function getFilter(){
        return searchFilter;
      }

      function setFilter(filter){
         searchFilter = filter;
      }*/

     return spareService;
  }

})();