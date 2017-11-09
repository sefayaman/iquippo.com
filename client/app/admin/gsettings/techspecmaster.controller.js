(function() {
    'use strict';

angular.module('admin').controller('TechSpecMasterCtrl', TechSpecMasterCtrl);

function TechSpecMasterCtrl($scope,$rootScope,$state,categorySvc, Modal,TechSpecMasterSvc, Auth,PagerSvc,$filter){
	var vm  = this;
    $scope.isEdit = false;
    $scope.pager = PagerSvc.getPager();

    //vm.save = save;
    //vm.update = update;
    //vm.destroy = destroy;
    //vm.editClicked = editClicked;
    vm.fireCommand = fireCommand;
    vm.stateIdArr = [{}];
    
    var initFilter = {};
    var filter = {};
    vm.searchStr = "";
    vm.getTechSpecData = getTechSpecData;
    function init(){
        filter = {};
        initFilter.pagination = true;
        angular.copy(initFilter, filter);
        
       // loadViewData(filter);
        getCategoryOnFilter();
    } 
    function getTechSpecData(){
        console.log("it is==");
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
    function loadViewData(filter){
        $scope.pager.copy(filter);
        TechSpecMasterSvc.get(filter)
        .then(function(result){
            vm.filteredList = result;
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

    /*function save(form){
        if(form.$invalid){
            $scope.submitted = true;
            return;
        }
        let objBrand = vm.brandList.find(o => o._id === vm.dataModel.brand.data);
        vm.dataModel.brand.name = objBrand.name; 
        let objDealer = vm.dealerList.find(o => o._id === vm.dataModel.dealer.data);
         vm.dataModel.dealer.name = objDealer.entityName;
         vm.dataModel.state = [];
         var i=0;
         
         if(vm.stateIdArr[0]){
            for(var id of vm.stateIdArr) {
                    let objState = vm.stateList.find(o => o._id === id);
                    vm.dataModel.state[i] = {};
                    vm.dataModel.state[i]['data'] = id;
                    vm.dataModel.state[i]['name'] = objState.name;
                    i++;
            }
         }
         vm.dataModel.status = true;
        TechSpecMasterSvc.save(vm.dataModel)
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
    }*/
    /*
    function editClicked(rowData){
        vm.dataModel = {};
        vm.dataModel = angular.copy(rowData);
        var i=0;
        vm.stateIdArr = [];
         for(var val of  vm.dataModel.state) {
                vm.stateIdArr[i] = val.data;
                i++;
         }
        $scope.isEdit = true;
    }

      function update(form){
        if(form.$invalid){
            $scope.submitted = true;
            return;
        }
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

    function destroy(id){
      Modal.confirm("Are you sure want to delete?",function(ret){
        if(ret == "yes")
            confirmDestory(id);
        });
    }

    function resetValue() {
      vm.container = {};
      //vm.dataModel.brand = {};
      vm.container.modelId = "";
      //vm.brandList = [];
    }

    function confirmDestory(id){
        TechSpecMasterSvc.destroy(id)
        .then(function(){
            fireCommand(true);
        })
         .catch(function(err){
            console.log("purpose err",err);
        });
    }*/
     //starting point
    Auth.isLoggedInAsync(function(loggedIn){
      if(loggedIn){
          init();
        }else
          $state.go("main");
    });
}

})();