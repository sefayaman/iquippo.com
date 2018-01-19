(function() {
    'use strict';

    angular.module('admin').controller('LegalTypeMasterCtrl', LegalTypeMasterCtrl);

    function LegalTypeMasterCtrl($scope,$rootScope,$state,Modal,Auth,PagerSvc,LegalTypeSvc){
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
            LegalTypeSvc.get(filter)
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
            LegalTypeSvc.save(createData)
            .then(function(){
                vm.dataModel = {};
                fireCommand(true);
                Modal.alert('Legal type saved sucessfully!');
            })
            .catch(function(err){
               if(err.data)
                    Modal.alert(err.data); 
            });
        }

        function editClicked(rowData){
            vm.dataModel = {};
            vm.dataModel._id  = rowData._id;
            vm.dataModel.legalType = rowData.legalType;
            $scope.isEdit = true;
        }

        function update(form){
            if(form.$invalid){
                $scope.submitted = true;
                return;
            }
            LegalTypeSvc.update(vm.dataModel)
            .then(function(){
                 vm.dataModel = {};
                $scope.isEdit = false;
                fireCommand(true);
                Modal.alert('Legal type updated sucessfully!');
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
            LegalTypeSvc.destroy(id)
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