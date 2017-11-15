(function() {
    'use strict';

angular.module('admin').controller('NewEquipmentBannersCtrl', NewEquipmentBannersCtrl);

function NewEquipmentBannersCtrl($scope, $state, vendorSvc, brandSvc, Modal, NewEquipmentBannersSvc, uploadSvc, Auth, PagerSvc){
    var vm  = this;
    vm.dataModel = {brand:{}};
    $scope.isEdit = false;
    $scope.pager = PagerSvc.getPager();
    $scope.updateBannerImage = updateBannerImage;

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
        loadAllBrand();
        loadViewData(filter);
    } 
  
    function loadAllBrand() {
        brandSvc.getAllBrand()
        .then(function(result) {
            vm.brandList = result;
        });
    }

    function loadViewData(filter){
        $scope.pager.copy(filter);
        NewEquipmentBannersSvc.get(filter)
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

    function save(form){
        if(form.$invalid){
            $scope.submitted = true;
            return;
        }
        
        console.log(vm.dataModel);return;
        let objBrand = vm.brandList.find(o => o._id === vm.dataModel.brand.data);
        vm.dataModel.brand.name = objBrand.name; 
        //let objPromotion = vm.promotionList.find(o => o._id === vm.dataModel.promotion.data);
         vm.dataModel.promotion.name = vm.dataModel.promotion.data;
         vm.dataModel.position.name = vm.dataModel.position.data;
         var i=0;
         
         console.log("promotion===",vm.dataModel);
         vm.dataModel.status = true;
        NewEquipmentBannersSvc.save(vm.dataModel)
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
        var i=0;
        
        $scope.isEdit = true;
    }

      function update(form){
        if(form.$invalid){
            $scope.submitted = true;
            return;
        }
        NewEquipmentBannersSvc.update(vm.dataModel)
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
        NewEquipmentBannersSvc.destroy(id)
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
    
    function updateBannerImage(files) {
        if (files.length == 0)
            return;
        uploadSvc.upload(files[0], bannerDir).then(function(result) {
            vm.newEquipBannerImg = result.data.filename;
        });
    }
}

})();