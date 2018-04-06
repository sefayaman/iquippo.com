(function() {
    'use strict';

    angular.module('admin').controller('BannerProductMappingCtrl', BannerProductMappingCtrl);

    function BannerProductMappingCtrl($scope,$rootScope,$state,Modal,Auth,PagerSvc,$filter,BannerSvc){
    	var vm  = this;
        $scope.pager = PagerSvc.getPager();
        vm.banner = {};
        vm.bannerEdit = false;
        vm.getAllBanner = getAllBanner;
        vm.updateBanner = updateBanner;
        vm.cancelUpdate = cancelUpdate;
        vm.editBanner = editBanner;
        vm.searchFn = searchFn;
        vm.activeOnly = false;
        vm.searchStr = "";

        function init(){
            getAllBanner({});
        }

        function getAllBanner(filter) {
            if(vm.activeOnly)
                filter["valid"] = "y";
            filter.bannerClick = "lead_capture";
            BannerSvc.get(filter)
                .then(function(result) {
                    vm.filteredList = result;
                    vm.bannerList = result;
                    $scope.pager.update(null,vm.filteredList.length,1);
                });
        }

        function searchFn(type){
            vm.filteredList = $filter('filter')(vm.bannerList,vm.searchStr);
            $scope.pager.update(null,vm.filteredList.length,1);
        }

        function updateBanner(form) {
            var products = vm.banner.products;
            if(vm.banner && products && products.length){
                vm.banner.products = [];
                vm.banner.products = products.filter(function(item){
                    return item && item.text;
                });
            }
            BannerSvc.update(vm.banner)
                .then(function(res) {
                    if (res.errorCode == 0) {
                        vm.banner = {};
                        //resetData();
                        vm.bannerEdit = false;
                        getAllBanner({});
                    }
                    Modal.alert(res.message);
                })
        }

        function cancelUpdate(){
            vm.banner = {};
            vm.bannerEdit = false;
        }

        function editBanner(banner){
            vm.banner = angular.copy(banner);
            if(!vm.banner.products || !vm.banner.products.length)
                vm.banner.products = [{}];
            vm.bannerEdit = true;
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