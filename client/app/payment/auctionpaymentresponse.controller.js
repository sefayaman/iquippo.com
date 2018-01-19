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
      vm.payTransaction.paymentMode = "online";
      vm.payTransaction.totalAmount = vm.payTransaction.emd;
 			if(vm.payTransaction.paymentMode == 'online' && !Auth.isAdmin() && !Auth.isAuctionRegPermission()){
	 			if(vm.payTransaction.statusCode == 0) {
          setPayment(vm.payTransaction, vm.success);
          if(vm.payTransaction.status !== transactionStatuses[5].code)
            vm.payTransaction.status = transactionStatuses[5].code;
          var stsObj = {};
          stsObj.createdAt = new Date();
          stsObj.userId = Auth.getCurrentUser()._id;
          stsObj.status = transactionStatuses[5].code;
          vm.payTransaction.statuses[vm.payTransaction.statuses.length] = stsObj;
          vm.payTransaction.userDataSendToAuction = true;
          $rootScope.loading = true;
          PaymentSvc.update(vm.payTransaction)
            .then(function(res) {
                $rootScope.loading = false;
            })
          .catch(function(err){
            $rootScope.loading = false;
          });
        } else {
	 				vm.success = false;
          setPayment(vm.payTransaction, vm.success);
          if(vm.payTransaction.status !== transactionStatuses[5].code)
              vm.payTransaction.status = transactionStatuses[2].code;
          var stsObj = {};
          stsObj.createdAt = new Date();
          stsObj.userId = Auth.getCurrentUser()._id;
          stsObj.status = transactionStatuses[2].code;
          vm.payTransaction.statuses[vm.payTransaction.statuses.length] = stsObj;
          PaymentSvc.update(vm.payTransaction);
	 			}	
 			}
 		})
 		.catch(function(err){
 			$state.go("main");
 			Modal.alert("Unknown error occured");
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
    if(success)
      paymentObj.paymentStatus = "success";
    else
      paymentObj.paymentStatus = transactionStatuses[2].code;

    vm.payTransaction.payments[vm.payTransaction.payments.length] = paymentObj;
  }

  function submit() {
    if($scope.option.select === 'offline') {
      var payTranData = {};
      payTranData.paymentMode = $scope.option.select;
      payTranData.transactionId = vm.payTransaction._id;
      payTranData.totalAmount = vm.payTransaction.emd;
      if(vm.payTransaction.statuses && vm.payTransaction.statuses.length < 1)
        payTranData.statuses = [];
      else {
        payTranData.statuses = angular.copy(vm.payTransaction.statuses);
      }
      var stObj = {};
      stObj.userId = Auth.getCurrentUser()._id;
      stObj.status = transactionStatuses[1].code;
      stObj.createdAt = new Date();
      payTranData.statuses[payTranData.statuses.length] = stObj;
      userRegForAuctionSvc.saveOfflineRequest(payTranData).then(function(rd){
        if(vm.payTransaction.status === 'completed')
          Modal.alert("Please pay Rs " + vm.payTransaction.emd + " amount to increase your credit limit and inform our customer care team.");
        else
          Modal.alert(informationMessage.auctionPaymentSuccessMsg);
        $state.go("main");
      });
    } else {
      $state.go("auctionpayment", {
                tid: vm.payTransaction._id
              });
    }
  }

 	init();
}

})();
