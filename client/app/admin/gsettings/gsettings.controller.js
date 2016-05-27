(function(){
  'use strict';

angular.module('admin').controller('GSettingCtrl', GSettingCtrl);

//Controller function
function GSettingCtrl($scope,LocationSvc,SubCategorySvc, Modal) {
    var vm = this;
    vm.tabValue = 'sc';
    vm.onSettingChange = onSettingChange;

    vm.subCategory = {};
    vm.subCatEdit = false;
    vm.saveSubCategory = saveSubCategory;
    vm.updateSubCategory = updateSubCategory;
    vm.subCategoryEditClick = subCategoryEditClick;
    vm.deleteSubCategory = deleteSubCategory;

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
    function loadAllSubcategory(){
    	SubCategorySvc.getAllSubCategory()
    	.then(function(result){
    		vm.subCategoryList = result;
    	})
    }

    loadAllState();
    loadAllLocation();
    loadAllSubcategory();

    function onSettingChange(){

    }

    //subcategory functions
    function saveSubCategory(form){
		if(form.$invalid){
			$scope.submitted = true;
			return;
		}
		SubCategorySvc.saveSubCategory(vm.subCategory)
		.then(function(result){
			 vm.subCategory = {};
			 loadAllSubcategory();
		})
    }
 	
 	function updateSubCategory(form){
		if(form.$invalid){
			$scope.submitted = true;
			return;
		}
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
		SubCategorySvc.deleteSubCategory(vm.subCategoryList[idx])
		.then(function(result){
			 loadAllSubcategory();
		})
    }

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
		LocationSvc.deleteLocation(vm.locationList[idx])
		.then(function(result){
			 loadAllLocation();
		})
    }


}
    
})();



  
