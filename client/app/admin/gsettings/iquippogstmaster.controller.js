(function() {
    'use strict';

    angular.module('admin').controller('IquippoGSTMasterCtrl', IquippoGSTMasterCtrl);

    function IquippoGSTMasterCtrl($scope,Modal,Auth,PagerSvc,$filter,IquippoGSTSvc,LocationSvc){
    	 var vm  = this;
        vm.dataModel = {};
        vm.dataList = [];
        vm.filteredList = [];
        $scope.edit = false;
        $scope.pager = PagerSvc.getPager();

       
        vm.save = save;
        vm.update = update;
        vm.destroy = destroy;
        vm.editClicked = editClicked;
        vm.searchFn = searchFn;

        function init(){
            LocationSvc.getAllState()
            .then(function(result) {
                vm.stateList = result;
            });
            loadViewData();
        } 

        function loadViewData(){
            IquippoGSTSvc.get()
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
            vm.stateList.forEach(function(state){
                if(vm.dataModel.stateId === state._id){
                    vm.dataModel.state = state.name;
                    vm.dataModel.country = state.country;
                }
            });
            IquippoGSTSvc.save(vm.dataModel)
            .then(function(){
                vm.dataModel = {};
                loadViewData();
                Modal.alert('Data saved successfully!');
            })
            .catch(function(err){
               if(err.data)
                    Modal.alert(err.data); 
            })
        }

        function editClicked(rowData){
            vm.dataModel = angular.copy(rowData);
            $scope.edit = true;
        }

          function update(form){
            if(form.$invalid){
                $scope.submitted = true;
                return;
            }
            vm.stateList.forEach(function(state){
                if(vm.dataModel.stateId === state._id){
                    vm.dataModel.state = state.name;
                    vm.dataModel.country = state.country;
                }
            });
            
            IquippoGSTSvc.update(vm.dataModel)
            .then(function(){
                 vm.dataModel = {};
                $scope.edit = false;
                loadViewData();
                Modal.alert('Data updated successfully!');
            })
            .catch(function(err){
                if(err.data)
                    Modal.alert(err.data); 
            })
        }

        function destroy(id){
          Modal.confirm("Are you sure want to delete?",function(ret){
            if(ret == "yes")
                confirmDestory(id);
            });
        }

        function confirmDestory(id){
            IquippoGSTSvc.destroy(id)
            .then(function(){
                loadViewData();
            })
             .catch(function(err){
                console.log("purpose err",err);
            })
        }

        init();

    }

})();