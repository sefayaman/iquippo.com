(function() {
	'use strict';
	angular.module('sreizaoApp').controller('ValuationRequestCtrl', ValuationRequestCtrl);

	function ValuationRequestCtrl($scope, $rootScope, Modal, Auth,ValuationPurposeSvc,AssetGroupSvc,ValuationSvc, LocationSvc, PaymentMasterSvc, vendorSvc, $state, notificationSvc) {
		var vm = this;
		//vm.close = close;
		vm.submitValuationReq = submitValuationReq;
		vm.resetValuationReq = resetValuationReq;
		vm.valuationReq = {purpose:"Financing"};
		$scope.mytime = new Date();
	    $scope.hstep = 1;
	    $scope.mstep = 1;
	    $scope.ismeridian = true;
	    $scope.assetCategoryList = [];
	    $scope.iqvlOtherGroupId = iqvlOtherGroupId;

		function init() {
		  getAssetGroup();
		 ValuationPurposeSvc.get(null)
	      .then(function(result){
	        $scope.valuationList = result;
	      }); 

			PaymentMasterSvc.getAll()
				.then(function(result) {
					$scope.payments = result;
					vendorSvc.getAllVendors()
						.then(function() {
							var valAgency = vendorSvc.getVendorsOnCode('Valuation');
							$scope.valAgencies = [];
							valAgency.forEach(function(item) {
								var pyMst = PaymentMasterSvc.getPaymentMasterOnSvcCode("Valuation", item._id);
								if (pyMst && pyMst.fees)
									$scope.valAgencies[$scope.valAgencies.length] = item;
								else if (pyMst && pyMst.fees === 0)
									$scope.valAgencies[$scope.valAgencies.length] = item;
							});
							var insAgency = vendorSvc.getVendorsOnCode('Inspection');
							$scope.insAgencies = [];
							insAgency.forEach(function(item) {
								var pyInsMst = PaymentMasterSvc.getPaymentMasterOnSvcCode("Inspection", item._id);
								if (pyInsMst && pyInsMst.fees)
									$scope.insAgencies[$scope.insAgencies.length] = item;
								else if (pyInsMst && pyInsMst.fees === 0)
									$scope.insAgencies[$scope.insAgencies.length] = item;
							})
						});

				})

			vm.valuationReq.product = {};
			vm.valuationReq.user = {};
			vm.valuationReq.seller = {};
			vm.valuationReq.valuationAgency = {};
			vm.valuationReq.initiatedBy = "buyer";
			if (Auth.getCurrentUser()._id && Auth.getCurrentUser()._id == $scope.currentProduct.seller._id)
				vm.valuationReq.initiatedBy = "seller";
			vm.valuationReq.product._id = $scope.currentProduct._id;
			vm.valuationReq.product.assetId = $scope.currentProduct.assetId;
			vm.valuationReq.product.assetDir = $scope.currentProduct.assetDir;
			vm.valuationReq.product.primaryImg = $scope.currentProduct.primaryImg;
			vm.valuationReq.product.name = $scope.currentProduct.name;
			vm.valuationReq.product.category = $scope.currentProduct.category.name;
			vm.valuationReq.product.brand = $scope.currentProduct.brand.name;
			vm.valuationReq.product.model = $scope.currentProduct.model.name;
			vm.valuationReq.product.mfgYear = $scope.currentProduct.mfgYear;
			vm.valuationReq.product.status = $scope.currentProduct.assetStatus;
			vm.valuationReq.product.country = $scope.currentProduct.country;
			vm.valuationReq.product.state = $scope.currentProduct.state;
			vm.valuationReq.product.city = $scope.currentProduct.city;
			vm.valuationReq.product.description = $scope.currentProduct.comment;
			
			if($scope.currentProduct.country)
				vm.valuationReq.product.countryCode=LocationSvc.getCountryCode($scope.currentProduct.country);
			vm.valuationReq.product.serialNumber = $scope.currentProduct.serialNo;
			vm.valuationReq.product.registrationNo = $scope.currentProduct.registrationNo;
			vm.valuationReq.product.engineNo = $scope.currentProduct.engineNo;
			vm.valuationReq.product.chasisNo = $scope.currentProduct.chasisNo;
			
			vm.valuationReq.user._id = Auth.getCurrentUser()._id;
			vm.valuationReq.user.fname = Auth.getCurrentUser().fname;
			vm.valuationReq.user.lname = Auth.getCurrentUser().lname;
			vm.valuationReq.user.country = Auth.getCurrentUser().country;
			vm.valuationReq.user.countryCode = LocationSvc.getCountryCode(Auth.getCurrentUser().country);
			vm.valuationReq.user.city = Auth.getCurrentUser().city;
			vm.valuationReq.user.phone = Auth.getCurrentUser().phone;
			vm.valuationReq.user.mobile = Auth.getCurrentUser().mobile;
			vm.valuationReq.user.email = Auth.getCurrentUser().email;
			vm.valuationReq.customerId = Auth.getCurrentUser().customerId;

			vm.valuationReq.seller._id = $scope.currentProduct.seller._id;
			vm.valuationReq.seller.mobile = $scope.currentProduct.seller.mobile;
			vm.valuationReq.seller.countryCode = LocationSvc.getCountryCode($scope.currentProduct.seller.country);
			vm.valuationReq.seller.email = $scope.currentProduct.seller.email;

		}

		function getAssetGroup() {
			var serData = {};
			AssetGroupSvc.get(serData)
			.then(function(result){
			   $scope.assetCategoryList = result;
			});
		};

		$scope.$on('productloaded', function() {
			init();
		});

		//init();
		function submitValuationReq(form, valType) {

			if (!Auth.getCurrentUser()._id) {
				//Modal.alert("Please Login/Register for submitting your request!", true);
				Auth.goToLogin();
				return;
			}

			if (Auth.getCurrentUser().profileStatus == "incomplete") {
				return $state.go("myaccount");
			}

			if (vm.valuationReq.schedule == 'yes') {
		        if (angular.isUndefined(vm.valuationReq.scheduleDate))
		          form.scheduleDate.$invalid = true;
		        else
		          form.scheduleDate.$invalid = false;
		    }

			if (form.$invalid) {
				$scope.valSubmitted = true;
				return;
			}

			Modal.confirm("Do you want to submit?", function(ret) {
				if (ret == "yes") {
					vm.valuationReq.status = IndividualValuationStatuses[0];
					vm.valuationReq.statuses = [];
					vm.valuationReq.requestType = valType;
					var stsObj = {};
					stsObj.createdAt = new Date();
					stsObj.userId = vm.valuationReq.user._id;
					stsObj.status = IndividualValuationStatuses[0];
					vm.valuationReq.statuses[vm.valuationReq.statuses.length] = stsObj;
					
					var agencyArr = [];
					angular.copy($scope.valAgencies, agencyArr);
					if(valType === "Inspection")
						angular.copy($scope.insAgencies, agencyArr);
					for (var i = 0; agencyArr.length; i++) {
						if (agencyArr[i]._id === vm.valuationReq.valuationAgency._id) {
							vm.valuationReq.valuationAgency.name = agencyArr[i].name;
							vm.valuationReq.valuationAgency.email = agencyArr[i].email;
							vm.valuationReq.valuationAgency.mobile = agencyArr[i].mobile;
							vm.valuationReq.valuationAgency.countryCode = agencyArr[i].country;
							break;
						}
					}

					var existCat = false;
					for (var i = 0; i < $scope.assetCategoryList.length; i++) {
						if($scope.assetCategoryList[i].assetCategory && $scope.assetCategoryList[i].assetCategory === vm.valuationReq.product.category){
						  vm.valuationReq.assetCategory = $scope.assetCategoryList[i].assetCategory || "";
						  vm.valuationReq.valuerGroupId = $scope.assetCategoryList[i].valuerGroupId || "";
						  existCat = true;
						  break;
						}
					}
					if(!existCat) {
						vm.valuationReq.assetCategory = "";
						vm.valuationReq.valuerGroupId = $scope.iqvlOtherGroupId;
					}

					var paymentTransaction = {};
					paymentTransaction.payments = [];
					paymentTransaction.totalAmount = 0;
					paymentTransaction.requestType = "Valuation Request";

					var payObj = {};

					var pyMaster = PaymentMasterSvc.getPaymentMasterOnSvcCode("Valuation", vm.valuationReq.valuationAgency._id);
					// payObj.type = "valuationreq";
					// payObj.amount = pyMaster.fees;
					paymentTransaction.totalAmount = pyMaster.fees;
					//paymentTransaction.payments[paymentTransaction.payments.length] = payObj;

					paymentTransaction.product = {};
					paymentTransaction.product.type = "equipment";
					paymentTransaction.product._id = $scope.currentProduct._id;
					paymentTransaction.product.assetId = $scope.currentProduct.assetId;
					paymentTransaction.product.assetDir = $scope.currentProduct.assetDir;
					paymentTransaction.product.primaryImg = $scope.currentProduct.primaryImg;
					paymentTransaction.product.city = $scope.currentProduct.city;
					paymentTransaction.product.name = $scope.currentProduct.name;
					paymentTransaction.product.category = $scope.currentProduct.category.name;
					paymentTransaction.product.mfgYear = $scope.currentProduct.mfgYear;
					paymentTransaction.product.status = $scope.currentProduct.assetStatus;
					paymentTransaction.user = {};

					paymentTransaction.user._id = Auth.getCurrentUser()._id;
					paymentTransaction.user.fname = Auth.getCurrentUser().fname;
					paymentTransaction.user.lname = Auth.getCurrentUser().lname;
					paymentTransaction.user.country = Auth.getCurrentUser().country;
					paymentTransaction.user.city = Auth.getCurrentUser().city;
					paymentTransaction.user.phone = Auth.getCurrentUser().phone;
					paymentTransaction.user.mobile = Auth.getCurrentUser().mobile;
					paymentTransaction.user.email = Auth.getCurrentUser().email;

					paymentTransaction.status = transactionStatuses[0].code;
					paymentTransaction.statuses = [];
					var sObj = {};
					sObj.createdAt = new Date();
					sObj.status = transactionStatuses[0].code;
					sObj.userId = Auth.getCurrentUser()._id;
					paymentTransaction.statuses[paymentTransaction.statuses.length] = sObj;
					paymentTransaction.paymentMode = "online";

					ValuationSvc.save({
							valuation: vm.valuationReq,
							payment: paymentTransaction
						})
						.then(function(result) {
							if(result && result.errorCode != 0) {
					          //Modal.alert(result.message, true);  
					          $state.go('main');
					          return;
					        }
							/*vm.valuationReq = {purpose:"Financing"};
							if (result.transactionId)
								$state.go('payment', {
									tid: result.transactionId
								});*/
							if(result.transactionId) {
								var paymentScope = $rootScope.$new();
					            paymentScope.tid = result.transactionId;
					            paymentScope.valuation = result.valuation;
					            Modal.openDialog('paymentOption',paymentScope);
							}

						})
						.catch(function() {
							//error handling
						});
				}
			});

		}

		function resetValuationReq() {

		}

		$scope.changed = function(mytime) {
	      if (mytime) {
	        var hours = mytime.getHours();
	        var minutes = mytime.getMinutes();
	        var ampm = hours >= 12 ? 'PM' : 'AM';
	        hours = hours % 12;
	        hours = hours ? hours : 12; // the hour '0' should be '12'
	        minutes = minutes < 10 ? '0' + minutes : minutes;
	        vm.valuationReq.scheduledTime = hours + ':' + minutes + ' ' + ampm;
	      }
	    };

	    $scope.toggleMode = function() {
	      $scope.isShow = !$scope.isShow;
	    };

	    //date picker
	    $scope.today = function() {
	      $scope.scheduleDate = new Date();
	    };
	    $scope.today();

	    $scope.clear = function() {
	      $scope.scheduleDate = null;
	    };

	    $scope.toggleMin = function() {
	      $scope.minDate = $scope.minDate ? null : new Date();
	    };

	    $scope.toggleMin();
	    $scope.maxDate = new Date(2020, 5, 22);
	    $scope.minDate = new Date();

	    $scope.open1 = function() {
	      $scope.popup1.opened = true;
	    };

	    $scope.setDate = function(year, month, day) {
	      $scope.scheduleDate = new Date(year, month, day);
	    };

	    $scope.dateOptions = {
	      formatYear: 'yy',
	      startingDay: 1
	    };

	    $scope.formats = ['dd/MM/yyyy', 'dd.MM.yyyy', 'shortDate'];
	    $scope.format = $scope.formats[0];

	    $scope.popup1 = {
	      opened: false
	    };

	}

})();