(function() {
    'use strict';

    angular.module('admin').controller('BannerMasterCtrl', BannerMasterCtrl);

    function BannerMasterCtrl($scope,$rootScope,$state,$window,Modal,Auth,PagerSvc,$filter,uploadSvc,BannerSvc){
    	var vm  = this;
        $scope.pager = PagerSvc.getPager();
        vm.banner = {};
        vm.bannerEdit = false;
        vm.getAllBanner = getAllBanner;
        vm.saveBanner = saveBanner;
        vm.updateBanner = updateBanner;
        vm.editBanner = editBanner;
        vm.deleteBanner = deleteBanner;
        $scope.updateBannerImage = updateBannerImage;
        $scope.updateMobBannerImage = updateMobBannerImage;
        vm.searchFn = searchFn;
        vm.activeOnly = false;
        vm.searchStr = "";

        function init(){
            resetData();
            getAllBanner({});
        }

        function getAllBanner(filter) {
            if(vm.activeOnly)
                filter["valid"] = "y";
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

        function updateBannerImage(files) {
            if (files.length == 0)
                return;
            $rootScope.loading = true;
            uploadSvc.upload(files[0], bannerDir).then(function(result) {
                $rootScope.loading = false;
                vm.banner.webImg = result.data.filename;
            })
            .catch(function(err){
                $rootScope.loading = false;
            });
        }

        function updateMobBannerImage(files) {
            if (files.length == 0)
                return;
             $rootScope.loading = true;
            uploadSvc.upload(files[0], bannerDir).then(function(result) {
                $rootScope.loading = false;
                vm.banner.mobileImg = result.data.filename;
            })
            .catch(function(err){
                $rootScope.loading = false;
            });;
        }

        function saveBanner(form) {
            /*if(form.$invalid){
                $scope.submitted = true;
                return;
            }*/
            if (vm.banner.bannerClick === 'hyper_link' && !vm.banner.linkUrl) {
                Modal.alert("Please enter hyper link url", true);
                return;
            }

            if (!vm.banner.webImg) {
                Modal.alert("Please upload image for web.", true);
                return;
            }
            if (!vm.banner.mobileImg && vm.banner.showInMobile == 'Yes') {
                Modal.alert("Please upload image for mobile.", true);
                return;
            }

             if(vm.banner.bannerClick !== 'hyper_link')
                vm.banner.linkUrl = "";
            //$scope.submitted = false;
            BannerSvc.save(vm.banner)
                .then(function(res) {
                    if (res.errorCode == 0) {
                        vm.banner = {};
                        resetData();
                        getAllBanner({});
                    }
                    Modal.alert(res.message);
                })

        }

        function updateFinanceMasterImage(files) {
            if (files.length == 0)
                return;
            uploadSvc.upload(files[0], financemasterDir).then(function(result) {
                vm.financeData.image = result.data.filename;
            });
        }

        function updateBanner(form) {
            /*if(form.$invalid){
                $scope.submitted = true;
                return;
            }*/
            if (vm.banner.bannerClick === 'hyper_link' && !vm.banner.linkUrl) {
                Modal.alert("Please enter hyper link url", true);
                return;
            }
            if (!vm.banner.mobileImg && vm.banner.showInMobile == 'Yes') {
                Modal.alert("Please upload image for mobile.", true);
                return;
            }
             if(vm.banner.bannerClick !== 'hyper_link')
                vm.banner.linkUrl = "";

            $scope.submitted = false;
            BannerSvc.update(vm.banner)
                .then(function(res) {
                    if (res.errorCode == 0) {
                        vm.banner = {};
                        resetData();
                        vm.bannerEdit = false;
                        getAllBanner({});
                    }
                    Modal.alert(res.message);
                })
        }

        function editBanner(index) {
            angular.copy(vm.bannerList[index], vm.banner)
            vm.bannerEdit = true;
            $window.scrollTo(0, 0);
        }

        function deleteBanner(index) {
            Modal.confirm("Are you sure want to delete?", function(ret) {
                if (ret == "yes")
                    submitDeleteBanner(index);
            });
        }

        function submitDeleteBanner(idx) {
            BannerSvc.deleteBanner(vm.bannerList[idx])
                .then(function(result) {
                    vm.banner = {};
                    resetData();
                    getAllBanner({});
                })
        }

        function resetData() {
            vm.banner.ticker = "No";
            vm.banner.showInMobile = "No";
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