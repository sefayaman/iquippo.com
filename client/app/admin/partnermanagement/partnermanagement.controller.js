'use strict';

angular.module('sreizaoApp')
  .controller('PartnerManagementCtrl', ['$scope', 'DTOptionsBuilder', '$rootScope', '$http', 'Auth','User', 'Modal', 'uploadSvc', 'notificationSvc', 'vendorSvc',
   function ($scope, DTOptionsBuilder, $rootScope, $http, Auth, User, Modal, uploadSvc, notificationSvc, vendorSvc) {
   	$scope.vendorReg ={};
   	$scope.errors = {};
    $scope.services = [];
    $scope.isEdit = false;
    $scope.editImage = false;
    $rootScope.isSuccess = false;
    $rootScope.isError = false;
    $scope.dtOptions = DTOptionsBuilder.newOptions().withOption('bFilter', true).withOption('lengthChange', true);
	  $scope.register = function(form){
    var ret = false;
    if($scope.form.$invalid || ret){
        $scope.form.submitted = true;
        return;
      }
     if(!$scope.vendorReg.imgsrc){
        Modal.alert("Please upload the partner logo image.",true);
        return;
      }

      saveVendor();
};

  function saveVendor(){
    $scope.services =[];
      if($scope.Shipping)
        $scope.services.push($scope.Shipping);
      if($scope.Valuation)
        $scope.services.push($scope.Valuation);
      if($scope.CertifiedByIQuippo)
        $scope.services.push($scope.CertifiedByIQuippo);
      
      $scope.vendorReg.services = $scope.services;

      if(!$scope.isEdit) {
      if(!$scope[$scope.imgsrc])
        return;
      uploadSvc.upload($scope[$scope.imgsrc],avatarDir).then(function(result){
        $scope.vendorReg.imgsrc = result.data.filename;
        $http.post('/api/vendor',$scope.vendorReg).success(function(result) {
        if(result && result.errorCode == 1){
          Modal.alert(result.message, true);
        } else {
          $scope.successMessage = "Partner added successfully";
          $scope.autoSuccessMessage(20);
          $scope.editImage = false;
          var data = {};
          data['to'] = $scope.vendorReg.email;
          data['subject'] = 'Partner Registration';
          $scope.vendorReg.serverPath = serverPath;
          notificationSvc.sendNotification('vendorRegEmail', data, $scope.vendorReg,'email');
          vendorSvc.getAllVendors();
          $scope.vendorReg = {};
          $scope.Shipping = "";
          $scope.Valuation = "";
          $scope[$scope.imgsrc] = null;
          $scope.CertifiedByIQuippo = "";
          } 
        }).error(function(res){
            Modal.alert(res,true);
        });
      });
    } else {
      if($scope.editImage) {
      if(!$scope[$scope.imgsrc])
        return;
        uploadSvc.upload($scope[$scope.imgsrc],avatarDir).then(function(result){
          $scope[$scope.imgsrc] = null;
          $scope.vendorReg.imgsrc = result.data.filename;
          updateVendor($scope.vendorReg);
        });
      } else {
        updateVendor($scope.vendorReg);
      }
      
    }
}

  $scope.getServiceString = function(services){
    var tempArr = [];
    var serviceArr = [];

    if(!services)
      return;

    tempArr = services.split(",");
    for (var i in tempArr) {
      if(tempArr[i] == 'Shipping')
        serviceArr.push('Shipping');
      else if(tempArr[i] == 'Valuation')
        serviceArr.push('Valuation');
      else if(tempArr[i] == 'CertifiedByIQuippo')
         serviceArr.push('Certified by iQuippo');
    }
    return serviceArr.join();
  }

function updateVendor(vendor) {
  vendorSvc.updateVendor(vendor).then(function(result){
    $scope.successMessage = "Partner updated successfully";
    $scope.autoSuccessMessage(5);
    $scope.vendorReg = {};
    $scope.Shipping = "";
    $scope.Valuation = "";
    $scope.CertifiedByIQuippo = "";
    $scope.isCollapsed = true;
    vendorSvc.getAllVendors();
  })
  .catch(function(err){
    console.log("error in vendor update",err);
  });
}
$scope.imgsrc = "file";
//listen for the file selected event
    $scope.$on("fileSelected", function (event, args) {
        if(args.files.length == 0)
          return;
        $scope.$apply(function () {            
            //add the file object to the scope's files collection
            $scope.editImage = true;
            //$scope.imgsrc = "";
            $scope[$scope.imgsrc] = args.files[0];
            $scope.vendorReg.imgsrc = args.files[0].name;
        });
    });

 $scope.isCollapsed = true;

 $scope.deleteVendor = function(vendor){
    Modal.confirm(informationMessage.deletePartnerConfirm,function(isGo){
        if(isGo == 'no')
          return;
        vendorSvc.deleteVendor(vendor).then(function(result){
        vendorSvc.getAllVendors();
      })
      .catch(function(err){
        console.log("error in vendor delete",err.data);
      });
    });
  }

  $scope.editVendorClick = function(vendor){
    $scope.isCollapsed = false;
    $scope.editImage = false;

    $scope.vendorReg = vendor;
    $scope.Shipping = "";
    $scope.Valuation = "";
    $scope.CertifiedByIQuippo = "";
    for (var i=0; i< vendor.services.length; i++) {
      if(vendor.services[i] == 'Shipping')
        $scope.Shipping = vendor.services[i];
      else if(vendor.services[i] == 'Valuation')
        $scope.Valuation = vendor.services[i];
      else if(vendor.services[i] == 'CertifiedByIQuippo')
        $scope.CertifiedByIQuippo = vendor.services[i];
    }
    $scope.isEdit = true;
  }

  
}]);

