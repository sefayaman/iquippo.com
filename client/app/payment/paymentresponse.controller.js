(function(){

'use strict';
angular.module('sreizaoApp').controller('PaymentResponseCtrl',PaymentResponseCtrl);

function PaymentResponseCtrl($scope,Modal,$stateParams,$state,notificationSvc,PaymentSvc,Auth,ValuationSvc,AuctionSvc,userRegForAuctionSvc,BuyContactSvc,$cookieStore) {
 	var vm = this;
  var filter={};
 	vm.payTransaction = null;
 	vm.enablePayment = false;
 	var valuationReq = null;
	var auctionReq = null;
	var auctionreqseller = null;
 	vm.success = true;
  var dataToSendToAs={};
 	function init(){
 		console.log("getting loaded");
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
      console.log("vm.payTransaction",vm.payTransaction);
       if(vm.payTransaction.status == "completed")
       {
            filter={};
            filter.transactionId=vm.payTransaction._id;
          userRegForAuctionSvc.get(filter)
          .then(function(userdata){
            console.log("userData",userdata);
            dataToSendToAs.user={};
            dataToSendToAs.user={
            user_id:userdata[0].user._id,
            lname:userdata[0].user.lname,
            fname:userdata[0].user.fname,
            email:userdata[0].user.email,
            iq_id:userdata[0].user.customerId,
            mobile:userdata[0].user.mobile
          };
          dataToSendToAs.amountPaid=vm.payTransaction.totalAmount;
          dataToSendToAs.auction_id=userdata[0].auction.dbAuctionId;
          dataToSendToAs.selectedLots=userdata[0].lotNumber;
          return userRegForAuctionSvc.sendUserData(dataToSendToAs);
          })
          .then(function(datasent){
            return datasent;
          })
          .catch(function(err){
            throw err;
          });
       }

 			if(vm.payTransaction.paymentMode == 'online' && !Auth.isAdmin()){
	 			if(vm.payTransaction.statusCode == 0)
	 				PaymentSvc.updateStatus(vm.payTransaction,transactionStatuses[5].code);
	 			else{
	 				vm.success = false;
	 				PaymentSvc.updateStatus(vm.payTransaction,transactionStatuses[2].code);
	 			}
 				
 			}
 			
 			for(var i = 0;i< vm.payTransaction.payments.length;i++){
 				if(vm.payTransaction.payments[i].type == "auctionreq")
					 getAuctionReqDetail(vm.payTransaction._id);
				else if(vm.payTransaction.payments[i].type == "auctionreqData")
 					getAuctionReqDetail(vm.payTransaction._id);
 				else if(vm.payTransaction.payments[i].type == "valuationreq")
 					getValuatonReqDetail(vm.payTransaction._id);
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
