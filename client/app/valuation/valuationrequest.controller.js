(function(){
'use strict';
angular.module('sreizaoApp').controller('ValuationRequestCtrl',ValuationRequestCtrl);
function ValuationRequestCtrl($scope,Modal,Auth,ValuationSvc,PaymentMasterSvc,vendorSvc,$state,notificationSvc) {
 	var vm = this;
 	//vm.close = close;
 	vm.submitValuationReq = submitValuationReq;
 	vm.resetValuationReq = resetValuationReq;
 	vm.valuationReq = {};

 	function init(){


		 PaymentMasterSvc.getAll()
	    .then(function(result){
	      $scope.payments = result;
	      vendorSvc.getAllVendors()
	      .then(function(){
	        var agency = vendorSvc.getVendorsOnCode('Valuation');
	        $scope.valAgencies = [];
	        agency.forEach(function(item){
	          var pyMst = PaymentMasterSvc.getPaymentMasterOnSvcCode("Valuation",item._id);
	          if(pyMst && pyMst.fees)
	            $scope.valAgencies[$scope.valAgencies.length] = item;
	          else if(pyMst && pyMst.fees === 0)
	            $scope.valAgencies[$scope.valAgencies.length] = item;
	        })
	      });

	    })

		vm.valuationReq.product = {};
		vm.valuationReq.user = {};
		vm.valuationReq.seller = {};
		vm.valuationReq.valuationAgency = {};
		vm.valuationReq.initiatedBy = "buyer";
		if(Auth.getCurrentUser()._id && Auth.getCurrentUser()._id == $scope.currentProduct.seller._id)
		vm.valuationReq.initiatedBy = "seller";
		vm.valuationReq.product._id = $scope.currentProduct._id;
		vm.valuationReq.product.assetId = $scope.currentProduct.assetId;
		vm.valuationReq.product.assetDir = $scope.currentProduct.assetDir;
		vm.valuationReq.product.primaryImg = $scope.currentProduct.primaryImg;
		vm.valuationReq.product.name = $scope.currentProduct.name;
		vm.valuationReq.product.category = $scope.currentProduct.category.name;
		vm.valuationReq.product.status = $scope.currentProduct.assetStatus;
		vm.valuationReq.product.city = $scope.currentProduct.city;
		vm.valuationReq.product.serialNumber = $scope.currentProduct.serialNo;

		vm.valuationReq.user._id = Auth.getCurrentUser()._id;
		vm.valuationReq.user.mobile = Auth.getCurrentUser().mobile;
		vm.valuationReq.user.email = Auth.getCurrentUser().email;
		
		vm.valuationReq.seller._id = $scope.currentProduct.seller._id;
		vm.valuationReq.seller.mobile = $scope.currentProduct.seller.mobile;
		vm.valuationReq.seller.email = $scope.currentProduct.seller.email;

 	}

 	$scope.$on('productloaded',function(){
 		init();
 	});

 	//init();
 	function submitValuationReq(form){
 		
         if(!Auth.getCurrentUser()._id) {
      Modal.alert("Please Login/Register for submitting your request!", true);
      return;
    }

    if(Auth.getCurrentUser().profileStatus == "incomplete"){
    return $state.go("myaccount");
  }

 		if(form.$invalid){
 			$scope.valSubmitted = true;
 			return;
 		}

 	 Modal.confirm("Do you want to submit?",function(ret){
        if(ret == "yes")
        {
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
		paymentTransaction.product.type = "equipment";
		paymentTransaction.product._id = $scope.currentProduct._id;
		paymentTransaction.product.assetId = $scope.currentProduct.assetId;
		paymentTransaction.product.assetDir = $scope.currentProduct.assetDir;
		paymentTransaction.product.primaryImg = $scope.currentProduct.primaryImg;
		paymentTransaction.product.city = $scope.currentProduct.city;
		paymentTransaction.product.name = $scope.currentProduct.name;
		paymentTransaction.product.category = $scope.currentProduct.category.name;
		paymentTransaction.product.status = $scope.currentProduct.assetStatus;
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
		paymentTransaction.paymentMode = "online";

 		ValuationSvc.save({valuation:vm.valuationReq,payment:paymentTransaction})
 		.then(function(result){	
 			vm.valuationReq={};
 			if(result.transactionId)
 				$state.go('payment',{tid:result.transactionId});

 		})
 		.catch(function(){
 			//error handling
 		});
 	}
 	});

 	}

 	function resetValuationReq(){

 	}


}

})();
