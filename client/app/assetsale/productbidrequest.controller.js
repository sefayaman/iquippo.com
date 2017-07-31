(function() {
	'use strict';
	angular.module('sreizaoApp').controller('ProductBidRequestCtrl', ProductBidRequestCtrl);
function ProductBidRequestCtrl($scope, $rootScope, $window, $uibModal, $stateParams,$state, Modal, Auth, AssetSaleSvc,PagerSvc,uploadSvc) {
	var vm = this;
	$scope.pager = PagerSvc.getPager();

	$scope.assetId = $stateParams.assetId;
	$scope.bidStatuses = bidStatuses;

	var initFilter = {actionable : 'y'};
	vm.bidListing = [];

	vm.fireCommand = fireCommand;
	vm.openDialog = openDialog;
	
	vm.update = update;

	vm.validateAction = AssetSaleSvc.validateAction;
	vm.doUpload = doUpload;
	vm.backButton = backButton;

	function backButton() {
      $window.history.back();
    }
	function init() {
		initFilter.productId = $stateParams.productId;
		if(Auth.isFAgencyPartner())
			initFilter.bidStatus = bidStatuses[7];
		getBidData(angular.copy(initFilter));
	}

	function fireCommand(reset) {
		if(reset)
		  $scope.pager.reset();
		var filter = {};
		angular.copy(initFilter,filter);
		if (vm.searchStr) {
			filter.isSearch = true;
			filter.searchStr = encodeURIComponent(vm.searchStr);
		}
		getBidData(filter);
	}

	function update(bid,action,cb){
		
		Modal.confirm("Do you want to change bid status?.",function(retVal){
			if(retVal === 'yes')
				updateBid(bid,action,cb);				
		});
	}

	function updateBid(bid,action,cb){
		
		switch(action){
			case 'approve':
				AssetSaleSvc.setStatus(bid,bidStatuses[7],'bidStatus','bidStatuses');
			break;
			case 'reject':
				AssetSaleSvc.setStatus(bid,bidStatuses[6],'bidStatus','bidStatuses');
				AssetSaleSvc.setStatus(bid,dealStatuses[1],'dealStatus','dealStatuses');
			break;
			case 'emdpayment':
				if(typeof bid.emdPayment.remainingPayment === 'undefined' || bid.emdPayment.remainingPayment > 0){
					Modal.alert("EMD has not been fully paid.");
					return;
				}
				AssetSaleSvc.setStatus(bid,dealStatuses[7],'dealStatus','dealStatuses');
			break;
			case 'fullpayment':
				if( typeof bid.fullPayment.remainingPayment === 'undefined' || bid.fullPayment.remainingPayment > 0){
					Modal.alert("Full payment has not been fully paid.");
					return;
				}
				AssetSaleSvc.setStatus(bid,dealStatuses[8],'dealStatus','dealStatuses');
			break;
			case 'doissued':
				AssetSaleSvc.setStatus(bid,dealStatuses[9],'dealStatus','dealStatuses');
			break;
			case 'deliverd':
				AssetSaleSvc.setStatus(bid,dealStatuses[10],'dealStatus','dealStatuses');
			break;
			case 'deliveryaccept':
				AssetSaleSvc.setStatus(bid,dealStatuses[11],'dealStatus','dealStatuses');
				AssetSaleSvc.setStatus(bid,dealStatuses[12],'dealStatus','dealStatuses');
			break;
			default:
				return;
			break
		}
		AssetSaleSvc.update(bid,action)
		.then(function(res){
			fireCommand(true);
			if(cb)
				cb();
		})
		.catch(function(err){
			if(err)
				Modal.alert(err.data);
			fireCommand(true);
		});
	}

	function getBidData(filter) {
		
		$scope.pager.copy(filter);
		filter.pagination = true;
		AssetSaleSvc.get(filter)
			.then(function(res) {
				vm.bidListing = res.items;
				$scope.pager.update(res.items,res.totalItems);
			})
			.catch(function(err) {
				
			});
	}

	function openDialog(bidData, popupName, modalClass, formType){
		var newScope = $rootScope.$new();
		newScope.bidData = bidData;
		if(formType)
			newScope.formType = formType;
		Modal.openDialog(popupName,newScope,modalClass);
	}

	// do upload
	function doUpload(bid){

		var scope = $rootScope.$new();
		scope.bidDt = {};
		var doupload = $uibModal.open({
		  animation: true,
		    templateUrl: "doupload.html",
		    scope: scope,
		    size: 'lg'
		});

		scope.close = function () {
		  doupload.dismiss('cancel');
		};

		scope.uploadDoc = function(files,_this){
			if(!files || !files.length)
				return;
			uploadSvc.upload(files[0],bid.product.assetDir)
			.then(function(res){
				scope.bidDt.deliveryOrder = res.data.filename;
	     	})
		}

		scope.submitDOIssued = function(form){

			if(form.$invalid || !scope.bidDt.deliveryOrder){
				scope.submitted = true;
				return;
			}
			bid.deliveryOrder = scope.bidDt.deliveryOrder;
			bid.dateOfDelivery = scope.bidDt.dateOfDelivery;
			update(bid,'doissued',scope.close);
		}
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