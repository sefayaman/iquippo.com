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
        vm.getUserOnRole = getUserOnRole;
        vm.onUserChange = onUserChange;
        vm.userSearch=userSearch;
        vm.findSingleUser = findSingleUser;
        var initFilter = {};
        var filter = {};
        var userFilter = {};
        vm.searchStr = "";
        $scope.container = {};
        vm.users = [];
        //vm.channelpartnerUser = [];
        vm.enterpriseUser = [];

        function init(){
            filter = {};
            initFilter.pagination = true;
            angular.copy(initFilter, filter);

            getEnterpriseUser();
            //getChannelpartnerUser();
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

        function getUserOnRole(role, noChange) {
            if(role == 'default' || role == 'customer') {
                $scope.container.mobile = "";
                $scope.container.userId = "";
                return;
            }
            if(!noChange)
                $scope.container.userId = "";
            switch (role) {
                case "enterprise" : 
                    if (vm.enterpriseUser.length < 0) {
                        getEnterpriseUser();
                    } else {
                        vm.users = [];
                        angular.copy(vm.enterpriseUser, vm.users);
                    }
                    break;
                // case "channelpartner" : 
                //     if (vm.channelpartnerUser.length < 0) {
                //         getChannelpartnerUser();
                //     } else {
                //         vm.users = [];
                //         angular.copy(vm.channelpartnerUser, vm.users);
                //     }
                //     break;     
            }
        }

        function getEnterpriseUser() {
            userFilter = {};
            userFilter.role = "enterprise";
            userFilter.enterprise = true;
            userFilter.status = true;
            userSvc.getUsers(userFilter).then(function(data){
              vm.enterpriseUser = data;
            });
        }

        /*function getChannelpartnerUser() {
            userFilter = {};
            userFilter.role = "channelpartner";
            userFilter.status = true;
            userSvc.getUsers(userFilter).then(function(data){
              vm.channelpartnerUser = data;
            });
        }*/

        function onUserChange(user, role) {
            if(!user)
                return;
            vm.dataModel.user = {};
            if(role != 'customer') {
                vm.users.forEach(function(item) {
                    if (item._id == user) {
                        vm.dataModel.user.userId = item._id;
                        vm.dataModel.user.mobile = item.mobile;
                        vm.dataModel.user.name = item.fname + " " + item.lname;
                        if(item.enterpriseId)
                            vm.dataModel.enterpriseId = item.enterpriseId;
                        return;
                    }
                });
            } else {
                vm.dataModel.user.userId = user._id;
                vm.dataModel.user.mobile = user.mobile;
                vm.dataModel.user.name = user.fname + " " + user.lname;
                if(user.enterpriseId)
                    vm.dataModel.enterpriseId = user.enterpriseId;
            }
        }

        function userSearch(searchUser){
          if (!vm.dataModel.userRole) 
            return;
          
          if(searchUser && searchUser.length < 4) 
            return;

          userFilter = {};
          userFilter.status = true;
          userFilter.role = vm.dataModel.userRole;
          userFilter.onlyUser = true;
          userFilter.mobileno = $scope.container.mobile;
          return userSvc.getUsers(userFilter).then(function(result) {
              return result.map(function(item){
                return item.mobile;
              });
          });
        }

        function findSingleUser(){
            if(!$scope.container.mobile)
              return;
            
            if($scope.container.mobile 
                && $scope.container.mobile.length < 6) 
                return;

            userFilter = {};
            userFilter.status = true;
            userFilter.role = vm.dataModel.userRole;
            userFilter.onlyUser = true;
            userFilter.mobileno = $scope.container.mobile;
            return userSvc.getUsers(userFilter).then(function(result){
              if(result.length == 1)
                onUserChange(result[0], vm.dataModel.userRole);
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
            if(vm.dataModel.userRole == 'default' && vm.dataModel.user) {
                delete vm.dataModel.user;
                if(vm.dataModel.enterpriseId)
                    delete vm.dataModel.enterpriseId;
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
            vm.dataModel = angular.copy(rowData);
            getUserOnRole(rowData.userRole, true);
            if(vm.dataModel.user && vm.dataModel.user.userId && vm.dataModel.userRole == 'enterprise') {
                onUserChange(vm.dataModel.user.userId, vm.dataModel.userRole);
                $scope.container.userId = vm.dataModel.user.userId;
            }
            if(vm.dataModel.user && vm.dataModel.user.mobile && vm.dataModel.userRole == 'customer') {
                $scope.container.mobile = vm.dataModel.user.mobile;
                findSingleUser();
            }
            $scope.isEdit = true;
        }

          function update(form){
            if(form.$invalid){
                $scope.submitted = true;
                return;
            }
            if(vm.dataModel.userRole == 'default' && vm.dataModel.user) {
                delete vm.dataModel.user;
                if(vm.dataModel.enterpriseId)
                    delete vm.dataModel.enterpriseId;
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