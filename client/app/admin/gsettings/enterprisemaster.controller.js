(function() {
    'use strict';

    angular.module('admin').controller('EnterpriseMasterCtrl', EnterpriseMasterCtrl);

    function EnterpriseMasterCtrl($scope,$state,Modal,Auth,PagerSvc,$filter,userSvc, EnterpriseMasterSvc){
    	var vm  = this;
        vm.dataModel = {};
        vm.filteredList = [];
        $scope.isEdit = false;
        $scope.pager = PagerSvc.getPager();

        vm.save = save;
        vm.update = update;
        vm.destroy = destroy;
        vm.editClicked = editClicked;
        vm.fireCommand = fireCommand;
        vm.dataModel.functionality = "assetsale";
        vm.dataModel.buyNowPriceApproval = "Yes";
        vm.dataModel.negotiatedSaleApproval = "Yes";

        var initFilter = {};
        var filter = {};
        vm.searchStr = "";

        function init(){
          initializeValue();
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

          loadViewData(filter);
        } 

        function loadViewData(filter){
            $scope.pager.copy(filter);
            EnterpriseMasterSvc.get(filter)
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

            EnterpriseMasterSvc.save(vm.dataModel)
            .then(function(){
                initializeValue();
                fireCommand(true);
                Modal.alert('Data saved successfully!');
            })
            .catch(function(err){
               if(err.data)
                    Modal.alert(err.data); 
            });
        }

        function initializeValue() {
            vm.dataModel = {};
            vm.dataModel.functionality = "assetsale";
            vm.dataModel.buyNowPriceApproval = "Yes";
            vm.dataModel.negotiatedSaleApproval = "Yes";
        }

        function editClicked(rowData){
            vm.dataModel = {};
            vm.dataModel._id  = rowData._id;
            vm.dataModel.enterpriseId = rowData.enterpriseId;
            vm.dataModel.functionality = rowData.functionality;
            vm.dataModel.buyNowPriceApproval = rowData.buyNowPriceApproval;
            vm.dataModel.negotiatedSaleApproval = rowData.negotiatedSaleApproval;
            vm.dataModel.coolingPeriod = rowData.coolingPeriod;
            vm.dataModel.emdPeriod = rowData.emdPeriod;
            vm.dataModel.fullPaymentPeriod = rowData.fullPaymentPeriod;
            $scope.isEdit = true;
        }

          function update(form){
            if(form.$invalid){
                $scope.submitted = true;
                return;
            }
            EnterpriseMasterSvc.update(vm.dataModel)
            .then(function(){
                 vm.dataModel = {};
                $scope.isEdit = false;
                initializeValue();
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
            EnterpriseMasterSvc.destroy(id)
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