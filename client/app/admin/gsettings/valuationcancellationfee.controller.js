(function() {
    'use strict';

    angular.module('admin').controller('ValuationCancellationCtrl', ValuationCancellationCtrl);

    function ValuationCancellationCtrl($scope,Modal,Auth,PagerSvc,$filter,ValuationCancellationSvc,userSvc){
    	
    	var vm  = this;
        vm.dataModel = {};
        vm.dataModel.enterprise = {};
        vm.dataList = [];
        vm.filteredList = [];
        $scope.edit = false;
        vm.EnterpriseValuationStatuses = [EnterpriseValuationStatuses[0],EnterpriseValuationStatuses[2],EnterpriseValuationStatuses[3],EnterpriseValuationStatuses[4],EnterpriseValuationStatuses[6]];
        $scope.pager = PagerSvc.getPager();

        vm.save = save;
        vm.update = update;
        vm.destroy = destroy;
        vm.onEnterpriseChange = onEnterpriseChange;
        vm.editClicked = editClicked;
        vm.searchFn = searchFn;

        function init(){
            var filter = {};
            filter.role = "enterprise";
            filter.enterprise = true;
            filter.status = true;
            userSvc.getUsers(filter).then(function(data){
                vm.enterprises = data;
            });
        }

        function loadViewData(){
            ValuationCancellationSvc.get()
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

           /* vm.enterprises.forEach(function(item){
                if(item.enterpriseId == vm.dataModel.enterprise.enterpriseId){
                    vm.dataModel.enterprise._id = item._id;
                    vm.dataModel.enterprise.name = item.fname;
                    if(item.mname)
                        vm.dataModel.enterprise.name += " " + item.mname;
                    vm.dataModel.enterprise.name  += " " + item.lname;


                }
            });*/

            ValuationCancellationSvc.save(vm.dataModel)
            .then(function(){
                vm.dataModel = {};
                vm.dataModel.enterprise = {};
                loadViewData();
                Modal.alert('Data saved successfully!');
            })
            .catch(function(err){
               if(err.data)
                    Modal.alert(err.data); 
            })
        }

        function onEnterpriseChange(){
            vm.enterprises.forEach(function(item){
                if(item.enterpriseId == vm.dataModel.enterprise.enterpriseId){
                    vm.dataModel.enterprise._id = item._id;
                    vm.dataModel.enterprise.name = item.fname;
                    if(item.mname)
                        vm.dataModel.enterprise.name += " " + item.mname;
                    vm.dataModel.enterprise.name  += " " + item.lname;


                }
            });

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
/*
            vm.enterprises.forEach(function(item){
                if(item.enterpriseId == vm.dataModel.enterprise.enterpriseId){
                    vm.dataModel.enterprise._id = item._id;
                    vm.dataModel.enterprise.name = item.fname;
                    if(item.mname)
                        vm.dataModel.enterprise.name += " " + item.mname;
                    vm.dataModel.enterprise.name  += " " + item.lname;
                }
            });*/

            ValuationCancellationSvc.update(vm.dataModel)
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
            ValuationCancellationSvc.destroy(id)
            .then(function(){
                loadViewData();
            })
             .catch(function(err){
                console.log("purpose err",err);
            })
        }

        loadViewData();
        init();

    }

})();