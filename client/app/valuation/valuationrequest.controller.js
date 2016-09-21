(function(){
'use strict';
angular.module('sreizaoApp').controller('ValuationRequestCtrl',ValuationRequestCtrl);
function ValuationRequestCtrl($scope,Modal,Auth,ValuationSvc,PaymentMasterSvc,$uibModalInstance) {
 	var vm = this;
 	vm.close = close;
 	vm.submitRequest = submitRequest;
 	vm.valuationRequest = {};

 	function init(){

		PaymentMasterSvc.getAll();

		vendorSvc.getAllVendors()
		.then(function(){
			$scope.valAgencies = vendorSvc.getVendorsOnCode('Valuation');
		});

		valuationReq.product = {};
		valuationReq.user = {};
		valuationReq.seller = {};
		valuationReq.valuationAgency = {};
		valuationReq.initiatedBy = "buyer";
		if(Auth.getCurrentUser()._id && Auth.getCurrentUser()._id == $scope.currentProduct.seller._id)
		valuationReq.initiatedBy = "buyer";
		valuationReq.product._id = $scope.currentProduct._id;
		valuationReq.product.assetId = $scope.currentProduct.assetId;
		valuationReq.product.name = $scope.currentProduct.name;
		valuationReq.product.category = $scope.currentProduct.category.name;

 	}

 	init();

      function close(){
      	 $uibModalInstance.dismiss('cancel');
      }

}

})();
