(function() {
  'use strict';

  angular.module('sreizaoApp').controller('ViewAuctionCtrl', ViewAuctionCtrl);

  function ViewAuctionCtrl($scope, $rootScope, $location, Modal, Auth,PagerSvc,LotSvc,AuctionSvc, UtilSvc, LocationSvc, $stateParams, $state, $uibModal, uiGmapGoogleMapApi, uiGmapIsReady, userRegForAuctionSvc,EmdSvc) {
    var vm = this;
    vm.dataModel = {};
    $scope.pager = PagerSvc.getPager();

    var listingCount = {};
    vm.show=false;
    vm.auctionListing = [];
    $scope.closeAuctionItems = 0;
    $scope.openAuctionItems = 0;
    //vm.openMap = openMap;
    vm.showAddress = showAddress;
    vm.closeMap = closeMap;

    vm.fireCommand = fireCommand;
    vm.fireCommandType = fireCommandType;
    vm.getProductData = getProductData;
    vm.emdamount = null;
    $scope.auctionType = 'upcoming';
    $scope.auctionOnMap = false;
    vm.lotList=[];
    
    var dataToSend = {};
    var query = $location.search();
    var filter = {};
    vm.openAuctionLot = openAuctionLot;
    $scope.currentAuction ={};
    vm.auctionId ="";
    $scope.lotsArr = [];
    $scope.OverAll = "overall";
    $scope.LotWist = "lotwise";
    function openAuctionLot(auction){
      Auth.isLoggedInAsync(function(loggedIn) {
        if (loggedIn && !Auth.isAdmin()) {
          var dataObj = {};
          dataObj.auction = {};
          dataObj.user = {};
          dataObj.auction.dbAuctionId = auction._id;
          if(!Auth.isAdmin()) {
            dataObj.user._id = Auth.getCurrentUser()._id;
            dataObj.user.mobile = Auth.getCurrentUser().mobile;
          } else {
            dataObj.user._id = $scope.registerUser._id;
            dataObj.user.mobile = $scope.registerUser.mobile;
          }
          if(auction.emdTax === $scope.OverAll) {
            dataObj.selectedLots = [];
            vm.lotList.forEach(function(item){
              dataObj.selectedLots[dataObj.selectedLots.length] = item.lotNumber;
            });
          } else {
            dataObj.emdTax = $scope.LotWist;
          }
          userRegForAuctionSvc.checkUserRegis(dataObj)
          .then(function(result){
            if(result.data){
              if(result.data =="done" && auction.emdTax === $scope.OverAll){
                 Modal.alert("You have already registered for this auction with lotnumbers" +" "+ result.selectedLots); 
                 return;
               }
              if(result.data =="undone" && auction.emdTax === $scope.OverAll){
                Modal.alert("Your EMD payment is still pending. Please pay the EMD amount and inform our customer care team.",true);
                return;
              }
            }
            if(result && result.length > 0 && auction.emdTax === $scope.LotWist)
            { $scope.lotsArr = [];
                result.forEach(function(item){
                  for (var i=0; i < item.selectedLots.length;i++)
                    $scope.lotsArr.push(item.selectedLots[i]);
                });
            }
            if(!Auth.isAdmin()) {
              var auctionRegislogin = $rootScope.$new();
              auctionRegislogin.currentAuction = auction;
              if($scope.lotsArr.length > 0 && auction.emdTax === $scope.LotWist)
                auctionRegislogin.regLots = $scope.lotsArr;
              Modal.openDialog('auctionRegislogin',auctionRegislogin);
            } else {
              var regUserAuctionScope = $rootScope.$new();
              regUserAuctionScope.currentAuction = auction;
              if($scope.lotsArr.length > 0 && auction.emdTax === $scope.LotWist)
                auctionRegislogin.regLots = $scope.lotsArr;
              Modal.openDialog('auctionRegistration', regUserAuctionScope);
            }
          }); 
        } else {
          var regUserAuctionScope = $rootScope.$new();
          regUserAuctionScope.currentAuction = auction;
          Modal.openDialog('auctionRegistration', regUserAuctionScope);
        }
      });
    }
    
    function save(dataObj,amount){
      userRegForAuctionSvc.save(dataObj)
      .then(function(){
          Modal.alert('Your emd amount is' + amount);
      })
      .catch(function(err){
         if(err.data)
              Modal.alert(err.data); 
      });
    }

    //Map variables

    $scope.map = {
      center: {
        latitude: 28.5277396,
        longitude: 77.21914919999999
      },
      zoom: 11,
      control: {}
    };

    function init() {
      LotSvc.getData({auction_id:$scope.currentAuction._id}).then(function(res){
        vm.lotList = res;   
      });

      filter = {};

      if ($stateParams.type){
          $scope.auctionType = $stateParams.type;
         filter.auctionType = $stateParams.type;
      }
      filter.pagination = true;
      getAuctions(filter);
    }

    init();
  
    function getAuctions(filter) {
      $scope.pager.copy(filter);
      vm.auctionListing =[];
      if(!filter.auctionType)
        filter.auctionType = $stateParams.type;
      filter.addAuctionType = true;
      AuctionSvc.getAuctionDateData(filter).then(function(result) {
        getAuctionWiseProductData(result); 
       /*vm.auctionListing = result.items;
        if(vm.auctionListing.length < 1){
          vm.show=true;
        }
        else{
          vm.show=false;
        }*/
      }).catch(function(err) {
        //Modal.alert("Error in geting auction master data");
      });
    }

    function fireCommand(reset, filterObj) {
     if(reset)
        $scope.pager.reset();
      var filter = {};
      if(!filterObj)
          angular.copy(dataToSend, filter);
      else
        filter = filterObj;

      if(vm.statusType)
        filter.statusType = vm.statusType;
      else 
        delete filter.statusType;
       if($scope.auctionType)
       filter.auctionType=$scope.auctionType;
       filter.pagination=true;      
      getAuctions(filter);
    }

    function fireCommandType(auctionType) {
      $scope.pager.reset();
      filter = {};
      angular.copy(dataToSend, filter);

      if(vm.statusType)
        filter.statusType=vm.statusType;
      else 
        delete filter.statusType;

      $scope.auctionType = auctionType;
      filter.auctionType = auctionType;
      $state.go("viewauctions", {type: auctionType}, {notify: false});
      filter.pagination=true;
      getAuctions(filter);
    }

    $scope.marker = {};
    $scope.marker['id'] = 0;
    $scope.marker.options = {
      labelClass: 'marker_labels',
      labelAnchor: '12 60'
    };

    var geocoder = null;
    var map = null;

    function initMap(addr, city, state, cb) {

      uiGmapIsReady.promise(1).then(function(instances) {
        instances.forEach(function(instance) {
          map = instance.map;
        });

        geocoder = new google.maps.Geocoder();
        map.setZoom(11)
        if (geocoder)
          cb(addr, city, state);
      });
    }

    function showAddress(addrs, city, state) {
      var addr = "";
      if (addrs)
        addr += addrs;
      if (city)
        addr += "," + city;
      if (state)
        addr += "," + state;
      addr += ",India";
      if (!addr)
        return;
      $scope.auctionOnMap = true;
      if (!geocoder)
        return initMap(addr, city, state, showAddress);

      geocoder.geocode({
        'address': addr
      }, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
          var latLan = results[0].geometry.location;
          $scope.marker.coords = {};
          $scope.marker.coords['latitude'] = latLan.lat();
          $scope.marker.coords['longitude'] = latLan.lng();
          var latLngc = new google.maps.LatLng(latLan.lat(), latLan.lng());
          if (map)
            map.panTo(latLngc);
          $scope.$apply();
        } else
          Modal.alert("error in getting position.");
      });

    }
    
    function getAuctionWiseProductData(result) {  
        var filter = {};      
        var auctionIds = [];
        if(result && result.items) {     
          result.items.forEach(function(item) { 
          auctionIds[auctionIds.length] = item._id;
        });
        filter.auctionIds = auctionIds; 
        if($stateParams.type ==="S"){
          filter.status = "request_approved";  
        }
      
        filter.isClosed = $scope.auctionType == 'closed' ? 'y' : 'n';
        AuctionSvc.getAuctionWiseProductData(filter) 
        .then(function(data) { 
        $scope.getConcatData = data; 
        vm.auctionListing = result.items;
        vm.totalItems = result.totalItems;
        $scope.pager.update(result.items,result.totalItems); 
        if(vm.auctionListing.length < 1){   
          vm.show = true;            
        }else{ 
          vm.show = false;
          }  
        })  
        .catch(function() {});  
        } 
    }

    function getProductData(id, type) { 
      if (angular.isUndefined($scope.getConcatData)) {  
        if (type == "total_products") 
          return 0;            
      } else {  
        var totalItemsInAuction = 0;
        $scope.getConcatData.forEach(function(data) {
        if (id == data._id) {
          totalItemsInAuction = data.total_products;
        }});
        if (type == "total_products") {  
          if (totalItemsInAuction > 0)   
          return totalItemsInAuction;
        }
          return 0;
        }
      }

    function closeMap() {
      geocoder = null;
      $scope.auctionOnMap = false;
    }
  }
})();