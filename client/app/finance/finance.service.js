/* 
 * To change this license header, choose License Headers in Project Properties.
 * Finance module service : Aug 2017
 * Developer: Jagdish Koli.
 */
'use strict';
(function(){
    
    angular.module('sreizaoApp').factory('FinancingSvc', FinancingSvc);
    
    function FinancingSvc($http){
        
        var svc = {};
        var path = '/api/finance';
        var data = {};
        //var promoFilter = 'promotion';
        
        svc.getAll = getAll;
        svc.getPromotion = getPromotion;
        
        svc.getFilterOnLeadMaster = getFilterOnLeadMaster;
        
        
        function getPromotion(data){
            return $http.post(path + "/financemaster/onfinancemasterfilter",data)
                .then(function(res){
                  return res.data;
                })
                .catch(function(err){
                  throw err;
                }); 
            
        }
        
        function getAll(data){
            //return $http.post(path + "/financemaster/onfinancemasterfilter",data)
            return $http.post(path + "/financemaster/getfinance",data)
                .then(function(res){
                    
                  return res.data;
                })
                .catch(function(err){
                  throw err;
                }); 
        }
        
      
        function getFilterOnLeadMaster(data){
            var path = "/api/lead/leadmaster"
            return $http.post(path + "/onleadidmasterfilter",data)
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




