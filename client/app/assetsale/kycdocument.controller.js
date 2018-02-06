(function() {
  'use strict';

angular.module('sreizaoApp').controller('kycDocumentCtrl', kycDocumentCtrl);

function kycDocumentCtrl($scope, $state, $rootScope, Modal, Auth, $uibModal, $uibModalInstance, KYCSvc, AssetSaleSvc, uploadSvc, userSvc) {
  var vm = this;
  vm.addressProofList = [];
  vm.idProofList = [];
  vm.kycInfo = {};
  vm.kycList = [];
  $scope.type = ['Address Proof', 'Identity Proof'];
  vm.closeDialog = closeDialog;
  vm.submit = submit;
  $scope.uploadDoc = uploadDoc;
  
  	function init(){
      reset();
      KYCSvc.get().then(function(result) {
      	if(!result)
      		return;
      	
      	result.forEach(function(item){
          if(item.kycType == $scope.type[0])
            vm.addressProofList[vm.addressProofList.length] = item;
          if(item.kycType == $scope.type[1])
            vm.idProofList[vm.idProofList.length] = item;	
        });
      });
      if($scope.bidData.user && $scope.bidData.user.kycInfo.length > 0) {
        angular.copy($scope.bidData.user.kycInfo, vm.kycList);
        $scope.kycUploadDir = kycDocDir;
        vm.kycList.forEach(function(item){
          if(item.type == $scope.type[0]){
            vm.kycInfo.addressProof = item.name;
            vm.kycInfo.addressProofDocName = item.docName;
          } else if(item.type == $scope.type[1]){
            vm.kycInfo.idProof = item.name;
            vm.kycInfo.idProofDocName = item.docName;
          }
        });
      } else if($scope.bidData.kyc.length > 0){
        angular.copy($scope.bidData.kyc, vm.kycList);
        $scope.kycUploadDir = $scope.bidData.product.assetDir;
        vm.kycList.forEach(function(item){
          if(item.type == $scope.type[0]){
            vm.kycInfo.addressProof = item.name;
            vm.kycInfo.addressProofDocName = item.docName;
          } else if(item.type == $scope.type[1]){
            vm.kycInfo.idProof = item.name;
            vm.kycInfo.idProofDocName = item.docName;
          }
        });
      }
    }

    function reset(){
      vm.kycInfo = {};
    }

    function uploadDoc(files, _this, type) {
      if (files.length == 0)
        return;
      /*console.log("files[0].name",files[0].name);
      var arr = files[0].name.split(".");
      var extPart = arr[arr.length - 1];
      var fileName = (vm.kycInfo.addressProof).replace(/\s/g,'').extPart;
      console.log("fileName@@@", fileName);
      files[0].name = fileName;*/
      $rootScope.loading = true;
      uploadSvc.upload(files[0], kycDocDir).then(function(result) {
        $rootScope.loading = false;
      	if(type == 'addressProof'){
            vm.kycInfo.addressProofDocName = result.data.filename;
        }
        if(type == 'idProof'){
            vm.kycInfo.idProofDocName = result.data.filename;
        }
      }).catch(function(err){
        $rootScope.loading = false;
      });
    }

	function submit(form) {
		if(form.$invalid){
      form.submitted = true;
      return;
    }
    var userData = {_id:$scope.bidData.user._id};
    var addProofObj = {};
    if(vm.kycInfo.addressProof) {
      userData.kycInfo = [{}];
      addProofObj.type = $scope.type[0];
      addProofObj.name = vm.kycInfo.addressProof;
      addProofObj.isActive = false;
      if(vm.kycInfo.addressProofDocName)
       addProofObj.docName = vm.kycInfo.addressProofDocName;
      else {
        Modal.alert("Please upload address proof document.", true);
        return;
      }
      userData.kycInfo[userData.kycInfo.length] = addProofObj;
    }
    var idProofObj = {};
    if(vm.kycInfo.idProof) {
      idProofObj.type = $scope.type[1];
      idProofObj.name = vm.kycInfo.idProof;
      idProofObj.isActive = false;
      if(vm.kycInfo.idProofDocName)
       idProofObj.docName = vm.kycInfo.idProofDocName;
      else {
        Modal.alert("Please upload ID proof document.", true);
        return;
      }
      userData.kycInfo[userData.kycInfo.length] = idProofObj;
    }
    userData.kycInfo = userData.kycInfo.filter(function(item, idx) {
      if (item && item.docName)
        return true;
      else
        return false;
    });
    if(!userData.kycInfo || userData.kycInfo.length < 1) {
      Modal.alert("Please upload KYC document.", true);
      return;
    }

    userSvc.updateUser(userData).then(function(result){
      Modal.alert(informationMessage.kycUpdate, true); 
      closeDialog();
    })
     .catch(function(){
        $rootScope.loading = false;
     });
	}

	function closeDialog() {
		$uibModalInstance.dismiss('cancel');
	}

  	//loading start
	Auth.isLoggedInAsync(function(loggedIn) {
		if(loggedIn)
			init();
		else
			$state.go('main');
	});
}

})();