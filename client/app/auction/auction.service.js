(function(){
'use strict';

angular.module('sreizaoApp').factory("AuctionSvc",AuctionSvc);
function AuctionSvc($http,$q,notificationSvc,Auth){
  var auctionId="";
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
  svc.getTotalItemsCount=getTotalItemsCount;
  svc.getAuctionData=getAuctionData;
  svc.getLatLong=getLatLong;
  svc.getTotalAuctionItemsCount=getTotalAuctionItemsCount;
  svc.getAuctionItemData=getAuctionItemData;


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

    function getTotalItemsCount(auctionType) {
      alert("hello2");
      return $http.get(path + "/auctionmaster/getAuctionCount?auctionType=" + auctionType)
        .then(function(result) {
          return result
        })
        .catch(function(err) {
          throw err;
        })

    }

    function getAuctionData(data){
      return $http.get(path + "/auctionmaster/fetchAuctionData?type="+data.auctionType+"&first_id=" + data.first_id + "&last_id=" + data.last_id + "&offset=" + data.offset + "&limit=" + data.itemsPerPage)
        .then(function(res) {
          return res.data
        })
        .catch(function(err) {
          throw err
        })

    }

    function getLatLong(city,location){
      var address="";
      address+=city+','+location;
      var params = {address: address, sensor: false};

      return $http.get('https://maps.googleapis.com/maps/api/geocode/json?address='+city+','+location+'&key=AIzaSyB2Vlq4VoNvIEkhE1Ou9HR48qdKRkSxmxs',{params:params,headers:{'X-Requested-With':undefined}})
        .then(function(res) {
          return res.geometry.location;
        })
        .catch(function(err) {
          throw err
        })
    }

    function setAuctionId(data){
     auctionId=data;
    }

    function getAuctionId(){
     return auctionId;
    }

    function getTotalAuctionItemsCount(data){
       return $http.get(path + "/auctionmaster/getAuctionItemsCount?auctionId=" + data)
        .then(function(result) {
          return result
        })
        .catch(function(err) {
          throw err;
        })

    }

    function getAuctionItemData(data){
     return $http.get(path + "/auctionmaster/fetchAuctionItemsData?auctionId="+data.auctionId)
        .then(function(res) {
          return res.data
        })
        .catch(function(err) {
          throw err
        })
 
    }



  return svc;
}
})();

/*var searchAddress = function(address) {
    var params = {address: address, sensor: false};
    //Note: google map rejects XHR header
    $http.get(google_map_web_api_url, {params: params, headers: {'X-Requested-With': undefined}})
        .success(function(data, status, headers, config) {
        })
        .error(function(data, status, headers, config) {
        })*/