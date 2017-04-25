(function(){
'use strict';

angular.module('sreizaoApp').factory("EnterpriseSvc",EnterpriseSvc);
function EnterpriseSvc($http,$rootScope ,$q, notificationSvc,Auth,UtilSvc){
  var entSvc = {};
  var path = "/api/enterprise";
  entSvc.get = get;
  entSvc.getInvoice = getInvoice;
  entSvc.save = save;
  entSvc.update = update;
  entSvc.getRequestOnId = getRequestOnId;
  entSvc.uploadExcel = uploadExcel;
  entSvc.exportExcel = exportExcel;

  entSvc.modifyExcel = modifyExcel;
  entSvc.setStatus = setStatus;
  entSvc.bulkUpdate = bulkUpdate;
  entSvc.generateInvoice = generateInvoice;
  entSvc.updateInvoice = updateInvoice;
  entSvc.generateinvoice = generateinvoice;
  entSvc.submitToAgency = submitToAgency;

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
      
      var deferred = $q.defer();
      $rootScope.loading = true;
      $http.post(path, data)
        .then(function(res){
          if(res.data.uniqueControlNo && !Auth.isApprovalRequired(res.data.requestType))
            submitToAgency([res.data],deferred);
          else{
            $rootScope.loading = false;
            deferred.resolve(res.data);
          }
        })
        .catch(function(err){
          $rootScope.loading = false;
          deferred.reject(err);
        })
      return deferred.promise;
    }



    function update(data){
       return $http.put(path + "/" + data.data._id, data)
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
    
    function exportExcel(reportType,filter){
      var serPath = path + "/export" + "?type=" + reportType + "&role=" + Auth.getCurrentUser().role;
        var queryParam = "";
        if(filter)
            queryParam = UtilSvc.buildQueryParam(filter);
        if(queryParam)
          serPath = serPath + "&" + queryParam;
        return $http.get(serPath)
        .then(function(res){
           saveAs(new Blob([s2ab(res.data)],{type:"application/octet-stream"}),reportType+"_"+ new Date().getTime() +".xlsx");
          //return res.data
        })
        .catch(function(err){
          throw err
        })
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

   var Field_MAP = {
    uniqueControlNo : "uniqueControlNo",
    requestType:"requestType",
    purpose : "purpose",
    agencyName : "agency.name",
    enterprise:"enterprise.name",
    customerTransactionId : "customerTransactionId",
    customerValuationNo : "customerValuationNo",
    customerPartyNo : "customerPartyNo",
    customerPartyName : "customerPartyName",
    userName : "userName",
    requestDate : "requestDate",
    assetId:"assetId",
    repoDate : "repoDate",
    assetCategory:"assetCategory",
    valuerGroupId:"valuerGroupId",
    valuerAssetId:"valuerAssetId",
    assetDescription : "assetDescription",
    engineNo:"engineNo",
    chassisNo :"chassisNo",
    registrationNo :"registrationNo",
    serialNo:"serialNo",
    yearOfManufacturing :"yearOfManufacturing",
    category:"category",
    brand:"brand",
    model:"model",
    yardParked:"yardParked",
    country:"country",
    state:"state",
    city:"city",
    contactPerson:"contactPerson",
    contactPersonTelNo:"contactPersonTelNo",
    disFromCustomerOffice:"disFromCustomerOffice"
  }
  
  var submmitted = false;
   function submitToAgency(items,deferred){
    
    if(submmitted)
      return;
    if(!items || items.length == 0)
      return;

    if(!deferred)
      deferred = $q.defer();
    submmitted = true;

    var dataArr = [];
    var keys = Object.keys(Field_MAP);
    items.forEach(function(item){
      var obj = {};
      keys.forEach(function(key){
        obj[key] = _.get(item,Field_MAP[key]);
      })
      dataArr[dataArr.length] = obj; 
    });

    var apiUrl = "http://quippoauctions.com/valuation/api.php?type=Mjobcreation";

    $rootScope.loading = true;
    $http.post(apiUrl,dataArr)
    .then(function(res){
      submmitted = false;
      if(res.data && res.data.length > 0)
        updateValReqs(res.data,items,deferred);
      else{
        $rootScope.loading = false;
        deferred.resolve(res.data);  
      }

    })
    .catch(function(err){
      submmitted = false;
      $rootScope.loading = false;
      deferred.reject(err)
    })
    return deferred.promise;
   }

   function getValReqByUniqueCtrlNo(list,unCtrlNo){
      var retVal = null;
      list.some(function(item){
        if(item.uniqueControlNo == unCtrlNo){
          retVal = item;
          return false;
        }
      })
      return retVal;
    }

    function updateValReqs(resList,selectedItems,deferred){
      
      resList.forEach(function(item){
        var valReq = getValReqByUniqueCtrlNo(selectedItems,item.uniqueControlNo);
        if(item.success == "true"){
           valReq.jobId = item.jobId;
           setStatus(valReq,EnterpriseValuationStatuses[2]);
        }else{
          valReq.remarks = item.msg;
          setStatus(valReq,EnterpriseValuationStatuses[1]);
        }

      })
      $rootScope.loading = true;     
      bulkUpdate(selectedItems)
        .then(function(res){
          if(deferred)
            deferred.resolve(res.data);
          $rootScope.loading = false;
      })
      .catch(function(err){
        if(deferred)
            deferred.reject(err);
         $rootScope.loading = false;
      })
    }

   return entSvc;
}
})();
