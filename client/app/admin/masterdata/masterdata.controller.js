(function(){

'use strict';
angular.module('admin').controller('MasterDataCtrl',MasterDataCtrl);

function MasterDataCtrl($scope, $rootScope,MasterDataService, groupSvc, modelSvc, categorySvc, brandSvc, Modal, uploadSvc,$filter) {
	$scope.groupList = [];
	$scope.categoryList = [];
	$scope.brandList = [];
	$scope.modelList = [];
	$scope.g={};
	$scope.c={};
    $scope.b={};
    $scope.m={};
    $scope.form = {};
    var dataToSend = {};
    $scope.fileObj = {};

    //edit flag
    $scope.groupEdit = false;
	$scope.categoryEdit = false;
	$scope.brandEdit = false;
	$scope.modelEdit = false;

	var vm = this;

	//pagination flag

	vm.itemsPerPage = 40;
	vm.maxSize = 6;

	vm.gCurrentPage = 1;
	vm.gTotalItems = 0;

	vm.cCurrentPage = 1;
	vm.cTotalItems = 0;

	vm.bCurrentPage = 1;
	vm.bTotalItems = 0;

	vm.mCurrentPage = 1;
	vm.mTotalItems = 0;
	
	//public methods
	vm.onGroupChange = onGroupChange;
	vm.onCategoryChange = onCategoryChange;
	vm.Save = Save;
	vm.reset = reset;
	//vm.updateCategoryStatus = updateCategoryStatus;
	vm.makeVisibleHome = makeVisibleHome;
	vm.update = update;
	vm.deleteClick = deleteClick;
	vm.editClick = editClick;
	vm.exportMasterData = exportMasterData;
	vm.searchFn = searchFn;

	//methods in scope
	//$scope.updateCategoryImg = updateCategoryImg;
	$scope.uploadImage = uploadImage;
	//$scope.updateImage = updateImage;
	$scope.importMasterData = importMasterData;
	$scope.getStatus = getStatus;
	$scope.checkCategoryFor = checkCategoryFor;
	$scope.checkBrandFor = checkBrandFor;

	function loadAllGroup(fromCache){
            if(!fromCache)
            groupSvc.clearCache();
            groupSvc.getAllGroup()
            .then(function(result){
                    $scope.allGroup = result;
                    $scope.filteredGroup = result;
                    vm.gCurrentPage = 1;
                    vm.gSearch = "";
                    vm.gTotalItems = result.length;
            });
	}

	function loadAllCategory(fromCache){
		if(!fromCache)
			categorySvc.clearCache();
		categorySvc.getAllCategory()
		.then(function(result){
			$scope.allCategory = result;
			$scope.filteredCategory = result;
			vm.cSearch = "";
			vm.cCurrentPage = 1;
			vm.cTotalItems = result.length;
			
		})
	}

	function loadAllBrand(){
		brandSvc.getAllBrand()
		.then(function(result){
			$scope.allBrand = result;
			$scope.filteredBrand = result;
			vm.bCurrentPage = 1;
			vm.bSearch = "";
			vm.bTotalItems = result.length;
		})
	}

	function loadAllModel(){
		modelSvc.getAllModel()
		.then(function(result){
			$scope.allModel = result;
			$scope.filteredModel = result;
			vm.mCurrentPage = 1;
			vm.mSearch = "";
			vm.mTotalItems = result.length;
		})
	}

	loadAllGroup(true);
	loadAllCategory(true);
	loadAllBrand();
	loadAllModel();

	function searchFn(type){

		switch(type){
			case "group":
				$scope.filteredGroup = $filter('filter')($scope.allGroup,vm.gSearch);
				if(vm.isForNew || vm.isForUsed){
					$scope.filteredGroup = $scope.filteredGroup.filter(function(item){
						if(vm.isForNew && vm.isForUsed)
							return item.isForUsed && item.isForNew;
						else if(vm.isForNew)
							return item.isForNew;
						else if(vm.isForUsed)
							return item.isForUsed;
						else
							return false;

					});
				}
				vm.gCurrentPage = 1;
				vm.gTotalItems = $scope.filteredGroup.length;
			break;

			case "category":
				$scope.filteredCategory = $filter('filter')($scope.allCategory,vm.cSearch);
				if(vm.isForNew || vm.isForUsed){
					$scope.filteredCategory = $scope.filteredCategory.filter(function(item){
						if(vm.isForNew && vm.isForUsed)
							return item.isForUsed && item.isForNew;
						else if(vm.isForNew)
							return item.isForNew;
						else if(vm.isForUsed)
							return item.isForUsed;
						else
							return false;

					});
				}
				vm.cCurrentPage = 1;
				vm.cTotalItems = $scope.filteredCategory.length;
			break;
			
			case "brand":
				$scope.filteredBrand = $filter('filter')($scope.allBrand,vm.bSearch);
				if(vm.isForNew || vm.isForUsed){
					$scope.filteredBrand = $scope.filteredBrand.filter(function(item){
						if(vm.isForNew && vm.isForUsed)
							return item.isForUsed && item.isForNew;
						else if(vm.isForNew)
							return item.isForNew;
						else if(vm.isForUsed)
							return item.isForUsed;
						else
							return false;

					});
				}
				vm.bCurrentPage = 1;
				vm.bTotalItems = $scope.filteredBrand.length;
			break;
			
			case "model":
				$scope.filteredModel = $filter('filter')($scope.allModel,vm.mSearch);
				if(vm.isForNew || vm.isForUsed){
					$scope.filteredModel = $scope.filteredModel.filter(function(item){
						if(vm.isForNew && vm.isForUsed)
							return item.isForUsed && item.isForNew;
						else if(vm.isForNew)
							return item.isForNew;
						else if(vm.isForUsed)
							return item.isForUsed;
						else
							return false;

					});
				}
				vm.mCurrentPage = 1;
				vm.mTotalItems = $scope.filteredModel.length;
			break;
		}
		
	}

   function onGroupChange(group){
    $scope.categoryList = [];
    $scope.brandList = [];
    if(!group)
      return;
    var otherCategory = null;  
    $scope.categoryList = $scope.allCategory.filter(function(d){
        if(d.name == 'Other'){
          otherCategory = d;
          return false;
        }
        else
          return group._id == d.group._id;
    });
    if(otherCategory)
      $scope.categoryList[$scope.categoryList.length] = otherCategory;
  }

 function getStatus(status){
    if(status == true)
      return "Active";
    else 
      return "Inactive";
    }

  function onCategoryChange(category){
  	
  	$scope.brandList = [];
    if(!category)
      return;
    var otherBrand = null;  
    $scope.brandList = $scope.allBrand.filter(function(d){
       if(d.name == 'Other'){
          otherBrand = d;
          return false;
        }
        else{
          return category._id == d.category._id
        }
    });
    if(otherBrand)
      $scope.brandList[$scope.brandList.length] = otherBrand;
  }
  
	function Save(Type)
	{	$scope.submitted = true;
		if(!validateMasterData(Type))
			return;
		switch (Type)
		{	
			case "Group":
				MasterDataService.SaveGroup($scope.g).then(function(Info) {
					loadAllGroup();
				if(Info.Code=="SUCCESS"){
					$scope.g={};
				}
				alert(Info.Message);
				 	$('#groupName').focus();
				}, function(reason) {
				alert(reason.Message);
					$('#groupName').focus();
				});
				break;
			case "Category":
				if(!$scope.fileObj.file){
					saveCategory();
					return;
				}
				uploadSvc.upload($scope.fileObj.file,categoryDir).then(function(result){
					$scope.fileObj = {};
		          $scope.c.imgSrc = result.data.filename;
		          saveCategory();
		        });

				break;
			case "Brand":
				if($scope.b && !$scope.b.enableHomeBanner){
					$scope.b.homeBannerLeft  = "";
					$scope.b.homeBannerTop = "";
				}

				MasterDataService.SaveBrand($scope.b).then(function(Info) {
				loadAllBrand();
				if(Info.Code=="SUCCESS"){
				    $scope.b={};
				   
				}
					alert(Info.Message);
				}, function(reason) {
					alert(reason.Message);
				});
			break;
			case "Model":
				MasterDataService.SaveModel($scope.m).then(function(Info) {
					loadAllModel();
					if(Info.Code=="SUCCESS"){
					 $scope.m= {};
				}
					alert(Info.Message);
				}, function(reason) {
					alert(reason.Message);
				});
				break;                
		}
		
	}

	function validateMasterData(Type){
		var isValid = true;
		switch (Type)
		{	
			case "Group":
			if(!$scope.g.name){
				$scope.form.errorGroup = true;
				isValid = false;
			}
			if(!$scope.g.isForNew && !$scope.g.isForUsed){
				isValid = false;
				Modal.alert("Please select used equipment or new equipment checkbox",true);
			}
			break;
			case "Category":
				if(!$scope.c.name){
					$scope.form.errorCategory = true;
					isValid = false;
				}
				if(!$scope.c.group){
					$scope.form.errorGroup = true;
					isValid = false;
				}
				if($scope.c.name.toLowerCase() != "other" && $scope.c.group.name.toLowerCase() == "other"){
					isValid = false;
					Modal.alert("Invaid combination",true);
				}
				if($scope.c.name.toLowerCase() == "other" && $scope.c.group.name.toLowerCase() != "other"){
					isValid = false;
					Modal.alert("Invaid combination",true);
				}
				if(!$scope.c.isForNew && !$scope.c.isForUsed){
					isValid = false;
					Modal.alert("Please select used equipment or new equipment checkbox",true);
				}
				break;
			case "Brand":
				if(!$scope.b.category){
					$scope.form.errorCategory = true;
					isValid = false;
				}
				if(!$scope.b.group){
					$scope.form.errorGroup = true;
					isValid = false;
				}
				if(!$scope.b.name){
					$scope.form.errorBrand = true;
					isValid = false;
				}
				/*if($scope.b.isForNew && $scope.b.enableHomeBanner && (!$scope.b.homeBannerLeft ||  !$scope.b.homeBannerTop)){
					isValid = false;
					Modal.alert("Upload home banner images",true);
				}*/
				if($scope.b.name.toLowerCase() != "other" && ($scope.b.group.name.toLowerCase() == "other" || $scope.b.category.name.toLowerCase() == "other")){
					isValid = false;
					Modal.alert("Invaid combination",true);
				}
				if($scope.b.name.toLowerCase() == "other" && ($scope.b.group.name.toLowerCase() != "other" || $scope.b.category.name.toLowerCase() != "other")){
					isValid = false;
					Modal.alert("Invaid combination",true);
				}
				if(!$scope.b.isForNew && !$scope.b.isForUsed){
					isValid = false;
					Modal.alert("Please select used equipment or new equipment checkbox",true);
				}
			break;
			case "Model":
				if(!$scope.m.category){
					$scope.form.errorCategory = true;
					isValid = false;
				}
				if(!$scope.m.group){
					$scope.form.errorGroup = true;
					isValid = false;
				}
				if(!$scope.m.brand){
					$scope.form.errorBrand = true;
					isValid = false;
				}
				if(!$scope.m.name){
					$scope.form.errorModel = true;
					isValid = false;
				}
				if($scope.m.name.toLowerCase() != "other" && ($scope.m.group.name.toLowerCase() == "other" || $scope.m.category.name.toLowerCase() == "other" || $scope.m.brand.name.toLowerCase() == "other")){
					isValid = false;
					Modal.alert("Invaid combination",true);
				}
				if($scope.m.name.toLowerCase() == "other" && ($scope.m.group.name.toLowerCase() != "other" || $scope.m.category.name.toLowerCase() != "other" || $scope.m.brand.name.toLowerCase() != "other")){
					isValid = false;
					Modal.alert("Invaid combination",true);
				}
				if(!$scope.m.isForNew && !$scope.m.isForUsed){
					isValid = false;
					Modal.alert("Please select used equipment or new equipment checkbox",true);
				}
				break;                
		}
		return isValid;
	}
	
	function saveCategory(){
		 MasterDataService.SaveCategory($scope.c).then(function(Info) {
			loadAllCategory();
			if(Info.Code=="SUCCESS"){
				$scope.c={};
			}
				Modal.alert(Info.Message);
			}, function(reason) {
				Modal.alert(reason.Message,true);
		});
	}


	function reset(){
		$scope.groupList = [];
		$scope.categoryList = [];
		$scope.brandList = [];
		$scope.modelList = [];
		$scope.g={};
		$scope.c={};
	    $scope.b={};
	    $scope.m={};
		$scope.submitted = false;
		$scope.groupEdit = false;
		$scope.categoryEdit = false;
		$scope.brandEdit = false;
		$scope.modelEdit = false;
		vm.isForNew = false;
		vm.isForUsed = false;
	}

	$scope.$watch("[g,c,b,m]", function(){
	  $scope.submitted = false;
	  $scope.form = {};
	}, true);

    function makeVisibleHome(modelRef,type,isNew) {
      if(!modelRef.imgSrc && (modelRef.visibleOnUsed || modelRef.visibleOnNew)){
      	  Modal.alert("Please upload image to make it visible on home page.");
      	  if(!isNew)
      	  	modelRef.visibleOnUsed = false;
      	  else
      	  	modelRef.visibleOnNew = false;
      	  return;
      }
      	modelRef.type = type;
      	updateMasterdataStatus(modelRef);
      	
  };

  function updateMasterdataStatus(modelRef){
  	MasterDataService.updateMasterDataStatus(modelRef)
      	.then(function(res){
      		Modal.alert( modelRef.type + " updated successfully.",true);
      		switch(modelRef.type){
				case "Group":
					loadAllGroup();
				break;
				case "Category":
					loadAllCategory();
				break;
				case "Brand":
					loadAllBrand();
				break;
				case "Model":
					loadAllModel();
				break;
			}
      	})
      	.catch(function(err){
      		if(err.data)
      			Modal.alert(res.data);
      	});
  }

    function importMasterData(files,_this){
    	if(!files[0])
    		return;
    	if(files[0].name.indexOf('.xlsx') == -1){
    		Modal.alert('Please upload a valid file');
    		$(_this).val('')
    		return;

    	}
    	$rootScope.loading = true;
	    uploadSvc.upload(files[0],importDir).then(function(result){
	        MasterDataService.importMasterData({fileName : result.data.filename})
	    	.then(function(result){
	    		loadAllGroup();
	    		loadAllCategory();
				loadAllBrand();
				loadAllModel();
	    		$rootScope.loading = false;
	    		Modal.alert(result,true);
	    	})
	    	.catch(function(res){
	    		$rootScope.loading = false;
	    		Modal.alert(res.data,true);
	    	})
	     })
	 }

	 function uploadImage(files,modelRef,type,autoUpdate,key){
	 	if(!files.length)
	 		return;
	 	$rootScope.loading = true;
	 	uploadSvc.upload(files[0],categoryDir).then(function(result){
	 		$rootScope.loading = false;
	 		if(key)
			 modelRef[key] = result.data.filename;
			else
			 modelRef.imgSrc = result.data.filename;
	 		if(autoUpdate && type){
	 			modelRef.type = type;
	 			updateMasterdataStatus(modelRef);
	 		}
	 		
	    })
	    .catch(function(err){
	    	$rootScope.loading = false;
	    });
	 }

	 function deleteClick(type,val){

		 	if(val.name == "Other"){
		 		Modal.alert("Delete not allowed.");
		 		return;
		 	}
	 		var dataToSend = {};
	 		dataToSend["type"] = type;
	 		dataToSend["_id"] = val._id;
	 		Modal.confirm("Are you sure want to delete?",function(ret){
	 			if(ret == "yes")
	 				deleteMasterData(type,dataToSend);
	 		});
	 }

	 function deleteMasterData(type,dataToSend){
	 	MasterDataService.deleteMasterData(dataToSend)
	 	.then(function(){
 			Modal.alert( type + " deleted successfully.");
 			switch(type){
				case "Group":
					loadAllGroup();
				break;
				case "Category":
					loadAllCategory();
				break;
				case "Brand":
					loadAllBrand();
				break;
				case "Model":
					loadAllModel();
				break;
			}

	 		})
	 		.catch(function(res){
	 			Modal.alert(res.data);
	 		})
	 }

	 function editClick(type,val){
	 	if(val.name == "Other"){
	 		Modal.alert("Edit not allowed.");
	 		return;
	 	}
 		switch(type){
			case "Group":
				$scope.g =  jQuery.extend(true, {}, val);
				$scope.groupEdit = true;
			break;
			case "Category":
				$scope.c = jQuery.extend(true, {}, val);
				$scope.categoryEdit = true;
			break;
			case "Brand":
				$scope.brandEdit = true;
				 $scope.b = jQuery.extend(true, {}, val);
				 onGroupChange($scope.b.group);
				 onCategoryChange($scope.b.category);
			break;
			case "Model":
				$scope.modelEdit = true;
				$scope.m = jQuery.extend(true, {}, val);
				 onGroupChange($scope.m.group);
				 onCategoryChange($scope.m.category);
			break;
		}
	 };

	 function update(type){

	 	$scope.submitted = true;
	 	var dataToSend = {};
		if(!validateMasterData(type))
			return;
 		switch(type){
			case "Group":
				 dataToSend = $scope.g;
			break;
			case "Category":
				dataToSend = $scope.c;
				dataToSend.group= filterObject($scope.c.group);
			break;
			case "Brand":
				if($scope.b && !$scope.b.enableHomeBanner){
					$scope.b.homeBannerLeft  = "";
					$scope.b.homeBannerTop = "";
				}
				dataToSend = $scope.b;
				dataToSend.group = filterObject($scope.b.group);
				dataToSend.category = filterObject($scope.b.category);
			break;
			case "Model":
				dataToSend = $scope.m;
				dataToSend.group= filterObject($scope.m.group);
				dataToSend.category = filterObject($scope.m.category);
				dataToSend.brand = filterObject($scope.m.brand);
			break;
		}
		if(dataToSend.name.toLowerCase() == "other"){
	 		Modal.alert("Update not allowed.");
	 		return;
	 	}

		dataToSend['type'] = type;
		updateMasterData(dataToSend);
 		
	 }

	 function updateMasterData(dataToSend){
	 	MasterDataService.updateMasterData(dataToSend)
	 	.then(function(){
 			Modal.alert( dataToSend.type + " updated successfully.",true);
 			loadAllGroup();
 			loadAllCategory();
 			loadAllBrand();
 			loadAllModel();
			reset();
 		})
 		.catch(function(res){
 			Modal.alert(res.data);
 		})
	 }

	 function exportMasterData(level){
	 	MasterDataService.exportMasterData({level:level})
	 	.then(function(result){
	 		saveAs(new Blob([s2ab(result)],{type:"application/octet-stream"}), "masterdatalist_"+ Math.ceil(Math.random()*100) +".csv")
	 	})
	 	.catch(function(res){
	 		//error handling
	 	})
	 }

	function filterObject(obj)
	{
		var retObject = {};
		retObject._id = obj._id;
		retObject.name = obj.name;
		return retObject;
	}
	function checkCategoryFor(category){
		$scope.b.useFor = category.useFor;
		console.log("$scope.b.useFor==",$scope.b.useFor);
	}
	function checkBrandFor(brand){console.log("brand==",brand);
		$scope.m.useFor = brand.useFor;
		console.log("muserfor",$scope.m.useFor);
	}
}

})();
