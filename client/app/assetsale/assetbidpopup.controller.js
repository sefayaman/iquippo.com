(function() {
  'use strict';

  angular.module('sreizaoApp').controller('AssetBidPopUpCtrl', AssetBidPopUpCtrl);

  function AssetBidPopUpCtrl($scope, Auth, Modal, $cookies, LocationSvc, NegotiationSvc, AssetSaleSvc, VatTaxSvc) {
    var vm = this;
    var query = $scope.params;
    var date = new Date();
    $scope.tcs = 0;
    $scope.taxPercent = 0;
    $scope.parking = 0;

    vm.submitBid = submitBid;
    vm.buyNow = buyNow;
    var dataToSend = {};

    //vm.bid = query.bid;
    /*if (query.product) {
      vm.salePrice = query.product.grossPrice;
      console.log(vm.salePrice);
    }*/
    //functions on scope
    //vm.bidAmount = query.bidAmount;
    vm.calculateBid = calculateBid;


    function init() {
      var filter = {};
      filter.taxType = "GST";
      filter.status = true;
      var date = new Date();
      filter.date = date;
      if (query.product.group)
        filter.groupId = query.product.group._id;
      if (query.product.category)
        filter.categoryId = query.product.category._id;
      if (query.product.state) {
        LocationSvc.getStateHelp({
            stateName: query.product.state
          })
          .then(function(result) {
            filter.stateId = result[0]._id;
            return VatTaxSvc.search(filter);
          })
          .then(function(result) {
            if (result.length > 0)
              $scope.taxPercent = result[0].amount;
            if ($scope.params.bid === "placebid")
              vm.bidAmount = query.bidAmount;
            else if ($scope.params.bid === "buynow")
              vm.bidAmount = query.product.grossPrice;
            calculateBid(vm.bidAmount);
          });
      }
    }


    init();

    function calculateBid(amount) {
      vm.salePrice = amount;
      $scope.taxRate = (Number(vm.salePrice) * Number($scope.taxPercent)) / 100;
      if (Number(vm.salePrice) + Number($scope.taxRate) > 1000000) {
        $scope.tcs = Number(vm.salePrice) * 0.01;
      }
      if (query.product.parkingCharges)
        $scope.parking = query.product.parkingCharges;

      $scope.total = Number($scope.taxRate || 0) + Number($scope.tcs || 0) + Number($scope.parking || 0) + Number(vm.salePrice || 0);
    }

    function getLastDate(currDate) {
      var date = new Date(currDate);
      var lastDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      return lastDate;
    }

    function submitBid(form) {
      if (form && form.$invalid) {
        $scope.submitted = true;
        return;
      }

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
          if (query.typeOfRequest)
            dataToSend.typeOfRequest = query.typeOfRequest;
          dataToSend.offerStatus = offerStatuses[0];
          dataToSend.bidStatus = bidStatuses[0];
          dataToSend.dealStatus = dealStatuses[0];
          dataToSend.assetStatus = assetStatuses[0].name;
          dataToSend.status = true;
          dataToSend.tradeType = query.product.tradeType;
          dataToSend.userId = Auth.getCurrentUser()._id;
          dataToSend.productId = query.product._id;
          dataToSend.bidAmount = $scope.total;
          dataToSend.proxyBid = query.proxyBid;

          AssetSaleSvc.fetchHigherBid(dataToSend)
            .then(function(res) {
              if (res.msg == true) {
                Modal.confirm("Do you want to enhance your bid?", function(ret) {
                    if (ret =="no") {
                      enhanceBid();
                    }
                  });
              }
            })
            .catch(function(err) {
              if (err) throw err;
            });

          function enhanceBid() {
            AssetSaleSvc.submitBid(dataToSend)
              .then(function(result) {
                Modal.alert("Your bid has been successfully submitted!", true);
                $scope.close();
              })
              .catch(function(err) {
                throw err;
                //$scope.close();
              });
          }
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
            offer: $scope.total,
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