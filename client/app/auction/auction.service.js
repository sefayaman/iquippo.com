(function(){
'use strict';

angular.module('sreizaoApp').factory("AuctionSvc",AuctionSvc);
function AuctionSvc($http,$q,notificationSvc,Auth){
  var svc = {};
  var path = "/api/auction";

  svc.getAll = getAll;
  svc.save = save;
  svc.update = update;
  svc.delAuction = delAuction;
  svc.getOnFilter = getOnFilter;
  svc.export = exportAuction;
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

    function exportAuction(data){
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

    function update(data){
       return $http.put(path + "/" + data._id, data)
        .then(function(res){
            return res.data;
        })
        .catch(function(err){
          throw err;
        });
    }

    function updateStatus(auctionReq,toStatus){
      var deferred = $q.defer();
      var stsObj = {};
      stsObj.createdAt = new Date();
      stsObj.userId = Auth.getCurrentUser()._id;
      stsObj.status = toStatus;
      auctionReq.statuses[auctionReq.statuses.length] = stsObj;
      auctionReq.status = toStatus;
      update(auctionReq)
      .then(function(result){
        deferred.resolve(result)
      })
      .catch(function(err){
        deferred.reject(err);
      })

      return deferred.promise;

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

    function sendNotification(mailData,statusName,flag){
      var data = {};
      data['to'] = mailData.user.email;
      mailData.serverPath = serverPath;
      switch(flag){
        case 1:
           data['subject'] = 'Request for Listing in auction';
           notificationSvc.sendNotification('auctioListingEmailToCustomer', data, mailData,'email');
        break;
        case 2:
            data['subject'] = 'Request for Listing in auction';
            mailData.statusName = statusName;
            notificationSvc.sendNotification('auctionCustomerEmail', data, mailData,'email');
            data['to'] = mailData.user.mobile;
            notificationSvc.sendNotification('auctionCustomerSms',data, mailData,'sms');
          break;

      }
    }

  return svc;
}
})();

