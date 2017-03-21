(function() {
	'use strict';
	angular.module('sreizaoApp').controller('BidCtrl', BidCtrl);
	angular.module('sreizaoApp').controller('BidListingCtrl', BidListingCtrl);

	function BidCtrl($scope, $rootScope, Modal, Auth, BiddingSvc, $uibModalInstance,LocationSvc, notificationSvc) {
		var vm = this;
		vm.biddingInfo = {};
		vm.biddingInfo.user = {};
		vm.biddingInfo.bannerInfo = {};
		vm.biddingInfo.paymentInfo = {};
		vm.biddingInfo.paymentmode = "Offline";
		vm.closeDialog = closeDialog;
		vm.submit = submit;

		function init() {
			if (!$scope.isPayNow) {
				Auth.isLoggedInAsync(function(loggedIn) {
					if (loggedIn) {
						vm.biddingInfo.user._id = Auth.getCurrentUser()._id;
						vm.biddingInfo.user.fname = Auth.getCurrentUser().fname;
						vm.biddingInfo.user.mname = Auth.getCurrentUser().mname;
						vm.biddingInfo.user.lname = Auth.getCurrentUser().lname;
						vm.biddingInfo.user.mobile = Auth.getCurrentUser().mobile;
						vm.biddingInfo.user.country = Auth.getCurrentUser().country;
						vm.biddingInfo.user.email = Auth.getCurrentUser().email;
					} else {
						vm.biddingInfo.user = {};
					}
				})

				vm.biddingInfo.bannerInfo._id = $scope.slideInfo._id;
				vm.biddingInfo.bannerInfo.name = $scope.slideInfo.name;
				vm.biddingInfo.bannerInfo.code = $scope.slideInfo.code;
				//vm.biddingInfo.bannerInfo.ticker = $scope.slideInfo.ticker;
			} else {
				vm.biddingInfo = $scope.biddingInfo;
			}
		}
		init();

		function submit(form) {
			if (form.$invalid) {
				$scope.submitted = true;
				return;
			}
			$scope.submitted = false;
			if (!$scope.isPayNow) {
				BiddingSvc.save(vm.biddingInfo)
					.then(function(res) {
						if (res.errorCode == 0) {
							var data = {};
							var dataToSend = {};
							dataToSend['promoname'] = vm.biddingInfo.bannerInfo.name;
							if (vm.biddingInfo.user.email)
								data['to'] = vm.biddingInfo.user.email;
							data['subject'] = 'No Reply: Bid Request';
							dataToSend['serverPath'] = serverPath;
							notificationSvc.sendNotification('biddingEmailToCustomer', data, dataToSend, 'email');
							if (vm.biddingInfo.user.mobile)
								data['to'] = vm.biddingInfo.user.mobile;
							data['countryCode']=LocationSvc.getCountryCode(vm.biddingInfo.user.country);
							notificationSvc.sendNotification('biddingSMSToCustomer', data, dataToSend, 'sms');
							vm.biddingInfo = {};
							closeDialog();
						} else
							Modal.alert(res.message);
					})
			} else {
				vm.biddingInfo.status = "Completed";
				BiddingSvc.update(vm.biddingInfo)
					.then(function(res) {
						if (res.errorCode == 0) {
							vm.biddingInfo = {};
							closeDialog();
							$rootScope.$broadcast('updateBidList');
						} else
							Modal.alert(res.message);
					})
			}
		}

		function closeDialog() {
			$uibModalInstance.dismiss('cancel');
			$rootScope.$broadcast('resetBannerTimer');
		};
	}

	function BidListingCtrl($scope, $rootScope, Modal, Auth, BiddingSvc, DTOptionsBuilder, BannerSvc) {
		var vm = this;

		//pagination variables
		var prevPage = 0;
		vm.itemsPerPage = 50;
		vm.currentPage = 1;
		vm.totalItems = 0;
		vm.maxSize = 6;
		var first_id = null;
		var last_id = null;

		vm.fireCommand = fireCommand;
		vm.bidListing = [];
		vm.biddingInfo = {};
		vm.payNow = payNow;
		var dataToSend = {};

		$scope.$on('updateBidList', function() {
			fireCommand(true);
		})

		function init() {
			Auth.isLoggedInAsync(function(loggedIn) {
				if (loggedIn) {
					if (!Auth.isAdmin())
						dataToSend["mobile"] = Auth.getCurrentUser().mobile;

					dataToSend.pagination = true;
					dataToSend.itemsPerPage = vm.itemsPerPage;
					getBids(dataToSend);
				}
			})

		}

		init();

		function fireCommand(reset, filterObj) {
			if (reset)
				resetPagination();
			var filter = {};
			if (!filterObj)
				angular.copy(dataToSend, filter);
			else
				filter = filterObj;
			if (vm.searchStr)
				filter['searchstr'] = vm.searchStr;

			getBids(filter);
		}

		function payNow(index) {
			angular.copy(vm.bidListing[index], vm.biddingInfo)
			var biddingScope = $rootScope.$new();
			biddingScope.biddingInfo = vm.biddingInfo;
			biddingScope.isPayNow = true;
			if (vm.biddingInfo.bannerInfo._id)
				var currentSlide = BannerSvc.getBannerOnId(vm.biddingInfo.bannerInfo._id);
			if (currentSlide)
				biddingScope.slideInfo = currentSlide;
			Modal.openDialog('biddingReq', biddingScope);
		}


		function getBids(filter) {
			filter.prevPage = prevPage;
			filter.currentPage = vm.currentPage;
			filter.first_id = first_id;
			filter.last_id = last_id;
			BiddingSvc.getOnFilter(filter)
				.then(function(result) {
					vm.bidListing = result.items;
					vm.totalItems = result.totalItems;
					prevPage = vm.currentPage;
					if (vm.bidListing.length > 0) {
						first_id = vm.bidListing[0]._id;
						last_id = vm.bidListing[vm.bidListing.length - 1]._id;
					}
				});
		}

		function resetPagination() {
			prevPage = 0;
			vm.currentPage = 1;
			vm.totalItems = 0;
			first_id = null;
			last_id = null;
		}
	}

})();