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
	vm.container = {};
	vm.closeDialog = closeDialog;
	vm.submit = submit;
	vm.onCategoryChange = onCategoryChange;
    vm.onBrandChange = onBrandChange;
    vm.onModelChange = onModelChange;
    vm.getInstallmentPerUnit =getInstallmentPerUnit;
    vm.onStateChange = onStateChange;

	function init() {
		resetValue();
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
		vm.inputFormReqInfo.bannerInfo.bannerData = $scope.slideInfo._id;
		vm.inputFormReqInfo.bannerInfo.name = $scope.slideInfo.name;
		vm.inputFormReqInfo.bannerInfo.code = $scope.slideInfo.code;
		loadAllCategory();
	}
	init();

	function loadAllCategory() {
        InputFormMasterSvc.search({})
        .then(function(result){
			vm.allCategory = result;
        });
    }

    function onModelChange(modelId) {
		resetValue();
		vm.inputFormMasterData = [];
		$scope.inputFormState = [];
		vm.inputFormReqInfo.state = "";
		vm.inputFormReqInfo.tenure = "";

		if (!modelId) {
	        vm.container.modelId = "";
	        return;
	    }
		var filter = {};
		var mod = [];
		mod = vm.modelList.filter(function(item) {
			return item.model.modelId == modelId;
		});
		if (mod.length == 0)
			return;
		vm.inputFormReqInfo.model = mod[0].model.name;

		if(!vm.inputFormReqInfo.category || !vm.inputFormReqInfo.brand || !vm.inputFormReqInfo.model)
    		return;

    	filter.category = vm.inputFormReqInfo.category;
    	filter.brand = vm.inputFormReqInfo.brand;
    	filter.model = vm.inputFormReqInfo.model;
		InputFormMasterSvc.get(filter)
        .then(function(result){
			result.forEach(function(item){
				if(item.additionalInfo)
					vm.orignalInputFormMasterData = item.additionalInfo;
					//vm.inputFormMasterData = item.additionalInfo;
					//onStateChange();
			});
			vm.orignalInputFormMasterData.forEach(function(item){
				if($scope.inputFormState.indexOf(item.state) === -1 && item.state) {
					$scope.inputFormState[$scope.inputFormState.length] = item.state;
				}
	        });
        });
    }
    
	function onStateChange(state){
		resetValue()
		vm.inputFormReqInfo.tenure = "";
		vm.inputFormMasterData = [];
		// if(!state) {
		// 	angular.copy(vm.orignalInputFormMasterData, vm.inputFormMasterData);
		// }

		vm.orignalInputFormMasterData.forEach(function(item){
			if(angular.isUndefined(item.state) || item.state === "" || item.state === state)
				vm.inputFormMasterData[vm.inputFormMasterData.length] = item;
		});
	}

    function resetValue() {
		vm.inputFormReqInfo.installmentPerUnit = "";
		vm.inputFormReqInfo.totalInstallment = "";
		vm.inputFormReqInfo.totalMargin = "";
		vm.inputFormReqInfo.totalProcessingFee = "";
		vm.inputFormReqInfo.marginPerUnit = "";
		vm.inputFormReqInfo.processingFee = "";
		vm.inputFormReqInfo.remark = "";
    }

    function getInstallmentPerUnit(val) {
    	resetValue();
		if(!val)
			return;
		for(var i=0; i < vm.inputFormMasterData.length; i++){
			if(vm.inputFormMasterData[i].tenure == val){
			  	vm.inputFormReqInfo.installmentPerUnit = vm.inputFormMasterData[i].installment;
			  	vm.inputFormReqInfo.marginPerUnit = vm.inputFormMasterData[i].marginPerUnit;
			  	vm.inputFormReqInfo.processingFee = vm.inputFormMasterData[i].processingFee;
			  	vm.inputFormReqInfo.remark = vm.inputFormMasterData[i].remarks;
			  	vm.inputFormReqInfo.totalInstallment = vm.inputFormReqInfo.quantity * vm.inputFormMasterData[i].installment;
				vm.inputFormReqInfo.totalMargin = vm.inputFormReqInfo.quantity * vm.inputFormMasterData[i].marginPerUnit;
				vm.inputFormReqInfo.totalProcessingFee = vm.inputFormReqInfo.quantity * vm.inputFormMasterData[i].processingFee;
			  	break;
			}
		}
	}

    function onCategoryChange(categoryId, reset) {
        vm.brandList = [];
        vm.modelList = [];
        vm.inputFormMasterData = [];
        $scope.inputFormState = [];
        resetValue();
        if (reset) {
			if (categoryId) {
	          var ct = categorySvc.getCategoryOnId(categoryId);
	          vm.inputFormReqInfo.category = ct.name;
	        }
            vm.container.brandId = "";
            vm.container.modelId = "";
            vm.inputFormReqInfo.state = "";
			vm.inputFormReqInfo.tenure = "";
        }

        if (!categoryId)
            return;
        InputFormMasterSvc.search({
            category: categoryId
        })
        .then(function(result) {
            vm.brandList = result;
        });
    }

    function onBrandChange(brandId, reset) {
        vm.modelList = [];
        vm.inputFormMasterData = [];
        $scope.inputFormState = [];
        resetValue();
        if (reset) {
            vm.container.modelId = "";
            vm.inputFormReqInfo.state = "";
			vm.inputFormReqInfo.tenure = "";
        }
        if (!brandId)
            return;
        else {
			var brd = [];
			brd = vm.brandList.filter(function(item) {
			return item.brand.brandId == brandId;
			});
			if (brd.length == 0)
				return;
			vm.inputFormReqInfo.brand = brd[0].brand.name;
        }

        InputFormMasterSvc.search({
            brand: brandId
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
		//if(vm.inputFormReqInfo.state)
			//vm.inputFormReqInfo.country = LocationSvc.getCountryByState(vm.inputFormReqInfo.state);
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
					data.subject = 'No Reply: Input Form Request with Reference No ' + res.data.referenceNo;
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