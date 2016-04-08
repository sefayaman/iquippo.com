(function(){
 'use strict';
 angular.module("classifiedAd").factory("classifiedSvc",classifiedSvc);

 function classifiedSvc($http,$rootScope,$q){
      var classifiedService = {};
      var path = '/api/classifiedad';
      classifiedService.activeAds = [];
      classifiedService.getClassifiedAdOnFilter = getClassifiedAdOnFilter;
      classifiedService.getActiveClassifiedAd = getActiveClassifiedAd;
      classifiedService.addClassifiedAd = addClassifiedAd;
      classifiedService.updateClassifiedAd = updateClassifiedAd;
      classifiedService.deleteClassifiedAd = deleteClassifiedAd;

     function getClassifiedAdOnFilter(filter){

      	return $http.post(path + "/search",filter)
      			.then(function(res){
      				return res.data;
      			})
      			.catch(function(res){
      				throw res;
      			})
      }

      function addClassifiedAd(classified){
        
        return $http.post(path,classified)
      			.then(function(res){
      				return res;
      			})
      			.catch(function(res){
      				throw res;
      			})
      };

	function updateClassifiedAd(classified){

        return $http.put(path + "/" + classified._id,classified)
        		.then(function(res){
        			return res
        		})
        		.catch(function(res){
        			throw res;
        		});
      };

      function deleteClassifiedAd(classified){

        return $http.delete(path + "/" + classified._id)
        .then(function(res){
        	return res;
        })
        .catch(function(res){
        	throw res;
        });
      };

      function getActiveClassifiedAd(){
        
        var deferred = $q.defer();
      	if(classifiedService.activeAds && classifiedService.activeAds.length){
      		deferred.resolve(classifiedService.activeAds);
      	}else{

      		$http.post(path + "/search",{status:true})
      			.then(function(res){
      			   classifiedService.activeAds = res.data;
      				deferred.resolve(res.data);
      			})
      			.catch(function(res){
      				deferred.reject(res);
      			})
      	}

        return deferred.promise; 
      	
      }

      return classifiedService;
  }

})();