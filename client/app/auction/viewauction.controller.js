(function() {
  'use strict';

  angular.module('sreizaoApp').controller('ViewAuctionCtrl', ViewAuctionCtrl);

  function ViewAuctionCtrl($scope, $rootScope, $location, Modal, Auth, PagerSvc, AuctionSvc, $stateParams, $state, userRegForAuctionSvc, LotSvc) {
    var vm = this;
    var listingCount = {};
    vm.show=false;

    vm.auctionListing = [];
    vm.fireCommandType = fireCommandType;
    $scope.auctionType = $stateParams.type || "upcoming";
    
     //vm.openBidModal = openBidModal;
     vm.openRegisterNow = openRegisterNow

    $scope.lotsArr = [];
    $scope.OverAll = "overall";
    $scope.LotWist = "lotwise";

    function openRegisterNow(auction){
      Auth.isLoggedInAsync(function(loggedIn) {
        if (loggedIn && !Auth.isAdmin() && !Auth.isAuctionRegPermission()) {
          var dataObj = {};
          dataObj.auction = {};
          dataObj.user = {};
          dataObj.auction.dbAuctionId = auction._id;
          //if(!Auth.isAdmin()) {
            dataObj.user._id = Auth.getCurrentUser()._id;
            dataObj.user.mobile = Auth.getCurrentUser().mobile;
          // } else {
          //   dataObj.user._id = $scope.registerUser._id;
          //   dataObj.user.mobile = $scope.registerUser.mobile;
          // }
          if(auction.emdTax === $scope.OverAll)
            dataObj.emdTax = $scope.OverAll;
          else
            dataObj.emdTax = $scope.LotWist;

          userRegForAuctionSvc.checkUserRegis(dataObj)
          .then(function(result){
            if(result.data){
              if(result.data =="done" && auction.emdTax === $scope.OverAll){
                 Modal.alert(informationMessage.auctionRegMsg, true); 
                 return;
               }
              if(result.data =="undone" && auction.emdTax === $scope.OverAll){
                Modal.alert(informationMessage.auctionPaymentPendingMsg,true);
                return;
              }
            }
            $scope.lotsArr = [];
            if(result && result.length > 0 && auction.emdTax === $scope.LotWist)
            { 
              result.forEach(function(item){
                for (var i=0; i < item.selectedLots.length;i++)
                  $scope.lotsArr.push(item.selectedLots[i]);
              });
            }
            //if(!Auth.isAdmin()) {
              var auctionRegislogin = $rootScope.$new();
              auctionRegislogin.currentAuction = auction;
              if($scope.lotsArr.length > 0 && auction.emdTax === $scope.LotWist)
                auctionRegislogin.regLots = $scope.lotsArr;
              Modal.openDialog('auctionRegislogin',auctionRegislogin);
            // } else {
            //   var regUserAuctionScope = $rootScope.$new();
            //   regUserAuctionScope.currentAuction = auction;
            //   if($scope.lotsArr.length > 0 && auction.emdTax === $scope.LotWist)
            //     auctionRegislogin.regLots = $scope.lotsArr;
            //   Modal.openDialog('auctionRegistration', regUserAuctionScope);
            // }
          }); 
        } else {
          var regUserAuctionScope = $rootScope.$new();
          regUserAuctionScope.currentAuction = auction;
          Modal.openDialog('auctionRegistration', regUserAuctionScope);
        }
      });
    }

    // bid summary
    /*function openBidModal(auction){
      Auth.isLoggedInAsync(function(loggedIn) {
          if (loggedIn) {
            var dataObj = {};
            dataObj.auction = {};
            dataObj.user = {};
            dataObj.auction.dbAuctionId = auction._id;
            dataObj.auction.name = auction.name;
            dataObj.auction.auctionId = auction.auctionId;
            dataObj.auction.emdAmount = auction.emdAmount;
            dataObj.auction.auctionOwnerMobile = auction.auctionOwnerMobile;
            dataObj.user._id = Auth.getCurrentUser()._id;
            dataObj.user.fname = Auth.getCurrentUser().fname;
            dataObj.user.lname = Auth.getCurrentUser().lname;
            dataObj.user.countryCode = LocationSvc.getCountryCode(Auth.getCurrentUser().country);
            dataObj.user.mobile = Auth.getCurrentUser().mobile;
            if(Auth.getCurrentUser().email)
              dataObj.user.email = Auth.getCurrentUser().email;
            save(dataObj);
          } else {
            var regUserAuctionScope = $rootScope.$new();
            regUserAuctionScope.currentAuction = auction;
            Modal.openDialog('auctionRegistration', regUserAuctionScope);
          }
        });
    }*/
    
    /*function save(dataObj){
      userRegForAuctionSvc.save(dataObj)
      .then(function(){
          Modal.alert('Your request has been successfully submitted!');
      })
      .catch(function(err){
         if(err.data)
              Modal.alert(err.data); 
      });
    }*/

    function getAuctions() {
      vm.auctionListing =[];
      var filter = {};
      filter.auctionType = $scope.auctionType;
      if(!filter.auctionType)
        return $state.go('main');
      $rootScope.loading = true;
      filter.addAuctionType = true;
      AuctionSvc.getAuctionDateData(filter).then(function(result) {
        $rootScope.loading = false;
        vm.auctionListing = result.items;
        if(result.items &&result.items.length)
            getAuctionWiseProductData(result);

      }).catch(function(err) {
        $rootScope.loading = false;
        Modal.alert("Unable to fetch auctions");
      });
    }


    function fireCommandType(auctionType) {
      $scope.auctionType = auctionType;
      var filter = {};
      filter.auctionType = auctionType;
      $state.go("viewauctions", {type: auctionType}, {notify: false});
      getAuctions();
      getAuctionCount();
    }
    
    function getAuctionWiseProductData(result) {  
        var filter = {};      
        var auctionIds = []; 
        if(result && result.items.length) {     
          result.items.forEach(function(item) { 
          auctionIds[auctionIds.length] = item._id;
        });
        filter.auctionIds = auctionIds; 
        filter.status = "request_approved";  
        filter.isClosed = $stateParams.type == 'closed' ? 'y' : 'n';
        AuctionSvc.getAuctionWiseProductData(filter) 
        .then(function(data) { 
          if(!data.length)
            return;
          result.items.forEach(function(item){
                data.forEach(function(countObj){
                  if(countObj._id === item._id)
                      item.total_products = countObj.total_products;
                });
                if(!item.total_products)
                  item.total_products = 0;
            }); 
         })  
        .catch(function() {});  
        } 
    }

    function getAuctionCount(){
        AuctionSvc.getAuctionCount()
        .then(function(result){
          if(result && result.closeCount)
            $scope.closeCount = result.closeCount;
          if(result && result.upcomingCount)
            $scope.upcomingCount = result.upcomingCount;
        });
    }
    getAuctions();
    getAuctionCount();
  }
})();