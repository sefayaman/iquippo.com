(function() {
  'use strict';

  angular.module('sreizaoApp').controller('AssetInAuctionCtrl', AssetInAuctionCtrl);

  function AssetInAuctionCtrl($scope, $state, $window, AuctionSvc, $location) {
    var vm = this;

    var query = $location.search();

    vm.auctionDetailListing = [];
    vm.backButton = backButton;
    $scope.openUrl = openUrl;

    function openUrl(_id){
      $window.open('/productdetail/'+_id,'_self');
    }

    function init() {
      var filter = {};
      filter.auctionId = query.auctionId;
      filter.status = "request_approved";
      AuctionSvc.getOnFilter(filter)
        .then(function(result) {
          vm.auctionDetailListing = result;
        });
    }

    init();

    function backButton() {
      $window.history.back();
      //$state.go("auctions?type="+ $scope.auctionType);
    }

  }
})();