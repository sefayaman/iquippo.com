(function(){
	'use strict';
angular.module('admin').factory("PriceTrendSvc",PriceTrendSvc);
 function PriceTrendSvc($http, $q){
 	 var ptSvc = {};
   var path = "/api/pricetrend";

   ptSvc.getOnFilter = getOnFilter;
   ptSvc.create = create;
   ptSvc.update = update;
   ptSvc.destroy = destroy;

   ptSvc.saveSurvey = saveSurvey;
   ptSvc.getSurveyAnalytics = getSurveyAnalytics;
   ptSvc.getSurveyOnFilter = getSurveyOnFilter;
   function getOnFilter(filter){

    return $http.post(path + "/getonfilter",filter)
    .then(function(res){
      return res.data;
    })
    .catch(function(err){
      throw err;
    })

   }

   function create(ptObj){
      return $http.post(path,ptObj)
      .then(function(res){
        return res.data;
      })
      .catch(function(err){
        throw err;
      })    
   }

   function update(ptObj){

      return $http.put(path + "/" + ptObj._id, ptObj)
      .then(function(res){
          return res.data;
      })
      .catch(function(err){
        throw err;
      });
   }

   function destroy(id){
      return $http.delete(path + "/" +id)
      .then(function(res){
        return res.data;
      })
      .catch(function(err){
          throw err;
      });
    
   }

   function saveSurvey(surObj){
      return $http.post(path + "/savesurvey",surObj)
      .then(function(res){
        return res.data;
      })
      .catch(function(err){
        throw err;
      })    
   }

   function getSurveyAnalytics(filter){
      return $http.post(path + "/surveyanalytics",filter)
      .then(function(res){
        var countObj = {};
        res.data.forEach(function(item){
          countObj[item._id] = item.count;
        })
        return countObj;
       
      })
      .catch(function(err){
        throw err;
      })    
   }

   function getSurveyOnFilter(filter){
      return $http.post(path + "/surveyonfilter",filter)
      .then(function(res){
         return res.data;
      })
      .catch(function(err){
        throw err;
      }) 
   }

    return ptSvc;
  }  
})();
