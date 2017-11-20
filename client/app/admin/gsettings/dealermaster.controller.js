(function() {
    'use strict';

angular.module('admin').controller('DealerMasterCtrl', DealerMasterCtrl);

function DealerMasterCtrl($scope,$rootScope,$state,categorySvc,vendorSvc, modelSvc, brandSvc, Modal,LocationSvc,DealerMasterSvc, Auth,PagerSvc,$filter){
	var vm  = this;
    vm.dataModel = {brand:{}};
    $scope.isEdit = false;
    $scope.pager = PagerSvc.getPager();

    vm.save = save;
    vm.update = update;
    vm.destroy = destroy;
    vm.editClicked = editClicked;
    vm.fireCommand = fireCommand;
    vm.stateIdArr = [{}];
    vm.checkDealer = checkDealer;
    vm.changeStatus = changeStatus;
    
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
          vm.dealerList = result;
      })
    }
  
    function loadAllBrand() {
        filter = {};
        filter.isForNew = true;
        brandSvc.getBrandOnFilter(filter)
        .then(function(result) {
          vm.brandList = result;
        })
        .catch(function(res) {
          console.log("error in fetching brand", res);
        })
        // brandSvc.getAllBrand()
        // .then(function(result) {
        //     vm.brandList = result;
        // });
    }
    


    function loadViewData(filter){
        $scope.pager.copy(filter);
        DealerMasterSvc.get(filter)
        .then(function(result){
            vm.filteredList = result;
            vm.totalItems = result.totalItems;
            $scope.pager.update(result.items, result.totalItems);
        });
    }
    function checkDealer(brandId,dealerId){
       var filter = {};
       filter['brandId'] = brandId;
       filter['dealerId'] = dealerId;
        DealerMasterSvc.get(filter)
        .then(function(result){
            vm.filteredList = result;
            
        });
    }
    function changeStatus(data,status){
      data.status = status;
       DealerMasterSvc.update(data)
        .then(function(){
            vm.dataModel = {};
            data = '';
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
        var filter = {};
       filter['brandId']= vm.dataModel.brand.data;
       filter['dealerId']= vm.dataModel.dealer.data;
        DealerMasterSvc.check(filter)
        .then(function(result){
            if(result.length != 0){
                Modal.alert('This dealer already added in this brand if you want add location than you edit this dealer and location!');
            }else{

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
                DealerMasterSvc.save(vm.dataModel)
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
            
        });
       
    }

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
        var i=0;
        vm.dataModel.state = [];
        if(vm.stateIdArr[0]){
            for(var id of vm.stateIdArr) {
                    let objState = vm.stateList.find(o => o._id === id);
                    vm.dataModel.state[i] = {};
                    vm.dataModel.state[i]['data'] = id;
                    vm.dataModel.state[i]['name'] = objState.name;
                    i++;
            }
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
      //vm.dataModel.brand = {};
      vm.container.modelId = "";
      //vm.brandList = [];
    }

    function confirmDestory(id){
        DealerMasterSvc.destroy(id)
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