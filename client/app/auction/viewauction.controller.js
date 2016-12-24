(function() {
  'use strict';

  angular.module('sreizaoApp').controller('ViewAuctionCtrl', ViewAuctionCtrl);

  function ViewAuctionCtrl($scope, $rootScope, $location, Modal, Auth, AuctionSvc, UtilSvc,$stateParams,$state) {
    var vm = this;
    //pagination variables
    var prevPage = 0;
    vm.itemsPerPage = 50;
    vm.currentPage = 1;
    vm.totalItems = 0;
    vm.maxSize = 6;
    var first_id = null;
    var last_id = null;

    var listingCount = {};
    vm.totalItemsInAuction = 0
    vm.totalItemsSold = 0;
    vm.totalSaleValue = 0;

    vm.auctionListing = [];
    $scope.closeAuctionItems = 0;
    $scope.openAuctionItems = 0;
    vm.openMap = openMap;

    vm.fireCommand = fireCommand;
    vm.fireCommandType = fireCommandType;
    vm.getProductData = getProductData;
    $scope.auctionType = 'closed';

    var dataToSend = {};
    $scope.getConcatData = [];
    var query = $location.search();

    function init() {
      //dataToSend.auctionType = $scope.auctionType;
      dataToSend.pagination = true;
      dataToSend.itemsPerPage = vm.itemsPerPage;
      if($stateParams.type)
          $scope.auctionType = $stateParams.type;
      var filter = {};
      angular.copy(dataToSend,filter);
      getAuctions(filter);

    }

    init();

    function getAuctions(filter) {

      filter.prevPage = prevPage;
      filter.currentPage = vm.currentPage;
      filter.first_id = first_id;
      filter.last_id = last_id;
      if($scope.auctionType)
        filter['auctionType'] = $scope.auctionType;
      else
        filter['auctionType'] = "closed";

      AuctionSvc.getAuctionDateData(filter).then(function(result){
        getAuctionWiseProductData(result);
        vm.auctionListing  = result.items;
        vm.totalItems = result.totalItems;
        prevPage = vm.currentPage;
        if(vm.auctionListing.length > 0){
          first_id = vm.auctionListing[0]._id;
          last_id = vm.auctionListing[vm.auctionListing.length - 1]._id;
        }
      })
      .catch(function(err){
        Modal.alert("Error in geting auction master data");
      })
    }

    function getAuctionWiseProductData(result){
      var filter = {};
      var auctionIds = [];
      result.items.forEach(function(item){
        auctionIds[auctionIds.length] = item._id;
      });
      filter.auctionIds = auctionIds;
      filter.isClosed = $scope.auctionType == 'closed'?'y':'n';
      AuctionSvc.getAuctionWiseProductData(filter)
      .then(function(data){
        $scope.getConcatData = data;
        console.log($scope.getConcatData);
      })
      .catch(function(){
      })
    }

    function getProductData(id, type){
      if(angular.isUndefined($scope.getConcatData)) {
        if(type == "total_products")
          return 0;
        if(type == "total_amount")
          return 0;
        if(type == "total_sold")
          return 0;
      } else {
        var totalItemsInAuction = 0;
        var totalSaleValue = 0;
        var totalsold = 0;
        $scope.getConcatData.forEach(function(data){
            if(id == data._id) {
              totalItemsInAuction = data.total_products;
              totalSaleValue = data.sumOfInsale;
              totalsold = data.isSoldCount;
            }
          });
        if(type == "total_products") {
          if(totalItemsInAuction > 0)
            return totalItemsInAuction;
        }
        if(type == "total_amount"){
          if(totalSaleValue > 0)
            return totalSaleValue;
        }
        if(type == "total_sold"){
          if(totalsold > 0)
            return totalsold;
        }
        return 0;
      }
    }

  function fireCommand(reset,filterObj){
      if(reset)
        resetPagination();
      var filter = {};
      if(!filterObj)
          angular.copy(dataToSend, filter);
      else
        filter = filterObj;
      getAuctions(filter);      
    }

    function fireCommandType(auctionType) {
      resetPagination();
      var filter = {};
      angular.copy(dataToSend, filter);
      $scope.auctionType = auctionType;
      $state.go("viewauctions",{type:auctionType},{notify:false});
      getAuctions(filter);
    }

    function resetPagination() {
      prevPage = 0;
      vm.currentPage = 1;
      vm.totalItems = 0;
      first_id = null;
      last_id = null;
    }

    function openMap(city, loc) {
      AuctionSvc.getLatLong(city, loc).then(function(result) {
        Modal.openMap(result, $scope);
      }).catch(function(err) {
        Modal.alert(err)
      })
    }


  }
 
})();