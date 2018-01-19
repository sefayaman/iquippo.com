(function() {
    'use strict';

angular.module('admin').controller('DealerMasterCtrl', DealerMasterCtrl);

function DealerMasterCtrl($scope,$rootScope,$state,categorySvc,vendorSvc, modelSvc, brandSvc, Modal,LocationSvc,DealerMasterSvc, Auth,PagerSvc,$filter){
	var vm  = this;
    //vm.dataModel = {brand:{}};
    $scope.isEdit = false;
    $scope.pager = PagerSvc.getPager();

    vm.save = save;
    vm.update = update;
    vm.destroy = destroy;
    vm.editClicked = editClicked;
    vm.fireCommand = fireCommand;
    vm.changeStatus = changeStatus;
    vm.onCountryChange = onCountryChange;
    vm.searchStr = "";
    
    function init(){
        loadAllBrand();
        loadAllDealer();
        loadViewData({});
    } 

    function onCountryChange(country,noChange){
        if(!noChange){
          vm.stateIdArr = [];
        }
        $scope.stateList = [];
        if(!country)
          return;
        var filter = {};
        filter.country = country;
        LocationSvc.getStateHelp(filter).then(function(result){
            vm.stateList = result;
        });
      }

    function loadAllDealer(){
      var filter = {};
      filter['service'] = 'Dealer';  
      vendorSvc.getFilter(filter)
        .then(function(result) {
          vm.dealerList = result;
      })
    }

    function state(id){

       if(vm.stateList && vm.stateList.length){
        for(var i=0;i < vm.stateList.length;i++){
            if(vm.stateList[i]._id === id)
                return vm.stateList[i].name;
        }
       } 
        return null;
    }

  
    function loadAllBrand() {
        var filter = {};
        filter.isForNew = true;
        brandSvc.getBrandOnFilter(filter)
        .then(function(result) {
          vm.brandList = result;
        })
        .catch(function(res) {
          console.log("error in fetching brand", res);
        });
    }
    


    function loadViewData(filter){
        $scope.pager.copy(filter);
        filter.pagination = true;
        DealerMasterSvc.get(filter)
        .then(function(result){
            vm.dataList = result.items;
            $scope.pager.update(result.items, result.totalItems);
        });
    }

    function changeStatus(data,status){
      data.status = status;
       DealerMasterSvc.update(data)
        .then(function(){
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
        var filter = {};
        if (vm.searchStr)
            filter.searchStr = vm.searchStr;
        loadViewData(filter);
    }

    function save(form){
        if(form.$invalid){
            $scope.submitted = true;
            return;
        }
        setData();
        vm.dataModel.status = true;
        DealerMasterSvc.save(vm.dataModel)
        .then(function(){
            initViewState();
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
        var i=0;
        vm.stateIdArr = [];
        vm.dataModel.state.forEach(function(state){
            vm.stateIdArr.push(state.data);
        });
        onCountryChange(rowData.country,true);
        $scope.isEdit = true;
    }

      function update(form){
        if(form.$invalid){
            $scope.submitted = true;
            return;
        }
        setData();
        DealerMasterSvc.update(vm.dataModel)
        .then(function(){
            initViewState();
            fireCommand(true);
            Modal.alert('Data updated successfully!');
        })
        .catch(function(err){
            if(err.data)
                Modal.alert(err.data); 
        });
    }

    function setData(){
        vm.dataModel.state = [];
        vm.stateIdArr.forEach(function(stateId){
            var obj = {data:stateId};
            obj.name = state(stateId);
            vm.dataModel.state.push(obj);
        });

        vm.brandList.forEach(function(brand){
            if(brand._id === vm.dataModel.brand.data)
                vm.dataModel.brand.name = brand.name;
        });

        vm.dealerList.forEach(function(dealer){
            if(dealer._id === vm.dataModel.dealer.data)
                vm.dataModel.dealer.name = dealer.entityName;
        });
    }

    function destroy(id){
      Modal.confirm("Are you sure want to delete?",function(ret){
        if(ret == "yes")
            confirmDestory(id);
        });
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

    function initViewState(){
        $scope.submitted = false;
        $scope.isEdit = false;
        vm.stateList = [];
        vm.stateIdArr = [];
        vm.dataModel = {};
        vm.dataModel.brand = {};
        vm.dataModel.dealer = {};
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