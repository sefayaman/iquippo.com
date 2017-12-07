(function () {
    'use strict';
    angular.module('sreizaoApp').controller('BidProductCtrl', BidProductCtrl);
    function BidProductCtrl($scope, $rootScope, $state, $stateParams, Auth, productSvc, AssetSaleSvc, userSvc, PagerSvc, Modal) {
        var vm = this;
        $scope.pager = PagerSvc.getPager();

        var initFilter = {};
        vm.dataList = [];
        vm.activeBid = "actionable";
        $scope.onTabChange = onTabChange;
        vm.fireCommand = fireCommand;
        vm.openDialog = openDialog;
        vm.exportExcel = exportExcel;

        function init() {

            initFilter.bidReceived = true;
            $scope.$parent.tabValue = Auth.isAdmin() ? 'administrator' : 'seller';
            if (!Auth.isAdmin())
                initFilter.userid = Auth.getCurrentUser()._id;
            if (Auth.isEnterprise() || Auth.isEnterpriseUser()) {
                delete initFilter.userid;
                initFilter.enterpriseId = Auth.getCurrentUser().enterpriseId;
            }

            //var filter = angular.copy(initFilter);
            //filter.bidRequestApproved = 'n';
            //getBidProducts(filter);
            if ($stateParams.t == 2)
                vm.activeBid = 'saleinprocess';
            else if ($stateParams.t == 3)
                vm.activeBid = 'closed';
            else
                vm.activeBid = "actionable";
            fireCommand(true);
        }


        function onTabChange(tab, tabVal) {
            vm.activeBid = tab;
            vm.searchStr = "";
            $state.go($state.current.name, {t: tabVal}, {location: 'replace', notify: false});
            fireCommand(true);
        }

        function fireCommand(reset) {
            if (reset)
                $scope.pager.reset();
            var filter = angular.copy(initFilter);
            var filterAll = angular.copy(initFilter);
            if (vm.searchStr) {
                filter.isSearch = true;
                filter.searchstr = vm.searchStr;
                if (vm.activeBid === 'closed')
                    filter.searchStr = vm.searchStr;
                    filterAll.searchStr = vm.searchStr;
            }

            if (vm.activeBid === 'actionable') {
                filter.bidRequestApproved = 'n';
                filterAll.bidRequestApproved = 'n';
                getBidProducts(filter);
                getBidProductAll(filterAll);
            } else if (vm.activeBid === 'saleinprocess') {
                filter.bidRequestApproved = 'y';
                filterAll.bidRequestApproved = 'y';
                getBidProducts(filter);
                getBidProductAll(filterAll);
            } else
                getClosedBids(filter);
        }

        function getBidProducts(filter) {
            $scope.pager.copy(filter);
            filter.pagination = true;
            AssetSaleSvc.getBidProduct(filter)
                    .then(function (result) {
                        vm.dataList = result.products;
                        $scope.pager.update(result.products, result.totalItems);
                    })
                    .catch(function (err) {
                        Modal.alert(err);
                    });
        }
        
        function getBidProductAll(filterAll){
            AssetSaleSvc.getBidProductAll(filterAll)
                    .then(function (result) {
                        vm.dataListAll = result.products;
                    })
                    .catch(function (err) {
                        Modal.alert(err);
                    });
        }

        function getClosedBids(filter) {
            $scope.pager.copy(filter);
            filter.actionable = 'n';
            //filter.dealStatus = dealStatuses[12];
            filter.pagination = true;
            AssetSaleSvc.get(filter)
                    .then(function (result) {
                        vm.dataList = result.items;
                        $scope.pager.update(result.items, result.totalItems);
                    });
        }

        function openDialog(data, popupName, modalClass, viewBlock) {
            var newScope = $rootScope.$new();
            newScope.data = data;
            newScope.viewBlock = viewBlock;
            Modal.openDialog(popupName, newScope, modalClass);
        }

        function exportExcel(allReport) {
            var exportFilter = {};
            angular.copy(initFilter, exportFilter);
            //console.log('--data_check--',vm.dataList);
            if (vm.activeBid === 'actionable' || vm.activeBid === 'saleinprocess') {
                if (vm.dataListAll) {
                    exportFilter.productIds = [];
                    vm.dataListAll.forEach(function (item) {
                        exportFilter.productIds.push(item._id);
                    });
                }
                exportFilter.actionable = 'y';
            } else {
                exportFilter.actionable = 'n';
                //exportFilter.dealStatuses = dealStatuses[12];
            }
            if (allReport === 'all') {
                exportFilter = {};
                angular.copy(initFilter, exportFilter);
                exportFilter.bidChanged = true;
            }
            if (allReport === 'payment') {
                exportFilter = {};
                angular.copy(initFilter, exportFilter);
                exportFilter.payment = 'y';
            }

            if (!Auth.isAdmin())
                exportFilter.seller = 'y';
            AssetSaleSvc.exportExcel(exportFilter);
        }

        //loading start
        Auth.isLoggedInAsync(function (loggedIn) {
            if (loggedIn)
                init();
            else
                $state.go('main');
        });

    }
})();