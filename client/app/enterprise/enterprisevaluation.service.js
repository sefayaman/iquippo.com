(function(){
'use strict';

angular.module('sreizaoApp').factory("EnterpriseSvc",EnterpriseSvc);
function EnterpriseSvc($http, $q, notificationSvc, Auth,UtilSvc){
  var entSvc = {};
  var path = "/api/enterprise";
  entSvc.get = get;
  entSvc.save = save;
  entSvc.update = update;
  entSvc.getRequestOnId = getRequestOnId;
  entSvc.uploadExcel = uploadExcel;

  entSvc.modifyExcel = modifyExcel;
  entSvc.setStatus = setStatus;
  entSvc.bulkUpdate = bulkUpdate;
  //entSvc.export = exportValuation;
  //entSvc.sendNotification = sendNotification;
  //entSvc.updateStatus = updateStatus;

  function getRequestOnId(id) {
    var deferred = $q.defer();
      $http.get(path + "/" + id)
      .then(function(res){
        deferred.resolve(res.data);
      })
      .catch(function(res){
        deferred.reject(res);
      })
    return deferred.promise;
  }

  function get(data) {
        var serPath = path;
        var queryParam = "";
        if(data)
            queryParam = UtilSvc.buildQueryParam(data);
        if(queryParam)
          serPath = serPath + "?" + queryParam;
        return $http.get(serPath)
        .then(function(res){
          return res.data
        })
        .catch(function(err){
          throw err
        })
    }

   /* function getOnFilter(data){
      return $http.post(path + "/onfilter",data)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err
        })
    }*/

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
      return $http.post(path+"/upload/excel",data).then(function(res){
        return res.data;
      }).catch(function(err){
        throw err;
      });
    }

    function modifyExcel(data){
      return $http.put(path+"/upload/excel",data).then(function(res){
        return res.data;
      }).catch(function(err){
        throw err;
      }); 
    }
    
    function setStatus(entValuation,status){
      entValuation.status = status;
      var stObj = {};
      stObj.status = status;
      stObj.createdAt = new Date();
      stObj.userId = Auth.getCurrentUser()._id;
      if(!entValuation.statuses)
        entValuation.statuses = [];
      entValuation.statuses.push(stObj);
    };

    /*function sendNotification(valReqData,status,sendTo){
      var data = {};
      if(sendTo == "customer"){
        data['to'] = valReqData.user.email;
        data['subject'] = 'Request for valuation/inspection';
        valReqData.serverPath = serverPath;
        valReqData.statusName = status;
        notificationSvc.sendNotification('valuationCustomerEmail', data, valReqData,'email');
        data['to'] = valReqData.user.mobile;
        notificationSvc.sendNotification('valuationCustomerSms', data, valReqData,'sms');
      }else if(sendTo == "valagency"){
        data['to'] = valReqData.valuationAgency.email;
        data['subject'] = 'Request for valuation/inspection';
        valReqData.serverPath = serverPath;
        valReqData.statusName = status;
        notificationSvc.sendNotification('valuationAgencyEmail', data, valReqData,'email');
        data['to'] = valReqData.valuationAgency.mobile;
        notificationSvc.sendNotification('valuationAgencySms', data, valReqData,'sms');
      }else if(sendTo == "seller"){
        //need to send to seller 
      }
      
    }*/
  return entSvc;
}
})();
