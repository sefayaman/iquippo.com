(function(){
  'use strict';

  angular.module('sreizaoApp').factory("BannerLeadSvc",BannerLeadSvc);
  function BannerLeadSvc($http, $rootScope,$q,$httpParamSerializer){
      var svc = {};
      var path = '/api/bannerlead';
      svc.get = get;
      svc.save = save;

      function get(filter){
        var serPath = path;
        var queryParam = "";
        if(filter)
          queryParam = $httpParamSerializer(filter);
        if(queryParam)
          serPath += "?" + queryParam;
        return $http.get(serPath)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err;
        })
      }

      function save(leadData){
        return $http.post(path,leadData)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err;
        })
      }
      return svc;
  }
})();