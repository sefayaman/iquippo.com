(function() {
  'use strict';

angular.module('sreizaoApp').controller('kycDocumentCtrl', kycDocumentCtrl);

function kycDocumentCtrl($scope, $rootScope, Modal, Auth, $uibModal, $uibModalInstance, KYCSvc, AssetSaleSvc, uploadSvc) {
  var vm = this;
  vm.addressProofList = [];
  vm.idProofList = [];
  vm.kycInfo = {};
  //$scope.bidData ={};
  $scope.type = ['Address Proof', 'Identity Proof'];
  vm.closeDialog = closeDialog;
  vm.submit = submit;
  $scope.uploadDoc = uploadDoc;
  
  	function init(){
      //angular.copy($scope.bidRequestData, $scope.bidData);
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
      uploadSvc.upload(files[0], $scope.bidData.product.assetDir).then(function(result) {
      	if(type == 'addressProof'){
            vm.kycInfo.addressProofDocName = result.data.filename;
        }
        if(type == 'idProof'){
            vm.kycInfo.idProofDocName = result.data.filename;
        }
        
      });
    }

	function submit(form) {
		var ret = false;
	  	if(form.$invalid || ret){
	      form.submitted = true;
	      return;
	    }
		//var kycData = [];
		$scope.bidData.kyc =[];
		var addProofObj = {};
		if(vm.kycInfo.addressProof) {
			addProofObj.type = $scope.type[0];
			addProofObj.name = vm.kycInfo.addressProof;
			addProofObj.docName = vm.kycInfo.addressProofDocName;
		}
		$scope.bidData.kyc[$scope.bidData.kyc.length] = addProofObj;
		var idProofObj = {};
		if(vm.kycInfo.addressProof) {
			idProofObj.type = $scope.type[1];
			idProofObj.name = vm.kycInfo.idProof;
			idProofObj.docName = vm.kycInfo.idProofDocName;
		}
		$scope.bidData.kyc[$scope.bidData.kyc.length] = idProofObj;

	    AssetSaleSvc.update($scope.bidData, 'kyc').
	      then(function(res) {
	        if (res)
	          Modal.alert(res, true);
	      	closeDialog();
	      })
	      .catch(function(res) {
	        console.log(res);
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