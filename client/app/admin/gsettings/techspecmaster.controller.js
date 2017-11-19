(function() {
    'use strict';

angular.module('admin').controller('TechSpecMasterCtrl', TechSpecMasterCtrl);

function TechSpecMasterCtrl($scope,$rootScope,$state,uploadSvc,categorySvc,brandSvc, modelSvc,Modal,TechSpecMasterSvc, Auth,PagerSvc,$filter){
	var vm  = this;
    vm.techform;
    $scope.isEdit = false;
    $scope.isView = false;
    $scope.pager = PagerSvc.getPager();
    $scope.fieldShow = false;
    // $scope.brandList = [];
    // $scope.modelList = [];
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
    vm.fieldUpdate = fieldUpdate;
    $scope.isFieldEdit = false;
    vm.checkCount = checkCount;
    vm.loadGroupByData = loadGroupByData;
    vm.checks = [];
    vm.totalChecked = 0;
    $scope.disArr = [];
    vm.closeView = closeView;

    vm.dataModel.category = {};
    vm.dataModel.brand = {};
    vm.dataModel.model = {};
    vm.container = {};
    vm.dataModel.fields = [{}];
    vm.listFieldDataShow = [];
    //vm.checkRecord = checkRecord;
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
    
    /*function getBrandOnFilter(){
        var filter = {};
        filter['isForNew'] = true;
        brandSvc.getBrandOnFilter(filter)
		.then(function(result){
			$scope.allBrand = result;
			vm.cSearch = "";
			vm.cCurrentPage = 1;
			vm.cTotalItems = result.length;
			
		})
    }*/

    function getAllField(filter){
      if($scope.isView)
        return;
      vm.fieldList =[];
      TechSpecMasterSvc.get(filter)
      .then(function(result){
          vm.fieldList = result;
      });
	 }
	
    function onCategoryChange(categoryId, noChange) {
      if (!noChange) {
        vm.dataModel.brand = {};
        vm.dataModel.model = {};
        vm.dataModel.category = {};
        if (categoryId) {
          var ct = categorySvc.getCategoryOnId(categoryId);
          vm.dataModel.category.categoryId = ct._id;
          vm.dataModel.category.name = ct.name;
        } else {
          vm.dataModel.category = {};
        }
        vm.container.brandId = "";
        vm.container.modelId = "";
      }

      $scope.brandList = [];
      $scope.modelList = [];
      if (!categoryId)
        return;
      
      filter = {};
      filter.categoryId = categoryId;
      filter.isForNew = true;
      brandSvc.getBrandOnFilter(filter)
        .then(function(result) {
          $scope.brandList = result;
          if(!$scope.isView && !$scope.isFieldEdit)
            getAllField(filter);
        })
        .catch(function(res) {
          console.log("error in fetching brand", res);
        })
    }

    function onBrandChange(brandId, noChange) {
      if (!noChange) {
        vm.dataModel.model = {};

        if (brandId) {
          var brd = [];
          brd = $scope.brandList.filter(function(item) {
            return item._id == brandId;
          });
          if (brd.length == 0)
            return;
          vm.dataModel.brand.brandId = brd[0]._id;
          vm.dataModel.brand.name = brd[0].name;
        } else {
          vm.dataModel.brand = {};
        }
        vm.container.modelId = "";
      }

      $scope.modelList = [];
      if (!brandId)
        return;
      
      filter = {};
      filter.brandId = brandId;
      filter.isForNew = true;
      modelSvc.getModelOnFilter(filter)
        .then(function(result) {
          $scope.modelList = result;
        })
        .catch(function(res) {
          console.log("error in fetching model", res);
        })

    }
    function onModelChange(modelId, noChange) {
      if (!modelId) {
        vm.dataModel.model = {};
        return;
      }
      var md = null;
      for (var i = 0; i < $scope.modelList.length; i++) {
        if ($scope.modelList[i]._id == modelId) {
          md = $scope.modelList[i];
          break;
        }
      }
      vm.dataModel.model = {};
      if (md) {
        vm.dataModel.model.modelId = md._id;
        vm.dataModel.model.name = md.name;
      } else
        vm.dataModel.model = {};

      var filter = {};
      if(vm.dataModel.category.categoryId && vm.dataModel.brand.brandId && vm.dataModel.model.modelId) {
        filter.categoryId = vm.container.categoryId;
        filter.brandId = vm.container.brandId;
        filter.modelId = vm.container.modelId;
        TechSpecMasterSvc.getFieldData(filter)
        .then(function(result){
            if(result.length != 0){
              Modal.alert('You have already added this model field so you can edit only!');
            }else{
              if(modelId){
                $scope.fieldShow = true;
              } else {
                $scope.fieldShow = false;
              }
            }
        });
      }
    }
    function getCategoryOnFilter(){
      var filter = {};
      filter.isForNew = true;
      categorySvc.getCategoryOnFilter(filter)
  		.then(function(result){
  			$scope.allCategory = result;
  		})
    }
    function loadViewData(filter){
        $scope.pager.copy(filter);
        TechSpecMasterSvc.get(filter)
        .then(function(result){
            vm.listData = result;
            vm.totalItems = result.totalItems;
            $scope.pager.update(result.items, result.totalItems);
        });
    }
    function loadViewFieldData(filter){
        $scope.pager.copy(filter);
        TechSpecMasterSvc.getFieldData(filter)
        .then(function(result){
            //vm.listFieldData = result;
            vm.listFieldDataShow = result.items;
            $scope.pager.update(result.items, result.totalItems);
        });
    }
    function loadGroupByData(filter){
        //$scope.pager.copy(filter);
        TechSpecMasterSvc.getGroupByData(filter)
        .then(function(result){
            vm.listGroupByData = result;
           
        });
    }
    function fireCommand(reset,requestFor){
        if (reset)
            $scope.pager.reset();
        filter = {};
        angular.copy(initFilter, filter);
        if (vm.searchStr)
            filter.searchStr = vm.searchStr;
        switch (requestFor) {
          case "techSpec":
              loadViewData(filter);
              break;
          case "techSpecValue":
              loadViewFieldData(filter);
              break;
        }
        // loadViewData(filter);
        // loadViewFieldData(filter);
    }

    function save(form){
        if(form.$invalid){
            $scope.submitted = true;
            return;
        }
        
        var createData = {};
        let objCategory = $scope.allCategory.find(o => o._id === vm.dataModel.categoryId);
        vm.dataModel.categoryName = objCategory.name; 
         if(vm.fieldArr){
            //for(var val of vm.fieldArr) {
            for(var k in  vm.fieldArr) {
              var createData = {};
              createData.categoryId = vm.dataModel.categoryId;
              createData.categoryName = objCategory.name;
              createData.fieldName = vm.fieldArr[k].name;//val.name;
              createData.fieldType = vm.fieldArr[k].type;//val.type;
              TechSpecMasterSvc.save(createData)
              .then(function(){
              })
              .catch(function(err){
              if(err.data)
                console.log(err);
              });
            }
            vm.dataModel = {};
            vm.fieldInfo = [{}];
            resetValue();
            fireCommand(true,'techSpec');
            Modal.alert('Data saved successfully!');
         }
    }
    function uploadTechFile(files,key){
	 	if(!files.length)
	 		return;
	 	uploadSvc.upload(files[0],categoryDir).then(function(result){
	 		if(key)
			 vm.fields[key] = result.data.filename;
	 		
	    });
	  }

    function fieldSave(form){
      if(form.$invalid){
          $scope.submitted = true;
          return;
      }
      vm.dataModel.fields = [];
      if(vm.fields){
        for(var k in  vm.fields) {
          var createData = {};
          createData.fieldId = vm.fieldList[k]._id;
          createData.name = vm.fieldList[k].fieldName;
          createData.type = vm.fieldList[k].fieldType;
          createData.value = vm.fields[k];
          createData.isFront = vm.checks[k] || false;
          vm.dataModel.fields[vm.dataModel.fields.length] = createData;
        }
        
      }
      vm.dataModel.fields = vm.dataModel.fields.filter(function(item, idx) {
        if (item && (item.value))
          return true;
        else
          return false;
      });

      TechSpecMasterSvc.saveField(vm.dataModel)
        .then(function(){
          resetTechValue();
          fireCommand(true,'techSpecValue');
          Modal.alert('Data saved successfully!');
        })
        .catch(function(err){
        if(err.data)
        console.log(err);
          //Modal.alert(err.data); 
        });
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
    function viewClicked(filterData){
      $scope.isFieldEdit = false;
      $scope.isView = true;
      $scope.fieldShow = false;
      vm.listFieldData = {};
      angular.copy(filterData, vm.dataModel);
      vm.container.categoryId = vm.dataModel.category.categoryId;
      onCategoryChange(vm.dataModel.category.categoryId, true);
      onBrandChange(vm.dataModel.brand.brandId, true);
      vm.container.brandId = vm.dataModel.brand.brandId;
      //onModelChange(vm.dataModel.model.modelId, true);
      vm.container.modelId = vm.dataModel.model.modelId;
      var filter = {};
      filter.categoryId = vm.dataModel.category.categoryId;
      TechSpecMasterSvc.get(filter)
      .then(function(result){
        vm.fieldList =[];
        vm.fieldList = result;
        filter.brandId = vm.dataModel.brand.brandId;
        filter.modelId = vm.dataModel.model.modelId;
        TechSpecMasterSvc.getFieldData(filter)
          .then(function(result){
            result[0].fields.forEach(function(item){
                vm.listFieldData[item.fieldId] = item;
            });
          });
      });
      //getAllField(filter);
      
    }
    function fieldEditClicked(filterData){
      $scope.isView = false;
      $scope.isFieldEdit = true;
      $scope.fieldShow = true;
      angular.copy(filterData, vm.dataModel);
      vm.container.categoryId = vm.dataModel.category.categoryId;
      onCategoryChange(vm.dataModel.category.categoryId, true);
      onBrandChange(vm.dataModel.brand.brandId, true);
      vm.container.brandId = vm.dataModel.brand.brandId;
      //onModelChange(vm.dataModel.model.modelId, true);
      vm.container.modelId = vm.dataModel.model.modelId;
      var filter = {};
      filter.categoryId = vm.dataModel.category.categoryId;
      TechSpecMasterSvc.get(filter)
      .then(function(result){
        vm.fieldList =[];
        vm.fieldList = result;
        vm.fieldsArr =[];
        angular.copy(filterData.fields, vm.fieldsArr);
          if(vm.fieldsArr){
            for(var k in  vm.fieldsArr) {
              vm.fields[k] = vm.fieldsArr[k].value;
              vm.checks[k] = vm.fieldsArr[k].isFront;
            }
        }
      });
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
            fireCommand(true, 'techSpec');
            Modal.alert('Data updated successfully!');
        })
        .catch(function(err){
            if(err.data)
                Modal.alert(err.data); 
        });
    }

    function fieldUpdate(form){
       if(form.$invalid){
        $scope.submitted = true;
        return;
      }
      vm.dataModel.fields = [];
      if(vm.fields){
        for(var k in  vm.fields) {
          var createData = {};
          createData.fieldId = vm.fieldList[k]._id;
          createData.name = vm.fieldList[k].fieldName;
          createData.type = vm.fieldList[k].fieldType;
          createData.value = vm.fields[k];
          createData.isFront = vm.checks[k] || false;
          vm.dataModel.fields[vm.dataModel.fields.length] = createData;
        }
      }
      vm.dataModel.fields = vm.dataModel.fields.filter(function(item, idx) {
        if (item && (item.value))
          return true;
        else
          return false;
      });

      TechSpecMasterSvc.fieldUpdate(vm.dataModel)
        .then(function(){
          resetTechValue();
          fireCommand(true,'techSpecValue');
          Modal.alert('Data updated successfully!');
        })
        .catch(function(err){
        if(err.data)
        console.log(err);
          //Modal.alert(err.data); 
        });
    }

    function closeView(){
        resetTechValue();
        fireCommand(true,'techSpecValue');
    }
    function resetTechValue() {
      filter = {};
      $scope.isFieldEdit = false;
      $scope.isView = false;
      $scope.fieldShow = false;
      vm.dataModel = {};
      vm.fields = [];
      vm.checks = [];
      $scope.brandList = [];
      $scope.modelList = [];
      vm.dataModel.category = {};
      vm.dataModel.brand = {};
      vm.dataModel.model = {};
      vm.container = {};
      vm.dataModel.fields = [{}];
    }

    function destroy(id, value){
      Modal.confirm("Are you sure want to delete?",function(ret){
        if(ret == "yes")
            confirmDestory(id, value);
        });
    }

    function resetValue() {
      vm.dataModel= {};
      vm.fieldInfo = [{}];
      vm.fieldArr = {};
      vm.fields = [];
    }
    function checkCount(check){
       
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
    function confirmDestory(id, value){
      if(value === 'techSpec') {
        TechSpecMasterSvc.destroy(id)
        .then(function(){
            fireCommand(true, "'techSpec");
        })
         .catch(function(err){
            console.log("purpose err",err);
        });
      } else {
        TechSpecMasterSvc.destroyFieldValue(id)
        .then(function(){
            fireCommand(true, 'techSpecValue');
        })
         .catch(function(err){
            console.log("purpose err",err);
        });
      }
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