(function() {
    'use strict';

angular.module('admin').controller('TechSpecMasterCtrl', TechSpecMasterCtrl);

function TechSpecMasterCtrl($scope,$rootScope,$state,$window,uploadSvc,categorySvc,brandSvc, modelSvc,Modal,TechSpecMasterSvc, Auth,PagerSvc,$filter){
    var vm  = this;
    $scope.pager = PagerSvc.getPager();
    vm.tabVal = "techSpec";
    $scope.isEdit = false;
    $scope.isView = false;
    $scope.fieldShow = false;
   
    vm.save = save;
    vm.fieldSave = fieldSave;
    vm.update = update;
    vm.fieldUpdate = fieldUpdate;
    vm.destroy = destroy;
    vm.editClicked = editClicked;
    vm.fieldEditClicked = fieldEditClicked;
    vm.viewClicked = viewClicked;
    vm.closeView = closeView;
    vm.fireCommand = fireCommand;
    $scope.onTabClick = onTabClick;
    vm.onCategoryChange = onCategoryChange;
    vm.onBrandChange = onBrandChange;
    vm.onModelChange = onModelChange;
    vm.checkCount = checkCount;
    vm.getTechSpecData = getTechSpecData;
    //vm.exportExcel = TechSpecMasterSvc.exportExcel;
    vm.exportExcel = exportExcel;

    vm.searchStr = "";
    vm.fieldList =[];
   
    function init(){
        setViewState();
        loadViewData({});
        loadCategory();
    }

    function onTabClick(tabVal){
      vm.tabVal = tabVal;
      setViewState();
      fireCommand(true);
    }

    function getTechSpecData(categoryId){
        var filter = {};
        setViewState();
        vm.dataModel.categoryId = categoryId;
        filter['categoryId'] = categoryId;
        $scope.pager.reset();
        loadViewData(filter);
    }

    function getAllField(filter){
      if($scope.isView)
        return;
      TechSpecMasterSvc.get(filter)
      .then(function(result){
          vm.fieldList = result;
          prepareFieldList();
      });
	 }
	
    function onCategoryChange(categoryId, noChange) {
      if (!noChange) {
        vm.dataModel.brand = {};
        vm.dataModel.model = {};
      }
      $scope.brandList = [];
      $scope.modelList = [];
      if (!categoryId)
        return;
      var filter = {};
      filter.categoryId = categoryId;
      filter.isForNew = true;
      brandSvc.getBrandOnFilter(filter)
        .then(function(result) {
          $scope.brandList = result;
          getAllField(filter);
        })
        .catch(function(res) {
          console.log("error in fetching category", res);
        })
    }

    function onBrandChange(brandId, noChange) {
      if (!noChange) {
        vm.dataModel.model = {};
      }

      $scope.modelList = [];
      if (!brandId)
        return;
      var filter = {};
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
      var filter = {};
      if(vm.dataModel.category.categoryId && vm.dataModel.brand.brandId && vm.dataModel.model.modelId) {
        filter.categoryId = vm.dataModel.category.categoryId;
        filter.brandId = vm.dataModel.brand.brandId;
        filter.modelId = vm.dataModel.model.modelId;
        $scope.fieldShow = false;
        TechSpecMasterSvc.getFieldData(filter)
        .then(function(result){
            if(result.length != 0){
              Modal.alert('You have already added this model field so you can edit only!');
            }else{
              $scope.fieldShow = true;
            }
        });
      }
    }

    function loadCategory(){
      var filter = {};
      filter.isForNew = true;
      categorySvc.getCategoryOnFilter(filter)
  		.then(function(result){
  			$scope.allCategory = result;
  		})
    }

    function loadViewData(filter){
        $scope.pager.copy(filter);
        filter.pagination = true;
        TechSpecMasterSvc.get(filter)
        .then(function(result){
            vm.totalItems = result.items;
            $scope.pager.update(result.items,result.totalItems);
        });
    }

    function loadViewFieldData(filter){
        $scope.pager.copy(filter);
        filter.pagination = true;
        TechSpecMasterSvc.getFieldData(filter)
        .then(function(result){
            vm.totalItems = result.items;
            $scope.pager.update(result.items,result.totalItems);
        });
    }

    function fireCommand(reset){
        if (reset)
            $scope.pager.reset();
        var filter = {};
        if (vm.searchStr)
            filter.searchStr = vm.searchStr;
        switch (vm.tabVal) {
          case "techSpec":
              loadViewData(filter);
              break;
          case "techSpecValue":
              loadViewFieldData(filter);
              break;
        }
    }

    function save(form){

        if(form.$invalid){
            $scope.submitted = true;
            return;
        }
        if(!vm.dataModel.fields.length)
          return;
        var dataArr = [];
        var createData = {};
        var  objCategory = categorySvc.getCategoryOnId(vm.dataModel.categoryId);
        vm.dataModel.categoryName = objCategory.name;
        vm.dataModel.fields.forEach(function(item){
          var obj = {};
          obj.categoryId = vm.dataModel.categoryId;
          obj.categoryName = objCategory.name;
          obj.fieldName = item.name;
          obj.fieldType = item.type;
          dataArr.push(obj);
        });

        TechSpecMasterSvc.save(dataArr)
        .then(function(){
          setViewState();
          fireCommand(true);
          Modal.alert('Data saved successfully!');
        })
        .catch(function(err){
          if(err.data)
            console.log(err.data);
        });
    }

    function fieldSave(form){
      if(form.$invalid){
          $scope.submitted = true;
          return;
      }
      vm.dataModel.fields = vm.dataModel.fields.filter(function(item, idx) {
        if(!item.isFront)
          delete item.priority;

        if (item && (item.value))
          return true;
        else
          return false;
      });
      if(!vm.dataModel.fields.length)
        return;

      setMasterData();
      TechSpecMasterSvc.saveField(vm.dataModel)
        .then(function(){
          setViewState();
          fireCommand(true);
          Modal.alert('Data saved successfully!');
        })
        .catch(function(err){
        if(err.data)
          console.log(err); 
        });
    }

    function setMasterData(){

      var category = categorySvc.getCategoryOnId(vm.dataModel.category.categoryId);
      if(category)
         vm.dataModel.category.name = category.name;
      $scope.brandList.forEach(function(item){
        if(item._id === vm.dataModel.brand.brandId){
            vm.dataModel.brand.name = item.name; 
        }
      });
      $scope.modelList.forEach(function(item){
        if(item._id === vm.dataModel.model.modelId){
            vm.dataModel.model.name = item.name; 
        }
      });
    }

    function editClicked(rowData){
        $window.scrollTo(0, 0);
        vm.dataModel = angular.copy(rowData);
        $scope.isEdit = true;
    }

    function viewClicked(filterData){
      $scope.isFieldEdit = false;
      $scope.isView = true;
      $scope.fieldShow = false;
      vm.listFieldData = {};
      angular.copy(filterData, vm.dataModel);
      onCategoryChange(vm.dataModel.category.categoryId, true);
      onBrandChange(vm.dataModel.brand.brandId, true);
    }

    function fieldEditClicked(filterData){
      $scope.isView = false;
      $scope.isFieldEdit = true;
      $scope.fieldShow = true;
      angular.copy(filterData, vm.dataModel);
      onCategoryChange(vm.dataModel.category.categoryId, true);
      onBrandChange(vm.dataModel.brand.brandId, true);
    }

    function update(form){
      if(form.$invalid){
          $scope.submitted = true;
          return;
      }
     var  objCategory = categorySvc.getCategoryOnId(vm.dataModel.categoryId);
     vm.dataModel.categoryName = objCategory.name; 
      TechSpecMasterSvc.update(vm.dataModel)
      .then(function(){
          setViewState();
          fireCommand(true);
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
      vm.dataModel.fields = vm.dataModel.fields.filter(function(item, idx) {
        if(!item.isFront)
          delete item.priority;
        if (item && (item.value))
          return true;
        else
          return false;
      });
      if(!vm.dataModel.fields.length)
        return;
      setMasterData();
      TechSpecMasterSvc.fieldUpdate(vm.dataModel)
        .then(function(){
          setViewState();
          fireCommand(true);
          Modal.alert('Data updated successfully!');
        })
        .catch(function(err){
        if(err.data)
          console.log(err); 
        });
    }

    function closeView(){
        setViewState();
        $scope.isView = false;
    }

    function destroy(id, value){
      Modal.confirm("Are you sure want to delete?",function(ret){
        if(ret == "yes")
            confirmDestory(id, value);
        });
    }

    function setViewState(){
      $scope.isEdit = false;
      $scope.fieldShow = false;
      $scope.submitted = false;
      $scope.isView = false;
      $scope.isFieldEdit = false;
      vm.dataModel = {};
      vm.dataModel.fields = [{}];
      if(vm.tabVal == 'techSpecValue'){
        vm.dataModel.category = {};
        vm.dataModel.brand = {};
        vm.dataModel.model = {};

      }
    }

    function prepareFieldList(){
      if(!$scope.isFieldEdit)
        vm.dataModel.fields = [];

      vm.fieldList.forEach(function(item){
        var isField = checkField(item);
        if(!isField){
          var obj = {};
          obj.name = item.fieldName;
          obj.fieldId = item._id;
          obj.type = item.fieldType || "text";
          obj.isFront = false;
          vm.dataModel.fields.push(obj);
        }

      });
    }

    function checkField(field){
      var retVal = false;
      if(!$scope.isFieldEdit)
        return retVal;
      for(var i = 0;i < vm.dataModel.fields.length;i++){
        if(field._id === vm.dataModel.fields[i].fieldId){
          retVal = true;
          break;
        }
      }
      return retVal;
    }

    function checkCount(field){
      var count = 0;
       vm.dataModel.fields.forEach(function(item){
          if(item.isFront)
            count ++;
          else
            field.priority = 0
       });
       if(count > 4){
        Modal.alert('You have checked 4 field.If you want to check than unchecked other option');
        field.isFront = false;
       }
    }

    function confirmDestory(id, value){
      if(value === 'techSpec') {
        TechSpecMasterSvc.destroy(id)
        .then(function(){
            fireCommand(true);
        })
         .catch(function(err){
            console.log("purpose err",err);
        });
      } else {
        TechSpecMasterSvc.destroyFieldValue(id)
        .then(function(){
            fireCommand(true);
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
    
    function exportExcel(reqParam){
        var filter = {};
        if(reqParam==='category'){
            filter.type = "techspec";
        }
        else{
           filter.type = "techspecbrand"; 
        }
        var exportObj = {filter:filter};
        exportObj.method = "GET";
        exportObj.action = "api/techspec/export";
        $scope.$broadcast("submit",exportObj);
    }
}

})();