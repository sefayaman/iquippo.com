/* 
 * To change this license header, choose License Headers in Project Properties.
 * Finance module service : Aug 2017
 * Developer: Jagdish Koli.
 */
'use strict';
(function(){
    
    angular.module('sreizaoApp').factory('NewEquipmentSvc', NewEquipmentSvc);
    
    function NewEquipmentSvc($http){
        
        var svc = {};
        var path = '/api/newequipment';
        var data = {};
        //var promoFilter = 'promotion';
        
        return svc;
    }
    
})();




