(function() {
    'use strict';

    angular.module('admin').controller('BankMasterCtrl', BankMasterCtrl);

    function BankMasterCtrl($scope,$rootScope,$state,Modal,Auth,PagerSvc,BankSvc){
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

            loadViewData(filter);
        } 

        function loadViewData(filter){
            $scope.pager.copy(filter);
            BankSvc.get(filter)
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
            BankSvc.save(createData)
            .then(function(){
                vm.dataModel = {};
                fireCommand(true);
                Modal.alert('Bank name saved sucessfully!');
            })
            .catch(function(err){
               if(err.data)
                    Modal.alert(err.data); 
            });
        }

        function editClicked(rowData){
            vm.dataModel = {};
            vm.dataModel._id  = rowData._id;
            vm.dataModel.bankName = rowData.bankName;
            $scope.isEdit = true;
        }

        function update(form){
            if(form.$invalid){
                $scope.submitted = true;
                return;
            }
            BankSvc.update(vm.dataModel)
            .then(function(){
                 vm.dataModel = {};
                $scope.isEdit = false;
                fireCommand(true);
                Modal.alert('Bank name updated sucessfully!');
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
            BankSvc.destroy(id)
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