(function() {
    'use strict';

    angular.module('admin').controller('EnterpriseValuationReportCtrl', EnterpriseValuationReportCtrl);

    function EnterpriseValuationReportCtrl($scope,$rootScope,$state,Modal,Auth,PagerSvc,$filter,userSvc,EnterpriseSvc,settingSvc){
    	var vm  = this;
        $scope.timestamp = new Date().getTime();
        $scope.pager = PagerSvc.getPager();
        $scope.filename = "";
        vm.filteredList = [];
        vm.enterprises = [];
        vm.update = update;
        vm.generateReport = EnterpriseSvc.generateReport;
        function init(){
            getUsers({});
            settingSvc.get("Ent_Valuation_Report")
            .then(function(res){
                $scope.filename = res.value;
            })
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