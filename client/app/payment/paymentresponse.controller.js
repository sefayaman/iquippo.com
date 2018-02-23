(function(){

'use strict';
angular.module('sreizaoApp').controller('PaymentResponseCtrl',PaymentResponseCtrl);

function PaymentResponseCtrl($scope,Modal,$stateParams,$state,notificationSvc,PaymentSvc,Auth,ValuationSvc,AuctionSvc,BuyContactSvc,$cookieStore) {
 	var vm = this;
  var filter={};
 	vm.payTransaction = null;
 	vm.enablePayment = false;
 	var valuationReq = null;
 	var auctionReq = null;
 	vm.success = true;

 	function init(){
 		var tid = $stateParams.tid;
 		var tidFromCookie = $cookieStore.get("tid");
 		if(!tidFromCookie || tid != tidFromCookie){
 			$state.go("main");
 			return;
 		}
 		$cookieStore.remove("tid");

 		PaymentSvc.getOnFilter({_id:tid})
 		.then(function(result){
 			if(result.length == 0){
 				$state.go("main");
 				Modal.alert("Invalid payment access");
 			}
 			vm.payTransaction = result[0];

 			if(vm.payTransaction.paymentMode == 'online' && !Auth.isAdmin()){
	 			if(vm.payTransaction.statusCode == 0)
	 				PaymentSvc.updateStatus(vm.payTransaction,transactionStatuses[5].code);
	 			else{
	 				vm.success = false;
	 				PaymentSvc.updateStatus(vm.payTransaction,transactionStatuses[2].code);
	 			}
 				
 			}
 			
      if(vm.payTransaction.requestType === "Valuation Request")
        getValuatonReqDetail(vm.payTransaction);

 			for(var i = 0;i< vm.payTransaction.payments.length;i++){
 				if(vm.payTransaction.payments[i].type == "auctionreq")
 					getAuctionReqDetail(vm.payTransaction._id);
 				// else if(vm.payTransaction.payments[i].type == "valuationreq")
 				// 	getValuatonReqDetail(vm.payTransaction);
 				else if(vm.payTransaction.payments[i].type == "valuationEnquiries")
 					getValuatonEnquiryDetail(vm.payTransaction._id);
 				else if(vm.payTransaction.payments[i].type == "sparebuy")
 					getBuyReqDetail(vm.payTransaction._id);
 			}

 		})
 		.catch(function(err){
 			$state.go("main");
 			Modal.alert("Unknown error occured");
 		})
 	}

 	function getValuatonEnquiryDetail(transactionId){
     if(!transactionId)
     	return;
     if(vm.payTransaction.status=="completed"){
     	var data={};
      data['to'] = vm.payTransaction.user.email;
      data['subject'] = 'Your payment has been completed successfully';
      var dataToSend={};
      dataToSend.serverPath=serverPath;
      dataToSend.transactionId=vm.payTransaction.transactionId;
      notificationSvc.sendNotification('paymentSuccessValuationEnquiry', data,dataToSend,'email');

      data['to'] = supportMail;
      data['subject'] = 'Your payment completed successfully';
      var dataToSend={};
      dataToSend.serverPath=serverPath;
      dataToSend.transactionId=vm.payTransaction.transactionId;
      notificationSvc.sendNotification('paymentSuccessValuationEnquiry', data,dataToSend,'email');
     }
     if(vm.payTransaction.status=="pending"){
     	var data={};
      data['to'] = vm.payTransaction.user.email;
      data['subject'] = 'Your payment is pending';
      var dataToSend={};
      dataToSend.serverPath=serverPath;
      dataToSend.transactionId=vm.payTransaction.transactionId;
      notificationSvc.sendNotification('paymentPendingValuationEnquiry', data,dataToSend,'email');
     }
     if(vm.payTransaction.status=="failed"){
     	var data={};
      data['to'] = vm.payTransaction.user.email;
      data['subject'] = 'Your payment was not successful';
      var dataToSend={};
      dataToSend.serverPath=serverPath;
      dataToSend.transactionId=vm.payTransaction.transactionId;
      notificationSvc.sendNotification('paymentUnsuccessfullValuationEnquiry', data,dataToSend,'email');
     }

 	}

 	function getAuctionReqDetail(transactionId){
 		if(!transactionId)
 			return;
 		AuctionSvc.getOnFilter({tid :transactionId})
 		.then(function(result){
 			if(result.length > 0){
 				auctionReq = result[0];
 				if(auctionReq.valuation)
 					auctionReq.valuation.status = valuationStatuses[3].code;
 				AuctionSvc.updateStatus(auctionReq,auctionStatuses[1].code);
 				AuctionSvc.sendNotification(auctionReq,auctionStatuses[1].notificationText,1);
 				PaymentSvc.sendNotification(vm.payTransaction,auctionReq,1);
 			}

 		})
 	}

 	function getValuatonReqDetail(transaction){
 		if(!transaction._id)
 			return;
 		ValuationSvc.getOnFilter({tid :transaction._id})
 		.then(function(result){
 			if(result.length > 0){
 				valuationReq = result[0];
        if(vm.success) {
          ValuationSvc.updateStatus(valuationReq, IndividualValuationStatuses[1]);
          submitToAgency(valuationReq,'Mjobcreation');
        }
        setPayment(transaction, vm.success);
        ValuationSvc.sendNotification(valuationReq,IndividualValuationStatuses[1],'customer');
 				PaymentSvc.sendNotification(vm.payTransaction, valuationReq, 2);
		
 			}
 		});
 	}

  function submitToAgency(valuation,type){
    //api integration
    ValuationSvc.submitToAgency(valuation,type)
    .then(function(resList){
      //Modal.alert("Valuation request submitted successfully !!!");
    })
    .catch(function(err){
      if(err)
        Modal.alert("Error occured in integration");
    }) 
  }

  function setPayment(payTran, success) {
    if(payTran.payments.length < 1)
      payTran.payments = [];
    var paymentObj = {};
    paymentObj.paymentModeType = "Net Banking";
    paymentObj.amount = payTran.totalAmount;
    paymentObj.paymentDate = new Date();
    paymentObj.createdAt = new Date();
    paymentObj.refNo = payTran.ccAvenueRes.bank_ref_no;
    paymentObj.bankname = payTran.ccAvenueRes.card_name;
    paymentObj.trans_fee = payTran.ccAvenueData.trans_fee;
    paymentObj.service_tax = payTran.ccAvenueData.service_tax;
    paymentObj.totAmount = payTran.ccAvenueData.amount;
    paymentObj.tracking_id = payTran.ccAvenueRes.tracking_id;
    if(success)
      paymentObj.paymentStatus = "success";
    else
      paymentObj.paymentStatus = transactionStatuses[2].code;
    vm.payTransaction.payments[vm.payTransaction.payments.length] = paymentObj;
    vm.payTransaction.paymentMode = "online";
    var stsObj = {};
    stsObj.createdAt = new Date();
    stsObj.userId = Auth.getCurrentUser()._id;
    if(success)
      stsObj.status = transactionStatuses[5].code;
    else
      stsObj.status = transactionStatuses[2].code;
    vm.payTransaction.statuses[vm.payTransaction.statuses.length] = stsObj;
    PaymentSvc.update(vm.payTransaction);
  }

 	function getBuyReqDetail(transactionId){
 		if(!transactionId)
 			return;
 		BuyContactSvc.getOnFilter({transactionId : transactionId})
 		.then(function(result){
 			if(result.length > 0){
	 			var buyreq = result[0];
	 			PaymentSvc.sendNotification(vm.payTransaction,buyreq,3);
 			}
 			
 		})
 	}

 	init();
}

})();
