(function() {
    'use strict';

    angular.module('admin').controller('AssetSaleChargeMasterCtrl', AssetSaleChargeMasterCtrl);

    function AssetSaleChargeMasterCtrl($scope,$state,Modal,Auth,PagerSvc,$filter,userSvc,categorySvc, AssetSaleChargeSvc){
    	 var vm  = this;
        vm.dataModel = {};
        vm.dataList = [];
        $scope.isEdit = false;
        $scope.pager = PagerSvc.getPager();

        vm.save = save;
        vm.update = update;
        vm.destroy = destroy;
        vm.editClicked = editClicked;
        vm.fireCommand = fireCommand;
        vm.getCategory = getCategory;
        var initFilter = {};
        var filter = {};
        vm.searchStr = "";

        function init(){
          var userFilter = {};
          filter = {};
          initFilter.pagination = true;
          angular.copy(initFilter, filter);

          userFilter.role = "enterprise";
          userFilter.enterprise = true;
          userFilter.status = true;
          userSvc.getUsers(userFilter).then(function(data){
            vm.enterprises = data;
          })

          categorySvc.getCategoryOnFilter()
            .then(function(result) {
                vm.categoryList = result;
            })
          loadViewData(filter);
        } 

        function getCategory(groupId) {
            vm.categoryList = [];
            
            if (!groupId) {
                vm.dataModel.category = "";
                return;
            }
            categorySvc.getCategoryOnFilter({groupId: groupId})
                .then(function(result) {
                    vm.categoryList = result;
                })
        }

        function loadViewData(filter){
            $scope.pager.copy(filter);
            AssetSaleChargeSvc.get(filter)
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
            AssetSaleChargeSvc.save(vm.dataModel)
            .then(function(){
                vm.dataModel = {};
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
            vm.dataModel._id  = rowData._id;
            vm.dataModel.group = rowData.group._id;
            vm.dataModel.vatType = rowData.vatType;
            if (rowData.effectiveToDate)
                vm.dataModel.effectiveToDate = moment(rowData.effectiveToDate).format('MM/DD/YYYY');
            if (rowData.effectiveFromDate)
                vm.dataModel.effectiveFromDate = moment(rowData.effectiveFromDate).format('MM/DD/YYYY');
            vm.dataModel.state = rowData.state._id;
            vm.dataModel.amount = rowData.amount;
            categorySvc.getCategoryOnFilter({groupId: rowData.group._id})
                .then(function(result) {
                    vm.categoryList = result;
                    vm.dataModel.category = rowData.category._id;
                })
            $scope.isEdit = true;
        }

          function update(form){
            if(form.$invalid){
                $scope.submitted = true;
                return;
            }
            AssetSaleChargeSvc.update(vm.dataModel)
            .then(function(){
                 vm.dataModel = {};
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

        function confirmDestory(id){
            AssetSaleChargeSvc.destroy(id)
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