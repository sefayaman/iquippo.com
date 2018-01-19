(function(){
'use strict';
angular.module('sreizaoApp').controller('EnterpriseTransactionCtrl',EnterpriseTransactionCtrl);
function EnterpriseTransactionCtrl($scope, $rootScope, Modal,$uibModal,uploadSvc,Auth, $state, notificationSvc, vendorSvc, EnterpriseSvc, userSvc, LocationSvc, categorySvc, brandSvc, modelSvc,PagerSvc) {
  
  var vm = this;
  $scope.$parent.tabValue = 'transaction';
  $scope.refresh = true;
  var selectedItems = [];
  $scope.EnterpriseValuationStatuses = EnterpriseValuationStatuses;
  $scope.pager = PagerSvc.getPager();
  vm.enterpriseValuationListing = [];
  
  var filter = {};
  $scope.docObj = {};
  $scope.isEdit = false;

  var dataToSend = {};
  $scope.uploadedExcel = '';
  $scope.modifiedExcel = '';
  $scope.reportUploadedExcel = '';
  $scope.uploadType = '';
  
  vm.requestTypeList = [{name:"Valuation"},{name:"Inspection"}];

  vm.submitUploadTemp = submitUploadTemp;

  vm.editEnterpriseRequest = editEnterpriseRequest;
  vm.deleteEnterprise = deleteEnterprise;
  vm.cancelEnterprise = cancelEnterprise;
  vm.fireCommand = fireCommand;
  vm.updateSelection = updateSelection;
  vm.submitToAgency = submitToAgency;
  vm.openCommentModal = openCommentModal;
  vm.enterpriseTemplateUpload = 'Enterprise_Valuation_Template.xlsx';
  vm.enterpriseTemplateUpdate = 'Enterprise_Valuation_Update_Template.xlsx';
  vm.adminTemplateUpload = 'Admin_Valuation_Template.xlsx';
  vm.adminTemplateUpdate = 'Admin_Valuation_Update_Template.xlsx';
  
  vm.agencyTemplate = 'Valuation_Report.xlsx';
  vm.showDetail = showDetail;
  vm.exportExcel = exportExcel;
  vm.selectAll = selectAll;
  vm.isSubmitAllowed = isSubmitAllowed;
  vm.isEditAllowed = isEditAllowed;

  function init(){

    dataToSend.pagination = true;
    getEnterpriseData(angular.copy(dataToSend));
  }

 function getEnterpriseData(filter){
      
      $scope.pager.copy(filter);
      if(Auth.isEnterprise() || Auth.isEnterpriseUser())
          filter['enterpriseId'] = Auth.getCurrentUser().enterpriseId;
      if(Auth.isValuationPartner()){
        filter['agencyId'] = Auth.getCurrentUser().partnerInfo._id;
        filter['status'] = EnterpriseValuationStatuses.slice(2,EnterpriseValuationStatuses.length);
      }

      if(Auth.isEnterpriseUser()){
        filter['userId'] = Auth.getCurrentUser()._id;
      }

      EnterpriseSvc.get(filter)
      .then(function(result){
        vm.selectAllReq = "";
        selectedItems = [];
        vm.enterpriseValuationListing = result.items;
        vm.totalItems = result.totalItems;
         $scope.pager.update(result.items,result.totalItems);
      });
    }

  function fireCommand(reset,filterObj){
      if(reset)
        $scope.pager.reset();
      var filter = {};
      if(!filterObj)
          angular.copy(dataToSend, filter);
      else
        filter = filterObj;
      if(vm.searchStr){
        filter['searchStr'] = encodeURIComponent(vm.searchStr);
      }
      if(vm.statusType){
        filter['statusType'] = encodeURIComponent(vm.statusType);
      }
      if(vm.fromDate){
        filter['fromDate'] = encodeURIComponent(vm.fromDate);
      }
      if(vm.toDate){
        filter['toDate'] = encodeURIComponent(vm.toDate);
      }
      
      getEnterpriseData(filter);
    }

    //listen for the file selected event
    $scope.$on("fileSelected", function (event, args) {
        $scope.uploadType = args.id;
        if(args.files.length == 0)
          return;
        $scope.$apply(function () {           
          uploadExcel(args.files[0]);
        });
    });

    function uploadExcel(file){
      if (!file){
        Modal.alert('Please select a file');
        return;
      }
      if (file.name.indexOf('.xlsx') === -1) {
        Modal.alert('Please upload a valid file');
        return;
      }
      $rootScope.loading = true;
      $scope.refresh = !$scope.refresh;
      uploadSvc.upload(file, importDir)
        .then(function(result) {
          if($scope.uploadType === 'upload'){
            $scope.uploadedExcel = result.data.filename;
            $scope.modifiedExcel = '';
            $scope.reportUploadedExcel = "";
          }
          if($scope.uploadType === 'modify'){
            $scope.modifiedExcel = result.data.filename;
            $scope.uploadedExcel = '';
            $scope.reportUploadedExcel = "";
          }
          if($scope.uploadType === 'reportupload'){
            $scope.modifiedExcel = "";
            $scope.uploadedExcel = '';
            $scope.reportUploadedExcel =  result.data.filename;
          }
          $rootScope.loading = false;
          $scope.refresh = !$scope.refresh;
        }).catch(function(res) {
          $rootScope.loading = false;
          $scope.refresh = !$scope.refresh;
          Modal.alert("error in file upload", true);
        });
    }

    function submitUploadTemp() {
      var uploadData = {};
      
      if($scope.uploadType === 'upload'){
        uploadData = {
          fileName : $scope.uploadedExcel,
          user : Auth.getCurrentUser()
        };
        if(!uploadData.fileName){
          Modal.alert("Please upload template first.");
          return;
        }
        $rootScope.loading = true;
        EnterpriseSvc.uploadExcel(uploadData).then(function(res){
          $rootScope.loading = false;
          //vm.enterpriseValuation = {};
          $scope.uploadedExcel = '';
          $scope.uploadType = "";
          var message = res.msg;
          if (res.errObj.length > 0) {
            var data = {};
            var subject = 'Bulk Valuation upload error details.';
            var template = 'BulkSpareUploadError';
            data.to = Auth.getCurrentUser().email;
            data.subject = subject ;
            var serData = {};
            serData.serverPath = serverPath;
            serData.errorList = res.errObj;
            
            notificationSvc.sendNotification(template, data, serData, 'email');
            message += " Error details have been sent on registered email id.";
          }

          var arrSubmitToAgency = [];
          if(res.uploadedData && res.uploadedData.length){
            arrSubmitToAgency = res.uploadedData.filter(function(item){
                return item.autoSubmit;
            });
          }

          Modal.alert(message);
          if(arrSubmitToAgency.length){
            submitToAgency(arrSubmitToAgency,'Mjobcreation');
            return;
          }
          fireCommand(true);

        }).catch(function(err){
          $rootScope.loading = false;
          Modal.alert('Error while uploading');
        });
      }else if(['modify','reportupload'].indexOf($scope.uploadType) != -1){
        uploadData = {
          user : Auth.getCurrentUser()
        };
        if($scope.uploadType == 'modify'){
          uploadData['updateType'] = "enterprise";
          uploadData['fileName'] = $scope.modifiedExcel;
        }
        else{
          uploadData['updateType'] = "agency";
          uploadData['fileName'] = $scope.reportUploadedExcel;
        }

        if(!uploadData.fileName){
          Modal.alert("Please upload template first.");
          return;
        }
        $rootScope.loading = true;
        EnterpriseSvc.modifyExcel(uploadData).then(function(res){
          $rootScope.loading = false;
          //vm.enterpriseValuation = {};
          $scope.modifiedExcel = "";
          $scope.reportUploadedExcel = "";
          $scope.uploadType = "";

          var message = res.msg;
          if (res.errObj.length > 0) {
            var data = {};
            var subject = 'Bulk Valuation Modify error details.';
            var template = 'BulkSpareUploadError';
            data.to = Auth.getCurrentUser().email;
            data.subject = subject ;
            var serData = {};
            serData.serverPath = serverPath;
            serData.errorList = res.errObj;
            
            notificationSvc.sendNotification(template, data, serData, 'email');
            message += " Error details have been sent on registered email id.";
          }
          var arrSubmitToAgency = [];
          if(res.successArr && res.successArr.length){
            arrSubmitToAgency = res.successArr.filter(function(item){
                return item.jobId;
            });
          }
          if(arrSubmitToAgency.length){
            submitToAgency(arrSubmitToAgency,'Mjobupdation');
            return;
          }
          fireCommand(true);
         return Modal.alert(message);
        }).catch(function(err){
          $rootScope.loading = false;
          Modal.alert('Error while uploading');
        });
      } else {
        $rootScope.loading = false;
        Modal.alert('Invalid Choice');
        return;
      }
    } 

    function editEnterpriseRequest(enterpriseData) {
      $state.go('enterprisevaluation.edittransaction', {id:enterpriseData._id});
    }

    function deleteEnterprise(enterpriseValuation){
      Modal.confirm("Would you like to delete this record?",function(ret){
        if(ret != 'yes')
          return;
        
        enterpriseValuation.deleted = true;
         var serData = {
          data:enterpriseValuation,
          user:Auth.getCurrentUser()
        };

        EnterpriseSvc.update(serData).then(function(result){
          fireCommand(true);
          Modal.alert("Request deleted succesfully", true);
        });
      })
      
    }

    function cancelEnterprise(valReq){
      $rootScope.loading = true;      
      EnterpriseSvc.getCancellationFee(valReq)
      .then(function(result){
        $rootScope.loading = false;
        var amount = result.amount || 0;
        var msg = "A cancellation charge of Rs " + amount + " will be charged. Are you sure you want to cancel the valuation request.";
        Modal.confirm(msg,function(retVal){
          if(retVal == 'yes')
            proceedToCancel(valReq,result);
        })
      })
      .catch(function(err){
        $rootScope.loading = false;
        if(err.data)
          Modal.alert(err.data);
      });
    }

    function proceedToCancel(valReq,cancelFee){
      $rootScope.loading = true;
      EnterpriseSvc.cancelEnterprise(valReq,cancelFee)
      .then(function(res){
        $rootScope.loading = false;
        fireCommand(true);
        Modal.alert("Request cancelled succesfully", true);
      })
      .catch(function(err){
        $rootScope.loading = false;
        Modal.alert("There are some issue in request cancellation.Please try again or contact support team.");
      });
    }

    function updateSelection(event,item){
        var checkbox = event.target;
        var index = -1
        selectedItems.forEach(function(obj,idx){
           if(obj._id == item._id)
             index = idx;
        });
        var action = checkbox.checked?'add':'remove';
        if(action == 'add' && index == -1)
          selectedItems.push(item)
        if(action == 'remove' && index != -1)
          selectedItems.splice(index,1);
     }

     function selectAll(event){

        var checkbox = event.target;
        var action = checkbox.checked?'add':'remove';
        if(action == 'add'){
          selectedItems = [];
          vm.enterpriseValuationListing.forEach(function(item){
            if(EnterpriseValuationStatuses.indexOf(item.status) <= 1 && !item.onHold && !item.cancelled)
                selectedItems.push(item);
          })
          
        }
        if(action == 'remove'){
          selectedItems = [];
        }
     }

     function isSubmitAllowed(requestType){
      if(Auth.isAdmin())
        return true;
        var validRole = Auth.isEnterprise() || Auth.isEnterpriseUser();
      if(requestType){
        if(validRole && Auth.isServiceApprover(requestType))
          return true;
        else
          return false;
      }else{
        if(validRole && (Auth.isServiceApprover('Valuation') || Auth.isServiceApprover('Inspection')))
          return true;
        else
          return false;
      }

     }

      function isEditAllowed(valReq){
        if(valReq.onHold || valReq.cancelled)
          return false;
        var agencyValidStatus = [EnterpriseValuationStatuses[2],EnterpriseValuationStatuses[3],EnterpriseValuationStatuses[4],EnterpriseValuationStatuses[5],EnterpriseValuationStatuses[6]];
        if(Auth.isValuationPartner() && agencyValidStatus.indexOf(valReq.status) !== -1)
          return true;
          var validRole = Auth.isEnterprise() || Auth.isEnterpriseUser() || Auth.isAdmin();
          var validStatuses = [EnterpriseValuationStatuses[0],EnterpriseValuationStatuses[1],EnterpriseValuationStatuses[2],EnterpriseValuationStatuses[6]];
          if(validRole && Auth.isServiceAvailed(valReq.requestType) && validStatuses.indexOf(valReq.status) !== -1)
            return true;
          else
            return false;
     }

     function submitToAgency(selItems,type){
        //api integration
        if(selItems)
          selectedItems = selItems;

        if(selectedItems.length == 0){
          Modal.alert('Please select entries to be updated');
          return;
        }
        var ids = [];
        selectedItems.forEach(function(item){
          ids.push(item._id);
        });

        EnterpriseSvc.submitToAgency(ids,type)
        .then(function(resList){
          vm.selectAllReq = "";
          selectedItems = [];
          fireCommand(true);    
        })
        .catch(function(err){
          if(err)
            Modal.alert("Error occured in integration");
        })
      
    }

    function showDetail(valReq){
      var scope = $rootScope.$new();
      scope.downloadFile = $scope.downloadFile;
      scope.valuation = valReq;
      scope.EnterpriseValuationStatuses = EnterpriseValuationStatuses;
      scope.isAdmin = $scope.isAdmin;
       var formModal = $uibModal.open({
          animation: true,
            templateUrl: "app/enterprise/valuation-details-popup.html",
            scope: scope,
            windowTopClass: 'product-preview',
            size: 'lg'
        });

        scope.close = function () {
          formModal.dismiss('cancel');
        };
    }

    function openCommentModal(enterpriseVal){
      var scope = $rootScope.$new();
      scope.dataModel = {};
       var commentModal = $uibModal.open({
          animation: true,
            templateUrl: "usercomment.html",
            scope: scope,
            size: 'lg'
        });

        scope.close = function () {
          commentModal.dismiss('cancel');
        };
        scope.submit = function(form){
          if(form.$invalid){
            scope.submitted = true;
            return;
          }
          enterpriseVal.userComment = scope.dataModel.userComment;
          scope.close();
          $rootScope.loading = true;
          EnterpriseSvc.resumeRequest(enterpriseVal)
          .then(function(res){
            $rootScope.loading = false;
            fireCommand(true);
          })
          .catch(function(err){
            $rootScope.loading = false;
            if(err.data)
              Modal.alert(err.data);
          });
        }
    }

    function exportExcel(){
      var filter = {};
       if(Auth.isEnterprise() || Auth.isEnterpriseUser())
          filter['enterpriseId'] = Auth.getCurrentUser().enterpriseId;
      if(Auth.isValuationPartner())
          filter['agencyId'] = Auth.getCurrentUser().partnerInfo._id;
      if(selectedItems && selectedItems.length > 0){
        var ids = [];
        selectedItems.forEach(function(item){
          ids[ids.length] = item._id;
        });
          filter.ids = ids;
      }

      if(Auth.isEnterpriseUser()){
        filter.userId = Auth.getCurrentUser()._id;
      }

      if(vm.fromDate){
        filter['fromDate'] = encodeURIComponent(vm.fromDate);
      }
      if(vm.toDate){
        filter['toDate'] = encodeURIComponent(vm.toDate);
      }
      filter.type = "transaction";
      filter.role = Auth.getCurrentUser().role;
      //$scope.filter = filter;
      var exportObj = {filter:filter};
      exportObj.method = "GET";
      exportObj.action = "api/enterprise/export";
      $scope.$broadcast("submit",exportObj);
      //EnterpriseSvc.exportExcel("transaction",filter);
    }

    //init();
    //starting point
    Auth.isLoggedInAsync(function(loggedIn){
      if(loggedIn){
          init();
        }else
          $state.go("main")
      })

}

})();
