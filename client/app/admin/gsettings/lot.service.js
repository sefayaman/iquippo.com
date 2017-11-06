(function() {
'use strict';

angular.module('admin').factory("LotSvc", LotSvc);

function LotSvc($http, $q, $httpParamSerializer) {
    var svc = {};
    var svcPath = '/api/common';

    svc.saveLot = saveLot;
    svc.getData = getData;
    svc.getLotsData=getLotsData;
    svc.destroy = destroy;
    svc.getLotsInAuction=getLotsInAuction;
    svc.update = update;
    svc.updateProductLot =updateProductLot;
    svc.removeLotData = removeLotData;
    svc.sendReqToCreateLot = sendReqToCreateLot;
    
    function saveLot(data) {
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
        return $http.get(path)
            .then(function(res) {
                //console.log("res.data",res.data);
                return res.data;
            })
            .catch(function(err) {
                throw err;
            });
    }

    function getLotsData(){
     var path = svcPath + "/lotdata";
        return $http.get(path)
            .then(function(res) {
                //console.log("res.data",res.data);
                return res.data;
            })
            .catch(function(err) {
                throw err;
            });   
    }

    function getLotsInAuction(filter){
     var path = svcPath + "/lot/lotsinauction";
        var queryParam = "";
        if (filter)
            queryParam = $httpParamSerializer(filter);
        if (queryParam)
            path = path + "?" + queryParam;
        return $http.get(path)
            .then(function(res) {
                //console.log("res.data",res.data);
                return res.data;
            })
            .catch(function(err) {
                throw err;
            });   
    }

    function sendReqToCreateLot(data){
        return $http.post(path + "/sendreqtocreatelot",data)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err
        })
    }

    function update(data) {
        return $http.put(svcPath + "/lot/" + data.lot_mongo_id, data)
            .then(function(res) {
                return res.data;
            })
            .catch(function(err) {
                throw err;
            });
    }

    function updateProductLot(data) {
        return $http.put(svcPath + "/lot/updateproductlot/" + data._id, data)
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

    function removeLotData(data) {
        return $http.put(svcPath + "/removelotdata/" + data._id, data)
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
