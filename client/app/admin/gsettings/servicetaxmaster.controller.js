(function() {
    'use strict';

    angular.module('admin').controller('ServiceTaxMasterCtrl', ServiceTaxMasterCtrl);

    function ServiceTaxMasterCtrl($scope,Modal,Auth,PagerSvc,$filter,ServiceTaxSvc){
    	 var vm  = this;
        vm.dataModel = {};
        vm.dataList = [];
        vm.filteredList = [];
        $scope.edit = false;
        $scope.pager = PagerSvc.getPager();

        $scope.taxList = TaxList;

        vm.save = save;
        vm.update = update;
        vm.destroy = destroy;
        vm.editClicked = editClicked;
        vm.searchFn = searchFn; 

        function loadViewData(){
            ServiceTaxSvc.get()
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
            vm.dataModel.createdBy = {};
            vm.dataModel.createdBy._id = Auth.getCurrentUser()._id;
            vm.dataModel.createdBy.name = Auth.getCurrentUser().fname + " " + Auth.getCurrentUser().lname;
            ServiceTaxSvc.save(vm.dataModel)
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
            if (vm.dataModel.effectiveToDate)
                vm.dataModel.effectiveToDate = moment(vm.dataModel.effectiveToDate).format('MM/DD/YYYY');
            if (vm.dataModel.effectiveFromDate)
                vm.dataModel.effectiveFromDate = moment(vm.dataModel.effectiveFromDate).format('MM/DD/YYYY');
            $scope.edit = true;
        }

          function update(form){
            if(form.$invalid){
                $scope.submitted = true;
                return;
            }
            ServiceTaxSvc.update(vm.dataModel)
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
            ServiceTaxSvc.destroy(id)
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