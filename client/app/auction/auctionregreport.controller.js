(function() {
  'use strict';
  
  angular.module('sreizaoApp').controller('AuctionRegReportCtrl', AuctionRegReportCtrl);

  function AuctionRegReportCtrl($scope, Modal, Auth, AuctionSvc, UtilSvc, userRegForAuctionSvc, PagerSvc) {
    var vm = this;
    vm.auctions = [];
    vm.master = false;
    var filter = {};
    $scope.pager = PagerSvc.getPager();
    vm.searchStr = "";
    
    vm.fireCommand = fireCommand;

    vm.exportExcel = exportExcel;
    
    var initFilter = {};
    
    function init() {
      Auth.isLoggedInAsync(function(loggedIn) {
        if (loggedIn) {
          filter = {};
          initFilter.pagination = true;
          if(Auth.getCurrentUser().mobile && Auth.isAuctionPartner())
            initFilter.auctionOwnerMobile = Auth.getCurrentUser().mobile;
          angular.copy(initFilter, filter);

          getRegisterUserForAuction(filter);
        }
      });
    }

    init();

    function getRegisterUserForAuction(filter) {
      $scope.pager.copy(filter);
      userRegForAuctionSvc.getFilterOnRegisterUser(filter)
        .then(function(result) {
          vm.registerUser = result.items;
          vm.totalItems = result.totalItems;
          $scope.pager.update(result.items, result.totalItems);
        });
    }

    function fireCommand(reset) {
      if (reset)
        $scope.pager.reset();
      filter = {};
      angular.copy(initFilter, filter);
      if (vm.searchStr)
        filter.searchstr = vm.searchStr;
      getRegisterUserForAuction(filter);
    }

    function exportExcel() {
      filter = {};
      if(Auth.getCurrentUser().mobile && Auth.isAuctionPartner())
        filter.auctionOwnerMobile = Auth.getCurrentUser().mobile;
          
      var fileName = "User_Request_For_Auction_Report_";
      userRegForAuctionSvc.exportData(filter)
      .then(function(res) {
      saveAs(new Blob([s2ab(res)], {type: "application/octet-stream"}), fileName + new Date().getTime() + ".xlsx");
      },
      function(res) {
        console.log(res);
      });
    }
  }

})();