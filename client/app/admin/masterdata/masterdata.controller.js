'use strict';

angular.module('sreizaoApp')
.controller('MasterDataCtrl',['$scope','$rootScope', '$http', 'MasterDataService', 'DTOptionsBuilder','groupSvc','modelSvc','categorySvc','brandSvc', 'Modal', 'uploadSvc', 
	function($scope, $rootScope, $http, MasterDataService, DTOptionsBuilder, groupSvc, modelSvc, categorySvc, brandSvc, Modal, uploadSvc) {
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
    $scope.refresh1 = false;
    var vm = this;
 	$scope.dtOptions = DTOptionsBuilder.newOptions().withOption('bFilter', true).withOption('lengthChange', true).withPaginationType('full_numbers')
        .withDisplayLength(100);

    //edit flag
    $scope.groupEdit = false;
	$scope.categoryEdit = false;
	$scope.brandEdit = false;
	$scope.modelEdit = false;

    $scope.onGroupChange = function(group){
    //$scope.c={};
    //$scope.b={};
    $scope.categoryList = [];
    $scope.brandList = [];
    if(!group)
      return;
    //$scope.categoryList = [];
    var otherCategory = null;  
    $scope.categoryList = $rootScope.allCategory.filter(function(d){
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

 	$scope.getStatus = function(status){
    if(status == true)
      return "Active";
    else 
      return "Inactive";
    }

  $scope.onCategoryChange = function(category){
  	//$scope.b={};
  	$scope.brandList = [];
    if(!category)
      return;
    //$scope.brandList = [];
    var otherBrand = null;  
    $scope.brandList = $rootScope.allBrand.filter(function(d){
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
  
	$scope.Save =function(Type)
	{	$scope.submitted = true;
		if(!validateMasterData(Type))
			return;
		switch (Type)
		{	
			case "Group":
				MasterDataService.SaveGroup($scope.g).then(function(Info) {
					groupSvc.getAllGroup();
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
				brandSvc.getAllBrand();
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
					modelSvc.getAllModel();
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
				break;                
		}
		return isValid;
	}
	
	function saveCategory(){
		 MasterDataService.SaveCategory($scope.c).then(function(Info) {
			categorySvc.getAllCategory();
			if(Info.Code=="SUCCESS"){
				$scope.c={};
			}
				Modal.alert(Info.Message);
			}, function(reason) {
				Modal.alert(reason.Message,true);
		});
	}


	$scope.reset = function(){
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

    $scope.updateCategoryStatus = function(category) {
      $rootScope.loading = true;
      if(category.status){
        //dataToSend['position'] = category.position;
         dataToSend["status"] = true;
        $http.post('/api/category/search', dataToSend).success(function(srchres){
            if(srchres.length > 7) {
                category.status = false;
                $rootScope.loading = false;
                Modal.alert("Eight categories are already selected for display. Please deactivate any one to select another.");
                return;
            }else
              updateCategory(category);
          });
      }else
        updateCategory(category);
     
      
  };

  function updateCategory(category){
      categorySvc.updateCategory(category).then(function(result){
        $rootScope.loading = false;
       if(result.data.errorCode){
          Modal.alert(result.data.message);
        }
        else{
        	categorySvc.getAllCategory();
           Modal.alert("Category Updated",true);
        }
      });
  }

  //listen for the file selected event
    $scope.$on("fileSelected", function (event, args) {
    	if(args.files.length == 0)
        	return;
        $scope.$apply(function () {            
            //add the file object to the scope's files collection
            //$scope.imgSrc = "";
            $scope.fileObj.file = args.files[0];
            $scope.fileObj.imgSrc = args.files[0].name;
            $scope.c.imgSrc = args.files[0].name;
        });
    });


    $scope.importMasterData = function(files,_this){
    	if(!files[0])
    		return;
    	if(files[0].name.indexOf('.xlsx') == -1){
    		Modal.alert('Please upload a valid file');
    		$(_this).val('')
    		return;

    	}
    	$rootScope.loading = true;
	    uploadSvc.upload(files[0],importDir).then(function(result){

	        $http.post('/api/common/importMasterData',{fileName : result.data.filename})
	    	.then(function(res){
	    		groupSvc.getAllGroup();
	    		categorySvc.getAllCategory();
	    		modelSvc.getAllModel();
	    		brandSvc.getAllBrand();
	    		$rootScope.loading = false;
	    		Modal.alert(res.data,true);
	    	},function(res){
	    		$rootScope.loading = false;
	    		Modal.alert(res.data,true);
	    	})
	     })
	 }

	 $scope.updateCategoryImg = function(files,_this){
	 	if(!files[0])
	 		return;
	 	var index = parseInt($(_this).data('index'));
	 	uploadSvc.upload(files[0],categoryDir).then(function(result){
	 		$rootScope.allCategory[index].imgSrc = result.data.filename;
	 		updateCategory($rootScope.allCategory[index]);
	    })
	 }

	 $scope.delete = function(type,val){
	 		var dataToSend = {};
	 		dataToSend["type"] = type;
	 		dataToSend["_id"] = val._id;
	 		Modal.confirm("Are you sure want to delete?",function(ret){
	 			if(ret == "yes")
	 				vm.delete(type,dataToSend);
	 		});
	 }

	 vm.delete = function(type,dataToSend){
	 	$http.post("/api/common/deleteMasterData",dataToSend)
	 		.success(function(){
	 			Modal.alert( type + " deleted successfully.");
	 			switch(type){
					case "Group":
						groupSvc.getAllGroup();
					break;
					case "Category":
						categorySvc.getAllCategory();
					break;
					case "Brand":
						brandSvc.getAllBrand();
					break;
					case "Model":
						modelSvc.getAllModel();
					break;
				}

	 		})
	 		.error(function(res){
	 			Modal.alert(res);
	 		})
	 }
	 $scope.editClick = function(type,val){
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
				 $scope.onGroupChange($scope.b.group);
				 $scope.onCategoryChange($scope.b.category);
			break;
			case "Model":
				$scope.modelEdit = true;
				$scope.m = jQuery.extend(true, {}, val);
				 $scope.onGroupChange($scope.m.group);
				 $scope.onCategoryChange($scope.m.category);
			break;
		}
	 };

	 $scope.update = function(type){

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
		dataToSend['type'] = type;
		if(type == "Category" && $scope.fileObj.file){
			uploadSvc.upload($scope.fileObj.file,categoryDir).then(function(result){
				  $scope.fileObj = {};
		          dataToSend.imgSrc = result.data.filename;
		          vm.updateMasterData(dataToSend);
		    });
		}else
			vm.updateMasterData(dataToSend);
 		
	 }

	 vm.updateMasterData = function(dataToSend){
	 	$http.post("/api/common/updateMasterData",dataToSend)
 		.success(function(){
 			Modal.alert( dataToSend.type + " updated successfully.",true);
 			groupSvc.getAllGroup();
			brandSvc.getAllBrand();
			modelSvc.getAllModel();
			categorySvc.getAllCategory();
			$scope.reset();
 		})
 		.error(function(res){
 			Modal.alert(res);
 		})
	 }
	function filterObject(obj)
	{
		var retObject = {};
		retObject._id = obj._id;
		retObject.name = obj.name;
		return retObject;
	}

}]);
