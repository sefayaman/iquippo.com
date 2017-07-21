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
		vm.ratingFeedback = ratingFeedback;
		$scope.pager = PagerSvc.getPager();
		var initFilter = {};

		function init() {
			Auth.isLoggedInAsync(function(loggedIn) {
				if (loggedIn) {
					filter = {};
					initFilter.pagination = true;
            		angular.copy(initFilter, filter);
					if (Auth.getCurrentUser().mobile && Auth.getCurrentUser().role != 'admin') {
						$scope.isAdmin = false;
						filter.userId = encodeURIComponent(Auth.getCurrentUser()._id);
					}
					filter.offerStatus = offerStatuses[0];
					getBidData(filter);
				}
			});
		}
		init();
		
		// payment type
	    function paymentType() {
	        var paymentTypeScope = $rootScope.$new();
	        paymentTypeScope.bidData = bidData;
            Modal.openDialog('selectPaymentType', paymentTypeScope);
	    }
	  // invoicedetails
	    function invoicedetails(bidData) {
	      	var invoicedetailScope = $rootScope.$new();
            invoicedetailScope.bidData = bidData;
            Modal.openDialog('invoiceDetails', invoicedetailScope);
	    }

	    // KYC document
	    function kycDocument(bidData) {
	      	var kycDocumentScope = $rootScope.$new();
	      	kycDocumentScope.bidData = bidData;
            Modal.openDialog('kycDocument', kycDocumentScope);
	    }
	    // Rating and Feedback
	    function ratingFeedback(bidData) {
		    var ratingFeedbackScope = $rootScope.$new();
		    ratingFeedbackScope.bidData = bidData;
            Modal.openDialog('feedbackForm', ratingFeedbackScope);
	    }

	    // Rating
		$scope.rate = 1;
		$scope.max = 5;
		$scope.isReadonly = false;

		$scope.hoveringOver = function(value) {
		$scope.overStar = value;
		$scope.percent = 100 * (value / $scope.max);
			};

		$scope.ratingStates = [
		{stateOn: 'glyphicon-star', stateOff: 'glyphicon-star-empty'}
			];
		console.log($scope.percent);
		
	  function onTabChange(tabs){
	  	switch(tabs){
	  		case 'auctionable':
	  		$scope.pager.reset();
	  		filter={};
			angular.copy(initFilter, filter);
	  		if (Auth.getCurrentUser().mobile && Auth.getCurrentUser().role != 'admin')
	  			filter.userId = encodeURIComponent(Auth.getCurrentUser()._id);
	  		filter.offerStatus = offerStatuses[0];
	  		vm.activeBid='Auctionable';
            $scope.subTabValue='auctionable';
	  		getBidData(filter);
	  		break;
	  		case 'closed':
	  		$scope.pager.reset();
	  		filter={};
	  		angular.copy(initFilter, filter);
			vm.activeBid='closed';
	  		$scope.subTabValue='closed';
	  		if (Auth.getCurrentUser().mobile && Auth.getCurrentUser().role != 'admin')
	  			filter.userId = encodeURIComponent(Auth.getCurrentUser()._id);
	  		filter.offerStatus = offerStatuses[2];
	  		//filter.assetStatus = encodeURIComponent('closed');
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

		getBidData(filter);
	}

	function getBidData(filter) {
		$scope.pager.copy(filter);
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