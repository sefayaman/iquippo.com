(function() {
    'use strict';

angular.module('admin').controller('InputFormMasterCtrl', InputFormMasterCtrl);

function InputFormMasterCtrl($scope,$rootScope,$state,categorySvc, modelSvc, brandSvc, Modal,Auth,PagerSvc,$filter,InputFormMasterSvc){
	var vm  = this;
    vm.dataModel = {};
    $scope.isEdit = false;
    $scope.pager = PagerSvc.getPager();

    vm.save = save;
    vm.update = update;
    vm.destroy = destroy;
    vm.editClicked = editClicked;
    vm.fireCommand = fireCommand;
    vm.onCategoryChange = onCategoryChange;
    vm.onBrandChange = onBrandChange;
    vm.onModelChange = onModelChange;
    vm.dataModel.category = {};
    vm.dataModel.brand = {};
    vm.dataModel.model = {};
    vm.dataModel.additionalInfo = [{}];
    var initFilter = {};
    var filter = {};
    vm.searchStr = "";

    function init(){
        filter = {};
        initFilter.pagination = true;
        angular.copy(initFilter, filter);
        loadAllCategory();
        loadViewData(filter);
    } 

    function loadAllCategory() {
        categorySvc.getAllCategory()
        .then(function(result) {
            vm.allCategory = result;
        });
    }

    function onCategoryChange(categoryId, noChange) {
      if (!noChange) {
        vm.dataModel.brand = {};
        vm.dataModel.model = {};
        if (categoryId) {
          var ct = categorySvc.getCategoryOnId(categoryId);
          vm.dataModel.category.categoryId = ct._id;
          vm.dataModel.category.name = ct.name;
        } else {
          vm.dataModel.category = {};
        }

        vm.dataModel.brandId = "";
        vm.dataModel.modelId = "";
      }

      vm.brandList = [];
      vm.modelList = [];
      //$scope.product.technicalInfo = {};
      if (!categoryId)
        return;
      
      filter = {};
      filter['categoryId'] = categoryId;
      brandSvc.getBrandOnFilter(filter)
        .then(function(result) {
          vm.brandList = result;

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
          brd = vm.brandList.filter(function(item) {
            return item._id == brandId;
          });
          if (brd.length == 0)
            return;
          vm.dataModel.brand.categoryId = brd[0]._id;
          vm.dataModel.brand.name = brd[0].name;
        } else {
          vm.dataModel.brand = {};
        }
        vm.dataModel.modelId = "";
      }

      vm.modelList = [];
      if (!brandId)
        return;
      
      filter = {};
      filter['brandId'] = brandId;
      modelSvc.getModelOnFilter(filter)
        .then(function(result) {
          vm.modelList = result;
        })
        .catch(function(res) {
          console.log("error in fetching model", res);
        })

    }

    function onModelChange(modelId) {
      if (!modelId) {
        vm.dataModel.model = {};
        return;
      }
      var md = null;
      for (var i = 0; i < vm.modelList.length; i++) {
        if (vm.modelList[i]._id == modelId) {
          md = vm.modelList[i];
          break;
        }
      }
      
      if (md) {
        vm.dataModel.model.categoryId = md._id;
        vm.dataModel.model.name = md.name;
      } else
        vm.dataModel.model = {};
    }

    function loadViewData(filter){
        $scope.pager.copy(filter);
        InputFormMasterSvc.get(filter)
        .then(function(result){
            vm.filteredList = result.items;
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
    }

    function save(form){
        if(form.$invalid){
            $scope.submitted = true;
            return;
        }

        var createData = {};
        Object.keys(vm.dataModel).forEach(function(x) {
            createData[x] = vm.dataModel[x];
        });
        InputFormMasterSvc.save(createData)
        .then(function(){
            vm.dataModel = {};
            fireCommand(true);
            Modal.alert('Data saved successfully!');
        })
        .catch(function(err){
           if(err.data)
                Modal.alert(err.data); 
        });
    }

    function editClicked(rowData){
        // vm.dataModel = {};
        // vm.dataModel._id  = rowData._id;
        //vm.dataModel.kycType = rowData.kycType;
        //vm.dataModel.docName = rowData.docName;
        vm.dataModel = angular.copy(rowData);
        vm.dataModel.categoryId = rowData.category.categoryId;
        onCategoryChange(rowData.category.categoryId, true);
        onBrandChange(rowData.brand.brandId, true);
        vm.dataModel.brandId = rowData.brand.brandId;
        vm.dataModel.modelId = rowData.model.modelId;
        $scope.isEdit = true;
    }

      function update(form){
        if(form.$invalid){
            $scope.submitted = true;
            return;
        }
        InputFormMasterSvc.update(vm.dataModel)
        .then(function(){
             vm.dataModel = {};
            $scope.isEdit = false;
            fireCommand(true);
            Modal.alert('Data updated successfully!');
        })
        .catch(function(err){
            if(err.data)
                Modal.alert(err.data); 
        });
    }

    function destroy(id){
      Modal.confirm("Are you sure want to delete?",function(ret){
        if(ret == "yes")
            confirmDestory(id);
        });
    }

    function confirmDestory(id){
        InputFormMasterSvc.destroy(id)
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