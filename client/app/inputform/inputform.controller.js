(function() {
'use strict';
angular.module('sreizaoApp').controller('InputFormCtrl', InputFormCtrl);
angular.module('sreizaoApp').controller('InputFormListingCtrl', InputFormListingCtrl);


function InputFormCtrl($scope, $rootScope, Modal, Auth, categorySvc, modelSvc, brandSvc, InputFormSvc, $uibModalInstance, notificationSvc, UtilSvc, InputFormMasterSvc) {
	var vm = this;
	vm.inputFormReqInfo = {};
	vm.inputFormReqInfo.user = {};
	vm.inputFormReqInfo.bannerInfo = {};
	vm.inputFormReqInfo.paymentInfo = {};
	vm.closeDialog = closeDialog;
	vm.submit = submit;
	vm.onCategoryChange = onCategoryChange;
    vm.onBrandChange = onBrandChange;
    vm.getInputFormData = getInputFormData;
    vm.getInstallmentPerUnit =getInstallmentPerUnit;

	function init() {
		Auth.isLoggedInAsync(function(loggedIn) {
			if (loggedIn) {
				vm.inputFormReqInfo.user.userData = Auth.getCurrentUser()._id;
				vm.inputFormReqInfo.user.fname = Auth.getCurrentUser().fname;
				vm.inputFormReqInfo.user.lname = Auth.getCurrentUser().lname;
				vm.inputFormReqInfo.user.mobile = Auth.getCurrentUser().mobile;
				vm.inputFormReqInfo.user.country = Auth.getCurrentUser().country;
				vm.inputFormReqInfo.user.email = Auth.getCurrentUser().email;
			}
		});

		vm.inputFormReqInfo.bannerInfo._id = $scope.slideInfo._id;
		vm.inputFormReqInfo.bannerInfo.name = $scope.slideInfo.name;
		vm.inputFormReqInfo.bannerInfo.code = $scope.slideInfo.code;
		//vm.inputFormReqInfo.bannerInfo.ticker = $scope.slideInfo.ticker;
		loadAllCategory();
	}
	init();

	function loadAllCategory() {
        categorySvc.getAllCategory()
        .then(function(result) {
            vm.allCategory = result;
        });
    }

    function getInputFormData() {
    	var filter = {};
    	if(!vm.inputFormReqInfo.category || !vm.inputFormReqInfo.brand || !vm.inputFormReqInfo.model)
    		return;
    	filter.category = vm.inputFormReqInfo.category;
    	filter.brand = vm.inputFormReqInfo.brand;
    	filter.model = vm.inputFormReqInfo.model;
    	InputFormMasterSvc.get(filter)
        .then(function(result){
        	if(result.additionalInfo)
            	vm.masterData = result.additionalInfo;
        });
    }

    function getInstallmentPerUnit(val) {
		for(var i=0; i < vm.masterData.additionalInfo.length; i++){
			if(vm.masterData.additionalInfo[i].tenure == val){
			  vm.inputFormReqInfo.installmentPerUnit = vm.masterData.additionalInfo[i].tenure;
			  break;
			}
		}
		vm.inputFormReqInfo.totalInstallment = val * vm.inputFormReqInfo.installmentPerUnit;
    }

    function onCategoryChange(catName, reset) {
        vm.brandList = [];
        vm.modelList = [];
        if (reset) {
            vm.brand = "";
            vm.model = "";
        }

        if (!catName)
            return;
        brandSvc.getBrandOnFilter({
            categoryName: catName
        })
        .then(function(result) {
            vm.brandList = result;
        });

    }

    function onBrandChange(brandName, reset) {
        vm.modelList = [];
        if (reset) {
            vm.model = "";
        }
        if (!brandName)
            return;
        modelSvc.getModelOnFilter({
            brandName: brandName
        })
        .then(function(result) {
            vm.modelList = result;
        });
    }

	function submit(form) {
		if (form.$invalid) {
			$scope.submitted = true;
			return;
		}
		$scope.submitted = false;
		InputFormSvc.save(vm.inputFormReqInfo)
			.then(function(res) {
				if (res.errorCode == 0) {
					var data = {};
					var dataToSend = {};
					console.log("######", res);
					//dataToSend['promoname'] = vm.inputFormReqInfo.bannerInfo.name;
					// if (vm.inputFormReqInfo.user.email)
					// 	data['to'] = vm.inputFormReqInfo.user.email;
					// data['subject'] = 'No Reply: Bid Request';
					// dataToSend['serverPath'] = serverPath;
					// notificationSvc.sendNotification('biddingEmailToCustomer', data, dataToSend, 'email');
					// if (vm.inputFormReqInfo.user.mobile)
					// 	data['to'] = vm.inputFormReqInfo.user.mobile;
					// data['countryCode'] = LocationSvc.getCountryCode(vm.inputFormReqInfo.user.country);
					// if (data.countryCode == "")
					// 	data.countryCode = vm.inputFormReqInfo.user.countryCode;
					// notificationSvc.sendNotification('biddingSMSToCustomer', data, dataToSend, 'sms');
					Modal.alert("Your request has been successfully received. We will contact you soon.");
					vm.inputFormReqInfo = {};
					closeDialog();
				} else
					Modal.alert(res.message);
			});
	}

	function closeDialog() {
		$uibModalInstance.dismiss('cancel');
		$rootScope.$broadcast('resetBannerTimer');
	};
}

function InputFormListingCtrl($scope, $rootScope, Modal, Auth, PagerSvc, InputFormSvc, DTOptionsBuilder) {
	var vm = this;

	//pagination variables
	/*var prevPage = 0;
	vm.itemsPerPage = 50;
	vm.currentPage = 1;
	vm.totalItems = 0;
	vm.maxSize = 6;
	var first_id = null;
	var last_id = null;*/

	vm.fireCommand = fireCommand;
	vm.InputFormListing = [];
	//vm.inputFormReqInfo = {};
	//vm.payNow = payNow;
	//var dataToSend = {};
	$scope.pager = PagerSvc.getPager();
	var initFilter = {};
    var filter = {};
    vm.searchStr = "";
	// $scope.$on('updateBidList', function() {
	// 	fireCommand(true);
	// })

	function init() {
		Auth.isLoggedInAsync(function(loggedIn) {
			if (loggedIn) {
				filter = {};
		        initFilter.pagination = true;
		        angular.copy(initFilter, filter);
				if (!Auth.isAdmin())
					initFilter.mobile = Auth.getCurrentUser()._id;

				// dataToSend.pagination = true;
				// dataToSend.itemsPerPage = vm.itemsPerPage;
				getInputFormReq(initFilter);
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
        getInputFormReq(filter);
    }

	/*function payNow(index) {
		angular.copy(vm.bidListing[index], vm.inputFormReqInfo)
		var biddingScope = $rootScope.$new();
		biddingScope.inputFormReqInfo = vm.inputFormReqInfo;
		biddingScope.isPayNow = true;
		if (vm.inputFormReqInfo.bannerInfo._id)
			var currentSlide = BannerSvc.getBannerOnId(vm.inputFormReqInfo.bannerInfo._id);
		if (currentSlide)
			biddingScope.slideInfo = currentSlide;
		Modal.openDialog('biddingReq', biddingScope);
	}*/

	function getInputFormReq(filter) {
		$scope.pager.copy(filter);
        InputFormSvc.get(filter)
        .then(function(result){
            vm.filteredList = result.items;
            vm.totalItems = result.totalItems;
            $scope.pager.update(result.items, result.totalItems);
        });
        
		// filter.prevPage = prevPage;
		// filter.currentPage = vm.currentPage;
		// filter.first_id = first_id;
		// filter.last_id = last_id;
		// InputFormSvc.get(filter)
		// 	.then(function(result) {
		// 		vm.bidListing = result.items;
		// 		vm.totalItems = result.totalItems;
		// 		prevPage = vm.currentPage;
		// 		if (vm.bidListing.length > 0) {
		// 			first_id = vm.bidListing[0]._id;
		// 			last_id = vm.bidListing[vm.bidListing.length - 1]._id;
		// 		}
		// 	});
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