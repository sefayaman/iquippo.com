(function(){

'use strict';
angular.module('sreizaoApp').controller('PaymentResponseCtrl',PaymentResponseCtrl);

function PaymentResponseCtrl($scope,Modal,$stateParams,$state,PaymentSvc,Auth,ValuationSvc,AuctionSvc) {
 	var vm = this;
 	vm.payTransaction = null;
 	vm.enablePayment = false;
 	var valuationReq = null;
 	var auctionReq = null;

 	function init(){
 		var tid = $stateParams.tid;
 		PaymentSvc.getOnFilter({_id:tid})
 		.then(function(result){
 			if(result.length == 0){
 				$state.go("main");
 				Modal.alert("Invalid payment access");
 			}
 			vm.payTransaction = result[0];
 			if(vm.payTransaction.statusCode == 0)
 				PaymentSvc.updateStatus(vm.payTransaction,transactionStatuses[5].code);
 			else
 				PaymentSvc.updateStatus(vm.payTransaction,transactionStatuses[2].code);

 			for(var i = 0;i< vm.payTransaction.payments.length;i++){
 				if(vm.payTransaction.payments[i].type == "auctionreq")
 					getAuctionReqDetail(vm.payTransaction._id);
 				else if(vm.payTransaction.payments[i].type == "valuationreq")
 					getValuatonReqDetail(vm.payTransaction._id);
 			}

 		})
 		.catch(function(err){
 			$state.go("main");
 			Modal.alert("Unknown error occured");
 		})
 	}

 	function getAuctionReqDetail(transactionId){
 		if(!transactionId)
 			return;
 		AuctionSvc.getOnFilter({tid :transactionId})
 		.then(function(result){
 			if(result.length > 0){
 				auctionReq = result[0];

 				AuctionSvc.updateStatus(auctionReq,auctionStatuses[1].code);
 				AuctionSvc.sendNotification(auctionReq,auctionStatuses[1].notificationText,1);
 				PaymentSvc.sendNotification(vm.payTransaction,auctionReq,1);
 			}

 		})
 	}

 	function getValuatonReqDetail(transactionId){
 		if(!transactionId)
 			return;
 		ValuationSvc.getOnFilter({tid :transactionId})
 		.then(function(result){
 			if(result.length > 0){
 				valuationReq = result[0];
 				if(valuationReq.initiatedBy == "seller"){
	 				ValuationSvc.updateStatus(valuationReq,valuationStatuses[3].code);
	 				//ValuationSvc.sendNotification(valuationReq,valuationStatuses[3].notificationText,'customer');
	 				ValuationSvc.sendNotification(valuationReq,valuationStatuses[3].notificationText,'valagency');
 				}

 				if(valuationReq.initiatedBy == "buyer"){
 					ValuationSvc.updateStatus(valuationReq,valuationStatuses[1].code);
	 				//ValuationSvc.sendNotification(valuationReq,valuationStatuses[1].notificationText,'customer');
	 				ValuationSvc.sendNotification(valuationReq,valuationStatuses[1].notificationText,'seller');
	 				//need to send seller also
 				}

 				PaymentSvc.sendNotification(vm.payTransaction,valuationReq,2);
		
 			}
 		});
 	}

 	init();
}

})();
