(function() {
  'use strict';

  angular.module('sreizaoApp').controller('AssetBidPopUpCtrl', AssetBidPopUpCtrl);

  function AssetBidPopUpCtrl($scope, Auth, Modal, $cookies, LocationSvc, NegotiationSvc, AssetSaleSvc, VatTaxSvc) {
    var vm = this;
    var query = $scope.params;
    var date = new Date();
    $scope.tcs = 0;
    $scope.parking = 299;
    vm.submitBid = submitBid;
    vm.buyNow = buyNow;
    var dataToSend = {};

    vm.bid = query.bid;
    if (query.product) {
      vm.salePrice = query.product.grossPrice;
      console.log(vm.salePrice);
    }
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
      if (query.state) {
        LocationSvc.getStateHelp({
            stateName: query.state
          })
          .then(function(result) {
            filter.stateId = result[0]._id;
            return VatTaxSvc.search(filter);
          })
          .then(function(result) {
            if(result.length > 0)
            $scope.taxRate = result[0].amount;
            if (vm.salePrice){
              if(vm.salePrice + $scope.taxRate > 1000000){
                $scope.tcs=Number(vm.salePrice * 0.01);
              }
              $scope.total = Number($scope.taxRate || 0) + Number($scope.tcs || 0) + Number($scope.parking) + Number(vm.salePrice || 0);
            }
            if (vm.bidAmount){
              if(vm.bidAmount + $scope.taxRate > 1000000){
                $scope.tcs=Number(vm.bidAmount * 0.01);
              }
              $scope.total = Number($scope.taxRate || 0) + Number($scope.tcs || 0) + Number($scope.parking) + Number(vm.bidAmount || 0);
            }
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
      if (vm.salePrice) {
        if(vm.salePrice + $scope.taxRate > 1000000){
                $scope.tcs=Number(vm.salePrice * 0.01);
              }
        $scope.total = Number($scope.taxRate || 0) + Number($scope.tcs || 0) + Number($scope.parking) + Number(vm.salePrice || 0);
      }
      if (vm.bidAmount){
        if(vm.bidAmount + $scope.taxRate > 1000000){
                $scope.tcs=Number(vm.bidAmount * 0.01);
              }
        $scope.total = Number($scope.taxRate || 0) + Number($scope.tcs || 0) + Number($scope.parking) + Number(vm.bidAmount || 0);
      }
    }

    function submitBid() {
       if (!Auth.getCurrentUser()._id) {
        Modal.alert("Please Login/Register for submitting your request!", true);
        return;
      }

      if (Auth.getCurrentUser().profileStatus == "incomplete") {
        return $state.go("myaccount");
      }
      var timestamp = new Date().getTime();
      var dataToSend = {};

      Modal.confirm("Do you want to submit?", function(ret) {
      if (ret == "yes") {
      dataToSend.offerStatus = offerStatuses[0];
      dataToSend.bidStatus = bidStatuses[0];
      dataToSend.dealStatus = dealStatuses[0];
      dataToSend.assetStatus = assetStatuses[0];
      dataToSend.status=true;
      dataToSend.tradeType = query.tradeType;
      dataToSend.ticketId = timestamp;
      dataToSend.userId = Auth.getCurrentUser()._id;
      dataToSend.productId = query.productId;
      dataToSend.bidAmount = $scope.total;
      AssetSaleSvc.submitBid(dataToSend)
        .then(function(result) {
          
        })
        .catch(function(err) {
          throw err;
        });
      
      }
      });
    }

    function buyNow() {
      if (!Auth.getCurrentUser()._id) {
        Modal.alert("Please Login/Register for submitting your request!", true);
        return;
      }

      if (Auth.getCurrentUser().profileStatus == "incomplete") {
        return $state.go("myaccount");
      }

      Modal.confirm("Do you want to submit?", function(ret) {
        var dataToSend = {};
        if (ret == "yes") {
          dataToSend = {
            user: query.user,
            product: query.product,
            type: "BUY",
            offer: vm.salePrice,
            negotiation: false
          };
          var flag = "false";
          NegotiationSvc.negotiation(dataToSend, flag)
            .then(function(res) {
              if (res && res.data && res.data.errorCode !== 0) {
                $state.go('main');
                return;
              }
              vm.negotiateAmt = "";
              if (res && res.data && res.data.message)
                Modal.alert(res.data.message, true);
              $scope.close();
            });
        }
      });
    }
  }
})();

//Data to be sent to submit a bid
/*
userId,_id,ticketId,

*/
