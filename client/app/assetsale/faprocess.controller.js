(function () {
    'use strict';
    angular.module('sreizaoApp').controller('FAProcessCtrl', FAProcessCtrl);
    function FAProcessCtrl($scope, $rootScope, $state, $stateParams, Auth, productSvc, AssetSaleSvc, userSvc, PagerSvc, Modal) {
        var vm = this;
        $scope.pager = PagerSvc.getPager();

        vm.dataList = [];
        //vm.tabVal = $stateParams.t == 1?"approved":"closed";
        $scope.onTabChange = onTabChange;
        vm.fireCommand = fireCommand;
        vm.openDialog = openDialog;
        vm.validateAction = AssetSaleSvc.validateAction;
        vm.update = update;
        vm.exportExcel = exportExcel;
        var initFilter = {actionable: 'y'};

        function init() {
            if (!Auth.isFAgencyPartner())
                $state.go('main');
            $scope.tabValue = 'fulfilmentagency';
            initFilter.userType = 'FA';
            if (Auth.getCurrentUser().partnerInfo.defaultPartner)
                initFilter.defaultPartner = 'y';
            else
                initFilter.defaultPartner = 'n';
            initFilter.partnerId = Auth.getCurrentUser().partnerInfo.partnerId;

            if ($stateParams.t == 1)
                vm.tabVal = "approved";
            else if ($stateParams.t == 2)
                vm.tabVal = "closed";
            else
                vm.tabVal = "bidproduct";

            fireCommand(true);
            //getApprovedBids(angular.copy(initFilter));
        }

        function onTabChange(tab, tabVal) {
            vm.tabVal = tab;
            vm.searchStr = "";
            fireCommand(true);
            $state.go($state.current.name, {t: tabVal}, {location: 'replace', notify: false});
        }

        function fireCommand(reset) {
            if (reset)
                $scope.pager.reset();
            var filter = angular.copy(initFilter);
            var filterAll = angular.copy(initFilter);
            if (vm.searchStr) {
                filter.searchStr = encodeURIComponent(vm.searchStr);
                if (vm.tabVal === 'bidproduct') {
                    filter.isSearch = true;
                    filter.searchstr = vm.searchStr;
                    filterAll.isSearch = true;
                    filterAll.searchstr = vm.searchStr;
                }
            }
            if (vm.tabVal === 'approved')
                getApprovedBids(filter);
            else if (vm.tabVal === 'closed')
                getClosedBids(filter);
            else
                getBidProducts(filter);
                getBidProductAll(filterAll);
            /*if(vm.activeBid === 'auctionable')
             getBidProducts(filter);
             else
             getClosedBids(filter);	*/
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

                    });
        }
        
        function getBidProductAll(filterAll){
            AssetSaleSvc.getBidAllProduct(filterAll)
                    .then(function (result) {
                        vm.dataListAll = result.products;
                    })
                    .catch(function (err) {
                        Modal.alert(err);
                    });
        }

        function getApprovedBids(filter) {
            $scope.pager.copy(filter);
            filter.actionable = 'y';
            filter.dealStatuses = dealStatuses.slice(6, 12);
            filter.bidStatus = bidStatuses[7];
            //filter.dealStatus = dealStatuses[12];
            filter.pagination = true;
            AssetSaleSvc.get(filter)
                    .then(function (result) {
                        vm.dataList = result.items;
                        $scope.pager.update(result.items, result.totalItems);
                    });
        }

        function getClosedBids(filter) {
            $scope.pager.copy(filter);
            filter.actionable = 'n';
            filter.dealStatus = dealStatuses[12];
            filter.pagination = true;
            AssetSaleSvc.get(filter)
                    .then(function (result) {
                        vm.dataList = result.items;
                        $scope.pager.update(result.items, result.totalItems);
                    });
        }

        function update(bid, action, cb) {
            Modal.confirm(StatusChangeConfirmationMsg[action], function (retVal) {
                if (retVal === 'yes')
                    AssetSaleSvc.changeBidStatus(bid, action, cb || fireCommand);
            });
        }

        function openDialog(bidData, popupName, modalClass, formType) {
            var newScope = $rootScope.$new();
            if (popupName === 'bidProductDetailPopup') {
                newScope.data = bidData;
                if (formType)
                    newScope.viewBlock = formType;
            } else {
                newScope.bidData = bidData;
                if (formType)
                    newScope.formType = formType;
            }
            Modal.openDialog(popupName, newScope, modalClass);
        }

        function exportExcel() {
            var exportFilter = {};
            angular.copy(initFilter, exportFilter)
            if (vm.tabVal === 'approved') {
                exportFilter.actionable = 'y';
                exportFilter.dealStatuses = dealStatuses.slice(6, 12);
                exportFilter.bidStatus = bidStatuses[7];
            } else if (vm.tabVal === 'closed') {
                exportFilter.actionable = 'n';
                exportFilter.dealStatuses = dealStatuses[12];
            } else {
                if (vm.dataListAll) {
                    exportFilter.productIds = [];
                    vm.dataListAll.forEach(function (item) {
                        exportFilter.productIds.push(item._id);
                    });
                }
            }

            exportFilter.fa = 'y';
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