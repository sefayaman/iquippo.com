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
	vm.updateCategoryStatus = updateCategoryStatus;
	vm.update = update;
	vm.deleteClick = deleteClick;
	vm.editClick = editClick;
	vm.exportMasterData = exportMasterData;
	vm.searchFn = searchFn;

	//methods in scope
	$scope.updateCategoryImg = updateCategoryImg;
	$scope.importMasterData = importMasterData;
	$scope.getStatus = getStatus;

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
		})
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
				vm.gCurrentPage = 1;
				vm.gTotalItems = $scope.filteredGroup.length;
			break;

			case "category":
				$scope.filteredCategory = $filter('filter')($scope.allCategory,vm.cSearch);
				vm.cCurrentPage = 1;
				vm.cTotalItems = $scope.filteredCategory.length;
			break;
			
			case "brand":
				$scope.filteredBrand = $filter('filter')($scope.allBrand,vm.bSearch);
				vm.bCurrentPage = 1;
				vm.bTotalItems = $scope.filteredBrand.length;
			break;
			
			case "model":
				$scope.filteredModel = $filter('filter')($scope.allModel,vm.mSearch);
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
				if($scope.b.name.toLowerCase() != "other" && ($scope.b.group.name.toLowerCase() == "other" || $scope.b.category.name.toLowerCase() == "other")){
					isValid = false;
					Modal.alert("Invaid combination",true);
				}
				if($scope.b.name.toLowerCase() == "other" && ($scope.b.group.name.toLowerCase() != "other" || $scope.b.category.name.toLowerCase() != "other")){
					isValid = false;
					Modal.alert("Invaid combination",true);
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
	}

	$scope.$watch("[g,c,b,m]", function(){
	  $scope.submitted = false;
	  $scope.form = {};
	}, true);

    function updateCategoryStatus(category) {
      if(!category.imgSrc && category.status){
      	  Modal.alert("Please upload category image to make it active.");
      	  category.status = false;
      	  return;
      }
       updateCategory(category);
  };

  function updateCategory(category){
      categorySvc.updateCategory(category).then(function(result){
        $rootScope.loading = false;
       if(result.errorCode){
          Modal.alert(result.message);
        }
        else{
        	loadAllCategory();
           Modal.alert("Category Updated",true);
        }
      });
  }

  //listen for the file selected event
    $scope.$on("fileSelected", function (event, args) {
    	if(args.files.length == 0)
        	return;
        $scope.$apply(function () {            
            $scope.fileObj.file = args.files[0];
            $scope.fileObj.imgSrc = args.files[0].name;
            $scope.c.imgSrc = args.files[0].name;
        });
    });


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

	 function updateCategoryImg(files,_this){
	 	if(!files[0])
	 		return;
	 	var index = parseInt($(_this).data('index'));
	 	uploadSvc.upload(files[0],categoryDir).then(function(result){
	 		$scope.filteredCategory[index].imgSrc = result.data.filename;
	 		updateCategory($scope.filteredCategory[index]);
	    })
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
		if(type == "Category" && $scope.fileObj.file){
			uploadSvc.upload($scope.fileObj.file,categoryDir).then(function(result){
				  $scope.fileObj = {};
		          dataToSend.imgSrc = result.data.filename;
		          updateMasterData(dataToSend);
		    });
		}else
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
	 		saveAs(new Blob([s2ab(result)],{type:"application/octet-stream"}), "masterdatalist_"+ Math.ceil(Math.random()*100) +".xlsx")
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

}

})();
