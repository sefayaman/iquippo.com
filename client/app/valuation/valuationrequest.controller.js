(function(){
'use strict';
angular.module('sreizaoApp').controller('ValuationRequestCtrl',ValuationRequestCtrl);
function ValuationRequestCtrl($scope,Modal,Auth,ValuationSvc,PaymentMasterSvc,$uibModalInstance,vendorSvc) {
 	var vm = this;
 	vm.close = close;
 	vm.submitRequest = submitRequest;
 	vm.valuationReq = {};

 	function init(){

		PaymentMasterSvc.getAll();

		vendorSvc.getAllVendors()
		.then(function(){
			$scope.valAgencies = vendorSvc.getVendorsOnCode('Valuation');
		});

		vm.valuationReq.product = {};
		vm.valuationReq.user = {};
		vm.valuationReq.seller = {};
		vm.valuationReq.valuationAgency = {};
		vm.valuationReq.initiatedBy = "buyer";
		if(Auth.getCurrentUser()._id && Auth.getCurrentUser()._id == $scope.product.seller._id)
		vm.valuationReq.initiatedBy = "buyer";
		vm.valuationReq.product._id = $scope.product._id;
		vm.valuationReq.product.assetId = $scope.product.assetId;
		vm.valuationReq.product.name = $scope.product.name;
		vm.valuationReq.product.category = $scope.product.category.name;

 	}

 	init();
 	function submitRequest(){

 	}
      function close(){
      	 $uibModalInstance.dismiss('cancel');
      }

}

})();
