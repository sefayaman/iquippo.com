(function() {
	'use strict';
angular.module('sreizaoApp').controller('BuyerProductBidRequestCtrl', BuyerProductBidRequestCtrl);
function BuyerProductBidRequestCtrl($scope, $state, Auth, Modal, PagerSvc, productSvc, AssetSaleSvc, $rootScope, $uibModal) {
	var vm = this;
	vm.bidListing = [];
	vm.activeBid = "auctionable";
	$scope.onTabChange = onTabChange;
	vm.withdrawBid = withdrawBid;
	vm.fireCommand = fireCommand;
	vm.openDialog = openDialog;
	vm.openBidModal = openBidModal;
	$scope.pager = PagerSvc.getPager();
	vm.validateAction = AssetSaleSvc.validateAction;
	vm.update = update;
	var initFilter = {};

	function init() {
		var filter = {};
		initFilter.pagination = true;
		initFilter.userId = encodeURIComponent(Auth.getCurrentUser()._id);
		angular.copy(initFilter, filter);
		filter.actionable = 'y';
		getBidData(filter);	
	}
	
	function openBidModal(bid) {
      	if (!Auth.getCurrentUser()._id) {
        	Modal.alert("Please Login/Register for submitting your request!", true);
        	return;
      	}
        filter = {};
        filter._id = bid.product.proData;
        filter.status = true;
        productSvc.getProductOnFilter(filter).then(function(result) {
          	if (result && result.length < 1) {
	            Modal.alert("Product not available!", true);
	            return;
          	}
          	$scope.currentProduct = result[0];
			var bidSummaryScope = $rootScope.$new();
	      	bidSummaryScope.params = {
		        bidAmount : 0,
		        product : $scope.currentProduct,
		        stateId : bid.stateId, 
		        bid : "placebid",
		        offerType : "Bid",
		        typeOfRequest : "changeBid"
	      	};

	      	Modal.openDialog('bidRequest',bidSummaryScope,'bidmodal');
	  	});
    }

    function openDialog(bidData, popupName, modalClass, formType){
		var newScope = $rootScope.$new();
		newScope.bidData = bidData;
		if(formType)
			newScope.formType = formType;
		Modal.openDialog(popupName,newScope, modalClass);
	}

    //Rating
	/*$scope.rate = 1;
	$scope.max = 5;
	$scope.isReadonly = false;

	$scope.hoveringOver = function(value) {
		$scope.overStar = value;
		$scope.percent = 100 * (value / $scope.max);
		console.log("$scope.percent", $scope.percent);
	};

	$scope.ratingStates = [
	{stateOn: 'glyphicon-star', stateOff: 'glyphicon-star-empty'}
		];*/
	
	function update(bid,action){

		AssetSaleSvc.setStatus(bid,dealStatuses[11],'dealStatus','dealStatuses');
		AssetSaleSvc.setStatus(bid,dealStatuses[12],'dealStatus','dealStatuses');
		AssetSaleSvc.update(bid,action)
		.then(function(res){
			fireCommand(true);
		})
		.catch(function(err){
			if(err)
				Modal.alert(err.data);
			fireCommand(true);
		});
	}

    function onTabChange(tab){
    	vm.activeBid = tab;
    	$scope.pager.reset();
	  	switch(tab){
	  		case 'auctionable':
	  		filter={};
			angular.copy(initFilter, filter);
			filter.actionable = 'y';
	  		getBidData(filter);
	  		break;
	  		case 'closed':
	  		filter={};
	  		angular.copy(initFilter, filter);
			filter.actionable = 'n';
	  		getBidData(filter);
	  		break;
	  	}
  	}

	function withdrawBid(bidId) {
      if (!Auth.getCurrentUser()._id) {
        Modal.alert("Please Login/Register for submitting your request!", true);
        return;
      }
      var data = {};
      data._id = bidId;
      Modal.confirm("Do you want to withdrawn bid?", function(ret) {
        if (ret == "yes") {
          AssetSaleSvc.withdrawBid(data)
          .then(function(res) {
            if(res && res.msg)
              Modal.alert(res.msg, true);
          	filter ={};
          	angular.copy(initFilter, filter);
          	filter.actionable = 'y';
          	getBidData(filter);
          })
          .catch(function(err) {
          });
        }
      });
    }

	function fireCommand(reset) {
		if(reset)
		  $scope.pager.reset();
		var filter = {};
		angular.copy(initFilter, filter);
		if (vm.searchStr)
			filter.searchStr = encodeURIComponent(vm.searchStr);
		
		getBidData(filter);
	}

	function getBidData(filter) {
		$scope.pager.copy(filter);
		AssetSaleSvc.fetchBid(filter)
			.then(function(res) {
				vm.bidListing = res.items;
				vm.totalItems = res.totalItems;
				$scope.pager.update(res.items, res.totalItems);
			})
			.catch(function(err) {

			});

	}

	//loading start
	Auth.isLoggedInAsync(function(loggedIn) {
		if(loggedIn)
			init();
		else
			$state.go('main');
	});
}
})();