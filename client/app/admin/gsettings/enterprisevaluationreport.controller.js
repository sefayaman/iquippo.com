(function() {
    'use strict';

    angular.module('admin').controller('EnterpriseValuationReportCtrl', EnterpriseValuationReportCtrl);

    function EnterpriseValuationReportCtrl($scope,$rootScope,$state,Modal,Auth,PagerSvc,$filter,userSvc){
    	var vm  = this;
        $scope.pager = PagerSvc.getPager();
        vm.filteredList = [];
        vm.enterprises = [];
        vm.update = update;
        function init(){
            getUsers({});
        }

        function getUsers(filter) {
            filter.role = "enterprise";
            filter.enterprise = true;
            filter.status = true;
            userSvc.getUsers(filter)
            .then(function(data){
              vm.filteredList = data;
              vm.enterprises = data;
               $scope.pager.update(null,vm.filteredList.length,1);
            });
        }

        function searchFn(type){
            vm.filteredList = $filter('filter')(vm.enterprises,vm.searchStr);
            $scope.pager.update(null,vm.filteredList.length,1);
        }

        function update(user){
            $rootScope.loading = true;
            userSvc.updateUser(user).then(function(result){
                $rootScope.loading = false;
                getUsers({});
            })
            .catch(function(err){
                $rootScope.loading = false;
                console.log("error in user update", err);
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