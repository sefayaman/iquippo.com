(function() {
  'use strict';

  angular.module('sreizaoApp').controller('AssetBidPopUpCtrl', AssetBidPopUpCtrl);

  function AssetBidPopUpCtrl($scope, Auth, Modal,MarkupPriceSvc,notificationSvc, AssetSaleSvc, VatTaxSvc,$uibModalInstance) {
    var vm = this;
    var query = $scope.params;
    var date = new Date();
    $scope.tcs = 0;
    $scope.taxPercent = 0;
    $scope.parking = 0;

    vm.submitBid = submitBid;
    $scope.close = close;
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
      var emdFilter = {};
      emdFilter.sellerUserId = query.product.seller._id;
      emdFilter.categoryId = query.product.category._id;
      AssetSaleSvc.getEmdOnProduct(emdFilter).then(function(result){
        if(result)
          $scope.emdAmount = result.emdCharge;
        getBidOrBuyCalculation(filter);
        });
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

      $scope.total = Number($scope.taxRate || 0) + Number($scope.tcs || 0) + Number($scope.parking || 0) + Number(vm.bidAmount || 0);
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

            AssetSaleSvc.setStatus(dataToSend,offerStatuses[0],'offerStatus','offerStatuses');
            AssetSaleSvc.setStatus(dataToSend,dealStatuses[0],'dealStatus','dealStatuses');
            AssetSaleSvc.setStatus(dataToSend,bidStatuses[0],'bidStatus','bidStatuses');
            AssetSaleSvc.setStatus(dataToSend,assetStatuses[0].name,'assetStatus','assetStatuses');

            if(query.offerType == "Buynow"){
              AssetSaleSvc.setStatus(dataToSend,dealStatuses[6],'dealStatus','dealStatuses');
              AssetSaleSvc.setStatus(dataToSend,bidStatuses[7],'bidStatus','bidStatuses');
            }

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
            dataToSend.product.assetDir = query.product.assetDir;
            dataToSend.product.name = query.product.name;
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
            dataToSend.gst = $scope.taxRate || 0;
            dataToSend.tcs = $scope.tcs || 0;
            dataToSend.bidAmount = $scope.total;
            dataToSend.emdAmount = $scope.emdAmount || 0;
            dataToSend.emdPayment = {remainingPayment:$scope.emdAmount || 0};
            dataToSend.fullPayment = {remainingPayment: ($scope.total || 0) - ($scope.emdAmount || 0)};
            dataToSend.proxyBid = query.proxyBid;
            dataToSend.offerType = query.offerType;
            dataToSend.bidReceived = query.product.bidReceived;
            AssetSaleSvc.submitBid(dataToSend)
              .then(function(result) {
                if($scope.params.callback)
                    $scope.params.callback();

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

    function close(){
      $uibModalInstance.dismiss('cancel');
    }

  }
})();