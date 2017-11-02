(function() {
    'use strict';

angular.module('admin').controller('DealerMasterCtrl', DealerMasterCtrl);

function DealerMasterCtrl($scope,$rootScope,$state,categorySvc, modelSvc, brandSvc, Modal,LocationSvc, Auth,PagerSvc,$filter,InputFormMasterSvc){
	var vm  = this;
    vm.dataModel = {};
    $scope.isEdit = false;
    $scope.pager = PagerSvc.getPager();

    vm.save = save;
    vm.update = update;
    vm.destroy = destroy;
    vm.editClicked = editClicked;
    vm.fireCommand = fireCommand;
    vm.dataModel.brand = {};
    vm.dataModel.model = {};
    vm.container = {};
    vm.dataModel.additionalInfo = [{}];
    var initFilter = {};
    var filter = {};
    vm.searchStr = "";

    function init(){
        filter = {};
        initFilter.pagination = true;
        angular.copy(initFilter, filter);
        loadAllBrand();
        loadAllState();
        loadAllDealer();
        loadViewData(filter);
    } 

    function loadAllState(){
      LocationSvc.getAllState()
        .then(function(result) {
          $scope.stateList = result;
      })
    }

    function loadAllBrand() {
        categorySvc.getAllCategory()
        .then(function(result) {
            vm.allCategory = result;
        });
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
            resetValue();
            fireCommand(true);
            Modal.alert('Data saved successfully!');
        })
        .catch(function(err){
           if(err.data)
                Modal.alert(err.data); 
        });
    }

    function editClicked(rowData){
        vm.dataModel = {};
        vm.dataModel = angular.copy(rowData);
        vm.container.categoryId = rowData.category.categoryId;
        onCategoryChange(rowData.category.categoryId, true);
        onBrandChange(rowData.brand.brandId, true);
        vm.container.brandId = rowData.brand.brandId;
        vm.container.modelId = rowData.model.modelId;
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

    function destroy(id){
      Modal.confirm("Are you sure want to delete?",function(ret){
        if(ret == "yes")
            confirmDestory(id);
        });
    }

    function resetValue() {
      vm.container = {};
      vm.dataModel.category = {};
      vm.dataModel.brand = {};
      vm.dataModel.model = {};
      vm.container.categoryId = "";
      vm.container.brandId = "";
      vm.container.modelId = "";
      vm.brandList = [];
      vm.modelList = [];
      vm.dataModel.additionalInfo = [{}];
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