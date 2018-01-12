(function(){

'use strict';
angular.module('sreizaoApp').controller('AuctionPaymentListingCtrl',AuctionPaymentListingCtrl);

function AuctionPaymentListingCtrl($scope, $rootScope, Modal, Auth, PaymentSvc, PagerSvc) {
	var vm = this;
	vm.transactions = [];
	var filter = {};
  var initFilter = {};
  vm.searchStr = "";
  $scope.pager = PagerSvc.getPager();
  $scope.transactionStatuses = transactionStatuses;

	vm.exportExcel = exportExcel;
	vm.openPaymentModel = openPaymentModel;
	var selectedIds = [];
	$scope.ReqSubmitStatuses = ReqSubmitStatuses;
	vm.resendUserData = resendUserData;
  vm.fireCommand = fireCommand;

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
        angular.copy(initFilter, filter);
	 			getTrasactions(filter);	
	 		}
	 	})
	 }

	 init();

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

	function exportExcel(){
    var dataToSend ={};
    dataToSend.auctionPaymentHistory = true;
    dataToSend.auctionPaymentReq = "Auction Request";
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
