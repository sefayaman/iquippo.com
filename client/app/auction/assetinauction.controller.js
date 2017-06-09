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
    vm.productSearchOnMfg=productSearchOnMfg;
    vm.auctionDetailListing = [];
    vm.backButton = backButton;
    vm.auctionName=$location.search().auctionName;
    $scope.auctionValue=$location.search().auctionType;
    $scope.openUrl = openUrl;

    //registering category brand functions
    vm.onCategoryChange=onCategoryChange;
    vm.onBrandChange=onBrandChange;


    function openUrl(_id) {
      if(!_id)
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
     filter['categoryName'] = category;
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
   filter['brandName'] = brand;
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
            var filter={};
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
                  $scope.auctionValue=$location.search().auctionType;
                });
            } else {
              assetIds = [];
              vm.auctionDetailListing = result;              
              $scope.auctionValue=$location.search().auctionType;            
            }
          }
        });
  }

  $scope.today = function() {
    $scope.mfgyr = new Date();
  };
  $scope.today();
  $scope.datepickers = {
    min: false,
    max: false
  };
  $scope.clear = function () {
    $scope.mfgyr = null;
  };

  // Disable weekend selection
  /*$scope.disabled = function(date, mode) {
    return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
  };*/

  $scope.toggleMin = function() {
    $scope.minDate = $scope.minDate ? null : new Date();
  };
  $scope.toggleMin();
  $scope.maxDate = new Date(2020, 5, 22);

  $scope.open = function($event, which) {
    $event.preventDefault();
    $event.stopPropagation();

    $scope.datepickers[which]= true;
  };

  $scope.setDate = function(year, month, day,key) {
    $scope.mfgyr[key] = new Date(year, month, day);
  };

  $scope.datepickerOptions = {
    datepickerMode:"'year'",
    minMode:"'year'",
    minDate:"minDate",
    showWeeks:"false",
  };

  $scope.formats = ['yyyy', 'dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
  $scope.format = $scope.formats[0];

  $scope.status = {
    opened: false
  };

  //date picker end

  function productSearchOnMfg(){

    if(!$scope.mfgyr.min && !$scope.mfgyr.max){
      delete $scope.equipmentSearchFilter.mfgYear;
      fireCommand();
      return;
    }

    $scope.equipmentSearchFilter.mfgYear = {};
    if($scope.mfgyr.min)
      $scope.equipmentSearchFilter.mfgYear.min = $scope.mfgyr.min.getFullYear();
    else
      delete $scope.equipmentSearchFilter.mfgYear.min;

    if($scope.mfgyr.max)
      $scope.equipmentSearchFilter.mfgYear.max = $scope.mfgyr.max.getFullYear();
    else
      delete $scope.equipmentSearchFilter.mfgYear.max;
      fireCommand();
  }




  }
})();