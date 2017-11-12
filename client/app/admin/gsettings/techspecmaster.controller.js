(function() {
    'use strict';

angular.module('admin').controller('TechSpecMasterCtrl', TechSpecMasterCtrl);

function TechSpecMasterCtrl($scope,$rootScope,$state,uploadSvc,categorySvc,brandSvc, modelSvc,Modal,TechSpecMasterSvc, Auth,PagerSvc,$filter){
	var vm  = this;
    $scope.isEdit = false;
    $scope.isView = false;
    $scope.pager = PagerSvc.getPager();
    $scope.fieldShow = false;
    $scope.brandList = [];
    $scope.modelList = [];
    vm.save = save;
    vm.fieldSave = fieldSave;
    vm.update = update;
    vm.destroy = destroy;
    vm.editClicked = editClicked;
    vm.fireCommand = fireCommand;
    vm.stateIdArr = [{}];
    vm.fieldInfo = [{}];
    vm.fields = [];
    vm.dataModel = {};
    vm.fieldArr = [{}];
    var initFilter = {};
    var filter = {};
    vm.searchStr = "";
    vm.categoryId = '';
    vm.getTechSpecData = getTechSpecData;
    vm.onCategoryChange = onCategoryChange;
    vm.onBrandChange = onBrandChange;
    vm.uploadTechFile = uploadTechFile;
    vm.onModelChange = onModelChange;
    vm.viewClicked = viewClicked;
    vm.fieldEditClicked = fieldEditClicked;
    vm.onGetCategory = onGetCategory;
    vm.fieldUpdate = fieldUpdate;
    $scope.isFieldEdit = false;
    vm.checkCount = checkCount;
    //vm.checks = [];
    vm.totalChecked = 0;
    
    function init(){
        filter = {};
        initFilter.pagination = true;
        angular.copy(initFilter, filter);
        
        loadViewData(filter);
        getCategoryOnFilter();
        loadViewFieldData(filter);
    } 
    function getTechSpecData(categoryId){
        var filter = {};
        filter['categoryId'] = categoryId;
        loadViewData(filter);
    }
    function getBrandOnFilter(){
        var filter = {};
        filter['isForNew'] = true;
        brandSvc.getBrandOnFilter(filter)
		.then(function(result){console.log("resultbrand==",result)
			$scope.allBrand = result;
			vm.cSearch = "";
			vm.cCurrentPage = 1;
			vm.cTotalItems = result.length;
			
		})

    }
    function getAllField(filter){
        TechSpecMasterSvc.get(filter)
        .then(function(result){
            vm.fieldList = result;
            console.log("fieldList",vm.fieldList);
        });
	}

	
    function onCategoryChange(categoryId, noChange) {console.log('categoryId=',categoryId);
      

      $scope.brandList = [];
      $scope.modelList = [];
      //$scope.product.technicalInfo = {};
      if (!categoryId)
        return;
      var otherBrand = null;
      filter = {};
      filter['categoryId'] = categoryId;
      brandSvc.getBrandOnFilter(filter)
        .then(function(result) {console.log("result==",result);
          $scope.brandList = result;
          getAllField(filter);

        })
        .catch(function(res) {
          console.log("error in fetching brand", res);
        })
    }
    function onGetCategory(categoryId, noChange) {console.log('categoryId=',categoryId);
      

      $scope.brandList = [];
      $scope.modelList = [];
      //$scope.product.technicalInfo = {};
      if (!categoryId)
        return;
      var otherBrand = null;
      filter = {};
      filter['categoryId'] = categoryId;
      brandSvc.getBrandOnFilter(filter)
        .then(function(result) {console.log("result==",result);
          $scope.brandList = result;
        })
        .catch(function(res) {
          console.log("error in fetching brand", res);
        })
    }
    function onBrandChange(brandId, noChange) {
      
      $scope.modelList = [];
      if (!brandId)
        return;
      var otherModel = null;
      filter = {};
      filter['brandId'] = brandId;
      modelSvc.getModelOnFilter(filter)
        .then(function(result) {console.log("resultbrand==",result);
          $scope.modelList = result;
        })
        .catch(function(res) {
          console.log("error in fetching model", res);
        })

    }
    function onModelChange(modelId, noChange) {
      if(modelId){
        $scope.fieldShow = true;
      }else{
        $scope.fieldShow = false;
      }
      
    }
    function getCategoryOnFilter(){
        var filter = {};
        filter['isForNew'] = true;
        categorySvc.getCategoryOnFilter(filter)
		.then(function(result){console.log("resultcat==",result)
			$scope.allCategory = result;
			$scope.filteredCategory = result;
			vm.cSearch = "";
			vm.cCurrentPage = 1;
			vm.cTotalItems = result.length;
			
		})

    }
    function loadViewData(filter){console.log("filter=",filter);
        $scope.pager.copy(filter);
        TechSpecMasterSvc.get(filter)
        .then(function(result){
            vm.listData = result;
            console.log("listData",vm.listData);
            vm.totalItems = result.totalItems;
            $scope.pager.update(result.items, result.totalItems);
        });
    }
    function loadViewFieldData(filter){console.log("filter=",filter);
        $scope.pager.copy(filter);
        TechSpecMasterSvc.getFieldData(filter)
        .then(function(result){
            vm.listFieldData = result;
            console.log("listfieldData",vm.listFieldData);
            vm.totalItems = result.totalItems;
            $scope.pager.update(result.items, result.totalItems);
        });
    }
    function fireCommand(reset){
        if (reset)
            $scope.pager.reset();
        filter = {};
        angular.copy(initFilter, filter);
        if (vm.searchStr)
            filter.searchStr = vm.searchStr;
        loadViewData(filter);
        loadViewFieldData(filter);
    }

    function save(form){
        /*if(form.$invalid){
            $scope.submitted = true;
            return;
        }*/
        var createData = {};
        let objCategory = $scope.allCategory.find(o => o._id === vm.dataModel.categoryId);
        vm.dataModel.categoryName = objCategory.name; 
        console.log("vm.dataModel==",vm.dataModel);
         //vm.dataModel.fields = [];
         //createData.categoryId = vm.dataModel.category.data;
         //createData.categoryName = objCategory.name; 
         var i=0;
        /* if(vm.fieldArr){
            for(var val of vm.fieldArr) {
                    vm.dataModel.fields[i] = {};
                    vm.dataModel.fields[i]['name'] = val.name;
                    vm.dataModel.fields[i]['type'] = val.type;
                    i++;
            }
         }*/
         console.log("vm.fieldArr",vm.fieldArr);
         if(vm.fieldArr){
            for(var val of vm.fieldArr) {
                 var createData = {};
                 console.log("vm.dataModel.category.data=",vm.dataModel.categoryId);
                 console.log("objCategory.name=",objCategory.name);
                    createData.categoryId = vm.dataModel.categoryId;
                    createData.categoryName = objCategory.name;
                    //vm.dataModel.fields[i] = {};
                   // vm.dataModel.fields[i]['name'] = val.name;
                    //vm.dataModel.fields[i]['type'] = val.type;
                    createData.fieldName = val.name;
                    createData.fieldType = val.type;
                    console.log("createData===",createData);
                    TechSpecMasterSvc.save(createData)
                    .then(function(){
                       
                    })
                    .catch(function(err){
                    if(err.data)
                    console.log("hj");
                            //Modal.alert(err.data); 
                    });
                    //i++;
            }
            vm.dataModel = {};
            vm.fieldInfo = [{}];
            resetValue();
            fireCommand(true);
            Modal.alert('Data saved successfully!');
         }
         
         //vm.dataModel.status = true;
        /*TechSpecMasterSvc.save(vm.dataModel)
        .then(function(){
            vm.dataModel = {};
            resetValue();
            fireCommand(true);
            Modal.alert('Data saved successfully!');
        })
        .catch(function(err){
           if(err.data)
                Modal.alert(err.data); 
        });*/
    }
    function uploadTechFile(files,key){console.log("files",files);console.log("key",key);
	 	if(!files.length)
	 		return;
	 	uploadSvc.upload(files[0],categoryDir).then(function(result){
	 		if(key)
			 vm.fields[key] = result.data.filename;
	 		
	    });
	 }
    /*function uploadImage1(files,key){console.log("files==",files[0]);console.log("key==",key);
	 	if(!files.length)
	 		return;
             console.log("categoryDir==",categoryDir);
	 	uploadSvc.upload(files[0],categoryDir).then(function(result){
             console.log("result==",result);
	 		/*if(key)
			 modelRef[key] = result.data.filename;
			else
			 modelRef.imgSrc = result.data.filename;
	 		if(autoUpdate && type){
	 			modelRef.type = type;
	 			//updateMasterdataStatus(modelRef);
	 		}////
	 		
	    });
}*/
    function fieldSave(form){
        /*if(form.$invalid){
            $scope.submitted = true;
            return;
        }*/
        console.log("fields=",vm.fields);
        console.log("check=",vm.checks);
       var createData = {};
         if(vm.fields){
             for(var k in  vm.fields) {
                 var createData = {};
                    createData.categoryId = vm.dataModel.categoryId;
                    //createData.categoryName = objCategory.name;
                   createData.brandId = vm.dataModel.brandId;
                   createData.modelId = vm.dataModel.modelId;
                   createData.fieldId = vm.fieldList[k]._id;
                   createData.fieldName = vm.fieldList[k].fieldName;
                   createData.fieldType = vm.fieldList[k].fieldType;
                   createData.fieldValue = vm.fields[k];
                   createData.isFront = vm.checks[k];
                   TechSpecMasterSvc.saveField(createData)
                    .then(function(){
                       
                    })
                    .catch(function(err){
                    if(err.data)
                    console.log("hj");
                            //Modal.alert(err.data); 
                    });
                    //i++;
            }
            vm.dataModel = {};
            vm.fieldInfo = [{}];
            vm.fields = [{}];
            vm.fieldList = [{}];
            resetValue();
            fireCommand(true);
            Modal.alert('Data saved successfully!');
         }
         
    }
    function editClicked(rowData){
        vm.dataModel = {};
        vm.dataModel = angular.copy(rowData);
        var i=0;
        //vm.fieldInfo = [];
        vm.fieldInfo.name =vm.dataModel.fieldName;
        vm.fieldInfo.type =vm.dataModel.fieldType;
       // vm.dataModel.category.data = vm.dataModel.categoryId;
         /*for(var val of  vm.dataModel.state) {
                vm.stateIdArr[i] = val.data;
                i++;
         }*/
         //console.log("fieldArr==",vm.fieldInfo);
        $scope.isEdit = true;
    }
    function viewClicked(categoryId,brandId,modelId){
       vm.listFieldData = {};
       vm.dataModel.categoryId = categoryId;
       vm.dataModel.brandId = brandId;
       vm.dataModel.modelId = modelId;
       onCategoryChange(categoryId);
       onBrandChange(brandId);
        var filter = {};
        filter['categoryId'] = categoryId;
       TechSpecMasterSvc.get(filter)
        .then(function(result){
            vm.viewFieldList = result;
        });
        filter['brandId'] = categoryId;
        filter['modelId'] = categoryId;
        TechSpecMasterSvc.getFieldData(filter)
        .then(function(result){
            //vm.listFieldData = result;
            result.forEach(function(item){
                vm.listFieldData[item.fieldId] = item;
                // Call asynchronous function, often a save() to DB
                //item.someAsyncCall();
            });

            //vm.totalItems = result.totalItems;
            //$scope.pager.update(result.items, result.totalItems);
        });
        $scope.isView = true;
    }
    function fieldEditClicked(filterData){
       vm.listFieldData = {};
       vm.dataModel.categoryId = filterData.categoryId;
       vm.dataModel.brandId = filterData.brandId;
       vm.dataModel.modelId = filterData.modelId;
       onGetCategory(filterData.categoryId);
       onBrandChange(filterData.brandId);
        var filter = {};
        filter['categoryId'] = filterData.categoryId;
       TechSpecMasterSvc.get(filter)
        .then(function(result){
            vm.viewFieldList = result;
            
        });
        filter['brandId'] = filterData.brandId;
        filter['modelId'] = filterData.modelId;
        TechSpecMasterSvc.getFieldData(filter)
        .then(function(result){
            //vm.listFieldData = result;
            result.forEach(function(item){
                vm.listFieldData[item.fieldId] = item;
                // Call asynchronous function, often a save() to DB
                //item.someAsyncCall();
            });
            var j=0 ;
            vm.editFieldData = {};
            vm.viewFieldList.forEach(function(item){
                var id = item._id;
            if(vm.listFieldData[id]){
                var fieldDataValue = vm.listFieldData[id];
                vm.fields[j] = fieldDataValue.fieldValue;
                vm.checks[j] = fieldDataValue.isFront;
                if(fieldDataValue.isFront)
                vm.totalChecked = vm.totalChecked + 1;
            }
                j++;
            });
           
            //vm.totalItems = result.totalItems;
            //$scope.pager.update(result.items, result.totalItems);
        });
        $scope.isView = false;
        $scope.isFieldEdit = true;
    }

      function update(form){
        /*if(form.$invalid){
            $scope.submitted = true;
            return;
        }*/
        let objCategory = $scope.allCategory.find(o => o._id === vm.dataModel.categoryId);
        vm.dataModel.categoryName = objCategory.name; 
        TechSpecMasterSvc.update(vm.dataModel)
        .then(function(){
            vm.dataModel = {};
            resetValue();
            $scope.isEdit = false;
            fireCommand(true);
            Modal.alert('Data updated successfully!');
        })
        .catch(function(err){
            if(err.data)
                Modal.alert(err.data); 
        });
    }
    function fieldUpdate(form){
        /*if(form.$invalid){
            $scope.submitted = true;
            return;
        }*/
         var createData = {};
        
         if(vm.fields){
             for(var k in  vm.fields) {
                 var createData = {};
                   
                 var fieldId = vm.viewFieldList[k]._id;
                  if(vm.listFieldData[fieldId]){
                      vm.listFieldData[fieldId].fieldValue = vm.fields[k];
                      vm.listFieldData[fieldId].isFront = vm.checks[k];
                     createData = vm.listFieldData[fieldId];
                     TechSpecMasterSvc.fieldUpdate(createData)
                    .then(function(){
                       
                    })
                    .catch(function(err){
                    if(err.data)
                    console.log("hj");
                            //Modal.alert(err.data); 
                    });
                  }else{
                   createData.categoryId = vm.dataModel.categoryId;
                   createData.brandId = vm.dataModel.brandId;
                   createData.modelId = vm.dataModel.modelId;
                   createData.fieldId = vm.viewFieldList[k]._id;
                   createData.fieldName = vm.viewFieldList[k].fieldName;
                   createData.fieldType = vm.viewFieldList[k].fieldType;
                   createData.fieldValue = vm.fields[k];
                   createData.isFront = vm.checks[k];

                   TechSpecMasterSvc.saveField(createData)
                    .then(function(){
                       
                    })
                    .catch(function(err){
                    if(err.data)
                    console.log("hj");
                            //Modal.alert(err.data); 
                    });

                  }
                  
            }
            vm.dataModel = {};
            vm.fieldInfo = [{}];
            vm.fields = [{}];
            vm.listFieldData = [];
            $scope.isFieldEdit = false;
            resetValue();
            fireCommand(true);
            Modal.alert('Data saved successfully!');
         }
    }

    function destroy(id){
      Modal.confirm("Are you sure want to delete?",function(ret){
        if(ret == "yes")
            confirmDestory(id);
        });
    }

    function resetValue() {
      //vm.container = {};
      vm.dataModel= {};
      vm.fieldInfo = [{}];
      vm.fieldArr = {};
      vm.fields = [];
      //vm.container.modelId = "";
      //vm.brandList = [];
    }
    function checkCount(check){
        console.log("check====",check);
        if(check){
            if(vm.totalChecked == 2){
                Modal.alert('You have checked 4 field.If you want to check than unchecked other option');
            }else{
             vm.totalChecked = vm.totalChecked + 1;
            }
        }else{
            vm.totalChecked = vm.totalChecked - 1;
        }
    }
    function confirmDestory(id){
        TechSpecMasterSvc.destroy(id)
        .then(function(){
            fireCommand(true);
        })
         .catch(function(err){
            console.log("purpose err",err);
        });
    }
     //starting point
    Auth.isLoggedInAsync(function(loggedIn){
      if(loggedIn){
          init();
        }else
          $state.go("main");
    });
}

})();