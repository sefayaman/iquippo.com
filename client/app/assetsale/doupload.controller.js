(function() {
  'use strict';

angular.module('sreizaoApp').controller('DoUploadCtrl', DoUploadCtrl);

function DoUploadCtrl($scope, $state, $rootScope, Modal, Auth, uploadSvc, AssetSaleSvc, $uibModalInstance) {
  	var vm = this;
   	$scope.uploadDoc = uploadDoc;
   	$scope.submitDOIssued = submitDOIssued;
   	$scope.bidDt = {};
   	$scope.close = close;

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
		if(form.$invalid || !$scope.bidDt.deliveryOrder){
			$scope.submitted = true;
			return;
		}
		$scope.bidData.deliveryOrder = $scope.bidDt.deliveryOrder;
		$scope.bidData.dateOfDelivery = $scope.bidDt.dateOfDelivery;
		AssetSaleSvc.changeBidStatus($scope.bidData,'doissued',$scope.close);
	}

	function close() {
		$uibModalInstance.dismiss('cancel');
	}
}

})();