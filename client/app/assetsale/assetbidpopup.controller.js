(function() {
  'use strict';

  angular.module('sreizaoApp').controller('AssetBidPopUpCtrl', AssetBidPopUpCtrl);

  function AssetBidPopUpCtrl($scope, Auth, Modal, $cookies, userSvc, MarkupPriceSvc, LocationSvc, notificationSvc, NegotiationSvc, AssetSaleSvc, VatTaxSvc) {
    var vm = this;
    var query = $scope.params;
    var date = new Date();
    $scope.tcs = 0;
    $scope.taxPercent = 0;
    $scope.parking = 0;

    vm.submitBid = submitBid;
    //vm.buyNow = buyNow;
    var dataToSend = {};
    var filter = {};

    vm.calculateBid = calculateBid;

    function init() {
      filter = {};
      filter.buyNowFlag = false;
      if (query.product.category)
        filter.categoryId = query.product.category._id;
      filter.stateId = query.stateId;
      filter.currentDate = 'y'
      if($scope.params.bid === "placebid") {
        filter.buyNowFlag = true;
        filter.bidAmount = vm.bidAmount = query.bidAmount;
      }
      if($scope.params.bid === "buynow") {
        if(!query.product.grossPrice) {
          if(!query.product.reservePrice && !query.product.valuationAmount) {
            Modal.alert("You can not request on this product!", true);
            return;
          }
          filter.buyNowFlag = false;
          filter.sellerUserId = query.product.seller._id;
          if(query.product.reservePrice)
            filter.bidAmount = vm.bidAmount = query.product.reservePrice;
          else if(query.product.valuationAmount) 
            filter.bidAmount = vm.bidAmount = query.product.valuationAmount;
        } else {
          filter.buyNowFlag = true;
          filter.bidAmount = vm.bidAmount = query.product.grossPrice;
        }
      }
      getBidOrBuyCalculation(filter);
    }

    init();

    function getBidOrBuyCalculation(filter) {
      AssetSaleSvc.getBidOrBuyCalculation(filter).then(function(result){
        console.log(result);
        if(result.buyNowPrice)
          vm.bidAmount = result.buyNowPrice;
        $scope.taxRate = result.taxRate;
        $scope.tcs = result.tcs;
        if (query.product.parkingCharges)
        $scope.parking = query.product.parkingCharges;

      $scope.total = Number($scope.taxRate || 0) + Number($scope.tcs || 0) + Number($scope.parking || 0) + Number(vm.salePrice || 0);
      });
    }

    function calculateBid(amount) {
      filter.bidAmount = amount;
      getBidOrBuyCalculation(filter);
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

      filter = {};
      filter.assetId = query.product.assetId;
      AssetSaleSvc.getMaxBidOnProduct(filter).then(function(result) {
        var msg = "";
        if((Number($scope.total) < Number(result.bidAmount)) 
          && (query.typeOfRequest == "changeBid" || query.typeOfRequest == "submitBid"))
          msg = "Higher bid available in the system. "
        Modal.confirm(msg + "Do you want to submit?", function(ret) {
          if (ret == "yes") {
            dataToSend = {};
            dataToSend.offerStatuses = [];
            dataToSend.dealStatuses = [];
            dataToSend.bidStatuses = [];
            dataToSend.assetStatuses = [];
            dataToSend.offerStatus = offerStatuses[0];
            var offerStatusObj = {};
            offerStatusObj.userId = Auth.getCurrentUser()._id;
            offerStatusObj.status = offerStatuses[0];
            offerStatusObj.createdAt = new Date();
            dataToSend.offerStatuses[dataToSend.offerStatuses.length] = offerStatusObj;

            dataToSend.bidStatus = bidStatuses[0];
            var bidStatusObj = {};
            bidStatusObj.userId = Auth.getCurrentUser()._id;
            bidStatusObj.status = bidStatuses[0];
            bidStatusObj.createdAt = new Date();
            dataToSend.bidStatuses[dataToSend.bidStatuses.length] = bidStatusObj;

            dataToSend.dealStatus = dealStatuses[0];
            var dealStatusObj = {};
            dealStatusObj.userId = Auth.getCurrentUser()._id;
            dealStatusObj.status = dealStatuses[0];
            dealStatusObj.createdAt = new Date();
            dataToSend.dealStatuses[dataToSend.dealStatuses.length] = dealStatusObj;

            dataToSend.assetStatus = assetStatuses[0].name;
            var assetStatusObj = {};
            assetStatusObj.userId = Auth.getCurrentUser()._id;
            assetStatusObj.status = assetStatuses[0].name;
            assetStatusObj.createdAt = new Date();
            dataToSend.assetStatuses[dataToSend.assetStatuses.length] = assetStatusObj;

            if (query.typeOfRequest)
              dataToSend.typeOfRequest = query.typeOfRequest;
            dataToSend.status = true;
            dataToSend.tradeType = query.product.tradeType;
            dataToSend.user = Auth.getCurrentUser()._id;
            dataToSend.product = {};
            dataToSend.product.seller = {};
            dataToSend.product.seller._id = query.product.seller._id;
            dataToSend.product.seller.name = query.product.seller.fname + " " + query.product.seller.lname;
            dataToSend.product.seller.mobile = query.product.seller.mobile;
            dataToSend.product.proData = query.product._id;
            dataToSend.product.assetId = query.product.assetId;
            dataToSend.product.category = query.product.category.name;
            dataToSend.product.brand = query.product.brand.name;
            dataToSend.product.model = query.product.model.name;
            dataToSend.product.mfgYear = query.product.mfgYear;
            dataToSend.product.country = query.product.country;
            dataToSend.product.state = query.product.state;
            dataToSend.product.stateId = query.stateId;
            dataToSend.product.city = query.product.city;
            if(query.product.repoDate)
              dataToSend.product.repoDate = query.product.repoDate;
            if(query.product.reservePrise)
              dataToSend.product.reservePrise = query.product.reservePrise;
            
            if(query.product.comment)
              dataToSend.product.comment = query.product.comment;
            dataToSend.ageingOfAsset = query.product.ageingOfAsset;
            dataToSend.parkingCharge = query.product.parkingCharges;
            dataToSend.bidAmount = $scope.total;
            dataToSend.proxyBid = query.proxyBid;
            dataToSend.offerType = query.offerType;
            dataToSend.bidReceived = query.product.bidReceived;
            AssetSaleSvc.submitBid(dataToSend)
              .then(function(result) {
                Modal.alert("Your bid has been successfully submitted!", true);
                if(Auth.getCurrentUser().email) {
                  var data = {};
                  dataToSend = {};
                  data['to'] = Auth.getCurrentUser().email;
                  dataToSend.serverPath = serverPath;
                  dataToSend.ticketId = result.ticketId;
                  if(query.typeOfRequest == "buynow") {
                    data['subject'] = 'No reply: Buynow request received';
                  } else {
                    data['subject'] = 'No reply: Bid request received';
                  }
                  notificationSvc.sendNotification('bidReceiveEmailToCustomer',data, dataToSend,'email');
                }
                $scope.close();
              })
              .catch(function(err) {
                throw err; 
                $scope.close();
              });        
            }
        });
      });
    }

    /*function buyNow() {
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
    }*/
  }
})();