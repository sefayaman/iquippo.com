(function() {
  'use strict';

angular.module('sreizaoApp').controller('kycDocumentCtrl', kycDocumentCtrl);

function kycDocumentCtrl($scope, $state, $rootScope, Modal, Auth, $uibModal, $uibModalInstance, KYCSvc, AssetSaleSvc, uploadSvc) {
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
      if($scope.bidData.kyc) {
        angular.copy($scope.bidData.kyc, vm.kycList);
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
		if(form.$invalid){
      form.submitted = true;
      return;
    }
    $scope.bidData.kyc =[];
    var msg="";
		var addProofObj = {};
		if(vm.kycInfo.addressProof) {
			addProofObj.type = $scope.type[0];
			addProofObj.name = vm.kycInfo.addressProof;
      if(vm.kycInfo.addressProofDocName)
			 addProofObj.docName = vm.kycInfo.addressProofDocName;
      else {
        Modal.alert("Please upload address proof document.", true);
        return;
      }
      $scope.bidData.kyc[$scope.bidData.kyc.length] = addProofObj;
    }
		var idProofObj = {};
		if(vm.kycInfo.idProof) {
			idProofObj.type = $scope.type[1];
			idProofObj.name = vm.kycInfo.idProof;
      if(vm.kycInfo.idProofDocName)
			 idProofObj.docName = vm.kycInfo.idProofDocName;
      else {
        Modal.alert("Please upload ID proof document.", true);
        return;
      }
      $scope.bidData.kyc[$scope.bidData.kyc.length] = idProofObj;
    }
	  if($scope.bidData.kyc.length === 0) {
      Modal.alert("Please upload at least one document.", true);
      return;
    }
    $scope.bidData.mailSend = 'No';
    AssetSaleSvc.update($scope.bidData, 'kyc').
      then(function(res) {
        Modal.alert(informationMessage.kycUpdate, true); 
        // else if (res)
        //   Modal.alert(res, true);
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