(function() {
  'use strict';

  angular.module('sreizaoApp').controller('AssetBidPopUpCtrl', AssetBidPopUpCtrl);

  function AssetBidPopUpCtrl($scope,$cookies,LocationSvc,AssetSaleSvc, VatTaxSvc) {
    var vm = this;
    var query = $scope.params;
    var date = new Date();
    $scope.tds = 599;
    $scope.parking = 299;
    vm.submitBid = submitBid;
    var statusData={};

    //functions on scope
    vm.bidAmount = query.bidAmount;
    vm.calculateBid = calculateBid;


    function init() {
      var filter = {};
      filter.taxType = "VAT";
      filter.status = true;
      var date = new Date();
      filter.date = date;
      if (query.group)
        filter.groupId = query.group;
      if (query.category)
        filter.categoryId = query.category;
      if (query.state){
      LocationSvc.getStateHelp({stateName:query.state})
      .then(function(result){
         filter.stateId=result[0]._id;
       return VatTaxSvc.search(filter);
      })  
      .then(function(result) {
          $scope.taxRate = result[0].amount;
          $scope.total = $scope.taxRate + $scope.tds + $scope.parking + Number(vm.bidAmount);
        });
     
    /* 
     AssetSaleSvc.searchBid()
     .then(function(result){
      if(result){

      }
     
     })*/
   }

    }


    init();

    function calculateBid() {
      init();
      $scope.total = $scope.taxRate + $scope.tds + $scope.parking + Number(vm.bidAmount);
    }

    function submitBid() {
      var timestamp=new Date().getTime();
      var dataToSend={};
       statusData.offerStatus="Bid Recieved";
      statusData.bidStatus="In Progress";
      statusData.dealStatus="Decision Pending";
      statusData.assetStatus="Listed";
      statusData.tradeType=query.tradeType;
      dataToSend.ticketId=timestamp;
      dataToSend.userId=query.user._id;
      dataToSend.productId=query.productId;
      dataToSend.bidAmount=$scope.total;
      dataToSend.statusData=statusData;

      AssetSaleSvc.submitBid(dataToSend)
        .then(function(result) {

        })
        .catch(function(err) {
          throw err;
        });

    }

  }
})();

//Data to be sent to submit a bid
/*
userId,_id,ticketId,

*/