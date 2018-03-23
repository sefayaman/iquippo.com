(function() {
    'use strict';

    angular.module('admin').controller('GSettingCtrl', GSettingCtrl);

    //Controller function
    function GSettingCtrl($scope, $rootScope, Auth, PagerSvc, productSvc, LocationSvc, notificationSvc, SubCategorySvc, Modal, settingSvc, PaymentMasterSvc, vendorSvc, uploadSvc, AuctionMasterSvc, categorySvc, brandSvc, modelSvc, ManufacturerSvc, AuctionSvc, ProductTechInfoSvc, FinanceMasterSvc, LeadMasterSvc, $window,LotSvc) {
        // $scope.dtOptions = DTOptionsBuilder.newOptions().withOption('order', []);
        $scope.actionAdditionalInfo = false;
        var vm = this;
        vm.tabValue = 'assetcount';
        vm.onTabChange = onTabChange;
        // vm.subCategory = {};
        // vm.subCategory.category = {};
        // vm.subCatEdit = false;
        // vm.saveSubCategory = saveSubCategory;
        // vm.updateSubCategory = updateSubCategory;
        // vm.subCategoryEditClick = subCategoryEditClick;
        // vm.deleteSubCategory = deleteSubCategory;
        $scope.isCollapsed = true;
        $scope.isAssetCollapsed = true;
        $scope.isTechCollapsed = false;

        vm.state = {};
        vm.stateEdit = false;
        vm.saveState = saveState;
        vm.updateState = updateState;
        vm.stateEditClick = stateEditClick;
        vm.deleteState = deleteState;

        vm.country = {};
        vm.country = "";
        vm.countryEdit = false;
        vm.saveCountry = saveCountry;
        vm.updateCountry = updateCountry;
        vm.countryEditClick = countryEditClick;
        vm.deleteCountry = deleteCountry;
        vm.onCountryChange = onCountryChange;

        vm.location = {};
        vm.locationEdit = false;
        vm.saveLocation = saveLocation;
        vm.updateLocation = updateLocation;
        vm.locationEditClick = locationEditClick;
        vm.deleteLocation = deleteLocation;

        vm.invSetting = {};
        vm.saveInvitationSetting = saveInvitationSetting;
        vm.getInvitationMasterData = getInvitationMasterData;

        vm.paymentMaster = {};
        vm.paymentMasterList = {};
        vm.paymentMasterEdit = false;
        vm.partners = [];
        vm.payableServices = payableServices;
        vm.savePaymentMaster = savePaymentMaster;
        vm.updatePaymentMaster = updatePaymentMaster;
        vm.editPaymentMaster = editPaymentMaster;
        vm.deletePaymentMaster = deletePaymentMaster;
        vm.onServiceChange = onServiceChange;
        vm.getParnerName = getParnerName;
        vm.markeDefaultPartner = markeDefaultPartner;

        vm.manufacturer = {};
        vm.manufacturerEdit = false;
        vm.saveManufacturer = saveManufacturer;
        vm.updateManufacturer = updateManufacturer;
        vm.editManufacturer = editManufacturer;
        vm.deleteManufacturer = deleteManufacturer;
        $scope.updateLogo = updateLogo;

        $scope.updateFinanceMasterImage = updateFinanceMasterImage
        vm.leadExportExcel = leadExportExcel;

        vm.auctionData = {};
        vm.auctionEdit = false;
        vm.saveAuctionMaster = saveAuctionMaster;
        vm.auctionData.bidIncrement = [{}];
        vm.auctionData.contactDetails = [{}];
        vm.editAuctionMaster = editAuctionMaster;
        vm.updateAuctionMaster = updateAuctionMaster;
        vm.fireCommand = fireCommand;
        vm.getProductData = getProductData;
        vm.showAddionalInfo = showAddionalInfo;
        vm.resendAuctionMasterData = resendAuctionMasterData;
        $scope.uploadDoc = uploadDoc;
        $scope.getConcatData = [];
        vm.auctionDateTemplate = 'AuctionDate-Template.xlsx';
        vm.addTechnicalInfoClicked = addTechnicalInfoClicked;
        vm.editProductTechInfo = editProductTechInfo;
        vm.exportProductTechInfoExcel = exportProductTechInfoExcel;
        vm.exportProductState = exportProductState;
        vm.totalProductTechInfoCount = 0;
        $scope.productTechTotalItems = 0;
        vm.closeTechInfo = closeTechInfo;
        $scope.lotDate=false;
        $scope.lotCreation=true;
        $scope.lot = {};
        $scope.lot.bidIncrement = [{}];
        var filter = {};
        vm.financeData = {};
        $scope.updateAuctionMasterImage = updateAuctionMasterImage
        vm.saveFinanceMaster = saveFinanceMaster;
        vm.editFinanceMaster = editFinanceMaster;
        vm.updateFinanceMaster = updateFinanceMaster;
        //import location
        $scope.importLocation = importLocation;
        $scope.checkForLot = checkForLot;
        $scope.onAuctionSelection=onAuctionSelection;
        $scope.ReqSubmitStatuses = ReqSubmitStatuses;
        vm.reSendReqToCreateAsset = reSendReqToCreateAsset;

        //vm.auctionSearchFilter = {};
        var dataToSend = {};

        //pagination variables
        var prevPage = 0;
        vm.itemsPerPage = 50;
        vm.currentPage = 1;
        vm.totalItems = 0;
        vm.totalMItems = 0;
        vm.maxSize = 6;
        var first_id = null;
        var last_id = null;
        $scope.resetPagination = resetPagination;

        vm.auctionProduct = {};
        vm.techInformation = {
            type: 'technical'
        };
        vm.addAssetInAuctionClicked = addAssetInAuctionClicked;
        vm.editAssetInAuctionClicked = editAssetInAuctionClicked;
        vm.saveAssetInAuction = saveAssetInAuction;
        vm.updateAssetInAuction = updateAssetInAuction;
        vm.deleteAssetFromAuction = deleteAssetFromAuction;
        vm.onCategoryChange = onCategoryChange;
        vm.onBrandChange = onBrandChange;
        $scope.uploadImage = uploadImage;
        vm.addAuctionClicked = addAuctionClicked;
        vm.onActionTabClick = onActionTabClick;
        vm.saveTechnicalInfo = saveTechnicalInfo;
        vm.updateProductTechInfo = updateProductTechInfo;
        vm.deleteProductTechInfo = deleteProductTechInfo;
        vm.productTechInfoTemplate = 'ProductTechInfoTemplate.xlsx';
        // vm.bidIncrementObj = {};
        // $scope.bidIncrementObj = {};
        vm.getChangeAuctionMasterData = getChangeAuctionMasterData;
        //vm.checkBidIncrement = checkBidIncrement;
        vm.checkBidIncrementAuction = checkBidIncrementAuction;
        vm.deleteDocumentFieldAuction = deleteDocumentFieldAuction;

        function closeTechInfo() {
            return $scope.isTechCollapsed = !$scope.isTechCollapsed;
        }

    function onAuctionSelection(dbAuctionId) {
      $scope.lot = {};
      var filter = {};
      filter.auction_id = dbAuctionId;
      //filter.isDeleted=false;
      console.log("filter", filter);
      fetchLot(filter);
    }

    function fetchLot(filter) {
      console.log("filter for lots",filter);
      LotSvc.getData(filter)
        .then(function(res) {
          $scope.lots = res;
          console.log("fetched",res);
          return;   
        })
        .catch(function(err) {
          if (err) throw err;
        });
    }


        function uploadDoc(files,_this,flag) {
            if (files.length == 0)
                return;
            if ([3,4].indexOf(flag) !== -1 && files[0].name.indexOf('.docx') == -1) {
                Modal.alert("Please upload a valid '.docx' file");
                $(_this).val('')
                return;
            }
            $rootScope.loading = true;
            uploadSvc.upload(files[0], auctionDir).then(function(result) {
                //vm.auctionData.docDir = result.data.assetDir;
                $rootScope.loading = false;
                if(flag==1){
                    vm.auctionData.docName = result.data.filename;
                }
                if(flag==2){
                    vm.auctionData.docNameProxy = result.data.filename;
                }
                if(flag==3){
                    vm.auctionData.registrationTemplate = result.data.filename;
                }
                if(flag==4){
                    vm.auctionData.undertakingTemplate = result.data.filename;
                }
            })
            .catch(function(){
                $rootScope.loading = false;
            });

        }
        
        //Auction date master

        $scope.importAuctionMaster = importAuctionMaster;
        $scope.importTechInfoMaster = importTechInfoMaster;
        vm.deleteAuctionMaster = deleteAuctionMaster;
         vm.deleteFinanceMaster = deleteFinanceMaster;

        function onCountryChange(country) {
            vm.filterStateList = [];
            if (!country)
                return;

            vm.filterStateList = vm.stateList.filter(function(item) {
                return item.country == country;
            });
        }

        function onTabChange(tabValue) {
            dataToSend.pagination = true;
            dataToSend.itemsPerPage = vm.itemsPerPage;

            switch (tabValue) {
                // case 'sc':
                // 	 loadAllSubcategory();
                // break;
                case 'loc':
                    loadAllCountry();
                    loadAllState();
                    loadAllLocation();
                    break;
                case 'date':
                    resetAuctionValuse();
                    resetPagination();

                    getAuctionMaster(dataToSend);
                    loadAuctionData();
                    loadAllCategory();
                    //checkForLot();
                    break;
                case 'inv':
                    getInvitationMasterData();
                    break;
                case 'paymnt':
                    vendorSvc.getAllVendors();
                    getPaymnetMaster();
                    break;
                case 'manu':
                    getAllManufacturer();
                    break;
                case 'technical':
                    resetPagination();
                    getProductTechInfo({});
                    loadAllCategory();
                    break;
                case 'promotion':
                    //resetAuctionValuse();
                    resetPagination();
                   
                    getFinanceMaster(dataToSend);
                    //loadAuctionData();
                    break;

                case 'leaddata':
                    //resetAuctionValuse();
                    resetPagination();
                   
                    getLeadMaster(dataToSend);
                    //loadAuctionData();
                    break;    
                

            }
        }
        onTabChange(vm.tabValue);

        function loadAllCountry() {
            LocationSvc.getAllCountry()
                .then(function(result) {
                    vm.countryList = result;
                })
        }

        function loadAllState() {
            LocationSvc.getAllState()
                .then(function(result) {
                    vm.stateList = result;
                })
        }

        function loadAllLocation() {
            LocationSvc.getAllLocation()
                .then(function(result) {
                    vm.locationList = result;
                })
        }

        function loadAllCategory() {
            categorySvc.getAllCategory()
                .then(function(result) {
                    vm.allCategory = result;
                })
        }

        function onCategoryChange(catName, reset) {
            vm.brandList = [];
            vm.modelList = [];
            if (reset) {
                if (vm.auctionProduct.product) {
                    vm.auctionProduct.product.brand = "";
                    vm.auctionProduct.product.model = "";
                }

                if (vm.techInformation.information) {
                    vm.techInformation.information.brand = "";
                    vm.techInformation.information.model = "";
                }

            }

            if (!catName)
                return;
            brandSvc.getBrandOnFilter({
                    categoryName: catName
                })
                .then(function(result) {
                    vm.brandList = result;
                })

        }

        function importLocation(files, _this) {
            if (!files[0])
                return;
            if (files[0].name.indexOf('.xlsx') == -1) {
                Modal.alert('Please upload a valid file');
                $(_this).val('')
                return;

            }

            // alert("I am through")
            $rootScope.loading = true;
            uploadSvc.upload(files[0], importDir)
                .then(function(result) {
                    var fileName = result.data.filename;
                    var user = Auth.getCurrentUser();
                    //alert(fileName);
                    $rootScope.loading = true;
                    LocationSvc.importExcel(fileName, user)
                        .then(function(res) {
                            console.log(res);
                            $rootScope.loading = false;
                            if (res && res.errObj && res.errObj.length > 0) {
                                var data = {};
                                data['to'] = Auth.getCurrentUser().email;
                                data['subject'] = 'Bulk  Country Excel Upload Error Details.';
                                var serData = {};
                                serData.serverPath = serverPath;
                                serData.errorList = res.errObj;
                                notificationSvc.sendNotification('bulkCountryUploadError', data, serData, 'email');
                                res.message += '. Error details has been sent to your email id';
                            }
                            Modal.alert(res.message, true);
                            loadAllCountry();
                            loadAllState();
                            loadAllLocation();
                        })
                        .catch(function(res) {
                            $rootScope.loading = false;
                            Modal.alert("error in parsing data", true);
                        })
                })
                .catch(function(res) {
                    $rootScope.loading = false;
                    Modal.alert("error in file upload", true);
                });
        }

        function onBrandChange(brandName, reset) {
            vm.modelList = [];
            if (reset) {
                if (vm.auctionProduct.product)
                    vm.auctionProduct.product.model = "";
                if (vm.techInformation.information)
                    vm.techInformation.information.model = "";
            }
            if (!brandName)
                return;
            modelSvc.getModelOnFilter({
                    brandName: brandName
                })
                .then(function(result) {
                    vm.modelList = result;
                })
        }

        /*function loadAllSubcategory(){
    	SubCategorySvc.getAllSubCategory()
    	.then(function(result){
    		vm.subCategoryList = result;
    	})

    	categorySvc.getAllCategory()
    	.then(function(result){
    		vm.allCategory = result;
    	})
    }*/

        /*    function loadAllManufacturer(){
            	SubCategorySvc.getAllManufacturer()
            	.then(function(result){
            		vm.subCategoryList = result;
            	})

            	categorySvc.getAllCategory()
        		.then(function(result){
        			vm.allCategory = result;
        		})
            }*/


        //subcategory functions
        /*function saveSubCategory(form){
        if(form.$invalid){
        	$scope.submitted = true;
        	return;
        }

        var cat = categorySvc.getCategoryOnId(vm.subCategory.category._id);
        vm.subCategory.category.name = cat.name;
        SubCategorySvc.saveSubCategory(vm.subCategory)
        .then(function(result){
        	if(result.errorCode == 1) {
        		Modal.alert(result.message, true);
        		return;
        	} else {
        		Modal.alert(result.message, true);
        		vm.subCategory = {};
        		loadAllSubcategory();
        	}	
        })
        }
    	
    	function updateSubCategory(form){
    	if(form.$invalid){
    		$scope.submitted = true;
    		return;
    	}
    	var cat = categorySvc.getCategoryOnId(vm.subCategory.category._id);
    	vm.subCategory.category.name = cat.name;
    	SubCategorySvc.updateSubCategory(vm.subCategory)
    	.then(function(result){
    		 vm.subCategory = {};
    		 vm.subCatEdit = false;
    		 loadAllSubcategory();
    	})
    }

    function subCategoryEditClick(idx){
    	vm.subCategory = vm.subCategoryList[idx];
    	vm.subCatEdit = true;
    }
    	
    	function deleteSubCategory(idx){
    		Modal.confirm("Are you sure want to delete?",function(ret){
    			if(ret == "yes")
    				submitDeleteSubCategory(idx);
     	});
    	
    }

    function submitDeleteSubCategory(idx){
    	SubCategorySvc.deleteSubCategory(vm.subCategoryList[idx])
    	.then(function(result){
    		 loadAllSubcategory();
    	})
    }*/

        //country functions
        function saveCountry(form) {
            if (form.$invalid) {
                $scope.submitted = true;
                return;
            }
            if((form.countryName.$viewValue).indexOf("_") > -1 || (form.countryCode.$viewValue).indexOf("_") > -1){
                alert('Underscore not allowed. Please update.');   
            }else{
                LocationSvc.saveCountry(vm.country)
                .then(function(result) {                    
                    if (result.errorCode == 1)
                        Modal.alert(result.message, true);
                    else {
                        vm.country = {};
                        loadAllCountry();
                    }
                })
            }
        }

        function updateCountry(form) {
            if (form.$invalid) {
                $scope.submitted = true;
                return;
            }
            if((form.countryName.$viewValue).indexOf("_") > -1 || (form.countryCode.$viewValue).indexOf("_") > -1){
                alert('Underscore not allowed. Please update.');   
            }else{
            LocationSvc.updateCountry(vm.country)
                .then(function(result) {
                    vm.country = {};
                    vm.countryEdit = false;
                    loadAllCountry();
                })
            }
        }

        function countryEditClick(idx) {
            vm.country = vm.countryList[idx];
            vm.countryEdit = true;
        }

        function deleteCountry(idx) {
            Modal.confirm("Are you sure want to delete?", function(ret) {
                if (ret == "yes")
                    submitDeleteCountry(idx);
            });
        }

        function submitDeleteCountry(idx) {
            LocationSvc.deleteCountry(vm.countryList[idx])
                .then(function(result) {
                    if (!result.errorCode)
                        loadAllCountry();
                    else
                        Modal.alert(result.message, true);
                })
                .catch(function(res) {
                    //error handling
                })
        }

        //state functions
        function saveState(form) {
            //console.log('hhhh', form.stateName.$viewValue);
            if (form.$invalid) {
                $scope.submitted = true;
                return;
            }
            if((form.stateName.$viewValue).indexOf("_") > -1){
                alert('Underscore not allowed. Please update.');   
            }else{
                LocationSvc.saveState(vm.state)
                .then(function(result) {
                    vm.state = {};
                    loadAllState();
                })
            }
            
        }

        function updateState(form) {
            if (form.$invalid) {
                $scope.submitted = true;
                return;
            }
            if((form.stateName.$viewValue).indexOf("_") > -1){
                alert('Underscore not allowed. Please update.');   
            }else{
            LocationSvc.updateState(vm.state)
                .then(function(result) {
                    vm.state = {};
                    vm.stateEdit = false;
                    loadAllState();
                })
            }
        }

        function stateEditClick(idx) {
            vm.state = vm.stateList[idx];
            vm.stateEdit = true;
        }

        function deleteState(idx) {
            Modal.confirm("Are you sure want to delete?", function(ret) {
                if (ret == "yes")
                    submitDeleteState(idx);
            });
        }

        function submitDeleteState(idx) {
            LocationSvc.deleteState(vm.stateList[idx])
                .then(function(result) {
                    if (!result.errorCode)
                        loadAllState();
                    else
                        Modal.alert(result.message, true);
                })
                .catch(function(res) {
                    //error handling
                })
        }


        //location functions
        function saveLocation(form) {
            if (form.$invalid) {
                $scope.submitted = true;
                return;
            }
            if((form.locationName.$viewValue).indexOf("_") > -1){
                alert('Underscore not allowed. Please update.');   
            }else{
                LocationSvc.saveLocation(vm.location)
                .then(function(result) {
                    vm.location = {};
                    vm.country = "";
                    loadAllLocation();
                })
            }
            
        }

        function updateLocation(form) {
            if (form.$invalid) {
                $scope.submitted = true;
                return;
            }
            if((form.locationName.$viewValue).indexOf("_") > -1){
                alert('Underscore not allowed. Please update.');   
            }else{
            LocationSvc.updateLocation(vm.location)
                .then(function(result) {
                    vm.location = {};
                    vm.country = "";
                    vm.locationEdit = false;
                    loadAllLocation();
                })
            }
        }

        function locationEditClick(idx) {
            vm.location = vm.locationList[idx];
            vm.country = vm.location.state.country;
            onCountryChange(vm.country);
            vm.locationEdit = true;
        }

        function deleteLocation(idx) {
            Modal.confirm("Are you sure want to delete?", function(ret) {
                if (ret == "yes")
                    submitDeleteLocation(idx);
            });
        }

        function submitDeleteLocation(idx) {
            LocationSvc.deleteLocation(vm.locationList[idx])
                .then(function(result) {
                    loadAllLocation();
                })
        }

        // Invitation Setting
        function saveInvitationSetting(form) {
            if (form.$invalid) {
                $scope.submitted = true;
                return;
            }
            var dataToSend = {};
            dataToSend.valueObj = {};
            dataToSend.key = UPDATE_INVITATION_MASTER;
            dataToSend.valueObj = vm.invSetting;
            settingSvc.upsert(dataToSend)
                .then(function(result) {
                    Modal.alert("Update Master", true);
                })
        }

        function getInvitationMasterData() {
            settingSvc.get(UPDATE_INVITATION_MASTER)
                .then(function(res) {
                    if (res) {
                        vm.invSetting.sDate = moment(res.valueObj.sDate).toDate();
                        vm.invSetting.eDate = moment(res.valueObj.eDate).toDate();
                        vm.invSetting.refAmount = res.valueObj.refAmount;
                        vm.invSetting.joinAmount = res.valueObj.joinAmount;
                    }
                })
                .catch(function(stRes) {})
        }

        //payment master 
        function getPaymnetMaster() {
            PaymentMasterSvc.getAll()
                .then(function(result) {
                    vm.paymentMasterList = result;
                });
        }

        function savePaymentMaster(form) {

            if (form.$invalid) {
                $scope.submitted = true;
                return;
            }
            $scope.submitted = false;
            PaymentMasterSvc.save(vm.paymentMaster)
                .then(function(res) {
                    if (res.errorCode == 0) {
                        vm.paymentMaster = {};
                        getPaymnetMaster();
                    } else
                        Modal.alert(res.message);
                })

        }

        function updatePaymentMaster(form) {
            if (form.$invalid) {
                $scope.submitted = true;
                return;
            }
            $scope.submitted = false;
            PaymentMasterSvc.update(vm.paymentMaster)
                .then(function(res) {
                    if (res.errorCode == 0) {
                        vm.paymentMaster = {};
                        vm.paymentMasterEdit = false;
                        getPaymnetMaster();
                    } else
                        Modal.alert(res.message);
                })
        }

        function markeDefaultPartner(payment) {
            $rootScope.loading = true;
            if (payment.default === true) {
                PaymentMasterSvc.clearCache();
                PaymentMasterSvc.getAll()
                    .then(function(result) {
                        var found = false;
                        for (var i = 0; i < result.length; i++) {
                            if (result[i].serviceCode == payment.serviceCode && result[i].default === true) {
                                found = true;
                                break;
                            }
                        }
                        if (!found)
                            update();
                        else {
                            $rootScope.loading = false;
                            payment.default = false;
                            Modal.alert("Default partner is already set for service " + payment.serviceCode.toLowerCase() || "" + ".");
                        }
                    });
            } else
                update();

            function update() {
                PaymentMasterSvc.update(payment)
                    .then(function(res) {
                        $rootScope.loading = false;
                        if (res.errorCode == 0)
                            getPaymnetMaster();
                        else
                            Modal.alert(res.message);
                    })
                    .catch(function(err) {
                        $rootScope.loading = false;
                    })
            }
            //console.log("default",payment.default);
        }

        function editPaymentMaster(index) {
            angular.copy(vm.paymentMasterList[index], vm.paymentMaster)
            vm.paymentMasterEdit = true;
            onServiceChange(vm.paymentMaster.serviceCode, true);
        }

        function deletePaymentMaster(index) {
            Modal.confirm("Are you sure want to delete?", function(ret) {
                if (ret == "yes")
                    submitDeletePaymentMaster(index);
            });
        }

        function submitDeletePaymentMaster(idx) {
            PaymentMasterSvc.delPaymentMaster(vm.paymentMasterList[idx])
                .then(function(result) {
                    getPaymnetMaster();
                })
        }

        function onServiceChange(code, isEdit) {
            vm.partners = [];
            if (!isEdit)
                vm.paymentMaster.partnerId = "";
            if (!code) {
                return;
            }
            var serv = getServiceByCode(code);
            vm.paymentMaster.serviceName = serv.name;
            vm.paymentMaster.multiple = serv.multiple ? 'y' : 'n';
            if (vm.paymentMaster.multiple == 'n')
                return;
            vendorSvc.getAllVendors()
                .then(function(res) {
                    vm.partners = vendorSvc.getVendorsOnCode(code);
                })

        }

        function getServiceByCode(code) {
            var serv = null;
            vm.payableServices.forEach(function(item) {
                if (item.code == code)
                    serv = item;
            });
            return serv;
        }

        function getParnerName(id) {
            var name = "";
            var partners = vendorSvc.getVandorCache();
            for (var i = 0; i < partners.length; i++) {
                if (partners[i]._id == id) {
                    name = partners[i].entityName;
                    break;
                }
            }
            return name;
        }

        function addAuctionClicked() {
            vm.auctionEdit = false;
            $scope.isCollapsed = !$scope.isCollapsed;
            vm.auctionData = {};
            vm.auctionData.bidIncrement=[{}];
            vm.auctionData.contactDetails = [{}];
            $scope.actionAdditionalInfo = false;
            loadAuctionData();
        }

        function resetAuctionValuse() {
            $scope.isCollapsed = true;
            $scope.submitted = false;
            $scope.isAssetCollapsed = true;
            vm.auctionData = {};
        }

        function onActionTabClick(param) {
            $scope.isAssetCollapsed = true;
            $scope.isCollapsed = true;
            resetPagination();
            switch (param) {
                case "auctionmaster":
                    getAuctionMaster(dataToSend);
                    break;
                case "auctionrequest":
                    getApprovedAuctionAsset(dataToSend);
                    break;
            }
        }

        function saveAuctionMaster(form) {

            if (form.$invalid) {
                $scope.submitted = true;
                return;
            }

            /*if (!vm.auctionData.primaryImg) {
                Modal.alert("Please upload image for auctionmaster.", true);
                return;
            }*/
            
            $scope.submitted = false;
            getChangeAuctionMasterData();
            $rootScope.loading = true;
            AuctionMasterSvc.saveAuctionMaster(vm.auctionData)
                .then(function(res) {
                    if (res.errorCode == 0) {
                        $scope.isCollapsed = !$scope.isCollapsed;
                        resetAuctionData();
                        Modal.alert(res.message);
                        $rootScope.loading = false;
                        $scope.actionAdditionalInfo = false;
                    }    
                })
                .catch(function(err){
                    if(err)
                        Modal.alert(err.data);
                    $rootScope.loading = false;
                    resetAuctionData();
                });
        }

        function resetAuctionData() {
            vm.auctionData = {};
            $scope.submitted = false;
            loadAuctionData();
            fireCommand(true, null, "auctionmaster");
        }
        function updateAuctionMaster(form) {
            if (form.$invalid) {
                $scope.submitted = true;
                return;
            }

            $scope.submitted = false;
            getChangeAuctionMasterData();
            $rootScope.loading = true;
            AuctionMasterSvc.updateAuctionMaster(vm.auctionData)
                .then(function(res) {
                    if (res.errorCode == 0) {
                        $scope.isCollapsed = true;
                        vm.auctionEdit = false;
                        resetAuctionData();
                        Modal.alert("Auction request updated successfully !!!");
                        $rootScope.loading = false;
                        $scope.actionAdditionalInfo = false;
                    }
                })
                .catch(function(err){
                    if(err)
                        Modal.alert(err.data);
                    $rootScope.loading = false;
                });
        }

        function showAddionalInfo(){
            $scope.actionAdditionalInfo = true;
        }
        function getChangeAuctionMasterData() {
            vm.auctionOwnerLists.forEach(function(item) {
                if (item.user.mobile == vm.auctionData.auctionOwnerMobile)
                    vm.auctionData.auctionOwner = item.entityName;
                //vm.auctionData.auctionOwner = item.user.fname + " " + item.user.lname;
            });
           
            if(vm.auctionData.rangeIncrement){
              vm.auctionData.bidIncrement = vm.auctionData.bidIncrement.filter(function(item, idx) {
                if (item && (item.bidFrom || item.bidTo || item.bidIncrement))
                  return true;
                else
                  return false;
              });
            } else {
              vm.auctionData.bidIncrement = [];
            }

            vm.auctionData.contactDetails = vm.auctionData.contactDetails.filter(function(item, idx) {
                if (item && (item.personName || item.personNumber || item.personEmail || item.personLocation))
                  return true;
                else
                  return false;
            });

            if(!vm.auctionData.staticIncrement) 
              vm.auctionData.static_increment = "";

            if (vm.auctionData.docType)
                vm.auctionData.docType = '';

            if (vm.auctionData.city)
                vm.auctionData.state = LocationSvc.getStateByCity(vm.auctionData.city);

            if (vm.auctionData.startDate)
                vm.auctionData.startDate = new Date(vm.auctionData.startDate);
            if (vm.auctionData.endDate)
                vm.auctionData.endDate = new Date(vm.auctionData.endDate);
            if (vm.auctionData.insStartDate)
                vm.auctionData.insStartDate = new Date(vm.auctionData.insStartDate);
            if (vm.auctionData.insEndDate)
                vm.auctionData.insEndDate = new Date(vm.auctionData.insEndDate);
            if (vm.auctionData.regEndDate)
                vm.auctionData.regEndDate = new Date(vm.auctionData.regEndDate);
        }

        function resendAuctionMasterData(index) {
            $rootScope.loading = true;
            AuctionMasterSvc.sendReqToCreateAuction(vm.auctions[index])
                .then(function(res) {
                    if (res.errorCode == 0) {
                        loadAuctionData();
                    }
                    fireCommand(true, null, 'auctionmaster');
                    Modal.alert(res.message);
                    $rootScope.loading = false;
                })
                .catch(function(err){
                  if(err)
                    Modal.alert(err.data);
                  $rootScope.loading = false;
                });
        }

        function editAuctionMaster(index) {
            angular.copy(vm.auctions[index], vm.auctionData)
            if (vm.auctionData.docType === 'bidProxy'){
                vm.auctionData.docNameProxy = vm.auctionData.docName;
                 vm.auctionData.docName = '';
            }

            if (vm.auctionData.bidIncrement && vm.auctionData.bidIncrement[0] && vm.auctionData.bidIncrement.length > 0) {
              for (var i = 0; i < vm.auctionData.bidIncrement.length; i++) {
                if (vm.auctionData.bidIncrement[i] && vm.auctionData.bidIncrement[i].bidFrom)
                  vm.auctionData.bidIncrement[i].bidFrom = Number(vm.auctionData.bidIncrement[i].bidFrom);
                  vm.auctionData.bidIncrement[i].bidTo = Number(vm.auctionData.bidIncrement[i].bidTo);
                  vm.auctionData.bidIncrement[i].bidIncrement = Number(vm.auctionData.bidIncrement[i].bidIncrement);
              }
              vm.auctionData.rangeIncrement = true;
            } else {
              vm.auctionData.rangeIncrement = false;
              vm.auctionData.bidIncrement = [{}];
            }

            if(!vm.auctionData.contactDetails || !vm.auctionData.contactDetails.length || (vm.auctionData.contactDetails.length && !vm.auctionData.contactDetails[0]))
                vm.auctionData.contactDetails = [{}];
            if(vm.auctionData.static_increment) {
              vm.auctionData.static_increment = parseInt(vm.auctionData.static_increment);
              vm.auctionData.staticIncrement = true;
            } else {
              vm.auctionData.static_increment = "";
              vm.auctionData.staticIncrement = false;
            }

            if (vm.auctionData.startDate)
                vm.auctionData.startDate = moment(vm.auctionData.startDate).format('MM/DD/YYYY hh:mm A');
            if (vm.auctionData.endDate)
                vm.auctionData.endDate = moment(vm.auctionData.endDate).format('MM/DD/YYYY hh:mm A');
            if (vm.auctionData.insStartDate)
                vm.auctionData.insStartDate = moment(vm.auctionData.insStartDate).format('MM/DD/YYYY hh:mm A');
            if (vm.auctionData.insEndDate)
                vm.auctionData.insEndDate = moment(vm.auctionData.insEndDate).format('MM/DD/YYYY hh:mm A');
            if (vm.auctionData.regEndDate)
                vm.auctionData.regEndDate = moment(vm.auctionData.regEndDate).format('MM/DD/YYYY');
            vm.auctionEdit = true;
            $scope.isCollapsed = false;
            $scope.actionAdditionalInfo = true;
        }

        function getAuctionMaster(filter) {
            filter = filter || {};
            filter.prevPage = prevPage;
            filter.currentPage = vm.currentPage;
            filter.first_id = first_id;
            filter.last_id = last_id;
            filter.isDeleted=false;

            AuctionMasterSvc.getFilterOnAuctionMaster(filter)
                .then(function(result) {
                    getAuctionWiseProductData(result);
                    vm.auctions = result.items;
                    vm.totalItems = result.totalItems;
                    prevPage = vm.currentPage;
                    if (vm.auctions && vm.auctions.length > 0) {
                        first_id = vm.auctions[0]._id;
                        last_id = vm.auctions[vm.auctions.length - 1]._id;
                    }
                });
        }

        function getAuctionWiseProductData(result) {
            var filter = {};
            var auctionIds = [];
            result.items.forEach(function(item) {
                auctionIds[auctionIds.length] = item._id;
            });
            filter.auctionIds = auctionIds;
            filter.status = "request_approved";
            filter.isClosed = 'n';
            AuctionSvc.getAuctionWiseProductData(filter)
                .then(function(data) {
                    $scope.getConcatData = data;
                })
                .catch(function() {})
        }
        
        function checkBidIncrementAuction(checkbox,val){
            if(val == 'static'){
                if(checkbox == true){
                    vm.auctionData.staticIncrement = true;
                }else{
                    vm.auctionData.staticIncrement = false;
                    if(vm.auctionData.static_increment)
                      deleteDocumentFieldAuction(vm.auctionData._id,1);
                }
                vm.auctionData.rangeIncrement = false;
                vm.auctionData.bidIncrement = [{}];
            }
            if(val == 'bid'){
                if(checkbox == true){
                    vm.auctionData.rangeIncrement = true;
                    vm.auctionData.bidIncrement = [{}];
                }else{
                    vm.auctionData.rangeIncrement = false;
                    if(vm.auctionData.bidIncrement[0].bidFrom)
                      deleteDocumentFieldAuction(vm.auctionData._id,2);
                }
                vm.auctionData.staticIncrement = false;
                vm.auctionData.static_increment = '';
            }
        }

        function deleteDocumentFieldAuction(id,flag){
          vm.auctionData.flag = flag;
          Modal.confirm("Are you sure want to delete value?",function(ret){
          if(ret == "yes")
         AuctionMasterSvc.removeAuctionMasterProduct(vm.auctionData)
          .then(function(){
          Modal.alert('Data updated successfully!');
          if(flag==2){
              vm.auctionData.bidIncrement = [{}];
            }
            if(flag==1){
              vm.auctionData.static_increment = "";
            }
          })
          .catch(function(err){
          if(err.data)
          Modal.alert(err.data); 
          });
          });
        }

        function getProductData(id, type) {
            if (angular.isUndefined($scope.getConcatData)) {
                if (type == "total_products")
                    return 0;
            } else {
                var totalItemsInAuction = 0;
                $scope.getConcatData.forEach(function(data) {
                    if (id == data._id) {
                        totalItemsInAuction = data.total_products;
                    }
                });
                if (type == "total_products") {
                    if (totalItemsInAuction > 0)
                        return totalItemsInAuction;
                }
                return 0;
            }
        }

        function loadAuctionData() {
            /*PaymentMasterSvc.getAll()
    		.then(function(result){
    		  result.forEach(function(item){
            if(item.serviceCode == "Auction")
              vm.auctionData.regCharges = item.fees;
          });
    		});*/

            var filter = {};
            filter.service = "Auction";
            AuctionMasterSvc.getAuctionOwnerFilter(filter).then(function(result) {
                    vm.auctionOwnerLists = result;
                })
                .catch(function() {
                    //error handling
                });
        }

        function importAuctionMaster(files) {
            if (files.length == 0 || !files)
                return;
            if (files[0].name.indexOf('.xlsx') == -1) {
                Modal.alert('Please upload a valid file');
                return;

            }
            $rootScope.loading = true;
            uploadSvc.upload(files[0], importDir)
                .then(function(result) {
                    var fileName = result.data.filename;
                    $rootScope.loading = true;
                    AuctionMasterSvc.parseExcel(fileName)
                        .then(function(res) {
                            $rootScope.loading = false;
                            if (res.errObj.length > 0) {
                                var data = {};
                                data['to'] = Auth.getCurrentUser().email;
                                data['subject'] = 'Bulk Auction Upload Excel Error Details.';
                                var serData = {};
                                serData.serverPath = serverPath;
                                serData.errorList = res.errObj;
                                notificationSvc.sendNotification('BulkUploadError', data, serData, 'email');
                                res.message += '. Error details has been sent to your email id';
                            }
                            Modal.alert(res.message, true);
                            fireCommand(true, null, "auctionmaster");
                        })
                        .catch(function(res) {
                            $rootScope.loading = false;
                            Modal.alert("error in parsing data", true);
                        })
                })
                .catch(function(res) {
                    $rootScope.loading = false;
                    Modal.alert("error in file upload", true);
                });
        }


        function deleteAuctionMaster(auctionData) {
            Modal.confirm("Are you sure want to delete?", function(ret) {
                if (ret == "yes")
                    submitDeleteAuctionMaster(auctionData);
            });
        }

        function submitDeleteAuctionMaster(auctionData) {
            auctionData.isDeleted = true;
            $rootScope.loading = true;
            AuctionMasterSvc.delAuctionMaster(auctionData)
                .then(function(result) {
                    if (result.errorCode == 0)
                        fireCommand(true, null, 'auctionmaster');
                    Modal.alert(result.message);
                    $rootScope.loading = false;
                })
                .catch(function(err){
                  if(err)
                    Modal.alert(err.data);
                  $rootScope.loading = false;
                });
        }

        //Manufacturer functions

        function getAllManufacturer() {
            ManufacturerSvc.getAllManufacturer()
                .then(function(result) {
                    vm.manufacturerList = result;
                });
        }

        function updateLogo(files) {
            if (files.length == 0)
                return;
            uploadSvc.upload(files[0], manufacturerDir).then(function(result) {
                vm.manufacturer.imgsrc = result.data.filename;
            });
        }

        function saveManufacturer(form) {

            if (form.$invalid) {
                $scope.submitted = true;
                return;
            }
            $scope.submitted = false;
            ManufacturerSvc.saveManufacturer(vm.manufacturer)
                .then(function(res) {
                    if (res.errorCode == 0) {
                        vm.manufacturer = {};
                        getAllManufacturer();
                    } else
                        Modal.alert(res.message);
                })

        }

        function updateManufacturer(form) {
            if (form.$invalid) {
                $scope.submitted = true;
                return;
            }
            $scope.submitted = false;
            ManufacturerSvc.updateManufacturer(vm.manufacturer)
                .then(function(res) {
                    if (res.errorCode == 0) {
                        vm.manufacturer = {};
                        vm.manufacturerEdit = false;
                        getAllManufacturer();
                    } else
                        Modal.alert(res.message);
                })
        }

        function editManufacturer(index) {
            angular.copy(vm.manufacturerList[index], vm.manufacturer)
            vm.manufacturerEdit = true;
            //onServiceChange(vm.paymentMaster.serviceCode,true);
        }

        function deleteManufacturer(index) {
            Modal.confirm("Are you sure want to delete?", function(ret) {
                if (ret == "yes")
                    submitDeleteManufacturer(index);
            });
        }

        function submitDeleteManufacturer(idx) {
            ManufacturerSvc.deleteManufacturer(vm.manufacturerList[idx])
                .then(function(result) {
                    getAllManufacturer();
                })
        }

        function updateAuctionMasterImage(files) {
            if (files.length == 0)
                return;
            $rootScope.loading = true;
            uploadSvc.upload(files[0], auctionmasterDir).then(function(result) {
                $rootScope.loading = false;
                vm.auctionData.primaryImg = result.data.filename;
            })
            .catch(function(){
                $rootScope.loading = false;
            });
        }

       
        function updateFinanceMasterImage(files) {
            if (files.length == 0)
                return;
            uploadSvc.upload(files[0], financemasterDir).then(function(result) {
                vm.financeData.image = result.data.filename;
            });
        }

        /*Auction Request for external product  start*/

        function getApprovedAuctionAsset(filter) {
            filter.prevPage = prevPage;
            filter.currentPage = vm.currentPage;
            filter.first_id = first_id;
            filter.last_id = last_id;
            filter['status'] = auctionStatuses[2].code;

            AuctionSvc.getOnFilter(filter)
                .then(function(result) {
                    vm.assetsInAuction = result.items;
                    vm.totalItems = result.totalItems;
                    prevPage = vm.currentPage;
                    if (vm.assetsInAuction.length > 0) {
                        first_id = vm.assetsInAuction[0]._id;
                        last_id = vm.assetsInAuction[vm.assetsInAuction.length - 1]._id;
                    }
                });
        }

        function addAssetInAuctionClicked() {
            $scope.isEdit = false;
            $scope.isAssetCollapsed = !$scope.isAssetCollapsed;
            vm.auctionProduct = {};
            $scope.lot.bidIncrement = [{}];
            vm.brandList = [];
            vm.modeList = [];
            if (!$scope.isAssetCollapsed) {
                vm.auctionProduct.external = true;
                vm.auctionProduct.user = {};
                vm.auctionProduct.user._id = Auth.getCurrentUser()._id;
                vm.auctionProduct.user.email = Auth.getCurrentUser().email;
                vm.auctionProduct.user.mobile = Auth.getCurrentUser().mobile;
                vm.auctionProduct.user.country = Auth.getCurrentUser().country;
                vm.auctionProduct.status = auctionStatuses[2].code;
                vm.auctionProduct.statuses = [];
                var stObj = {};
                stObj.userId = Auth.getCurrentUser()._id;
                stObj.status = auctionStatuses[2].code;
                stObj.createdAt = new Date();
                vm.auctionProduct.statuses[vm.auctionProduct.statuses.length] = stObj;
                vm.auctionProduct.product = {};
                vm.auctionProduct.product.originalInvoice = 'Yes';
                vm.auctionProduct.product.isSold = false;
                getUpcomingAuctions();
            }

        }

        function uploadImage(files, _this, param) {
            if (files.length == 0)
                return;
            var assetDir = !vm.auctionProduct.product.assetDir ? auctionDir : vm.auctionProduct.product.assetDir;
            $rootScope.loading = true;
            var isChildDir = assetDir == auctionDir ? true : false;
            uploadSvc.upload(files[0], assetDir, null, isChildDir)
                .then(function(result) {
                    $rootScope.loading = false;
                    vm.auctionProduct.product.assetDir = result.data.assetDir;
                    if (param == 1)
                        vm.auctionProduct.product.primaryImg = result.data.filename;
                    else if (param == 2) {
                        if (!vm.auctionProduct.product.otherImages)
                            vm.auctionProduct.product.otherImages = [];
                        vm.auctionProduct.product.otherImages[0] = result.data.filename;
                    }

                })
                .catch(function() {
                    $rootScope.loading = false;
                });
        }

        function getUpcomingAuctions() {
            var filter = {};
            filter['yetToStartDate'] = new Date();
            AuctionMasterSvc.get(filter)
                .then(function(result) {
                    vm.upcomingAuctions = result;
                });
        }
          
        function checkForLot(lotNumber){
            $scope.lot = {};
            if(!lotNumber)
                return;
            
            filter = {};
            filter.isDeleted = false;
            filter._id = lotNumber;
           
            LotSvc.getData(filter)
            .then(function(res){
              if(res.length > 0){
                angular.copy(res[0], $scope.lot);
                //$scope.lot.lot_id = lotNumber;
                if (res[0] && res[0].startDate && res[0].endDate) {
                  $scope.lot.startDate = moment(res[0].startDate).format('MM/DD/YYYY hh:mm A');
                  $scope.lot.endDate = moment(res[0].endDate).format('MM/DD/YYYY hh:mm A');
                }
                $scope.lot.lot_id = res[0]._id;
                
                if (res[0].bidIncrement && res[0].bidIncrement[0] && res[0].bidIncrement.length > 0) {
                  for (var i = 0; i < res[0].bidIncrement.length; i++) {
                    if (res[0].bidIncrement[i] && res[0].bidIncrement[i].bidFrom)
                      res[0].bidIncrement[i].bidFrom = Number(res[0].bidIncrement[i].bidFrom);
                      res[0].bidIncrement[i].bidTo = Number(res[0].bidIncrement[i].bidTo);
                      res[0].bidIncrement[i].bidIncrement = Number(res[0].bidIncrement[i].bidIncrement);
                  }
                  $scope.lot.rangeIncrement = true;
                } else {
                  $scope.lot.rangeIncrement = false;
                  $scope.lot.bidIncrement = [{}];
                }
                if(res[0].static_increment) {
                  $scope.lot.static_increment = parseInt(res[0].static_increment);
                  $scope.lot.staticIncrement = true;
                } else {
                  $scope.lot.static_increment = "";
                  $scope.lot.staticIncrement = false;
                }
                //$scope.lot._id = res[0]._id;
                $scope.lotCreation=false;
                }
                else
                {
                $scope.lotCreation=true;
                }
            })
            .catch(function(err){
            });
        }
      
        function checkForasset(assetId,auctionId){
            var auctionfilter ={};
            auctionfilter._id = auctionId;
            AuctionSvc.getAuctionDateData(auctionfilter).then(function(result){
            filter = {};
            filter.auctionId = result.items[0].auctionId;
            filter.assetId =  assetId;
            LotSvc.getData(filter)
                .then(function(res){
                  if(res.length > 0){
                    Modal.alert("This Asset is already assign to this auction.", true);
                    return;
                    }
                })
                .catch(function(err){
                });
            });
        }

    /*function checkBidIncrement(checkbox,val){
        if(val == 'static'){
          if(checkbox == true){
            vm.auctionProduct.staticIncrement = true;
          }else{
            vm.auctionProduct.staticIncrement = false;
            if(vm.auctionProduct.static_increment)
              deleteDocumentField(vm.auctionProduct._id,1);
          }
          vm.auctionProduct.rangeIncrement = false;
          vm.auctionProduct.bidInfo = [];
        }
       if(val == 'bid'){
          if(checkbox == true){
            vm.auctionProduct.rangeIncrement = true;
            vm.auctionProduct.bidInfo = [{}];
          }else{
            vm.auctionProduct.rangeIncrement = false;
            if(vm.auctionProduct.bidInfo[0].bidFrom)
              deleteDocumentField(vm.auctionProduct._id,2);
          }
          vm.auctionProduct.staticIncrement = false;
          delete vm.auctionProduct.static_increment;
        }
    }*/

    function deleteDocumentField(id,flag){
      vm.auctionProduct.flag = flag;
      Modal.confirm("Are you sure want to delete value?",function(ret){
      if(ret == "yes")
     LotSvc.removeLotData(vm.auctionProduct)
      .then(function(){
      Modal.alert('Data updated successfully!');
      if(flag==2){
          $scope.lot.bidIncrement = [{}];
        }
        if(flag==1){
          delete $scope.lot.static_increment;
        }
      })
      .catch(function(err){
      if(err.data)
      Modal.alert(err.data); 
      });
      });
    }         
        function saveAssetInAuction(form) {
            if (form.$invalid) {
                $scope.submitted = true;
                return;
            }
            /*var imgFound = vm.auctionProduct.product.primaryImg && vm.auctionProduct.product.otherImages && vm.auctionProduct.product.otherImages.length > 0 ? true : false;
            if (!imgFound) {
                Modal.alert("Please upload both images.");
                return;
            }*/
            for (var i = 0; i < vm.upcomingAuctions.length; i++) {
                if (vm.upcomingAuctions[i]._id == vm.auctionProduct.dbAuctionId) {
                    vm.auctionProduct.auctionId = vm.upcomingAuctions[i].auctionId;
                    vm.auctionProduct.startDate = vm.upcomingAuctions[i].startDate;
                    vm.auctionProduct.endDate = vm.upcomingAuctions[i].endDate;
                }
            }

            if($scope.lot) {
                vm.auctionProduct.lot_id = $scope.lot._id;
                vm.auctionProduct.lotNo = $scope.lot.lotNumber;
            }
            $rootScope.loading = true;
            AuctionSvc.save(vm.auctionProduct)
                .then(function(result) {
                    if (result.errorCode == 0) {
                        $scope.submitted = false;
                    $scope.isAssetCollapsed = !$scope.isAssetCollapsed;
                    fireCommand('true', null, "auctionrequest");
                    }
                    Modal.alert(result.message);
                    $rootScope.loading = false;
                })
                .catch(function(err) {
                    if(err && err.data)
                      Modal.alert(err.data);
                    $rootScope.loading = false;
                });
        }

        function editAssetInAuctionClicked(assetInAuct) {
            $scope.isEdit = true;
            $scope.isAssetCollapsed = false;
            vm.auctionProduct = {};
            getUpcomingAuctions();
            angular.copy(assetInAuct, vm.auctionProduct);
            if(angular.isUndefined(assetInAuct.product.description))
                vm.auctionProduct.product.description = assetInAuct.product.name;
            onCategoryChange(vm.auctionProduct.product.category, false);
            onBrandChange(vm.auctionProduct.product.brand, false);
            //LotData();
            onAuctionSelection(vm.auctionProduct.dbAuctionId);
            checkForLot(vm.auctionProduct.lot_id)
        }

        /*function LotData(){
          var auctionfilter ={};
          auctionfilter._id = vm.auctionProduct.dbAuctionId;
           AuctionSvc.getAuctionDateData(auctionfilter).then(function(result){
            var filter={};
            filter.auctionId = result.items[0].auctionId;
            filter.assetId =  vm.auctionProduct.product.assetId;
                LotSvc.getData(filter)
                .then(function(res){
                  if(res.length > 0){
                    angular.copy(res[0], $scope.lot);
                    //$scope.lot.lot_id = lotNumber;
                    if (res[0] && res[0].startDate && res[0].endDate) {
                      $scope.lot.startDate = moment(res[0].startDate).format('MM/DD/YYYY hh:mm A');
                      $scope.lot.endDate = moment(res[0].endDate).format('MM/DD/YYYY hh:mm A');
                    }
                    $scope.lot.lot_id = res[0]._id;
                    
                    if (res[0].bidIncrement && res[0].bidIncrement[0] && res[0].bidIncrement.length > 0) {
                      for (var i = 0; i < res[0].bidIncrement.length; i++) {
                        if (res[0].bidIncrement[i] && res[0].bidIncrement[i].bidFrom)
                          res[0].bidIncrement[i].bidFrom = Number(res[0].bidIncrement[i].bidFrom);
                          res[0].bidIncrement[i].bidTo = Number(res[0].bidIncrement[i].bidTo);
                          res[0].bidIncrement[i].bidIncrement = Number(res[0].bidIncrement[i].bidIncrement);
                      }
                      $scope.lot.rangeIncrement = true;
                    } else {
                      $scope.lot.rangeIncrement = false;
                      $scope.lot.bidIncrement = [{}];
                    }
                    if(res[0].static_increment) {
                      $scope.lot.static_increment = parseInt(res[0].static_increment);
                      $scope.lot.staticIncrement = true;
                    } else {
                      $scope.lot.static_increment = "";
                      $scope.lot.staticIncrement = false;
                    }
                        $scope.lotCreation=false;
                    }
                    else
                    {
                        $scope.lotCreation=true;
                    }

                })
                .catch(function(err){
                });
            });
        }*/

        function updateAssetInAuction(form) {
            if (form.$invalid) {
                $scope.submitted = true;
                return;
            }
            /* var imgFound = vm.auctionProduct.product.primaryImg && vm.auctionProduct.product.otherImages && vm.auctionProduct.product.otherImages.length > 0 ? true : false;
             if (!imgFound) {
                 Modal.alert("Please upload both images.");
                 return;
             }*/

            for (var i = 0; i < vm.upcomingAuctions.length; i++) {
                if (vm.upcomingAuctions[i]._id == vm.auctionProduct.dbAuctionId) {
                    vm.auctionProduct.auctionId = vm.upcomingAuctions[i].auctionId;
                    vm.auctionProduct.startDate = vm.upcomingAuctions[i].startDate;
                    vm.auctionProduct.endDate = vm.upcomingAuctions[i].endDate;
                }
            }

            if($scope.lot){
                vm.auctionProduct.lot_id = $scope.lot._id;
                vm.auctionProduct.lotNo = $scope.lot.lotNumber;
            }
            $rootScope.loading = true;
            AuctionSvc.update(vm.auctionProduct)
                .then(function(result) {
                    if (result.errorCode == 0) {
                        $scope.submitted = false;
                    $scope.isAssetCollapsed = true;
                    fireCommand('true', null, "auctionrequest");
                    }
                    Modal.alert(result.message);
                    $rootScope.loading = false;
                })
                .catch(function(err) {
                    if(err && err.data)
                        Modal.alert(err.data); 
                    $rootScope.loading = false;
                });
        }

        function deleteAssetFromAuction(auct) {
            if (!auct)
                return;
            Modal.confirm('Would you want to delete?', function(ret) {
                if (ret == 'yes')
                    deleteFn(auct);
            });
        }

        function reSendReqToCreateAsset(reqData) {
            if(!reqData.external) {
                var filter = {};
                filter._id = reqData.product._id;
                filter.deleted = false;
                productSvc.getProductOnFilter(filter).then(function(response) {
                  if (response && response.length < 1) {
                    return;
                  }
                var product ={};
                angular.copy(response[0], product);
                var dataObj = {};
                dataObj.images = [];
                dataObj._id = product._id;
                dataObj.assetId = product.assetId;
                dataObj.assetDesc = product.name;
                dataObj.auction_id = reqData.dbAuctionId;
                dataObj.auctionId = reqData.auctionId;
                dataObj.lot_id = reqData.lot_id;
                dataObj.assetDir = product.assetDir;
                dataObj.city = product.city;
                dataObj.mfgYear = product.mfgYear;
                dataObj.operatingHour = product.operatingHour;
                dataObj.mileage = product.mileage;
                dataObj.primaryImg = $rootScope.uploadImagePrefix + product.assetDir + "/" + product.primaryImg;
                product.images.forEach(function(x) {
                  dataObj.images[dataObj.images.length] = $rootScope.uploadImagePrefix + product.assetDir + "/" + x.src;
                })
                
                dataObj.seller = {};
                dataObj.seller._id = product.seller._id;
                dataObj.seller.fname = product.seller.fname;
                dataObj.seller.lname = product.seller.lname;
                dataObj.seller.role = product.seller.role;
                dataObj.seller.customerId = product.seller.customerId;
                dataObj.seller.mobile = product.seller.mobile;
                dataObj.seller.email = product.seller.email;
                dataObj.assetReqId = reqData._id;
                dataObj.external = reqData.external;
                createDataAndSend(dataObj);
                });  
            } else {
                createDataAndSend(reqData);
            }
        }

        function createDataAndSend(reqData){
            $rootScope.loading = true;
            AuctionSvc.reSendReqToCreateAsset(reqData)
              .then(function(res) {
                  if (res.errorCode == 0) {
                    fireCommand('true', null, "auctionrequest");
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

        function addTechnicalInfoClicked() {
            $scope.isEdit = false;
            $scope.isTechCollapsed = !$scope.isTechCollapsed;
            vm.techInformation = {
                type: 'technical'
            };
            vm.brandList = [];
            vm.modeList = [];
            if (!$scope.isTechCollapsed) {
                vm.techInformation.information = {};
            }
        }

        function getProductTechInfo(filter) {
            var countFilter = {
                count: true
            };

            filter.prevPage = prevPage;
            filter.currentPage = vm.currentPage;
            filter.first_id = first_id;
            filter.last_id = last_id;
            filter.limit = vm.itemsPerPage;

            if (filter.searchStr)
                $scope.productTechTotalItems = 0;

            if ($scope.productTechTotalItems) {
                if (vm.currentPage > prevPage) {
                    filter.first_id = null;
                    filter.last_id = vm.productTechnicalList[vm.productTechnicalList.length - 1]._id;
                    filter.offset = ((vm.currentPage - prevPage) * vm.itemsPerPage) - vm.itemsPerPage;
                } else {
                    filter.first_id = vm.productTechnicalList[0]._id;
                    filter.last_id = null;
                    filter.offset = ((vm.currentPage - prevPage) * vm.itemsPerPage) + vm.itemsPerPage;
                }

                ProductTechInfoSvc.fetchInfo(filter).then(function(result) {
                    vm.productTechnicalList = result;
                    vm.totalProductTechInfoCount = $scope.productTechTotalItems;
                    prevPage = vm.currentPage;
                })
            } else {
                if (filter.searchStr) {
                    countFilter.searchStr = filter.searchStr;
                }

                ProductTechInfoSvc.fetchInfo(countFilter).then(function(infoCount) {
                    vm.totalProductTechInfoCount = infoCount;
                    if (filter.searchstr) {
                        $scope.productTechTotalItems = 0;
                    } else {
                        $scope.productTechTotalItems = vm.totalProductTechInfoCount;
                    }

                    ProductTechInfoSvc.fetchInfo(filter).then(function(result) {
                        vm.productTechnicalList = result;
                        prevPage = vm.currentPage;
                        first_id = vm.productTechnicalList[0]._id;
                        last_id = vm.productTechnicalList[vm.productTechnicalList.length - 1]._id;
                    })
                })
            }
        }

        function saveTechnicalInfo(form) {
            if (form.$invalid) {
                $scope.submitted = true;
                return;
            }

            var createData = {};
            createData.type = vm.techInformation.type;
            Object.keys(vm.techInformation.information).forEach(function(x) {
                createData[x] = vm.techInformation.information[x];
            })

            ProductTechInfoSvc.createInfo(createData).then(function(result) {
                    if (result.msg) {
                        $scope.submitted = false;
                        $scope.isTechCollapsed = !$scope.isTechCollapsed;
                        fireCommand('true', null, "technical");
                    }
                })
                .catch(function(err) {
                    if (err.status === 409)
                        Modal.alert('Duplicate Entry');
                    else if (err && err.data && err.data.msg)
                        return Modal.alert(err.data.msg);
                    else
                        return Modal.alert('Error while updating');

                    return;

                });
        }

        function editProductTechInfo(techInfo) {
            $scope.isEdit = true;
            $scope.isTechCollapsed = true;
            vm.techInformation = {};
            angular.copy(techInfo, vm.techInformation);
            onCategoryChange(vm.techInformation.information.category, false);
            onBrandChange(vm.techInformation.information.brand, false);

        }

        function updateProductTechInfo(form) {
            if (form.$invalid) {
                $scope.submitted = true;
                return;
            }

            var updateData = {};
            Object.keys(vm.techInformation.information).forEach(function(x) {
                updateData[x] = vm.techInformation.information[x];
            })

            updateData.type = 'technical';

            var updateId = vm.techInformation._id;

            ProductTechInfoSvc.updateInfo(updateId, updateData).then(function(result) {
                    if (result.msg) {
                        $scope.submitted = false;
                        $scope.isTechCollapsed = !$scope.isTechCollapsed;
                        fireCommand('true', null, "technical");
                    }
                })
                .catch(function(err) {
                    if (err.status === 409)
                        return Modal.alert('Duplicate Entry');
                    else if (err && err.data && err.data.msg)
                        return Modal.alert(err.data.msg);
                    else
                        return Modal.alert('Error while updating');

                    //return;

                });
        }

        function openWindow(url) {
            $window.open(url);
        }

        //import Product Technical Info
        function importTechInfoMaster(files) {
            if (files.length == 0 || !files)
                return;
            if (files[0].name.indexOf('.xlsx') == -1) {
                Modal.alert('Please upload a valid file');
                return;

            }

            $rootScope.loading = true;
            uploadSvc.upload(files[0], importDir)
                .then(function(result) {
                    var fileName = result.data.filename;
                    $rootScope.loading = true;
                    ProductTechInfoSvc.importExcel(fileName)
                        .then(function(res) {
                            $rootScope.loading = false;
                            if (res.errObj.length > 0) {
                                var data = {};
                                data['to'] = Auth.getCurrentUser().email;
                                data['subject'] = 'Bulk Product Technical Information Excel Upload Error Details.';
                                var serData = {};
                                serData.serverPath = serverPath;
                                serData.errorList = res.errObj;
                                notificationSvc.sendNotification('BulkUploadError', data, serData, 'email');
                                res.message += '. Error details has been sent to your email id';
                            }
                            Modal.alert(res.message, true);
                            fireCommand('true', null, "technical");
                        })
                        .catch(function(res) {
                            $rootScope.loading = false;
                            Modal.alert("error in parsing data", true);
                        })
                })
                .catch(function(res) {
                    $rootScope.loading = false;
                    Modal.alert("error in file upload", true);
                });
        }

        function exportProductState(type) {
            var filters = {};
            filters.limit = 500;
            filters.type = type;

            openWindow(LocationSvc.exportExcel(filters));

        }

        function exportProductTechInfoExcel() {
            var filters = {};
            filters.limit = 500;

            openWindow(ProductTechInfoSvc.exportExcel(filters));

        }



        function deleteProductTechInfo(techInfo) {
            if (!techInfo)
                return;
            Modal.confirm('Would you want to delete?.', function(ret) {
                if (ret == 'yes') {
                    ProductTechInfoSvc.deleteInfo(techInfo)
                        .then(function(res) {
                            fireCommand(true, null, 'technical');
                        })
                }
            });
        }

        function deleteFn(auct) {
            auct.isDeleted = true;
            AuctionSvc.update(auct)
                .then(function(res) {
                    Modal.alert("Asset Deleted", true);
                    fireCommand(true, null, 'auctionrequest');
                });
        }
        /*Auction Request for external product  end*/

        function fireCommand(reset, filterObj, requestFor) {
            if (reset)
                resetPagination();
            var filter = {};
            if (!filterObj)
                angular.copy(dataToSend, filter);
            else
                filter = filterObj;
            if (vm.searchStr)
                filter['searchStr'] = vm.searchStr;
            if (vm.selectedAuctionId)
                filter['auctionId'] = vm.selectedAuctionId;
            switch (requestFor) {
                case "auctionmaster":
                    getAuctionMaster(filter);
                    break;
                case "auctionrequest":
                    getApprovedAuctionAsset(filter);
                    break;
                case "technical":
                    getProductTechInfo(filter);
                    break;
                case "financemaster":
                    getFinanceMaster(filter);
                    break;
                 case "leadmaster":
                    getLeadMaster(filter);
                    break;
            }

        }

        function resetPagination() {
            prevPage = 0;
            vm.currentPage = 1;
            vm.totalItems = 0;
            vm.totalMItems = 0;
            first_id = null;
            last_id = null;
            $scope.productTechTotalItems = 0;
        }
        //date picker
        $scope.today = function() {
            vm.sDate = new Date();
        };
        $scope.today();

        $scope.clear = function() {
            vm.sDate = null;
        };

        $scope.toggleMin = function() {
            $scope.minDate = $scope.minDate ? null : new Date();
        };

        $scope.toggleMin();
        /*$scope.maxDate = new Date(2020, 5, 22);
        $scope.minDate = new Date();*/

        /*$scope.setDate = function(year, month, day) {
        vm.sDate = new Date(year, month, day);
        };*/

        $scope.dateOptions = {
            formatYear: 'yy',
            startingDay: 1
        };

        $scope.formats = ['dd/MM/yyyy', 'dd.MM.yyyy', 'shortDate'];
        $scope.format = $scope.formats[0];

        $scope.open1 = function() {
            $scope.popup1.opened = true;
        };
        $scope.popup1 = {
            opened: false
        };

        $scope.open2 = function() {
            $scope.popup2.opened = true;
        };
        $scope.popup2 = {
            opened: false
        };

        function getFinanceMaster(filter) {
            filter = filter || {};
            filter.prevPage = prevPage;
            filter.currentPage = vm.currentPage;
            filter.first_id = first_id;
            filter.last_id = last_id;
            vm.financeData.type = "promotion";
            FinanceMasterSvc.getFilterOnFinanceMaster(filter)
               .then(function(result) {
                     //vm.financeData = result.items;
                    vm.finances = result.items;
                    vm.totalItems = result.totalItems;
                    prevPage = vm.currentPage;
                    if (vm.finances && vm.finances.length > 0) {
                        first_id = vm.finances[0]._id;
                        last_id = vm.finances[vm.finances.length - 1]._id;
                    }
               });
        }
        function saveFinanceMaster(form) {

            /*if (form.$invalid) {
                $scope.submitted = true;
                return;
            }*/
            
            //$scope.submitted = false;
            //getChangeAuctionMasterData();
            FinanceMasterSvc.saveFinanceMaster(vm.financeData)
                .then(function(res) {
                    if (res.errorCode == 0) {
                        $scope.isCollapsed = !$scope.isCollapsed;
                        vm.auctionData = {};
                        $scope.submitted = false;
                        //loadFinanceData();
                        fireCommand(true, null, "financemaster");
                    } else
                        Modal.alert(res.message);
                })

        }
        function deleteFinanceMaster(index) {
            Modal.confirm("Are you sure want to delete?", function(ret) {
                if (ret == "yes")
                    submitDeleteFinanceMaster(index);
            });
        }

        function submitDeleteFinanceMaster(idx) {
            FinanceMasterSvc.delFinanceMaster(vm.finances[idx])
                .then(function(result) {
                    //loadAuctionData();
                    fireCommand(true, null, 'financemaster');
                })
        }

         function editFinanceMaster(index) {
            angular.copy(vm.finances[index], vm.financeData)
          vm.financeEdit = true;
            $scope.isCollapsed = false;
        }

        function updateFinanceMaster(form) {
            if (form.$invalid) {
                $scope.submitted = true;
                return;
            }
            $scope.submitted = false;
            //getChangeAuctionMasterData();
            FinanceMasterSvc.updateFinanceMaster(vm.financeData)
                .then(function(res) {
                    if (res.errorCode == 0) {
                        $scope.isCollapsed = true;
                        vm.financeData = {};
                        $scope.submitted = false;
                        vm.financeEdit = false;
                        //loadFinanceData();
                        fireCommand(true, null, 'financemaster');
                    } else
                        Modal.alert(res.message);
                })
        }
        function loadFinanceData() {
            var filter = {};
            filter.service = "Finance";
            FinanceMasterSvc.getFilterOnFinanceMaster(filter).then(function(result) {
                    vm.financeData = result;
                })
                .catch(function() {
                    //error handling
                });
        }

        function getLeadMaster(filter) {
            filter = filter || {};
            filter.prevPage = prevPage;
            filter.currentPage = vm.currentPage;
            filter.first_id = first_id;
            filter.last_id = last_id;
            
            LeadMasterSvc.getFilterOnLeadMaster(filter)
               .then(function(result) {
                    vm.leads = result.items;
                    vm.totalItems = result.totalItems;
                    prevPage = vm.currentPage;
                    if (vm.leads && vm.leads.length > 0) {
                        first_id = vm.leads[0]._id;
                        last_id = vm.leads[vm.leads.length - 1]._id;
                    }
               });
        }

        function leadExportExcel() {
            LeadMasterSvc.getLeadExportExcel()
            .then(function(result) {
                saveAs(new Blob([s2ab(result)],{type:"application/octet-stream"}), "leadlist_"+ new Date().getTime() +".xlsx")
            });
        }
    }
})();
