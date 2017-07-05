(function() {
    'use strict';

    angular.module('admin').controller('MarkupPriceMasterCtrl', MarkupPriceMasterCtrl);

    function MarkupPriceMasterCtrl($scope,$rootScope,$state,Modal,Auth,PagerSvc,$filter,userSvc, MarkupPriceSvc){
    	var vm  = this;
        vm.dataModel = {};
        $scope.isEdit = false;
        $scope.pager = PagerSvc.getPager();

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

            var userFilter = {};
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
            MarkupPriceSvc.get(filter)
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

            var createData = {};
            Object.keys(vm.dataModel).forEach(function(x) {
                createData[x] = vm.dataModel[x];
            });
            MarkupPriceSvc.save(createData)
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
            vm.dataModel.enterpriseId = rowData.enterpriseId;
            vm.dataModel.price = rowData.price;
            $scope.isEdit = true;
        }

          function update(form){
            if(form.$invalid){
                $scope.submitted = true;
                return;
            }
            MarkupPriceSvc.update(vm.dataModel)
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
            MarkupPriceSvc.destroy(id)
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