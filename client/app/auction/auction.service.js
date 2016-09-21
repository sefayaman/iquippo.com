(function(){
'use strict';

angular.module('sreizaoApp').factory("AuctionSvc",AuctionSvc);
function AuctionSvc($http,$q){
  var svc = {};
  var path = "/api/auction";

  svc.getAll = getAll;
  svc.save = save;
  svc.update = update;
  svc.delAuction = delAuction;
  svc.getOnFilter = getOnFilter;

  function getAll(){
        return $http.get(path)
        .then(function(res){
          return res.data
        })
        .catch(function(err){
          throw err
        })
    }

    function getOnFilter(data){
     return $http.post(path + "/onfilter",data)
        .then(function(res){
          return res.data
        })
        .catch(function(err){
          throw err
        }) 
    }

    function save(data){
      return $http.post(path,data)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err
        })
    }

    function update(data){
       return $http.put(path + "/" + data._id, data)
        .then(function(res){
          paymentMasterCache = [];
            return res.data;
        })
        .catch(function(err){
          throw err;
        });
    }

    function delAuction(data){
      return $http.delete(path + "/" + data._id)
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

