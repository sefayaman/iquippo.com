(function() {
  'use strict';

  angular.module('sreizaoApp').controller('AssetInAuctionCtrl', AssetInAuctionCtrl);

  function AssetInAuctionCtrl($scope, $state, $window, AuctionSvc, $location, productSvc) {
    var vm = this;

    var query = $location.search();
    var filter = {};
      
    vm.auctionDetailListing = [];
    vm.backButton = backButton;
    $scope.openUrl = openUrl;

    function openUrl(_id){
      $window.open('/productdetail/'+_id,'_blank');
    }

    function init() {
      var assetIds = [];
      filter.auctionId = query.auctionId;
      filter.status = "request_approved";
      AuctionSvc.getOnFilter(filter)
        .then(function(result) {
          if(result) {
            result.forEach(function(item){
              if(item.external === false && item.product.assetId)
                assetIds[assetIds.length] = item.product.assetId;
            });
            filter = {};
            if(assetIds.length > 0) {
              filter.assetIds = assetIds;
              productSvc.getProductOnFilter(filter)
              .then(function(data){
                data.forEach(function(item){
                  if(item.status === false && item.assetId) {
                    for(var i = 0; i < result.length; i++){
                      if (result[i].product.assetId === item.assetId) 
                        result.splice(i, 1);
                    }
                  }
                });
              vm.auctionDetailListing = result;
              });
            } else {
              assetIds = [];
              vm.auctionDetailListing = result;
            }
          }
        });
    }

    init();

    function backButton() {
      $window.history.back();
      //$state.go("auctions?type="+ $scope.auctionType);
    }

  }
})();