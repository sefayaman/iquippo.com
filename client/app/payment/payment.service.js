(function(){
'use strict';

angular.module('sreizaoApp').factory("PaymentSvc",PaymentSvc);
function PaymentSvc($http,$q,Auth,notificationSvc){
  var svc = {};
  var path = "/api/payment";

  svc.getAll = getAll;
  svc.save = save;
  svc.update = update;
  svc.updateStatus = updateStatus;
  svc.delPayment = delPayment;
  svc.getOnFilter = getOnFilter;
  svc.export = exportValuation;
  svc.encrypt = encrypt;
  svc.sendNotification = sendNotification;

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

    function exportValuation(data){
     return $http.post(path + "/export",data)
        .then(function(res){
          return res.data
        })
        .catch(function(err){
          throw err
        }) 
    }

    function encrypt(dataStr){
     return $http.post(path + "/encrypt",dataStr)
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
            return res.data;
        })
        .catch(function(err){
          throw err;
        });
    }

    function updateStatus(payTrans,toStatus){
      var deferred = $q.defer();
      var stsObj = {};
      stsObj.createdAt = new Date();
      stsObj.createdAt = Auth.getCurrentUser()._id;
      stsObj.status = toStatus;
      payTrans.statuses[payTrans.statuses.length] = toStatus;
      payTrans.status = toStatus;
      update(payTrans)
      .then(function(result){
        deferred.resolve(result)
      })
      .catch(function(err){
        deferred.reject(err);
      })
      return deferred.promise;
    }

    function delPayment(data){
      return $http.delete(path + "/" + data._id)
          .then(function(res){
            return res.data;
          })
          .catch(function(err){
              throw err;
          });
    }

  function sendNotification(tData,oData,flag){
    var data = {};
    data['to'] = tData.user.email;
    data['subject'] = 'Payment detail';
    var mailData = {};
    mailData.serverPath = serverPath;
    mailData.product = tData.product;
    mailData.user = tData.user;
    mailData.tId = tData.transactionId;
    mailData.totalAmount = tData.totalAmount;
    mailData.status = tData.status == 'completed'?'Paid' : 'Payment Pending';
    mailData.createdAt = tData.createdAt;
    switch(flag){
      case 1:
         mailData.auctionId = oData.auctionId;
         mailData.auctionDate = oData.startDate;
         notificationSvc.sendNotification('auctionPaymentDetailToCustomer', data, mailData,'email');
      break;
      case 2:
         notificationSvc.sendNotification('valuationListingEmailToCustomer', data, mailData,'email');
        break;

    }
  }
  return svc;
}
})();
