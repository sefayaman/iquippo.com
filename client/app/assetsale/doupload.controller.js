(function() {
  'use strict';

angular.module('sreizaoApp').controller('DoUploadCtrl', DoUploadCtrl);

function DoUploadCtrl($scope, $state, $rootScope, Modal, Auth, uploadSvc, AssetSaleSvc, $uibModalInstance) {
  	var vm = this;
   	$scope.uploadDoc = uploadDoc;
   	$scope.submitDOIssued = submitDOIssued;
   	$scope.bidDt = {};
   	$scope.close = close;
   	vm.validateAction = AssetSaleSvc.validateAction;
   	var action = $scope.formType == 'doIssued' ? 'doissued' : 'deliverd';
   	if($scope.bidData && $scope.bidData.deliveryOrder)
   		$scope.bidDt.deliveryOrder = $scope.bidData.deliveryOrder;
   // do upload
   function uploadDoc(files,_this){
		if(!files || !files.length)
			return;
		uploadSvc.upload(files[0],$scope.bidData.product.assetDir)
		.then(function(res){
			$scope.bidDt.deliveryOrder = res.data.filename;
     	})
	}

	function submitDOIssued(form){
		if(action === 'doissued' && !$scope.bidDt.deliveryOrder) {
			Modal.alert("Please Upload DO!");
			return;
		}

		if(action === 'deliverd' && (form.$invalid || !$scope.bidDt.dateOfDelivery)){
			$scope.submitted = true;
			return;
		}
		if($scope.bidDt.deliveryOrder)
			$scope.bidData.deliveryOrder = $scope.bidDt.deliveryOrder;
		if($scope.bidDt.dateOfDelivery)
			$scope.bidData.dateOfDelivery = $scope.bidDt.dateOfDelivery;
		AssetSaleSvc.changeBidStatus($scope.bidData,action,$scope.close);
	}

	function close() {
		$uibModalInstance.dismiss('cancel');
	}
}

})();