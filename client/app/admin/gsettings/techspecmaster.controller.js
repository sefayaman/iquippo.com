(function() {
    'use strict';

angular.module('admin').controller('TechSpecMasterCtrl', TechSpecMasterCtrl);

function TechSpecMasterCtrl($scope,$rootScope,$state,categorySvc, Modal,TechSpecMasterSvc, Auth,PagerSvc,$filter){
	var vm  = this;
    $scope.isEdit = false;
    $scope.pager = PagerSvc.getPager();

    vm.save = save;
    vm.update = update;
    vm.destroy = destroy;
    vm.editClicked = editClicked;
    vm.fireCommand = fireCommand;
    vm.stateIdArr = [{}];
    vm.fieldInfo = [{}];
    vm.dataModel = {};
    vm.fieldArr = [{}];
    var initFilter = {};
    var filter = {};
    vm.searchStr = "";
    vm.categoryId = '';
    vm.getTechSpecData = getTechSpecData;
    function init(){
        filter = {};
        initFilter.pagination = true;
        angular.copy(initFilter, filter);
        
        loadViewData(filter);
        getCategoryOnFilter();
    } 
    function getTechSpecData(categoryId){
        console.log("it is==",categoryId);
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
    
    function editClicked(rowData){console.log("rowData=",rowData);
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
         console.log("fieldArr==",vm.fieldInfo);
        $scope.isEdit = true;
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
      //vm.container.modelId = "";
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