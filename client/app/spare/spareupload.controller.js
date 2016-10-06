(function(){
'use strict';
angular.module('spare').controller('SpareUploadCtrl',SpareUploadCtrl);

//Spare upload controller
function SpareUploadCtrl($scope, $http, $rootScope, $stateParams, groupSvc, categorySvc,SubCategorySvc,LocationSvc, uploadSvc, brandSvc, modelSvc, Auth, $uibModal, Modal, $state, notificationSvc, AppNotificationSvc, userSvc, $timeout, $sce) {
    var vm = this;
    $rootScope.isSuccess = false;
    $rootScope.isError = false;
    $scope.assetDir = "";
    vm.spare = {};
    $scope.container = {};
    vm.onRoleChange = onRoleChange;
    vm.onUserChange = onUserChange;
    vm.resetClick = resetClick;
    vm.firstStep = firstStep;
  	vm.secondStep = secondStep;

    function onRoleChange(userType,noChange){
	    if(!userType){
	      $scope.getUsersOnUserType = "";
	      return;
	    }
	    var dataToSend = {};
	    dataToSend.status = true;
	    dataToSend.userType = userType;
	    if(!noChange){
	      vm.spare.seller = {};
	      vm.spare.seller.userType = userType;
	      $scope.container.selectedUserId = "";
	    }
	    userSvc.getUsers(dataToSend).then(function(result){
	      vm.getUsersOnUserType = result;
	    });
	}

    function onUserChange(userId){
      if(angular.isUndefined(userId) || !userId){
        //vm.spare.seller = {};
        return;
      }
      var seller = null;
      for(var i=0; i< vm.getUsersOnUserType.length;i++){
          if(userId == vm.getUsersOnUserType[i]._id){
            seller = vm.getUsersOnUserType[i];
            break;
          }
      }
      if(!seller)
        return;
      vm.spare.seller._id = seller._id;
      vm.spare.seller.fname = seller.fname;
      vm.spare.seller.mname = seller.mname;
      vm.spare.seller.lname = seller.lname;
      vm.spare.seller.role = seller.role;
      vm.spare.seller.userType = user.userType;
      vm.spare.seller.phone = seller.phone;
      vm.spare.seller.mobile = seller.mobile;
      vm.spare.seller.email = seller.email;
      vm.spare.seller.country = seller.country;
      vm.spare.seller.company = seller.company;
    }

    function resetClick(form){
	    productInit();
	    $scope.container = {};
	    $scope.brandList = [];
	    $scope.modelList = [];
	    $scope.images = [{isPrimary:true}];
	    prepareImgArr();
	    productHistory = $scope.productHistory = {};
	    $scope.container.mfgYear = null;
	}

	function firstStep(form,spare){

	}

	function secondStep(form,product){
    
    }
}
})();
