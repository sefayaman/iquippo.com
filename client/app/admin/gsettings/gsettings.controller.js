(function(){
  'use strict';

angular.module('admin').controller('GSettingCtrl', GSettingCtrl);

//Controller function
function GSettingCtrl($scope,$rootScope,Auth,DTOptionsBuilder,LocationSvc,SubCategorySvc, Modal, settingSvc,PaymentMasterSvc,vendorSvc,uploadSvc,AuctionMasterSvc,categorySvc,brandSvc,modelSvc, ManufacturerSvc, BannerSvc,AuctionSvc) {
    $scope.dtOptions = DTOptionsBuilder.newOptions().withOption('order', []);
    var vm = this;
    vm.tabValue = 'loc';
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

    vm.state = {};
    vm.stateEdit = false;
    vm.saveState = saveState;
    vm.updateState = updateState;
    vm.stateEditClick = stateEditClick;
    vm.deleteState = deleteState;

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

    vm.manufacturer = {};
    vm.manufacturerEdit = false;
    vm.saveManufacturer = saveManufacturer;
    vm.updateManufacturer = updateManufacturer;
    vm.editManufacturer = editManufacturer;
    vm.deleteManufacturer = deleteManufacturer;
    $scope.updateLogo = updateLogo;

    vm.banner = {};
    vm.bannerEdit = false;
    vm.saveBanner = saveBanner;
    vm.updateBanner = updateBanner;
    vm.editBanner = editBanner;
    vm.deleteBanner = deleteBanner;
    $scope.updateBannerImage = updateBannerImage;
    $scope.updateMobBannerImage = updateMobBannerImage;

    vm.auctionData = {};
    vm.auctionEdit = false;
    vm.saveAuctionMaster = saveAuctionMaster;
    
    vm.editAuctionMaster = editAuctionMaster;
    vm.updateAuctionMaster = updateAuctionMaster;
    vm.fireCommandForAuctionMaster = fireCommandForAuctionMaster;
    $scope.uploadDoc = uploadDoc;
    
    vm.auctionSearchFilter = {};
    var dataToSend = {};
    //pagination variables
    var prevPage = 0;
    vm.itemsPerPage = 50;
    vm.currentPage = 1;
    vm.totalItems = 0;
    vm.maxSize = 6;
    var first_id = null;
    var last_id = null;
    
    vm.auctionProduct = {};
    vm.addAssetInAuction = addAssetInAuction;
    vm.saveAssetInAuction = saveAssetInAuction;
    vm.editProductInAuction = editProductInAuction;
    vm.deleteProductFromAuction = deleteProductFromAuction;
    vm.onCategoryChange = onCategoryChange;
    vm.onBrandChange = onBrandChange;
    $scope.uploadImage = uploadImage;
    
    function uploadDoc(files){
      if(files.length == 0)
        return;

      uploadSvc.upload(files[0], auctionDir).then(function(result){
        //vm.auctionData.docDir = result.data.assetDir;
        vm.auctionData.docName = result.data.filename;
        });
        
    }

    function resetData(){
    	vm.banner.hyperlink = "No";
    	vm.banner.ticker = "No";
    	vm.banner.showInMobile = "No";
    }
    //Auction date master

    $scope.importAuctionMaster = importAuctionMaster;
    vm.deleteAuctionMaster = deleteAuctionMaster;

    function onTabChange(tabValue){
    	switch(tabValue){
    		// case 'sc':
    		// 	 loadAllSubcategory();
    		// break;
    		case 'loc':
    			loadAllState();
    			loadAllLocation();
    		break;
    		case 'date':
			dataToSend.pagination = true;
			dataToSend.itemsPerPage = vm.itemsPerPage;
			getAuctionMaster(dataToSend);
    			loadAuctionData();
				loadAllCategory();
				getApprovedAuctionAsset()
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
			case 'banner':
				vm.banner = {};
				resetData();
    			getAllBanner();
			break;

    	}
    }
    onTabChange(vm.tabValue);

    function loadAllState(){
    	LocationSvc.getAllState()
    	.then(function(result){
    		vm.stateList = result;
    	})
    }

    function loadAllLocation(){
    	LocationSvc.getAllLocation()
    	.then(function(result){
    		vm.locationList = result;
    	})
    }

    function loadAllCategory(){
		categorySvc.getAllCategory()
		.then(function(result){
			vm.allCategory = result;
		})
    }

    function onCategoryChange(catName,reset){
    	vm.brandList = [];
    	vm.modelList = [];
    	if(reset){
    		vm.auctionProduct.product.brand = "";
    		vm.auctionProduct.product.model = "";
    	}
    	
    	if(!catName)
    		return;
    	brandSvc.getBrandOnFilter({categoryName:catName})
    	.then(function(result){
    		vm.brandList = result;
    	})

    }

    function onBrandChange(brandName,reset){
    	vm.modelList = [];
    	if(reset){
    		vm.auctionProduct.product.model = "";
    	}
    	if(!brandName)
    	return;
    	modelSvc.getModelOnFilter({brandName:brandName})
    	.then(function(result){
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

    //state functions
	function saveState(form){
		if(form.$invalid){
			$scope.submitted = true;
			return;
		}
		LocationSvc.saveState(vm.state)
		.then(function(result){
			 vm.state = {};
			 loadAllState();
		})
    }
 	
 	function updateState(form){
		if(form.$invalid){
			$scope.submitted = true;
			return;
		}
		LocationSvc.updateState(vm.state)
		.then(function(result){
			 vm.state = {};
			 vm.stateEdit = false;
			 loadAllState();
		})
    }

    function stateEditClick(idx){
		vm.state = vm.stateList[idx];
    	vm.stateEdit = true;
    }
 	
 	function deleteState(idx){
 		Modal.confirm("Are you sure want to delete?",function(ret){
 			if(ret == "yes")
 				submitDeleteState(idx);
 		});
 	}

 	function submitDeleteState(idx){
		LocationSvc.deleteState(vm.stateList[idx])
		.then(function(result){
			if(!result.errorCode)
			 	loadAllState();
			 else
			 	Modal.alert(result.message,true);
		})
		.catch(function(res){
			//error handling
		})
    }


    //location functions
	function saveLocation(form){
		if(form.$invalid){
			$scope.submitted = true;
			return;
		}
		LocationSvc.saveLocation(vm.location)
		.then(function(result){
			 vm.location = {};
			 loadAllLocation();
		})
    }
 	
 	function updateLocation(form){
		if(form.$invalid){
			$scope.submitted = true;
			return;
		}
		LocationSvc.updateLocation(vm.location)
		.then(function(result){
			 vm.location = {};
			 vm.locationEdit = false;
			 loadAllLocation();
		})
    }

    function locationEditClick(idx){
		vm.location = vm.locationList[idx];
    	vm.locationEdit = true;
    }
 	
 	function deleteLocation(idx){
 		Modal.confirm("Are you sure want to delete?",function(ret){
 			if(ret == "yes")
 				submitDeleteLocation(idx);
 		});
 	}

 	function submitDeleteLocation(idx){
		LocationSvc.deleteLocation(vm.locationList[idx])
		.then(function(result){
			 loadAllLocation();
		})
    }

// Invitation Setting
	function saveInvitationSetting(form){
		if(form.$invalid){
			$scope.submitted = true;
			return;
		}
		var dataToSend = {};
		dataToSend.valueObj = {};
		dataToSend.key = UPDATE_INVITATION_MASTER;
		dataToSend.valueObj = vm.invSetting;
		settingSvc.upsert(dataToSend)
		.then(function(result){
			Modal.alert("Update Master",true);
		})
    }

    function getInvitationMasterData(){
    settingSvc.get(UPDATE_INVITATION_MASTER)
    .then(function(res){
    	if(res) {
         vm.invSetting.sDate = moment(res.valueObj.sDate).toDate();
         vm.invSetting.eDate = moment(res.valueObj.eDate).toDate();
         vm.invSetting.refAmount = res.valueObj.refAmount;
         vm.invSetting.joinAmount = res.valueObj.joinAmount;
     	}
      })
      .catch(function(stRes){
      })
  	}

  //payment master 
  	function getPaymnetMaster(){
  		PaymentMasterSvc.getAll()
  		.then(function(result){
  			vm.paymentMasterList = result;
  		});
  	}

	function savePaymentMaster(form){
		
		if(form.$invalid){
			$scope.submitted = true;
			return;
		}
		$scope.submitted = false;
		PaymentMasterSvc.save(vm.paymentMaster)
		.then(function(res){
			if(res.errorCode == 0){
				vm.paymentMaster = {};
				getPaymnetMaster();
			}
			else
				Modal.alert(res.message);
		})

	}

	function updatePaymentMaster(form){
		if(form.$invalid){
			$scope.submitted = true;
			return;
		}
		$scope.submitted = false;
		PaymentMasterSvc.update(vm.paymentMaster)
		.then(function(res){
			if(res.errorCode == 0){
				vm.paymentMaster = {};
				vm.paymentMasterEdit = false;
				getPaymnetMaster();
			}
			else
				Modal.alert(res.message);
		})
	}

	function editPaymentMaster(index){
		angular.copy(vm.paymentMasterList[index],vm.paymentMaster)
		vm.paymentMasterEdit = true;
		onServiceChange(vm.paymentMaster.serviceCode,true);
	}

	function deletePaymentMaster(index){
		Modal.confirm("Are you sure want to delete?",function(ret){
 			if(ret == "yes")
 				submitDeletePaymentMaster(index);
 		});
	}

	function submitDeletePaymentMaster(idx){
		PaymentMasterSvc.delPaymentMaster(vm.paymentMasterList[idx])
		.then(function(result){
			 getPaymnetMaster();
		})
    }

    function onServiceChange(code,isEdit){
    	vm.partners = [];
    	if(!isEdit)
    		vm.paymentMaster.partnerId = "";
    	if(!code){
    		return;
    	}
    	var serv = getServiceByCode(code);
    	vm.paymentMaster.serviceName = serv.name;
		vm.paymentMaster.multiple = serv.multiple?'y':'n';
		if(vm.paymentMaster.multiple == 'n')
			return;
		vendorSvc.getAllVendors()
		.then(function(res){
			vm.partners = vendorSvc.getVendorsOnCode(code);
		})

    }

	function getServiceByCode(code){
		var serv = null;
		vm.payableServices.forEach(function(item){
			if(item.code == code)
				serv = item;
		});
		return serv;
	}

	function getParnerName(id){
		var name = "";
		var partners = vendorSvc.getVandorCache(); 
		for(var i = 0;i < partners.length;i++){
			if(partners[i]._id == id){
				name = partners[i].entityName;
				break;
			}
		}
		return name;
	}

	function saveAuctionMaster(form){
		
		if(form.$invalid){
			$scope.submitted = true;
			return;
		}
		$scope.submitted = false;
		if(vm.auctionData.city)
			vm.auctionData.state = LocationSvc.getStateByCity(vm.auctionData.city);
		AuctionMasterSvc.saveAuctionMaster(vm.auctionData)
		.then(function(res){
			if(res.errorCode == 0){
				vm.auctionData = {};
				loadAuctionData();
				fireCommandForAuctionMaster(true);
			}
			else
				Modal.alert(res.message);
		})

	}
	function updateAuctionMaster(form){
		if(form.$invalid){
			$scope.submitted = true;
			return;
		}
		$scope.submitted = false;
		AuctionMasterSvc.updateAuctionMaster(vm.auctionData)
		.then(function(res){
			if(res.errorCode == 0){
				vm.auctionData = {};
				vm.auctionEdit = false;
				loadAuctionData();
				fireCommandForAuctionMaster(true);
			}
			else
				Modal.alert(res.message);
		})
	}

	function editAuctionMaster(index){
		angular.copy(vm.auctions[index], vm.auctionData)
		vm.auctionEdit = true;
		$scope.isCollapsed = false;
	}
	
	function getAuctionMaster(filter){
		filter.prevPage = prevPage;
	    filter.currentPage = vm.currentPage;
	    filter.first_id = first_id;
	    filter.last_id = last_id;
		AuctionMasterSvc.getFilterOnAuctionMaster(filter)
		.then(function(result){
			vm.auctions = result.items;
	        vm.totalItems = result.totalItems;
	        prevPage = vm.currentPage;
	        if(vm.auctions.length > 0){
	          first_id = vm.auctions[0]._id;
	          last_id = vm.auctions[vm.auctions.length - 1]._id;
	        }
		});
	}

	function fireCommandForAuctionMaster(reset,filterObj){
	    if(reset)
	      resetPagination();
	    var filter = {};
	    if(!filterObj)
	        angular.copy(dataToSend, filter);
	    else
	      filter = filterObj;
	    if(vm.auctionSearchFilter.searchStr)
	      filter['searchstr'] = vm.auctionSearchFilter.searchStr;
	    
	    getAuctionMaster(filter);
	  }

	function resetPagination(){
      prevPage = 0;
      vm.currentPage = 1;
      vm.totalItems = 0;
      first_id = null;
      last_id = null;
  	}

	function loadAuctionData(){
		PaymentMasterSvc.getAll()
  		.then(function(result){
  		  result.forEach(function(item){
            if(item.serviceCode == "Auction")
              vm.auctionData.regCharges = item.fees;
          });
  		});

		var filter = {};
		filter.service = "Auction";
		AuctionMasterSvc.getAuctionOwnerFilter(filter).then(function(result){
        vm.auctionOwnerLists = result;
      })
      .catch(function(){
        //error handling
      });
	}

	function importAuctionMaster(files){
	    if(files.length == 0 || !files)
	      return;
	     if(files[0].name.indexOf('.xlsx') == -1){
	        Modal.alert('Please upload a valid file');
	        return;

	     }
	     $rootScope.loading = true;
	    uploadSvc.upload(files[0],importDir)
	    .then(function(result){
	      var fileName = result.data.filename;
	      $rootScope.loading = true;
	      AuctionMasterSvc.parseExcel(fileName)
	      .then(function(res){
	        $rootScope.loading = false; 
	        if(res.errorCode)
	        	Modal.alert(res.message,true);
	        else
	        	//getAuctionMaster();	 
	        fireCommandForAuctionMaster(true);
	      })
	      .catch(function(res){
	        $rootScope.loading = false;
	        Modal.alert("error in parsing data",true);
	      })
	    })
	    .catch(function(res){
	    	$rootScope.loading = false;
	       Modal.alert("error in file upload",true);
	    });
  }


  function deleteAuctionMaster(index){
		Modal.confirm("Are you sure want to delete?",function(ret){
 			if(ret == "yes")
 				submitDeleteAuctionMaster(index);
 		});
	}

	function submitDeleteAuctionMaster(idx){
		AuctionMasterSvc.delAuctionMaster(vm.auctions[idx])
		.then(function(result){
			//getAuctionMaster();
			fireCommandForAuctionMaster(true);
		})
    }

    //Manufacturer functions

    function getAllManufacturer(){
  		ManufacturerSvc.getAllManufacturer()
  		.then(function(result){
  			vm.manufacturerList = result;
  		});
  	}

  	function updateLogo(files){
	    if(files.length == 0)
	      return;
	    uploadSvc.upload(files[0], manufacturerDir).then(function(result){
	      vm.manufacturer.imgsrc = result.data.filename;
	    });
	}

	function saveManufacturer(form){
		
		if(form.$invalid){
			$scope.submitted = true;
			return;
		}
		$scope.submitted = false;
		ManufacturerSvc.saveManufacturer(vm.manufacturer)
		.then(function(res){
			if(res.errorCode == 0){
				vm.manufacturer = {};
				getAllManufacturer();
			}
			else
				Modal.alert(res.message);
		})

	}

	function updateManufacturer(form){
		if(form.$invalid){
			$scope.submitted = true;
			return;
		}
		$scope.submitted = false;
		ManufacturerSvc.updateManufacturer(vm.manufacturer)
		.then(function(res){
			if(res.errorCode == 0){
				vm.manufacturer = {};
				vm.manufacturerEdit = false;
				getAllManufacturer();
			}
			else
				Modal.alert(res.message);
		})
	}

	function editManufacturer(index){
		angular.copy(vm.manufacturerList[index], vm.manufacturer)
		vm.manufacturerEdit = true;
		//onServiceChange(vm.paymentMaster.serviceCode,true);
	}

	function deleteManufacturer(index){
		Modal.confirm("Are you sure want to delete?",function(ret){
 			if(ret == "yes")
 				submitDeleteManufacturer(index);
 		});
	}

	function submitDeleteManufacturer(idx){
		ManufacturerSvc.deleteManufacturer(vm.manufacturerList[idx])
		.then(function(result){
			 getAllManufacturer();
		})
    }

/*Banner Master code start*/
	function getAllBanner(){
  		BannerSvc.getAll()
  		.then(function(result){
  			vm.bannerList = result;
  		});
  	}

	function updateBannerImage(files){
	    if(files.length == 0)
	      return;
	    uploadSvc.upload(files[0], bannerDir).then(function(result){
	      vm.banner.webImg = result.data.filename;
	    });
	}

	function updateMobBannerImage(files){
	    if(files.length == 0)
	      return;
	    uploadSvc.upload(files[0], bannerDir).then(function(result){
	      vm.banner.mobileImg = result.data.filename;
	    });
	}
	
	function saveBanner(form){
		/*if(form.$invalid){
			$scope.submitted = true;
			return;
		}*/
		if(!vm.banner.webImg){
	        Modal.alert("Please upload image for web.",true);
	        return;
	      }
	    if(!vm.banner.mobileImg && vm.banner.showInMobile == 'Yes'){
	        Modal.alert("Please upload image for mobile.",true);
	        return;
	      }
		//$scope.submitted = false;
		BannerSvc.save(vm.banner)
		.then(function(res){
			if(res.errorCode == 0){
				vm.banner = {};
				resetData();
				getAllBanner();
			}
			else
				Modal.alert(res.message);
		})

	}

	function updateBanner(form){
		/*if(form.$invalid){
			$scope.submitted = true;
			return;
		}*/
		if(!vm.banner.mobileImg && vm.banner.showInMobile == 'Yes'){
	        Modal.alert("Please upload image for mobile.",true);
	        return;
	      }
		$scope.submitted = false;
		BannerSvc.update(vm.banner)
		.then(function(res){
			if(res.errorCode == 0){
				vm.banner = {};
				resetData();
				vm.bannerEdit = false;
				getAllBanner();
			}
			else
				Modal.alert(res.message);
		})
	}

	function editBanner(index){
		angular.copy(vm.bannerList[index], vm.banner)
		vm.bannerEdit = true;
		//onServiceChange(vm.paymentMaster.serviceCode,true);
	}

	function deleteBanner(index){
		Modal.confirm("Are you sure want to delete?",function(ret){
 			if(ret == "yes")
 				submitDeleteBanner(index);
 		});
	}

	function submitDeleteBanner(idx){
		BannerSvc.deleteBanner(vm.bannerList[idx])
		.then(function(result){
			vm.banner = {};
			resetData();
			getAllBanner();
		})
    }
/*Banner Master code end*/

/*Auction Request for external product  start*/

function getApprovedAuctionAsset(){
	var filter = {};
	filter['status'] = auctionStatuses[2].code;
	AuctionSvc.getOnFilter()
	.then(function(aucts){
		vm.assetsInAuction = aucts;
	})
}

function addAssetInAuction(){

	$scope.isAssetCollapsed = !$scope.isAssetCollapsed;
	vm.auctionProduct = {};
	vm.brandList = [];
	vm.modeList = [];
	if(!$scope.isAssetCollapsed){
		vm.auctionProduct.external = true;
		vm.auctionProduct.user = {};
		vm.auctionProduct.user._id = Auth.getCurrentUser()._id;
		vm.auctionProduct.user.email = Auth.getCurrentUser().email;
		vm.auctionProduct.user.mobile = Auth.getCurrentUser().mobile;
		vm.auctionProduct.status = auctionStatuses[2].code;
		vm.auctionProduct.statuses = [];
		var stObj = {};
		stObj.userId = Auth.getCurrentUser()._id;
		stObj.status = auctionStatuses[2].code;
		stObj.createdAt = new Date();
		vm.auctionProduct.statuses[vm.auctionProduct.statuses.length] = stObj;
		vm.auctionProduct.product = {};
		vm.auctionProduct.product.originalInvoice = 'Yes';
		vm.auctionProduct.product.isSold = true;
		getUpcomingAuctions();
	}
	
}

function uploadImage(files,_this,param){
	if(files.length == 0)
		return;
	 uploadSvc.upload(files[0], auctionDir,null,true).then(function(result){
	 	vm.auctionProduct.product.assetDir = result.data.assetDir;
	 	if(param == 1)
	 		vm.auctionProduct.product.primaryImage = result.data.filename;
	 	else if(param == 2){
	 		if(!vm.auctionProduct.product.otherImages)
	 			vm.auctionProduct.product.otherImages = [];
			vm.auctionProduct.product.otherImages[vm.auctionProduct.product.otherImages.length] = result.data.filename;
	 	}

      });
}

function getUpcomingAuctions(){
		var filter = {};
		filter['yetToStartDate'] = new Date();
		AuctionMasterSvc.get(filter)
		.then(function(result){
			vm.upcomingAuctions = result;
		});	
}

function saveAssetInAuction(form){
	
	if(form.$invalid){
		$scope.submitted = true;
		return;
	}

	for(var i=0; i< vm.upcomingAuctions.length;i++){
		if(vm.upcomingAuctions[i]._id == vm.auctionProduct.dbAuctionId){
			vm.auctionProduct.auctionId = vm.upcomingAuctions[i].auctionId;
			vm.auctionProduct.startDate = vm.upcomingAuctions[i].startDate;
			vm.auctionProduct.endDate = vm.upcomingAuctions[i].endDate;
		}
	}

	AuctionSvc.save(vm.auctionProduct)
	.then(function(){
		$scope.submitted = false;
		$scope.isAssetCollapsed = !$scope.isAssetCollapsed;
	})
	.catch(function(){
		//error handling
	});

}

function editProductInAuction(){

}

function deleteProductFromAuction(){

}

/*Auction Request for external product  end*/
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

    /*$scope.open3 = function() {
      $scope.popup3.opened = true;
    };
    $scope.popup3 = {
      opened: false
    };

    $scope.open4 = function() {
      $scope.popup4.opened = true;
    };
    $scope.popup4 = {
      opened: false
    };

    $scope.open5 = function() {
      $scope.popup5.opened = true;
    };
    $scope.popup5 = {
      opened: false
    };

    $scope.open6 = function() {
      $scope.popup6.opened = true;
    };
    $scope.popup6 = {
      opened: false
    };

    $scope.open7 = function() {
      $scope.popup7.opened = true;
    };
    $scope.popup7 = {
      opened: false
    };*/
}
    
})();



  
