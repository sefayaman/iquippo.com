(function() {
    'use strict';

angular.module('admin').controller('NewEquipmentCtrl', NewEquipmentCtrl);

function NewEquipmentCtrl($scope,$rootScope,$state,NewEquipmentSvc,Modal, Auth,PagerSvc,$filter){
	var vm  = this;
    vm.dataModel = {};
    $scope.isEdit = false;
    $scope.pager = PagerSvc.getPager();

    vm.save = save;
    vm.update = update;
    vm.destroy = destroy;
    vm.editClicked = editClicked;
    vm.fireCommand = fireCommand;
    var initFilter = {};
    var filter = {};
    vm.searchStr = "";
    function init(){
        filter = {};
        initFilter.pagination = true;
        angular.copy(initFilter, filter);
        loadViewData(filter);
    } 

    function loadViewData(filter){
        $scope.pager.copy(filter);
        NewEquipmentSvc.get(filter)
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
       
        /* createData.dealer.data = vm.dataModel.dealer._id;
        createData.dealer.name = vm.dataModel.dealer.entityName;
        createData.location.data = vm.dataModel.state._id;
        createData.location.name = vm.dataModel.state.name;*/
        console.log("createData=",createData);
        NewEquipmentSvc.save(createData)
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
       
        $scope.isEdit = true;
    }

      function update(form){
        if(form.$invalid){
            $scope.submitted = true;
            return;
        }
        NewEquipmentSvc.update(vm.dataModel)
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
    }

    function confirmDestory(id){
        NewEquipmentSvc.destroy(id)
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