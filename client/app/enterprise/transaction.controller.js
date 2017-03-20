(function(){
'use strict';
angular.module('sreizaoApp').controller('EnterpriseTransactionCtrl',EnterpriseTransactionCtrl);
function EnterpriseTransactionCtrl($scope, $rootScope, Modal, uploadSvc,Auth, $state, notificationSvc, vendorSvc, EnterpriseSvc, userSvc, LocationSvc, categorySvc, brandSvc, modelSvc,PagerSvc) {
  
  var vm = this;

  var statuses = EnterpriseValuationStatuses.slice(0,4);
  $scope.pager = PagerSvc.getPager();

  vm.enterpriseValuation = {};
  vm.enterpriseValuationListing = [];
  vm.enterpriseValuation.user = {};
  $scope.enterpriseSubmitted = false;
  $scope.enterpriseValSubmitted = false;
  var filter = {};
  $scope.docObj = {};
  $scope.isEdit = false;
  var dataToSend = {};
  $scope.uploadedExcel = '';
  $scope.modifiedExcel = '';
  $scope.uploadType = '';
  
  vm.requestTypeList = [{name:"Valuation"},{name:"Inspection"}];
  vm.enterpriseNameList = [];

  vm.submitUploadTemp = submitUploadTemp;

  vm.editEnterpriseRequest = editEnterpriseRequest;
  vm.deleteEnterprise = deleteEnterprise;
  vm.fireCommand = fireCommand;
  vm.uploadTemplate = 'Valuation_Template.xlsx';

  function init(){

    Auth.isLoggedInAsync(function(loggedIn) {
      Auth.isLoggedInAsync(function(loggedIn){
        if(loggedIn){
            
            dataToSend.pagination = true;
            if(Auth.isEnterprise() || Auth.isEnterpriseUser())
                dataToSend.enterpriseName =  Auth.getCurrentUser().enterpriseName;
            else if(Auth.isPartner())
              dataToSend["partnerId"] = Auth.getCurrentUser()._id;
              getEnterpriseData(dataToSend);
            }
        })
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
      EnterpriseSvc.getOnFilter(filter)
      .then(function(result){
        vm.enterpriseValuationListing = result.items;
        vm.totalItems = result.totalItems;
         $scope.pager.update(result.items,result.totalItems);
      });
    }

  init();

  function fireCommand(reset,filterObj){
      if(reset)
        $scope.pager.reset();
      var filter = {};
      if(!filterObj)
          angular.copy(dataToSend, filter);
      else
        filter = filterObj;
      if(vm.searchStr)
        filter['searchStr'] = vm.searchStr;
      
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

      uploadSvc.upload(file, importDir)
        .then(function(result) {
          setUserData();
          if($scope.uploadType === 'upload')
            $scope.uploadedExcel = result.data.filename;
          if($scope.uploadType === 'modify')
            $scope.modifiedExcel = result.data.filename;
          $rootScope.loading = false;
        }).catch(function(res) {
          Modal.alert("error in file upload", true);
        });
    }

    function submitUploadTemp() {
      var uploadData = {};
      
      if($scope.uploadType === 'upload'){
        uploadData = {
          fileName : $scope.uploadedExcel,
          user : vm.enterpriseValuation.user
        };

        EnterpriseSvc.uploadExcel(uploadData).then(function(res){
          vm.enterpriseValuation = {};
          $scope.uploadedExcel = '';
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
      }else if($scope.uploadType === 'modify'){
        uploadData = {
          fileName : $scope.modifiedExcel,
          user : vm.enterpriseValuation.user
        };

        EnterpriseSvc.modifyExcel(uploadData).then(function(res){
          vm.enterpriseValuation = {};
          $scope.modifiedExcel = '';
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


    function setUserData(){
      vm.enterpriseValuation.user = {};
      vm.enterpriseValuation.user._id = Auth.getCurrentUser()._id;
      vm.enterpriseValuation.user.userName = Auth.getCurrentUser().fname + " " + Auth.getCurrentUser().lname;
      vm.enterpriseValuation.user.mobile = Auth.getCurrentUser().mobile;
      vm.enterpriseValuation.user.email = Auth.getCurrentUser().email;
      vm.enterpriseValuation.user.role = Auth.getCurrentUser().role;
    }

    function setData() {
      if(Auth.getCurrentUser()._id) {
        vm.enterpriseValuation.user.userName = Auth.getCurrentUser().fname + " " + Auth.getCurrentUser().lname;
      }
      vm.enterpriseValuation.requestDate = moment(new Date()).format('MM/DD/YYYY');
    }

    function deleteEnterprise(enterpriseValuation){
      enterpriseValuation.deleted = true;
      EnterpriseSvc.update(enterpriseValuation).then(function(result){
        Modal.alert("Request deleted succesfully", true);
      });
    }

}

})();
