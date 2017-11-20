(function() {
    'use strict';

angular.module('admin').controller('NewEquipmentBannersCtrl', NewEquipmentBannersCtrl);

function NewEquipmentBannersCtrl($scope, $rootScope, $state, vendorSvc, brandSvc, Modal, NewEquipmentBannersSvc, CertificateMasterSvc, uploadSvc, Auth, PagerSvc){
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
        loadPromoData(filter);
    } 
  
    function loadAllBrand() {
        brandSvc.getBrandOnFilter({isForNew:true})
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
    
    function loadPromoData(filter){
        $scope.pager.copy(filter);
        CertificateMasterSvc.get(filter)
        .then(function(result){
           vm.promoList = result;
           //console.log(vm.promoList);
            vm.promoTotalItems = result.totalItems;
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
       filter['position']= vm.dataModel.position;
       if(vm.dataModel.position!='none'){
            NewEquipmentBannersSvc.check(filter)
            .then(function(result){
                if(result.length != 0){
                    Modal.alert('This position is already exist. Chose "None" to reset position !');
                }
                else{

                    if (!vm.newEquipBannerImg) {
                        Modal.alert("Please upload image for Banner.", true);
                        return;
                    }
                    
                    if (vm.dataModel.brand) {
                        for (var k in  vm.brandList) {
                            if (vm.brandList[k]._id == vm.dataModel.brand._id)
                                vm.dataModel.brand.name = vm.brandList[k].name;
                        }
                    }
                    if (vm.dataModel.position) {
                        vm.dataModel.position = vm.dataModel.position;
                    }
                    if (vm.dataModel.promotion) {
                        for (var k in  vm.promoList) {
                            if (vm.promoList[k]._id == vm.dataModel.promotion.pro_id)
                                vm.dataModel.promotion.name = vm.promoList[k].certificate;
                        }
                    }
                    if (vm.newEquipBannerImg) {
                        vm.dataModel.newEquipBannerImg = vm.newEquipBannerImg;
                    }
                    var i = 0;

                    if(vm.dataModel.position==='none'){
                        vm.dataModel.status = false;
                        vm.dataModel.order = false;
                    }

                    if(vm.dataModel.position==='left'){
                         vm.dataModel.order = 1;
                         vm.dataModel.status = true;
                     }
                     if(vm.dataModel.position==='topRight'){
                         vm.dataModel.order = 2;
                         vm.dataModel.status = true;
                     }
                     if(vm.dataModel.position==='bottomRight'){
                         vm.dataModel.order = 3;
                         vm.dataModel.status = true;
                     }
                    else{
                        vm.dataModel.status = true;
                    }

                    NewEquipmentBannersSvc.save(vm.dataModel)
                            .then(function () {
                                vm.dataModel = {};
                                resetValue();
                                fireCommand(true);
                                Modal.alert('Data saved successfully!');
                            })
                            .catch(function (err) {
                                if (err.data)
                                    Modal.alert(err.data);
                            });
                }
            });
        }
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
        if(vm.dataModel.position==='none'){
            vm.dataModel.status = false;
            vm.dataModel.order = false;
        }
        if(vm.dataModel.position==='left'){
            vm.dataModel.order = 1;
            vm.dataModel.status = true;
        }
        if(vm.dataModel.position==='topRight'){
            vm.dataModel.order = 2;
            vm.dataModel.status = true;
        }
        if(vm.dataModel.position==='bottomRight'){
            vm.dataModel.order = 3;
            vm.dataModel.status = true;

        }
        else{
            vm.dataModel.status = true;
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
        $rootScope.loading = true;
        if (files.length == 0)
            return;
        $rootScope.loading = true;
        uploadSvc.upload(files[0], bannerDir).then(function(result) {
            $rootScope.loading = false;
            vm.newEquipBannerImg = result.data.filename;
            vm.dataModel.newEquipBannerImg = result.data.filename;
        })
        .catch(function(){
            $rootScope.loading = false;
        });
    }
}

})();