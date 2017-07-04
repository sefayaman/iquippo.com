(function() {
    'use strict';

    angular.module('admin').controller('MarkupPriceMasterCtrl', MarkupPriceMasterCtrl);

    function MarkupPriceMasterCtrl($scope,$rootScope,$state,Modal,Auth,PagerSvc,$filter,userSvc, MarkupPriceSvc){
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
            var filter = "";
            MarkupPriceSvc.get(filter)
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

            // vm.dataModel.user = {}
            // vm.dataModel.user._id =  Auth.getCurrentUser()._id;

            var createData = {};
            Object.keys(vm.dataModel).forEach(function(x) {
                createData[x] = vm.dataModel[x];
            });
            MarkupPriceSvc.save(createData)
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
            MarkupPriceSvc.destroy(id)
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