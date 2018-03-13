(function(){
'use strict';

angular.module('sreizaoApp').factory("EnterpriseSvc",EnterpriseSvc);
function EnterpriseSvc($http,$rootScope ,$q,$timeout, notificationSvc,Auth,UtilSvc,userSvc,ValuationCancellationSvc){
  var entSvc = {};
  var enterprise = null;

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
  entSvc.getCancellationFee = getCancellationFee;
  entSvc.cancelEnterprise = cancelEnterprise;
  entSvc.resumeRequest = resumeRequest;
  entSvc.generateReport = generateReport;

  function getRequestOnId(id) {
    var deferred = $q.defer();
      $http.get(path + "/" + id + "?type=request")
      .then(function(res){
        deferred.resolve(res.data);
      })
      .catch(function(res){
        deferred.reject(res);
      });
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
          return res.data;
        })
        .catch(function(err){
          throw err;
        });
    }

    function getInvoiceOnId(id) {
    var deferred = $q.defer();
      $http.get(path + "/" + id + "?type=invoice")
      .then(function(res){
        deferred.resolve(res.data);
      })
      .catch(function(res){
        deferred.reject(res);
      });
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
          return res.data;
        })
        .catch(function(err){
          throw err;
        });
    }

    function getCancellationFee(entReq){
      var deferred = $q.defer();
      ValuationCancellationSvc.getCancellationFee({_id:entReq._id,enterpriseId:entReq.enterprise.enterpriseId})
      .then(function(res){
        if(res.length)
            deferred.resolve(res[0]);
        else
          deferred.reject({data:"Unable to find cancellation fee.Please contact support team."});
      })
      .catch(function(err){
        deferred.reject({data:"Unable to find cancellation fee.Please contact support team."});
      });
      return deferred.promise;
    }

    function cancelEnterprise(valReq,cancelFee){
      var dataToSend = {_id:valReq._id};
      dataToSend.uniqueControlNo = valReq.uniqueControlNo;
      dataToSend.jobId = valReq.jobId;
      dataToSend.cancellationFee = cancelFee.cancellationFee;
      dataToSend.cancelled = cancelFee.cancelled;
      return $http.post(path + "/cancel",dataToSend)
            .then(function(res){
              return res.data;
            })
            .catch(function(err){
              throw err;
            });
    }

    function resumeRequest(valReq){
      return $http.post(path + "/removeonhold",valReq)
      .then(function(res){
        return res.data;
      })
      .catch(function(err){
        throw err;
      });
    }

    function save(data){
      var deferred = $q.defer();
      $rootScope.loading = true;
      $http.post(path, data)
        .then(function(res){
          if(res.data.uniqueControlNo)
            postSave(res.data,deferred);
          else{
            $rootScope.loading = false;
            deferred.resolve(res.data);
          }
          sendNotification(res.data);
        })
        .catch(function(err){
          $rootScope.loading = false;
          deferred.reject(err);
        });
      return deferred.promise;
    }

    function postSave(resData,deferred){
      Auth.isApprovalRequired(resData.requestType,resData.enterprise.enterpriseId,function(isRequired){
            if(isRequired){
              $rootScope.loading = false;
              deferred.resolve(resData);
              return;
            }
            submitToAgency([resData._id],'Mjobcreation',deferred);
      })
    }

    function sendNotification(reqData) {
      var data = {};
      var dataToSend = {};
      if(!reqData.createdBy.email)
        return;
      data.to = reqData.createdBy.email;
      if(reqData.status === EnterpriseValuationStatuses[0]) {
        data.subject = reqData.requestType + " " + 'Request Initiated with Unique Control No. - ' + reqData.uniqueControlNo;
        dataToSend.status = "initiated";
      }
      if(reqData.status === EnterpriseValuationStatuses[2]) {
        data.subject = reqData.requestType + " " + 'Request Approved for Unique Control No. - ' + reqData.uniqueControlNo;
        dataToSend.status = "submitted";
      }
      if(reqData.status === EnterpriseValuationStatuses[6]) {
        data.cc = reqData.enterprise.email;
        data.subject = 'Valuation Report as an attachment for Unique Control No. - ' + reqData.uniqueControlNo;
        dataToSend.assetDir = reqData.assetDir;
        if(reqData.valuationReport && reqData.valuationReport.filename) {
          dataToSend.external = reqData.valuationReport.external;
          dataToSend.filename = reqData.valuationReport.filename;
        }
      }
      dataToSend.uniqueControlNo = reqData.uniqueControlNo;
      dataToSend.name = reqData.createdBy.name;
      dataToSend.requestType = reqData.requestType;
      dataToSend.serverPath = serverPath;
      if(reqData.status === EnterpriseValuationStatuses[6])
        notificationSvc.sendNotification('ValuationReportSubmission', data, dataToSend,'email');
      else if(reqData.status === EnterpriseValuationStatuses[0] || reqData.status === EnterpriseValuationStatuses[2]) {
        var approverUsers = [];
        var userFilter = {};
        userFilter.role = "enterprise";
        userFilter.enterpriseId = reqData.enterprise.enterpriseId;
        userFilter.status = true;
        userSvc.getUsers(userFilter).then(function(approverUsersData){
          if(approverUsersData.length > 0){
            approverUsersData.forEach(function(item){
              for(var i=0;i<item.availedServices.length;i++){
                if(item.availedServices[i].code === reqData.requestType && item.availedServices[i].approver === true && item.email !== reqData.createdBy.email) {
                  approverUsers[approverUsers.length] = item.email;
                }
              }
            });
            data.cc = approverUsers.join(',');
            notificationSvc.sendNotification('ValuationRequest', data, dataToSend,'email');
          }
        });
      }
    }

    function update(data){
      var deferred = $q.defer();
       $http.put(path + "/" + data.data._id, data)
        .then(function(res){
          if(data.data.jobId && data.updateType === 'enterprise')
            return submitToAgency([data.data._id],'Mjobupdation',deferred);
          if(data.data.updateType === 'agency' && data.data.valuationReport && data.data.valuationReport.filename){
            sendNotification(data.data);
          }
          return deferred.resolve(res.data);
        })
        .catch(function(err){
          deferred.reject(err);
        });
        return deferred.promise;
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
          throw err;
        })
    }

    function setStatus(entValuation,status,doNotChangeStatus){
      if(!doNotChangeStatus)
          entValuation.status = status;
      var stObj = {};
      stObj.status = status;
      stObj.createdAt = new Date();
      stObj.userId = Auth.getCurrentUser()._id;
      stObj.mobile = Auth.getCurrentUser().mobile;
      stObj.email = Auth.getCurrentUser().email;
      stObj.name = Auth.getCurrentUser().fname + " " + Auth.getCurrentUser().lname;
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

   function generateReport(){
      $rootScope.loading = true;
      return $http.post(path + "/generatereport",{})
          .then(function(res){
            $rootScope.loading = false;
            return res.data;
          })
          .catch(function(err){
            $rootScope.loading = false;
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

  var submmitted = false;
   function submitToAgency(valReqsIds,type,deferred){
     if(!deferred)
      deferred = $q.defer();

    if(!valReqsIds || valReqsIds.length == 0 || submmitted){
      $timeout(function(){
        deferred.reject();
      },0);
      return deferred.promise;
    }
    submmitted = true;
    $rootScope.loading = true;
    $http.post(path + "/submitrequest?type=" + type,valReqsIds)
    .then(function(res){
      submmitted = false;
      $rootScope.loading = false;
      return deferred.resolve(res.data);
    })
    .catch(function(err){
      submmitted = false;
      $rootScope.loading = false;
      deferred.reject(err);
    });

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
          //valReq.submittedToAgencyDate = new Date();
          valReq.assignSubmitDate = true;
          setStatus(valReq,EnterpriseValuationStatuses[2]);
          sendNotification(valReq);
        }else{
          valReq.remarks = item.msg;
          setStatus(valReq,EnterpriseValuationStatuses[1]);
        }
      });
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
      });
    }

   return entSvc;
}
})();