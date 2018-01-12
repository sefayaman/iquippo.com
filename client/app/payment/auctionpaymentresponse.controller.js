(function(){

'use strict';
angular.module('sreizaoApp').controller('AuctionPaymentResponseCtrl',AuctionPaymentResponseCtrl);

function AuctionPaymentResponseCtrl($scope,$rootScope,Modal,$stateParams,$state,notificationSvc,userRegForAuctionSvc,PaymentSvc,Auth,$cookieStore) {
 	var vm = this;
  var filter={};
 	vm.payTransaction = null;
 	var auctionReq = null;
 	vm.success = true;
  $scope.auctionResponse = false;
  $scope.option = {};
  vm.submit = submit;

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
      if(vm.payTransaction.requestType === 'Auction Request')
        $scope.auctionResponse = true;
      else
        $scope.auctionResponse = false;

 			if(vm.payTransaction.paymentMode == 'online' && !Auth.isAdmin()){
	 			if(vm.payTransaction.statusCode == 0) {
          if(vm.payTransaction.payments.length ===1) {
            var paymentObj = angular.copy(vm.payTransaction.payments[0]);
            vm.payTransaction.payments = [];
            paymentObj.refNo = vm.payTransaction.ccAvenueRes.bank_ref_no;
            paymentObj.bankname = vm.payTransaction.ccAvenueRes.card_name;
            paymentObj.paymentStatus = "success";
            vm.payTransaction.payments[vm.payTransaction.payments.length] = paymentObj;
          }
          resendUserDataToAucion(vm.payTransaction);
	 				PaymentSvc.updateStatus(vm.payTransaction,transactionStatuses[5].code);
        } else {
	 				vm.success = false;
	 				PaymentSvc.updateStatus(vm.payTransaction,transactionStatuses[2].code);
	 			}	
 			}
 		})
 		.catch(function(err){
 			$state.go("main");
 			Modal.alert("Unknown error occured");
 		})
 	}

  function submit() {
    if($scope.option.select === 'offline') {
      var payTranData = {};
      payTranData.paymentMode = $scope.option.select;
      payTranData.transactionId = vm.payTransaction._id;
      if(vm.payTransaction.payments.length ===1) {
        payTranData.payments = [];
        var paymentObj = angular.copy(vm.payTransaction.payments[0]);
        paymentObj.refNo = vm.payTransaction.ccAvenueRes.bank_ref_no;
        paymentObj.bankname = vm.payTransaction.ccAvenueRes.card_name;
        paymentObj.paymentStatus = transactionStatuses[2].code;
        payTranData.payments[payTranData.payments.length] = paymentObj;
      }
      userRegForAuctionSvc.saveOfflineRequest(payTranData).then(function(rd){
        Modal.alert("You have sucessfully registered for the auction. Please pay the EMD amount and inform our customer care team."); 
        $state.go("main");
      });
    } else {
      $state.go("auctionpayment", {
                tid: vm.payTransaction._id
              });
    }
  }

  function resendUserDataToAucion(data) {
    $rootScope.loading = true;
    PaymentSvc.sendReqToCreateUser(data)
      .then(function(res) {
          $rootScope.loading = false;
      })
      .catch(function(err){
        if(err)
          //Modal.alert(err.data);
        $rootScope.loading = false;
      });
  }

 	init();
}

})();
