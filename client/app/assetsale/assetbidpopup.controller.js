(function() {
  'use strict';

  angular.module('sreizaoApp').controller('AssetBidPopUpCtrl', AssetBidPopUpCtrl);

  function AssetBidPopUpCtrl($scope, Auth, Modal, $cookies, LocationSvc, notificationSvc, NegotiationSvc, AssetSaleSvc, VatTaxSvc) {
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
      /*var filter = {};
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
            if(result.length > 0)
              $scope.taxPercent = result[0].amount;
            if($scope.params.bid === "placebid")
              vm.bidAmount = query.bidAmount;
            else if($scope.params.bid === "buynow")
              vm.bidAmount = query.product.grossPrice;
            calculateBid(vm.bidAmount);
          });
      }*/
      var filter = {};
      filter.taxType = "GST";
      filter.status = true;
      if (query.product.group)
        filter.groupId = query.product.group._id;
      if (query.product.category)
        filter.categoryId = query.product.category._id;
      filter.state = query.product.state;
      filter.currentDate = 'y'
      VatTaxSvc.get(filter)
      .then(function(taxes){
        if(taxes.length)
          $scope.taxPercent = taxes[0].amount;
        if($scope.params.bid === "placebid")
          vm.bidAmount = query.bidAmount;
        else if($scope.params.bid === "buynow")
          vm.bidAmount = query.product.grossPrice;
        calculateBid(vm.bidAmount);
      });
    }


    init();

    function calculateBid(amount) {
      vm.salePrice = amount;
      $scope.taxRate = (Number(vm.salePrice) * Number($scope.taxPercent)) / 100;
      if(Number(vm.salePrice) + Number($scope.taxRate) > 1000000){
        $scope.tcs = Number(vm.salePrice) * 0.01;
      }
      if(query.product.parkingCharges)
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
      
      // dataToSend = {};
      // dataToSend.offerStatuses = [];
      // dataToSend.dealStatuses = [];
      // dataToSend.bidStatuses = [];
      // dataToSend.assetStatuses = [];
      var filter = {};
      filter.assetId = query.product.assetId;
      AssetSaleSvc.getMaxBidOnProduct(filter).then(function(result) {
        var msg = "";
        if(Number($scope.total) < Number(result.bidAmount))
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
            offerStatusObj.userId = Auth.getCurrentUser()._id;;
            offerStatusObj.status = offerStatuses[0];
            offerStatusObj.createdAt = new Date();
            dataToSend.offerStatuses[dataToSend.offerStatuses.length] = offerStatusObj;

            dataToSend.bidStatus = bidStatuses[0];
            var bidStatusObj = {};
            bidStatusObj.userId = Auth.getCurrentUser()._id;;
            bidStatusObj.status = bidStatuses[0];
            bidStatusObj.createdAt = new Date();
            dataToSend.bidStatuses[dataToSend.bidStatuses.length] = bidStatusObj;

            dataToSend.dealStatus = dealStatuses[0];
            var dealStatusObj = {};
            dealStatusObj.userId = Auth.getCurrentUser()._id;;
            dealStatusObj.status = dealStatuses[0];
            dealStatusObj.createdAt = new Date();
            dataToSend.dealStatuses[dataToSend.dealStatuses.length] = dealStatusObj;

            dataToSend.assetStatus = assetStatuses[0].name;
            var assetStatusObj = {};
            assetStatusObj.userId = Auth.getCurrentUser()._id;;
            assetStatusObj.status = assetStatuses[0].name;
            assetStatusObj.createdAt = new Date();
            dataToSend.assetStatuses[dataToSend.assetStatuses.length] = assetStatusObj;

            dataToSend.status = true;
            dataToSend.tradeType = query.product.tradeType;
            dataToSend.user = Auth.getCurrentUser()._id;
            dataToSend.product = {};
            dataToSend.product.proData = query.product._id;
            dataToSend.product.assetId = query.product.assetId;
            dataToSend.product.category = query.product.category.name;
            dataToSend.product.brand = query.product.brand.name;
            dataToSend.product.model = query.product.model.name;
            dataToSend.product.mfgYear = query.product.mfgYear;
            dataToSend.product.country = query.product.country;
            dataToSend.product.state = query.product.state;
            dataToSend.product.city = query.product.city;
            if(query.product.comment)
              dataToSend.product.comment = query.product.comment;

            dataToSend.bidAmount = $scope.total;
            dataToSend.proxyBid = query.proxyBid;
            AssetSaleSvc.submitBid(dataToSend)
              .then(function(result) {
                Modal.alert("Your bid has been successfully submitted!", true);
                if(Auth.getCurrentUser().email) {
                  var data = {};
                  data['to'] = Auth.getCurrentUser().email;
                  data['subject'] = 'No reply: Bid request received';
                  dataToSend.serverPath = serverPath;
                  dataToSend.ticketId = result.ticketId;
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
