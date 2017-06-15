(function() {
    'use strict';

    angular.module('admin').controller('EnterpriseMasterCtrl', EnterpriseMasterCtrl);

    function EnterpriseMasterCtrl($scope,$state,Modal,Auth,PagerSvc,$filter,userSvc, EnterpriseSvc){
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
        vm.fireCommand = fireCommand;
        vm.dataModel.functionality = "assetsale";

        function init(){
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
            EnterpriseSvc.get()
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
            EnterpriseSvc.save(vm.dataModel)
            .then(function(){
                vm.dataModel = {};
                loadViewData();
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
            
            $scope.isEdit = true;
        }

          function update(form){
            if(form.$invalid){
                $scope.submitted = true;
                return;
            }
            EnterpriseSvc.update(vm.dataModel)
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
            EnterpriseSvc.destroy(id)
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