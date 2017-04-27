(function(){
'use strict';

angular.module('sreizaoApp').factory("ValuationSvc",ValuationSvc);
function ValuationSvc($http,$q,notificationSvc,Auth,LocationSvc){
  var svc = {};
  var path = "/api/valuation";
  svc.getAll = getAll;
  svc.save = save;
  svc.saveService=saveService;
  svc.update = update;
  svc.delAuction = delValuation;
  svc.getOnFilter = getOnFilter;
  svc.export = exportValuation;
  svc.sendNotification = sendNotification;
  svc.updateStatus = updateStatus;

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
          return res.data;
        })
        .catch(function(err){
          throw err
        })
    }

    function exportValuation(data){
     return $http.post(path + "/export",data)
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

    function saveService(data){
      return $http.post("/api/services",data)
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

    function updateStatus(valReq,toStatus,intermediateStatus){
      var deferred = $q.defer();
      var stsObj = {};
      if(intermediateStatus){
        stsObj.createdAt = new Date();
        stsObj.userId = Auth.getCurrentUser()._id;
        stsObj.status = intermediateStatus;
        valReq.statuses[valReq.statuses.length] = stsObj;
      }
      stsObj.createdAt = new Date();
      stsObj.userId = Auth.getCurrentUser()._id;
      stsObj.status = toStatus;
      valReq.statuses[valReq.statuses.length] = stsObj;
      valReq.status = toStatus;
      update(valReq)
      .then(function(result){
        deferred.resolve(result)
      })
      .catch(function(err){
        deferred.reject(err);
      })

      return deferred.promise;

    }

    function delValuation(data){
      return $http.delete(path + "/" + data._id)
          .then(function(res){
            return res.data;
          })
          .catch(function(err){
              throw err;
          });
    }

    function sendNotification(valReqData,status,sendTo){
      var data = {};
      if(sendTo == "customer"){
        data['to'] = valReqData.user.email;
        data['subject'] = 'Request for valuation/inspection';
        valReqData.serverPath = serverPath;
        valReqData.statusName = status;
        notificationSvc.sendNotification('valuationCustomerEmail', data, valReqData,'email');
        data['to'] = valReqData.user.mobile;
        data['countryCode']=LocationSvc.getCountryCode(valReqData.user.country);
        notificationSvc.sendNotification('valuationCustomerSms', data, valReqData,'sms');
      }else if(sendTo == "valagency"){
        data['to'] = valReqData.valuationAgency.email;
        data['subject'] = 'Request for valuation/inspection';
        valReqData.serverPath = serverPath;
        valReqData.statusName = status;
        notificationSvc.sendNotification('valuationAgencyEmail', data, valReqData,'email');
        data['to'] = valReqData.valuationAgency.mobile;
        data['countryCode']=LocationSvc.getCountryCode(valReqData.valuationAgency.country);
        notificationSvc.sendNotification('valuationAgencySms', data, valReqData,'sms');
      }else if(sendTo == "seller"){
        //need to send to seller 
      }
      
    }
  return svc;
}
})();
