(function() {
    'use strict';

    angular.module('admin').controller('VatTaxMasterCtrl', VatTaxMasterCtrl);

    function VatTaxMasterCtrl($scope,$state,Modal,Auth,PagerSvc,$filter,VatTaxSvc,categorySvc,modelSvc,brandSvc,LocationSvc){
    	 var vm  = this;
        vm.dataModel = {};
        vm.dataList = [];
        vm.filteredList = [];
        $scope.isEdit = false;
        $scope.pager = PagerSvc.getPager();

        vm.save = save;
        vm.update = update;
        vm.destroy = destroy;
        vm.editClicked = editClicked;
        vm.searchFn = searchFn;
        vm.getBrand = getBrand;
        vm.getModel = getModel;

        function init(){
        categorySvc.getAllCategory()
        .then(function(result) {
          $scope.categoryList = result;
        });

        LocationSvc.getAllState()
          .then(function(result){
            $scope.stateList = result;
          });
          loadViewData();
        } 

        function loadViewData(){
            VatTaxSvc.get()
            .then(function(result){
                vm.dataList = result;
                vm.filteredList = result;
                $scope.pager.update(null,vm.filteredList.length,1);
            });
        }

        function getBrand(categoryId){
            $scope.brandList = [];
            $scope.modelList = [];
            vm.dataModel.brand = "";
            vm.dataModel.model = "";

             if(!categoryId)
                return;
            brandSvc.getBrandOnFilter({categoryId:categoryId})
            .then(function(result) {
                $scope.brandList = result;

            });
        }

        function getModel(brandId){
            $scope.modelList = [];
            vm.dataModel.model = "";
            if(!brandId)
                return;
            modelSvc.getModelOnFilter({brandId:brandId})
            .then(function(result) {
              $scope.modelList = result;
            });
            
        }

        function searchFn(type){
            vm.filteredList = $filter('filter')(vm.dataList,vm.searchStr);
            $scope.pager.update(null,vm.filteredList.length,1);
        }

        function save(form){
            if(form.$invalid){
                $scope.submitted = true;
                return;
            }
            vm.dataModel.createdBy = {};
            vm.dataModel.createdBy._id = Auth.getCurrentUser()._id;
            vm.dataModel.createdBy.name = Auth.getCurrentUser().fname + " " + Auth.getCurrentUser().lname;
            VatTaxSvc.save(vm.dataModel)
            .then(function(){
                vm.dataModel = {};
                loadViewData();
                Modal.alert('Data saved successfully!');
            })
            .catch(function(err){
               if(err.data)
                    Modal.alert(err.data); 
            });
        }

        function editClicked(rowData){
            vm.dataModel = {};
            vm.dataModel._id  = rowData._id;
            vm.dataModel.category = rowData.category._id;
            vm.dataModel.brand = rowData.brand._id;
            vm.dataModel.model = rowData.model._id;
            vm.dataModel.state = rowData.state._id;
            vm.dataModel.amount = rowData.amount;
            brandSvc.getBrandOnFilter({categoryId:rowData.category._id})
            .then(function(result) {
                $scope.brandList = result;

            });
            modelSvc.getModelOnFilter({brandId:rowData.brand._id})
            .then(function(result) {
              $scope.modelList = result;
            });
            $scope.isEdit = true;
        }

          function update(form){
            if(form.$invalid){
                $scope.submitted = true;
                return;
            }
            VatTaxSvc.update(vm.dataModel)
            .then(function(){
                 vm.dataModel = {};
                $scope.isEdit = false;
                loadViewData();
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
            VatTaxSvc.destroy(id)
            .then(function(){
                loadViewData();
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