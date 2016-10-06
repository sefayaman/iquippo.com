(function(){
 'use strict';
 angular.module("spare").factory("spareSvc",spareSvc);

 function spareSvc($http,$rootScope,$q,Auth){
      var spareService = {};
      var path = '/api/spares';
      
      var spareCache = {};
      

     return spareService;
  }

})();