(function() {
    'use strict';

    angular.module('admin').controller('EnterpriseMasterCtrl', EnterpriseMasterCtrl);

    function EnterpriseMasterCtrl($scope,$state,Modal,Auth,PagerSvc,$filter,userSvc, EnterpriseMasterSvc){
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
        //vm.fireCommand = fireCommand;
        vm.dataModel.functionality = "assetsale";
        vm.dataModel.buyNowPriceApproval = "Yes";
        vm.dataModel.negotiatedSaleApproval = "Yes";

        function init(){
          initializeValue();
          var userFilter = {};
          userFilter.role = "enterprise";
          userFilter.enterprise = true;
          userFilter.status = true;
          userSvc.getUsers(userFilter).then(function(data){
            vm.enterprises = data;
          })

          loadViewData();
        } 

        function loadViewData(){
            var filter = {};
            EnterpriseMasterSvc.get(filter)
            .then(function(result){
                vm.dataList = result;
                vm.filteredList = result;
                $scope.pager.update(null,vm.filteredList.length,1);
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

            EnterpriseMasterSvc.save(vm.dataModel)
            .then(function(){
                initializeValue();
                loadViewData();
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
            EnterpriseMasterSvc.destroy(id)
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