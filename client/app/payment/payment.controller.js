(function(){

'use strict';
angular.module('sreizaoApp').controller('PaymentCtrl',PaymentCtrl);

function PaymentCtrl($scope,Modal,$stateParams,$state,PaymentSvc,Auth) {
 	var vm = this;
 	vm.payTransaction = null;
 	vm.enablePayment = false;

 	vm.payNow = payNow;
 	function init(){

 		if(!Auth.getCurrentUser()._id){
 			Modal.alert("It seems you have refreshed the page.");
 			$state.go("main");
 		}
 		if(!$stateParams.tid)
 			$state.go("main");
 		var tid = $stateParams.tid;
 		PaymentSvc.getOnFilter({_id:tid})
 		.then(function(result){
 			if(result.length == 0){
 				$state.go("main");
 				Modal.alert("Invalid payment access");
 			}

 			vm.payTransaction = result[0];
 			vm.prevStatus = vm.payTransaction.status;

 			if(vm.prevStatus != transactionStatuses[5].code && vm.prevStatus != transactionStatuses[3].code){
	 			PaymentSvc.updateStatus(vm.payTransaction,transactionStatuses[1].code)
	 			.then(function(){
	 				vm.enablePayment = true;
	 			});
 			}else{
 				vm.enablePayment = false;
 			}

 		})
 		.catch(function(err){
 			$state.go("main");
 			Modal,$stateParams,$state.alert("Unknown error occured in payment system");
 		})
 	}

 	function payNow(){
 		$state.go("paymentresponse",{tid:vm.payTransaction._id});
 	}

 	init();
}

})();
