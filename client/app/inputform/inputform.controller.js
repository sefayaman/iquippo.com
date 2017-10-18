(function() {
'use strict';
angular.module('sreizaoApp').controller('InputFormCtrl', InputFormCtrl);
angular.module('sreizaoApp').controller('InputFormListingCtrl', InputFormListingCtrl);


function InputFormCtrl($scope, $rootScope, Modal, Auth, categorySvc, LocationSvc, modelSvc, brandSvc, InputFormSvc, $uibModalInstance, notificationSvc, UtilSvc, InputFormMasterSvc) {
	var vm = this;
	vm.inputFormReqInfo = {};
	vm.inputFormReqInfo.user = {};
	vm.inputFormReqInfo.bannerInfo = {};
	vm.inputFormReqInfo.paymentInfo = {};
	vm.inputFormMasterData = [];
	vm.closeDialog = closeDialog;
	vm.submit = submit;
	vm.onCategoryChange = onCategoryChange;
    vm.onBrandChange = onBrandChange;
    vm.onModelChange = onModelChange;
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

    function onModelChange() {
    	var filter = {};
		resetValue();
    	if(!vm.inputFormReqInfo.category || !vm.inputFormReqInfo.brand || !vm.inputFormReqInfo.model)
    		return;

    	filter.category = vm.inputFormReqInfo.category;
    	filter.brand = vm.inputFormReqInfo.brand;
    	filter.model = vm.inputFormReqInfo.model;
    	InputFormMasterSvc.get(filter)
        .then(function(result){
			result.forEach(function(item){
				if(item.additionalInfo)
					vm.inputFormMasterData = item.additionalInfo;
			});
        });
    }
    
    function resetValue() {
		vm.inputFormMasterData = [];
		vm.inputFormReqInfo.tenure = "";
		vm.inputFormReqInfo.installmentPerUnit = "";
		vm.inputFormReqInfo.totalInstallment = "";
    }

    function getInstallmentPerUnit(val) {
		vm.inputFormReqInfo.installmentPerUnit = "";
		vm.inputFormReqInfo.totalInstallment = "";
		for(var i=0; i < vm.inputFormMasterData.length; i++){
			if(vm.inputFormMasterData[i].tenure == val){
			  vm.inputFormReqInfo.installmentPerUnit = vm.inputFormMasterData[i].installment;
			  break;
			}
		}
		vm.inputFormReqInfo.totalInstallment = val * vm.inputFormReqInfo.installmentPerUnit;
    }

    function onCategoryChange(catName, reset) {
        vm.brandList = [];
        vm.modelList = [];
        resetValue();
        if (reset) {
            vm.inputFormReqInfo.brand = "";
            vm.inputFormReqInfo.model = "";
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
        resetValue();
        if (reset) {
            vm.inputFormReqInfo.model = "";
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
					angular.copy(res.data, dataToSend);
					dataToSend.promoname = vm.inputFormReqInfo.bannerInfo.name;
					dataToSend.referenceNo = res.data.referenceNo;
					if (dataToSend.user.email)
						data.to = dataToSend.user.email;
					data.subject = 'No Reply: Input Form Request';
					dataToSend.serverPath = serverPath;
					notificationSvc.sendNotification('inputformReqEmailToCustomer', data, dataToSend, 'email');
					if (dataToSend.user.mobile)
						data['to'] = dataToSend.user.mobile;
					data.countryCode = LocationSvc.getCountryCode(dataToSend.user.country);
					if (data.countryCode == "")
						data.countryCode = dataToSend.user.countryCode;
					notificationSvc.sendNotification('inputformReqSMSToCustomer', data, dataToSend, 'sms');
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
	vm.fireCommand = fireCommand;
	vm.InputFormListing = [];
	$scope.pager = PagerSvc.getPager();
	var initFilter = {};
    var filter = {};
    vm.searchStr = "";

	function init() {
		Auth.isLoggedInAsync(function(loggedIn) {
			if (loggedIn) {
				filter = {};
		        initFilter.pagination = true;
		        angular.copy(initFilter, filter);
				if (!Auth.isAdmin())
					filter.userId = Auth.getCurrentUser()._id;

				// dataToSend.pagination = true;
				// dataToSend.itemsPerPage = vm.itemsPerPage;
				getInputFormReq(filter);
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

	function getInputFormReq(filter) {
		$scope.pager.copy(filter);
        InputFormSvc.get(filter)
        .then(function(result){
            vm.filteredList = result.items;
            vm.totalItems = result.totalItems;
            $scope.pager.update(result.items, result.totalItems);
        });
	}
}

})();