(function() {
    'use strict';

    angular.module('admin').controller('AssetSaleChargeMasterCtrl', AssetSaleChargeMasterCtrl);

    function AssetSaleChargeMasterCtrl($scope,$state,Modal,Auth,PagerSvc,$filter,userSvc,categorySvc, AssetSaleChargeSvc){
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
        vm.getCategory = getCategory;
        $scope.userSearch = userSearch;
        vm.fireCommand = fireCommand;

        function init(){
          var userFilter = {};
          userFilter.role = "enterprise";
          userFilter.enterprise = true;
          userFilter.status = true;
          userSvc.getUsers(userFilter).then(function(data){
            vm.enterprises = data;
          })

          categorySvc.getCategoryOnFilter()
            .then(function(result) {
                vm.categoryList = result;
            })
          loadViewData();
        } 

        function userSearch(userSearchText){
          if (!$scope.product.seller.userType) {
            $scope.getUsersOnUserType = "";
            return;
          }
          if(userSearchText && userSearchText.length < 4)
            return;
          var dataToSend = {};
          dataToSend["status"] = true;
          dataToSend["userType"] = $scope.product.seller.userType;
          dataToSend["mobileno"] = $scope.product.seller.mobile;
         return userSvc.getUsers(dataToSend).then(function(result) {
          console.log("data",result);
          return result.map(function(item){
            console.log("item",item);
            return item.mobile;
          });
          });
        }

        function fireCommand(){
            var filter={};
            if(!$scope.product.seller.mobile)
              return;
            filter["status"]=true;
            filter["userType"]=$scope.product.seller.userType;
            filter["contact"]=$scope.product.seller.mobile;
            return userSvc.getUsers(filter).then(function(result){
              console.log("users",result);
              if(result[0] && result[0].email)
              $scope.product.seller.email=result[0].email;
              if(result[0] && result[0].fname)
                $scope.product.seller.name=result[0].fname + " " + (result[0].mname || " ") + " " + (result[0].lname || " ");
            })
        }
    
        function getCategory(groupId) {
            vm.categoryList = [];
            
            if (!groupId) {
                vm.dataModel.category = "";
                return;
            }
            categorySvc.getCategoryOnFilter({groupId: groupId})
                .then(function(result) {
                    vm.categoryList = result;
                })
        }

        function loadViewData(){
            AssetSaleChargeSvc.get()
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
            AssetSaleChargeSvc.save(vm.dataModel)
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
            categorySvc.getCategoryOnFilter({groupId: rowData.group._id})
                .then(function(result) {
                    vm.categoryList = result;
                    vm.dataModel.category = rowData.category._id;
                })
            $scope.isEdit = true;
        }

          function update(form){
            if(form.$invalid){
                $scope.submitted = true;
                return;
            }
            AssetSaleChargeSvc.update(vm.dataModel)
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
            AssetSaleChargeSvc.destroy(id)
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