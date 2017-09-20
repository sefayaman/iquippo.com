(function() {
    'use strict';

    angular.module('admin').factory("LotSvc", LotSvc);

    function LotSvc($http, $q, $httpParamSerializer) {
        var svc = {};
        var svcPath = '/api/common';

        svc.saveLot = saveLot;
        svc.getData = getData;
        svc.destroy = destroy;
        svc.update = update;
        svc.updateProductLot =updateProductLot;

        function saveLot(data) {console.log("lotsavedata==".data);
            return $http.post(svcPath + "/lot", data) 
                .then(function(res) {
                   //lot response data come console.log("reslotdata",res.data.lotData);
                    return res.data;
                })
                .catch(function(err) {
                    throw err;
                });
        }

        function getData(filter) {
            var path = svcPath + "/lot";
            var queryParam = "";
            if (filter)
                queryParam = $httpParamSerializer(filter);
            if (queryParam)
                path = path + "?" + queryParam;
            //console.log("path",path);
            return $http.get(path)
                .then(function(res) {
                   // console.log("res lot data",res);
                    return res.data;
                })
                .catch(function(err) {
                    throw err;
                });
        }

        function update(data) {

            return $http.put(svcPath + "/lot/" + data._id, data)
                .then(function(res) {
                    return res.data;
                })
                .catch(function(err) {
                    throw err;
                });
        }
        function updateProductLot(data) {
            
                        return $http.put(svcPath + "/lot/updateproductlot/" + data.auctionId, data)
                            .then(function(res) {
                                return res.data;
                            })
                            .catch(function(err) {
                                throw err;
                            });
         }


        function destroy(id) {
            return $http.delete(svcPath + "/lot/" + id)
                .then(function(res) {
                    return res.data;
                })
                .catch(function(err) {
                    throw err;
                });
        }

        return svc;
    }

})();