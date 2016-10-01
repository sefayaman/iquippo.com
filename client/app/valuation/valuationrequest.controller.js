(function(){
'use strict';
angular.module('sreizaoApp').controller('ValuationRequestCtrl',ValuationRequestCtrl);
function ValuationRequestCtrl($scope,Modal,Auth,ValuationSvc,PaymentMasterSvc,$uibModalInstance,vendorSvc,$state,notificationSvc) {
 	var vm = this;
 	vm.close = close;
 	vm.submitValuationReq = submitValuationReq;
 	vm.resetValuationReq = resetValuationReq;
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
		vm.valuationReq.initiatedBy = "seller";
		vm.valuationReq.product._id = $scope.product._id;
		vm.valuationReq.product.assetId = $scope.product.assetId;
		vm.valuationReq.product.assetDir = $scope.product.assetDir;
		vm.valuationReq.product.name = $scope.product.name;
		vm.valuationReq.product.category = $scope.product.category.name;
		vm.valuationReq.product.status = $scope.product.assetStatus;
		vm.valuationReq.product.city = $scope.product.city;
		vm.valuationReq.product.serialNumber = $scope.product.serialNo;

		vm.valuationReq.user._id = Auth.getCurrentUser()._id;
		vm.valuationReq.user.mobile = Auth.getCurrentUser().mobile;
		vm.valuationReq.user.email = Auth.getCurrentUser().email;
		
		vm.valuationReq.seller._id = $scope.product.seller._id;
		vm.valuationReq.seller.mobile = $scope.product.seller.mobile;
		vm.valuationReq.seller.email = $scope.product.seller.email;

 	}

 	init();
 	function submitValuationReq(form){
 		if(form.$invalid){
 			$scope.submitted = true;
 			return;
 		}

 		vm.valuationReq.status = valuationStatuses[0].code;
 		vm.valuationReq.statuses = [];
 		var stsObj = {};
 		stsObj.createdAt = new Date();
 		stsObj.userId = vm.valuationReq.user._id;
 		stsObj.status = valuationStatuses[0].code;
 		vm.valuationReq.statuses[vm.valuationReq.statuses.length] = stsObj;
 		for(var i=0; $scope.valAgencies.length;i++){
 			if($scope.valAgencies[i]._id == vm.valuationReq.valuationAgency._id){
 				vm.valuationReq.valuationAgency.name = $scope.valAgencies[i].name;
 				vm.valuationReq.valuationAgency.email = $scope.valAgencies[i].email;
 				vm.valuationReq.valuationAgency.mobile = $scope.valAgencies[i].mobile;
 				break;
 			}
 		}
 		
		var paymentTransaction = {};
		paymentTransaction.payments = [];
		paymentTransaction.totalAmount = 0;
		paymentTransaction.requestType = "Valuation Request";

		var payObj = {};

		var pyMaster = PaymentMasterSvc.getPaymentMasterOnSvcCode("Valuation",vm.valuationReq.valuationAgency._id);
		payObj.type = "valuationreq";
		payObj.charge = pyMaster.fees;
		paymentTransaction.totalAmount += payObj.charge;
		paymentTransaction.payments[paymentTransaction.payments.length] = payObj;

		paymentTransaction.product = {};
		paymentTransaction.product._id = $scope.product._id;
		paymentTransaction.product.assetId = $scope.product.assetId;
		paymentTransaction.product.assetDir = $scope.product.assetDir;
		paymentTransaction.product.primaryImage = $scope.product.primaryImg;
		paymentTransaction.product.city = $scope.product.city;
		paymentTransaction.product.name = $scope.product.name;
		paymentTransaction.user = {};

		paymentTransaction.user._id = Auth.getCurrentUser()._id;
		paymentTransaction.user.mobile = Auth.getCurrentUser().mobile;
		paymentTransaction.user.fname = Auth.getCurrentUser().fname;
		paymentTransaction.user.city = Auth.getCurrentUser().city;
		paymentTransaction.user.email = Auth.getCurrentUser().email;

		paymentTransaction.status = transactionStatuses[0].code;
		paymentTransaction.statuses = [];
		var sObj = {};
		sObj.createdAt = new Date();
		sObj.status = transactionStatuses[0].code;
		sObj.userId = Auth.getCurrentUser()._id;
		paymentTransaction.statuses[paymentTransaction.statuses.length] = sObj;

 		ValuationSvc.save({valuation:vm.valuationReq,payment:paymentTransaction})
 		.then(function(result){
			close(); 			
 			if(result.transactionId)
 				$state.go('payment',{tid:result.transactionId});
 		})
 		.catch(function(){
 			//error handling
 		});

 	}

 	function resetValuationReq(){

 	}

    function close(){
      	 $uibModalInstance.dismiss('cancel');
    }

}

})();
