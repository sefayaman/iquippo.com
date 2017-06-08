(function() {
  'use strict';

  angular.module('sreizaoApp').controller('AssetInAuctionCtrl', AssetInAuctionCtrl);

  function AssetInAuctionCtrl($scope, $state, $window,categorySvc,brandSvc,modelSvc,productSvc, AuctionSvc, $location) {
    var vm = this;

    var query = $location.search();
    $scope.auctionName=$location.search().auctionName;
    $scope.docName=$location.search().docName;
    $scope.docType=$location.search().docType;
    var filter = {};

    $scope.equipmentSearchFilter={};
    $scope.mfgyr = {};
    vm.fireCommand = fireCommand;
    vm.auctionDetailListing = [];
    vm.backButton = backButton;
    vm.auctionName = $location.search().auctionName;
    $scope.auctionValue = $location.search().auctionType;
    $scope.openUrl = openUrl;

    //registering category brand functions
    vm.onCategoryChange=onCategoryChange;
    vm.onBrandChange=onBrandChange;


    function openUrl(_id) {
      if (!_id)
        return;

      $window.open('/productdetail/' + _id, '_blank');
    }

    function init() {
      categorySvc.getAllCategory()
      .then(function(result){
        $scope.allCategory = result;
      });
      $scope.auctionId=query.auctionId;
      filter.auctionId = query.auctionId;
      filter.status = "request_approved";
      console.log("filters",filter);
      getAssetsInAuction(filter);
    }

    init();

    function backButton() {
      $window.history.back();
      //$state.go("auctions?type="+ $scope.auctionType);
    }

    function onCategoryChange(category,noAction){
      $scope.brandList = [];
      $scope.modelList = [];
      if(!noAction){
        $scope.equipmentSearchFilter.brand = "";
        $scope.equipmentSearchFilter.model = "";
      }
      if(!category){
        $scope.equipmentSearchFilter.category = "";
        fireCommand();
        return;
      }
     var filter = {};
     filter['category'] = category;
      brandSvc.getBrandOnFilter(filter)
      .then(function(result){
        $scope.brandList = result;
      });
     
  }

  function onBrandChange(brand,noAction){
    $scope.modelList = [];
    if(!noAction)
        $scope.equipmentSearchFilter.model = "";
    if(!brand) {
      fireCommand();
      return;
    }
   var filter = {};
   filter['brand'] = brand;
    modelSvc.getModelOnFilter(filter)
    .then(function(result){
      $scope.modelList = result;
    })

  }

  function fireCommand(noReset,doNotSaveState){

    if(!$scope.mfgyr.min && !$scope.mfgyr.max)
       delete $scope.equipmentSearchFilter.mfgYear;

      /*if(!noReset)
        vm.currentPage = 1;
      if(!doNotSaveState){
        saveState(false);
      

      }*/
      var filter = {};
      angular.copy($scope.equipmentSearchFilter,filter);

      filter['status'] = "request_approved";
      //filter['sort'] = {featured:-1};
      $scope.searching = true;

      console.log("filter",filter);

      if($scope.equipmentSearchFilter && $scope.equipmentSearchFilter.locationName){
        filter.location=$scope.equipmentSearchFilter.locationName;
         delete filter.locationName;
        }
       filter['auctionId']=$scope.auctionId;
       console.log("I am here",filter);
      getAssetsInAuction(filter);
  }

  function getAssetsInAuction(filter){
    var assetIds = [];
    AuctionSvc.getOnFilter(filter)
        .then(function(result) {
          if (result) {
            console.log("data recieved",result);
            result.forEach(function(item) {
              if (item.external === false && item.product.assetId)
                assetIds[assetIds.length] = item.product.assetId;
            });
            delete filter.auctionId;
            delete filter.status;
            if (assetIds.length > 0) {
              filter.assetIds = assetIds;
              console.log("init",filter);
              productSvc.getProductOnFilter(filter)
                .then(function(data) {
                  data.forEach(function(item) {
                    if (item.status === false && item.assetId) {
                      for (var i = 0; i < result.length; i++) {
                        if (result[i].product.assetId === item.assetId)
                          result.splice(i, 1);
                      }
                    }
                  });
                  vm.auctionDetailListing = result;
                  $scope.auctionValue = $location.search().auctionType;
                });
            } else {
              assetIds = [];
              vm.auctionDetailListing = result;              
              $scope.auctionValue=$location.search().auctionType;            
            }
          }
        });
  }



  }
})();