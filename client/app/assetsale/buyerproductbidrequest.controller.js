(function() {
	'use strict';
	angular.module('sreizaoApp').controller('BuyerProductBidRequestCtrl', BuyerProductBidRequestCtrl);

	function BuyerProductBidRequestCtrl($scope, Auth, Modal, PagerSvc, AssetSaleSvc, $rootScope, $uibModal) {
		var vm = this;
		var filter = {};
		var dataToSend={};
		vm.bidListing = [];
		vm.activeBid = "Auctionable";
		$scope.subTabValue = 'auctionable'
		$scope.onTabChange = onTabChange;
		vm.withdrawBid = withdrawBid;
		vm.fireCommand = fireCommand;
		vm.invoicedetails = invoicedetails;
		vm.paymentType = paymentType;
		vm.kycDocument = kycDocument;
		$scope.pager = PagerSvc.getPager();

		function init() {
			Auth.isLoggedInAsync(function(loggedIn) {
				if (loggedIn) {
					filter = {};
					if (Auth.getCurrentUser().mobile && Auth.getCurrentUser().role != 'admin') {
						$scope.isAdmin = false;
						filter.userId = encodeURIComponent(Auth.getCurrentUser()._id);
					}
					getBidData(filter);
				}
			});
		}
		init();
		
		// payment type
	    function paymentType() {
	      var paymentTypeScope = $rootScope.$new();
	      var paymentTypeModal = $uibModal.open({
	        templateUrl: "/app/assetsale/selectpaymenttype.html",
	        scope: paymentTypeScope,
	        windowTopClass: 'bidmodal',
	        size: 'xs'
	      });

	      paymentTypeScope.close = function() {
	        paymentTypeModal.close();
	      };
	    }
	  // invoicedetails
	    function invoicedetails() {
	      var invoiceDetailsScope = $rootScope.$new();
	      var invoiceDetailsModal = $uibModal.open({
	        templateUrl: "/app/assetsale/invoicedetails.html",
	        scope: invoiceDetailsScope,
	        size: 'xs'
	      });

	      invoiceDetailsScope.close = function() {
	        invoiceDetailsModal.close();
	      };
	    }
	    // KYC document
	    function kycDocument() {
	      var kycDocumentScope = $rootScope.$new();
	      var kycDocumentModal = $uibModal.open({
	        templateUrl: "/app/assetsale/kycDocument.html",
	        scope: kycDocumentScope,
	        size: 'xs'
	      });

	      kycDocumentScope.close = function() {
	        kycDocumentModal.close();
	      };
	    }
	  function onTabChange(tabs){
	  	switch(tabs){
	  		case 'auctionable':
	  		filter={};
			  $scope.pager.reset();
	  		if (Auth.getCurrentUser().mobile && Auth.getCurrentUser().role != 'admin')
	  			filter.userId = encodeURIComponent(Auth.getCurrentUser()._id);
	  		vm.activeBid='Auctionable';
            $scope.subTabValue='auctionable';
	  		getBidData(filter);
	  		break;
	  		case 'closed':
	  		filter={};
			  $scope.pager.reset();
	  		vm.activeBid='closed';
	  		$scope.subTabValue='closed';
	  		if (Auth.getCurrentUser().mobile && Auth.getCurrentUser().role != 'admin')
	  			filter.userId = encodeURIComponent(Auth.getCurrentUser()._id);
	  		filter.assetStatus = encodeURIComponent('closed');
	  		getBidData(filter);
	  		break;
	  	}
	  }

	function withdrawBid(bid) {
		if (bid) {
			filter._id = bid;
			filter.offerStatus = offerStatuses[2];
			filter.dealStatus = dealStatuses[12];
			filter.bidStatus = bidStatuses[8];
		}
		AssetSaleSvc.withdrawBid(filter)
			.then(function(res) {
				getBidData(filter);
			})
			.catch(function(err) {

			});

	}

	function fireCommand(reset, filterObj) {
		if (reset)
			$scope.pager.reset();
		var filter = {};
		if (!filterObj)
			angular.copy(dataToSend, filter);
		else
			filter = filterObj;
		if (vm.searchStr) {
			filter.isSearch = true;
			filter.searchStr = encodeURIComponent(vm.searchStr);
		}
		/*if(vm.statusType){
		  filter.isSearch = true;
		  filter['statusType'] = encodeURIComponent(vm.statusType);
		}
		if(vm.fromDate){
		  filter.isSearch = true;
		  filter['fromDate'] = encodeURIComponent(vm.fromDate);
		}
		if(vm.toDate){
		  filter.isSearch = true;
		  filter['toDate'] = encodeURIComponent(vm.toDate);
		}*/

		getBidData(filter);
	}

	function getBidData(filter) {
		$scope.pager.copy(filter);
		filter.pagination = true;
		filter.userId = encodeURIComponent(Auth.getCurrentUser()._id);
		AssetSaleSvc.fetchBid(filter)
			.then(function(res) {
				console.log("res", res);
				vm.bidListing = res.items;
				vm.totalItems = res.totalItems;
				$scope.pager.update(res.items, res.totalItems);
			})
			.catch(function(err) {

			});

	}
}
})();