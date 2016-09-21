(function(){

'use strict';
angular.module('sreizaoApp').controller('PaymentCtrl',PaymentCtrl);

function PaymentCtrl($scope,Modal,$stateParams,$state,PaymentSvc,Auth) {
 	var vm = this;
 	vm.payTrasaction = null;
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
 			vm.payTrasaction = result[0];
 			vm.prevStatus = vm.payTrasaction.status;
 			if(vm.prevStatus != transactionStatuses[5].code && vm.prevStatus != transactionStatuses[2].code){
 				var stObj = {};
	 			stObj.createdAt = new Date();
	 			stObj.status = transactionStatuses[2].code;
	 			vm.payTrasaction.status = transactionStatuses[2].code;
	 			stObj.userId = Auth.getCurrentUser()._id;
	 			vm.payTrasaction.statuses[vm.payTrasaction.statuses.length] = stObj;
	 			PaymentSvc.update(vm.payTrasaction)
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
 		var stObj = {};
		stObj.createdAt = new Date();
		stObj.status = transactionStatuses[5].code;
		vm.payTrasaction.status = transactionStatuses[5].code;
		stObj.userId = Auth.getCurrentUser()._id;
		vm.payTrasaction.statuses[vm.payTrasaction.statuses.length] = stObj;
		PaymentSvc.update(vm.payTrasaction)
		.then(function(){
			vm.enablePayment = true;
			$state.go("productlisting");
		});
 	}
 	init();
}

})();
