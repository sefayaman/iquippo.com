(function() {
    'use strict';

    angular.module('admin').controller('ValuationPurposeMasterCtrl', ValuationPurposeMasterCtrl);

    function ValuationPurposeMasterCtrl($scope,Modal,Auth,PagerSvc,$filter,ValuationPurposeSvc){
        
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

        function loadViewData(){
            ValuationPurposeSvc.get()
            .then(function(result){
                vm.dataList = result;
                vm.filteredList = result;
                $scope.pager.update(null,vm.filteredList.length,1);
            });
        }

        function searchFn(){
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
            ValuationPurposeSvc.save(vm.dataModel)
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
            ValuationPurposeSvc.update(vm.dataModel)
            .then(function(){
                $scope.edit = false;
                 vm.dataModel = {};
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
            ValuationPurposeSvc.destroy(id)
            .then(function(){
                loadViewData();
            })
             .catch(function(err){
                console.log("purpose err",err);
            })
        }

        loadViewData();

    }

})();