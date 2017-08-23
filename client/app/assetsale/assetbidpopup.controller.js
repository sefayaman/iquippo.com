(function() {
  'use strict';

  angular.module('sreizaoApp').controller('AssetBidPopUpCtrl', AssetBidPopUpCtrl);

  function AssetBidPopUpCtrl($scope, Auth, Modal,MarkupPriceSvc,notificationSvc, AssetSaleSvc, VatTaxSvc,$uibModalInstance) {
    var vm = this;
    var query = $scope.params;
    
    vm.submitBid = submitBid;
    $scope.close = close;
    var dataToSend = {};

    vm.calculateBid = getBidOrBuyCalculation;

    function init() {

      var emdFilter = {};
      emdFilter.sellerUserId = query.product.seller._id;
      emdFilter.categoryId = query.product.category._id;
      AssetSaleSvc.getEmdOnProduct(emdFilter).then(function(result){
        if(result)
          $scope.emdAmount = result.emdCharge;
        });
      getBidOrBuyCalculation();
    }

    init();

    function getBidOrBuyCalculation(amount) {
      var filter = {};
      if (query.product.group)
        filter.groupId = query.product.group._id;
      if (query.product.category)
        filter.categoryId = query.product.category._id;
      filter.stateId = query.stateId;
      filter.currentDate = 'y'
      filter.bidAmount = vm.bidAmount = query.bidAmount;
      if(amount)
        filter.bidAmount = vm.bidAmount = amount;
      filter.productId = query.product._id;
      AssetSaleSvc.getBidOrBuyCalculation(filter).then(function(result){
        $scope.result = result;
      });
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
      
      var filter = {};
      filter.assetId = query.product.assetId;
      AssetSaleSvc.getMaxBidOnProduct(filter).then(function(result) {
        var msg = "";
        if((Number($scope.total) < Number(result.bidAmount)) 
          && (query.typeOfRequest == "changeBid" || query.typeOfRequest == "submitBid"))
          msg = "Higher Bid available for the Asset. "
        Modal.confirm(msg + "Do you want to change your Bid?", function(ret) {
          if (ret == "no") 
            proceedToSubmit();
        });
      });
    }

    function proceedToSubmit(){
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
        dataToSend.parkingCharge = $scope.result.parkingCharges;
        dataToSend.gst = $scope.result.taxRate || 0;
        dataToSend.tcs = $scope.result.tcs || 0;
        dataToSend.bidAmount = $scope.result.total || 0;
        dataToSend.emdAmount = $scope.emdAmount || 0;
        dataToSend.parkingPaymentTo = query.product.parkingPaymentTo;
        dataToSend.fullPaymentAmount = $scope.result.total - $scope.emdAmount;
        if(dataToSend.parkingPaymentTo == 'Yard')
          dataToSend.fullPaymentAmount = (dataToSend.fullPaymentAmount || 0) - (dataToSend.parkingCharge || 0);
        dataToSend.emdPayment = {remainingPayment:$scope.emdAmount || 0};
        dataToSend.fullPayment = {remainingPayment: dataToSend.fullPaymentAmount};
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
    function close(){
      $uibModalInstance.dismiss('cancel');
    }

  }
})();