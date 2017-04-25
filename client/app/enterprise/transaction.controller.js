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
  vm.enterpriseValuation = {};
  vm.enterpriseValuationListing = [];
  vm.enterpriseValuation.user = {};
  
  var filter = {};
  $scope.docObj = {};
  $scope.isEdit = false;

  var dataToSend = {};
  $scope.uploadedExcel = '';
  $scope.modifiedExcel = '';
  $scope.reportUploadedExcel = '';
  $scope.uploadType = '';
  
  vm.requestTypeList = [{name:"Valuation"},{name:"Inspection"}];
  vm.enterpriseNameList = [];

  vm.submitUploadTemp = submitUploadTemp;

  vm.editEnterpriseRequest = editEnterpriseRequest;
  vm.deleteEnterprise = deleteEnterprise;
  vm.fireCommand = fireCommand;
  vm.updateSelection = updateSelection;
  vm.submitToAgency = submitToAgency;
  vm.enterpriseTemplate = 'Valuation_Template.xlsx';
  vm.agencyTemplate = 'Valuation_Report.xlsx';
  vm.showDetail = showDetail;
  vm.exportExcel = exportExcel;
  vm.selectAll = selectAll;
  vm.isSubmitAllowed = isSubmitAllowed;

  function init(){

      Auth.isLoggedInAsync(function(loggedIn){
        if(loggedIn){
            
            dataToSend.pagination = true;
            if(Auth.isEnterprise() || Auth.isEnterpriseUser()){
                dataToSend.enterpriseName =  Auth.getCurrentUser().enterpriseName;
            }
            else if(Auth.isPartner())
              dataToSend["partnerId"] = Auth.getCurrentUser()._id;
              getEnterpriseData(dataToSend);
            }
        })
    setData();
    var userFilter = {};
    userFilter.role = "enterprise";
    userFilter.enterprise = true;
    userSvc.getUsers(userFilter).then(function(data){
      vm.enterpriseNameList = data;
    })
    .catch(function(err){
    })
    vendorSvc.getAllVendors()
      .then(function(){
        vm.valAgencies = vendorSvc.getVendorsOnCode('Valuation');
      });
  }

 function getEnterpriseData(filter){
      
      $scope.pager.copy(filter);
      if(Auth.isEnterprise() || Auth.isEnterpriseUser())
          filter['enterpriseId'] = Auth.getCurrentUser().enterpriseId;
      if(Auth.isPartner()){
        filter['agencyId'] = Auth.getCurrentUser().partnerInfo._id;
        filter['status'] = EnterpriseValuationStatuses.slice(2,EnterpriseValuationStatuses.length);
      }

      if(Auth.isEnterpriseUser() && filter.isSearch){
        filter['userId'] = Auth.getCurrentUser()._id;
      }

      delete filter.isSearch;

      EnterpriseSvc.get(filter)
      .then(function(result){
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
        filter.isSearch = true;
        filter['searchStr'] = encodeURIComponent(vm.searchStr);
      }
      if(vm.fromDate){
        filter.isSearch = true;
        filter['fromDate'] = encodeURIComponent(vm.fromDate);
      }
      if(vm.toDate){
        filter.isSearch = true;
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
        EnterpriseSvc.uploadExcel(uploadData).then(function(res){
          vm.enterpriseValuation = {};
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
          fireCommand(true);
         return Modal.alert(message);
        }).catch(function(err){
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
        EnterpriseSvc.modifyExcel(uploadData).then(function(res){
          vm.enterpriseValuation = {};
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
          fireCommand(true);
         return Modal.alert(message);
        }).catch(function(err){
          Modal.alert('Error while uploading');
        });
      } else {
        Modal.alert('Invalid Choice');
        return;
      }
    } 

    function editEnterpriseRequest(enterpriseData) {
      $state.go('enterprisevaluation.edittransaction', {id:enterpriseData._id});
    }


    function setData() {
      if(Auth.getCurrentUser()._id) {
        vm.enterpriseValuation.user.userName = Auth.getCurrentUser().fname + " " + Auth.getCurrentUser().lname;
      }
      vm.enterpriseValuation.requestDate = moment(new Date()).format('MM/DD/YYYY');
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
            if(EnterpriseValuationStatuses.indexOf(item.status) <= 1)
                selectedItems.push(item);
          })
          
        }
        if(action == 'remove'){
          selectedItems = [];
        }
     }

     function isSubmitAllowed(){
      if(Auth.isAdmin())
        return true;
        var validRole = Auth.isEnterprise() || Auth.isEnterpriseUser();
        if(validRole && (Auth.isServiceApprover('Valuation') || Auth.isServiceApprover('Inspection')))
          return true;
        else
          return false;

     }

     function submitToAgency(){
        //api integration
        if(selectedItems.length == 0){
          Modal.alert('Please select entries to be updated');
          return;
        }

        EnterpriseSvc.submitToAgency(selectedItems)
        .then(function(resList){
          vm.selectAllReq = "";
          selectedItems = [];
          fireCommand(true);
          /*//console.log("res",res);
            if(resList && resList.length > 0){
              resList.forEach(function(item){
                var valReq = getValReqByUniqueCtrlNo(selectedItems,item.uniqueControlNo);
                if(item.success == "true"){
                   valReq.jobId = item.jobId;
                   EnterpriseSvc.setStatus(valReq,EnterpriseValuationStatuses[2]);
                }else{
                  valReq.remarks = item.msg;
                   EnterpriseSvc.setStatus(valReq,EnterpriseValuationStatuses[1]);
                }

              })
              bulkUpdate(selectedItems);
            }     */     
        })
        .catch(function(err){
          Modal.alert("error occured in integration");
        })
      
    }

    /*function getValReqByUniqueCtrlNo(list,unCtrlNo){
      var retVal = null;
      list.some(function(item){
        if(item.uniqueControlNo == unCtrlNo){
          retVal = item;
          return false;
        }
      })
      return retVal;
    }

    function bulkUpdate(){
      EnterpriseSvc.bulkUpdate(selectedItems)
        .then(function(res){
          vm.selectAllReq = "";
          selectedItems = [];
          fireCommand(true);
      })
    }*/

    function showDetail(valReq){
      var scope = $rootScope.$new()
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

    function exportExcel(){
      var filter = {};
       if(Auth.isEnterprise() || Auth.isEnterpriseUser())
          filter['enterpriseId'] = Auth.getCurrentUser().enterpriseId;
      if(Auth.isPartner())
          filter['agencyId'] = Auth.getCurrentUser().partnerInfo._id;
      if(selectedItems && selectedItems.length > 0){
        var ids = [];
        selectedItems.forEach(function(item){
          ids[ids.length] = item._id;
        });
          filter.ids = ids;
      }

      if(vm.fromDate){
        filter['fromDate'] = encodeURIComponent(vm.fromDate);
      }
      if(vm.toDate){
        filter['toDate'] = encodeURIComponent(vm.toDate);
      }

      EnterpriseSvc.exportExcel("transaction",filter);
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
