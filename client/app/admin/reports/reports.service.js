(function(){
	'use strict';
angular.module('report').factory("ReportsSvc",ReportsSvc)

 function ReportsSvc($http, $q, $rootScope){
      var reportService = {};
      var path = '/api';
      reportService.getCallbackOnFilter = getCallbackOnFilter;
      reportService.getQuickQueryOnFilter = getQuickQueryOnFilter;
      reportService.getAdditionalServicesOnFilter = getAdditionalServicesOnFilter;
      reportService.exportData = exportData;

      function getCallbackOnFilter(data){
      return $http.post(path + "/callback/onfilter",data)
        .then(function(res){
          return res.data
        })
        .catch(function(err){
          throw err
        }) 
      }

      function getQuickQueryOnFilter(data){
      return $http.post(path + "/quote/onfilter",data)
        .then(function(res){
          return res.data
        })
        .catch(function(err){
          throw err
        }) 
      }

      function getAdditionalServicesOnFilter(data){
      return $http.post(path + "/productquote/onfilter",data)
        .then(function(res){
          return res.data
        })
        .catch(function(err){
          throw err
        }) 
      }

      function exportData(data, refName){
        var url = "";
        if(refName == "callback")
          url = path + "/callback/export";
        else if(refName == "quickQuery")
          url = path + "/quote/export";
        else
          url = path + "/productquote/export";
        
        return $http.post(url, data)
          .then(function(res){
            return res.data
          })
          .catch(function(err){
            throw err
          }) 
      }

      return reportService;
      
  }
})();
