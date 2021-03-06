(function(){
  'use strict';

   angular.module('admin').factory("EmdSvc",EmdSvc);

    function EmdSvc($http, $q,$httpParamSerializer){
        var svc = {};
        var svcPath = '/api/common';

        svc.saveEmd = saveEmd;
        svc.getData = getData;
        svc.getAmount = getAmount;
        svc.destroy = destroy;
        svc.update = update;
        svc.sendReqToCreateEmd = sendReqToCreateEmd;
        
            function saveEmd(data){
                return $http.post(svcPath+ "/emd",data)
                .then(function(res){
                return res.data; 
                })
                .catch(function(err){
                throw err;
                });
            }

            function getData(filter){
                return $http.post(svcPath+"/emd/getData",filter)
                .then(function(res){
                    return res.data;
                })
                .catch(function(err){
                    throw err;
                });
            }

             function getAmount(filter){
                var path = svcPath +"/emd/amount"; 
                var queryParam = "";
                if(filter)
                queryParam = $httpParamSerializer(filter);
                if(queryParam)
                path  = path + "?" + queryParam;
                return $http.get(path)
                .then(function(res){
                    return res.data;
                })
                .catch(function(err){
                    throw err;
                });
            }

            function sendReqToCreateEmd(data){
                return $http.post(svcPath + "/sendreqtocreateemd",data)
                .then(function(res){
                  return res.data;
                })
                .catch(function(err){
                  throw err
                })
            }
            function update(data){

                return $http.put(svcPath + "/emd/" + data._id,data)
                .then(function(res){
                return res.data;
                })
                .catch(function(err){
                throw err;
                });
            }

            function destroy(data){
                return $http.put(svcPath + "/emd/delete/" + data._id,data)
                .then(function(res){
                return res.data;
                })
                .catch(function(err){
                throw err;
                });
             }
                    
        return svc;
  }

})();