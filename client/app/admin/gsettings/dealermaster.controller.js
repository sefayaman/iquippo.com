(function() {
    'use strict';

angular.module('admin').controller('DealerMasterCtrl', DealerMasterCtrl);

function DealerMasterCtrl($scope,$rootScope,$state,categorySvc,vendorSvc, modelSvc, brandSvc, Modal,LocationSvc,DealerMasterSvc, Auth,PagerSvc,$filter,InputFormMasterSvc){
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
    vm.dataModel.allBrand = {};
    vm.dataModel.stateList = {};
    vm.dataModel.model = {};
    vm.dataModel.allDealer = {};
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
          vm.stateList = result;
      })
    }
    function loadAllDealer(){
      var filter = {};
      filter['service'] = 'Dealer';  
      vendorSvc.getFilter(filter)
        .then(function(result) {
          vm.allDealer = result;
          console.log("alldealer=",vm.allDealer);
      })
    }
   /* function loadAllBrand() {
        categorySvc.getAllCategory()
        .then(function(result) {
            vm.allCategory = result;
            console.log("brand===",vm.allCategory);
        });
    }*/
    function loadAllBrand() {
        brandSvc.getAllBrand()
        .then(function(result) {
            vm.allBrand = result;
        });
    }
    


    function loadViewData(filter){
        $scope.pager.copy(filter);
        DealerMasterSvc.get(filter)
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

    function save(form){console.log("form==",form);
        if(form.$invalid){
            $scope.submitted = true;
            return;
        }

       /* var createData = {};
        Object.keys(vm.dataModel).forEach(function(x) {
            createData[x] = vm.dataModel[x];
        });
        DealerMasterSvc.save(createData)
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
        DealerMasterSvc.update(vm.dataModel)
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