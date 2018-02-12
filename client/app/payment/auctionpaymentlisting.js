(function(){

'use strict';
angular.module('sreizaoApp').controller('AuctionPaymentListingCtrl',AuctionPaymentListingCtrl);

function AuctionPaymentListingCtrl($scope, $state, $rootScope, $uibModal, Modal, Auth, PaymentSvc, PagerSvc, userRegForAuctionSvc, AuctionMasterSvc, EmdSvc) {
	var vm = this;
	vm.transactions = [];
	var filter = {};
  var initFilter = {};
  vm.searchStr = "";
  $scope.OverAll = "overall";
  $scope.LotWist = "lotwise";
  $scope.pager = PagerSvc.getPager();
  $scope.transactionStatuses = transactionStatuses;

	vm.exportExcel = exportExcel;
	vm.openPaymentModel = openPaymentModel;
	var selectedIds = [];
	$scope.ReqSubmitStatuses = ReqSubmitStatuses;
	vm.resendUserData = resendUserData;
  vm.fireCommand = fireCommand;
  vm.openPaymentOptionModal = openPaymentOptionModal;
  vm.generateKit = generateKit;

  function generateKit(auctionId,transactionId,userId){
    if(!auctionId || !transactionId || !userId)
      return;
    var filter = {
      auctionId:auctionId,
      transactionId:transactionId,
      userId:userId
    };
    userRegForAuctionSvc.generateKit(filter)
    .then(function(res){
      Modal.alert("Kit generated successfully!");
      fireCommand(true);
    })
    .catch(function(err){
      if(err.data)
        Modal.alert(err.data);
      console.log("Error in kit generation",err);
    })
  }

	$scope.$on('refreshPaymentHistroyList',function(){
    fireCommand(true);
  });

	function openPaymentModel(paymentData, openDialog){
		Auth.isLoggedInAsync(function(loggedIn) {
		    if (loggedIn) {
          var OfflinePaymentScope = $rootScope.$new();
          OfflinePaymentScope.offlinePayment = paymentData;
          OfflinePaymentScope.viewMode = openDialog;
          Modal.openDialog('OfflinePaymentPopup',OfflinePaymentScope);
		    }
		});
	}

	function init(){
	 	Auth.isLoggedInAsync(function(loggedIn){
	 		if(loggedIn){
        filter ={};
        initFilter.pagination = true;
        if(!Auth.isAdmin() && !Auth.isAuctionRegPermission()){
          initFilter['userId'] = Auth.getCurrentUser()._id;
        }
        angular.copy(initFilter, filter);
	 			getTrasactions(filter);	
	 		}
	 	})
	 }

	init();

  function openPaymentOptionModal(paymentData){
    var payScope = $rootScope.$new();
    payScope.auctionRegPayment = paymentData;
    payScope.option = {};
    payScope.option.select = paymentData.paymentMode;
    if(angular.isUndefined(payScope.auctionRegPayment.emd)) {
      if(payScope.auctionRegPayment.emdTax === $scope.OverAll) {
        var serData = {};
        serData._id = paymentData.auction_id;
        AuctionMasterSvc.get(serData)
        .then(function(result) {
          if(!result)
            return;
          payScope.auctionRegPayment.emd = result[0].emdAmount;
          PaymentSvc.update(payScope.auctionRegPayment);
        });
      } else {
        var serData = {};
        serData.auction_id = paymentData.auction_id;
        serData.selectedLots = paymentData.selectedLots;
        EmdSvc.getAmount(serData).then(function(result){
          if(!result)
            return;
          payScope.auctionRegPayment.emd = result.emdAmount;
          PaymentSvc.update(payScope.auctionRegPayment);
        }).catch(function(err){
        });
      }
    }

    var paymentModal = $uibModal.open({
      animation: true,
        templateUrl: "paymentOption.html",
        scope: payScope,
        size: 'lg'
    });

    payScope.submit = function () {
      if(!payScope.option.select) {
        Modal.alert("Please select your preferred payment method", true);
        return;
      }
      if(!payScope.kycExist) {
        payScope.kycExist = false;
        if(!Auth.getCurrentUser().kycInfo || Auth.getCurrentUser().kycInfo.length < 1){
          payScope.kycExist = true;
          return;
        }
      }
      if(payScope.kycExist && !payScope.option.kycUploadlater)
        return;

      if(payScope.option.select === 'offline') {
        var payTranData = {};
        payTranData.paymentMode = payScope.option.select;
        payTranData.transactionId = payScope.auctionRegPayment._id;
        payTranData.totalAmount = payScope.auctionRegPayment.emd;
        //payTranData.status = transactionStatuses[1].code;
        if(payScope.option.kycUploadlater)
          payTranData.kycUploadlater = "Yes";

        if(payScope.auctionRegPayment.statuses.length < 1)
          payTranData.statuses = [];
        else {
          payTranData.statuses = angular.copy(payScope.auctionRegPayment.statuses);
        }
        var stObj = {};
        stObj.userId = Auth.getCurrentUser()._id;
        stObj.status = transactionStatuses[1].code;
        stObj.createdAt = new Date();
        payTranData.statuses[payTranData.statuses.length] = stObj;
        userRegForAuctionSvc.saveOfflineRequest(payTranData).then(function(rd){
          if(payScope.auctionRegPayment.status === 'completed')
            Modal.alert("Please pay Rs " + payScope.auctionRegPayment.emd + " amount to increase your credit limit and inform our customer care team.");
          else
            Modal.alert(informationMessage.auctionPaymentSuccessMsg);
          
          paymentModal.dismiss('cancel');
          $rootScope.$broadcast('refreshPaymentHistroyList');
        });
      } else {
        $state.go("auctionpayment", {
          tid: payScope.auctionRegPayment._id
        });
        paymentModal.dismiss('cancel');
      }
    };

    payScope.close = function () {
      paymentModal.dismiss('cancel');
    };
  }

  function fireCommand(reset){
    if (reset)
        $scope.pager.reset();
    filter = {};
    angular.copy(initFilter, filter);
    if (vm.searchStr)
        filter.searchStr = vm.searchStr;
    getTrasactions(filter);
  }

  function getTrasactions(filterObj){
    $scope.pager.copy(filterObj);
		filterObj.auctionPaymentReq = "Auction Request";
	 	PaymentSvc.getOnFilter(filterObj)
	 	.then(function(result){
	 		vm.transactions = result.items;
      vm.totalItems = result.totalItems;
      $scope.pager.update(result.items, result.totalItems);
	 	})
	 	.catch(function(err){
	 	});
	}
function exportExcel(data){
    var dataToSend ={};
    dataToSend['exportType'] = data; 
    if(!Auth.isAdmin() && !Auth.isAuctionRegPermission()){
      dataToSend['userId'] = Auth.getCurrentUser()._id;
    }
    dataToSend.auctionPaymentHistory = true;
    dataToSend.auctionPaymentReq = "Auction Request";
    
    if (data === 'all') {
      var exportObj = {filter:dataToSend};
      exportObj.method = "POST";
      exportObj.action = "api/payment/export";
      $scope.$broadcast("submit",exportObj);
        return;
    }
    
    PaymentSvc.export(dataToSend)
    .then(function(buffData){
      saveAs(new Blob([s2ab(buffData)],{type:"application/octet-stream"}), "Payment_"+ new Date().getTime() +".xlsx")
    });
  }

  function resendUserData(data) {
    $rootScope.loading = true;
    PaymentSvc.sendReqToCreateUser(data)
      .then(function(res) {
          if (res.errorCode == 0) {
            fireCommand(true);
          }
          Modal.alert(res.message);
          $rootScope.loading = false;
      })
      .catch(function(err){
        if(err)
          Modal.alert(err.data);
        $rootScope.loading = false;
      });
  }
}

})();
