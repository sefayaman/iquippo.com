(function(){
'use strict';

angular.module('sreizaoApp').factory("EnterpriseSvc",EnterpriseSvc);
function EnterpriseSvc($http, $q, notificationSvc, Auth,UtilSvc){
  var entSvc = {};
  var path = "/api/enterprise";
  entSvc.get = get;
  entSvc.getInvoice = getInvoice;
  entSvc.save = save;
  entSvc.update = update;
  entSvc.getRequestOnId = getRequestOnId;
  entSvc.uploadExcel = uploadExcel;

  entSvc.modifyExcel = modifyExcel;
  entSvc.setStatus = setStatus;
  entSvc.bulkUpdate = bulkUpdate;
  entSvc.generateInvoice = generateInvoice;
  entSvc.updateInvoice = updateInvoice;
  entSvc.generateinvoice = generateinvoice;

  function getRequestOnId(id) {
    var deferred = $q.defer();
      $http.get(path + "/" + id + "?type=request")
      .then(function(res){
        deferred.resolve(res.data);
      })
      .catch(function(res){
        deferred.reject(res);
      })
    return deferred.promise;
  }

  function get(data) {
        var serPath = path + "?type=request";
        var queryParam = "";
        if(data)
            queryParam = UtilSvc.buildQueryParam(data);
        if(queryParam)
          serPath = serPath + "&" + queryParam;
        return $http.get(serPath)
        .then(function(res){
          return res.data
        })
        .catch(function(err){
          throw err
        })
    }

    function getInvoiceOnId(id) {
    var deferred = $q.defer();
      $http.get(path + "/" + id + "?type=invoice")
      .then(function(res){
        deferred.resolve(res.data);
      })
      .catch(function(res){
        deferred.reject(res);
      })
    return deferred.promise;
  }

  function getInvoice(data) {
        var serPath = path + "?type=invoice";
        var queryParam = "";
        if(data)
            queryParam = UtilSvc.buildQueryParam(data);
        if(queryParam)
          serPath = serPath + "&" + queryParam;
        return $http.get(serPath)
        .then(function(res){
          return res.data
        })
        .catch(function(err){
          throw err
        })
    }


    function save(data){
      return $http.post(path, data)
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
            return res.data;
        })
        .catch(function(err){
          throw err;
        });
    }

    function bulkUpdate(dtArr){
      return $http.post(path + "/bulkupdate", dtArr)
        .then(function(res){
            return res.data;
        })
        .catch(function(err){
          throw err;
        });
    }


    function uploadExcel(data){
      return $http.post(path+"/upload/excel",data)
      .then(function(res){
        return res.data;
      })
      .catch(function(err){
        throw err;
      });
    }

    function modifyExcel(data){
      return $http.put(path+"/upload/excel",data)
      .then(function(res){
        return res.data;
      })
      .catch(function(err){
        throw err;
      }); 
    }
    
    function setStatus(entValuation,status,doNotChangeStatus){
      if(!doNotChangeStatus)
          entValuation.status = status;
      var stObj = {};
      stObj.status = status;
      stObj.createdAt = new Date();
      stObj.userId = Auth.getCurrentUser()._id;
      if(!entValuation.statuses)
        entValuation.statuses = [];
      entValuation.statuses.push(stObj);
    };

   
   function generateInvoice(invoice){
    return $http.post(path + "/createinvoice",invoice)
          .then(function(res){
            return res.data;
          })
          .catch(function(err){
            throw err;
          });

   }

   function updateInvoice(invoice){
    return $http.post(path + "/updateinvoice",invoice)
          .then(function(res){
            return res.data;
          })
          .catch(function(err){
            throw err;
          });

   }

   function generateinvoice(invoiceNo){
    return path + "/generateinvoice/" + invoiceNo;    
   }

   return entSvc;
}
})();
