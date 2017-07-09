(function() {
  'use strict';

  angular.module('sreizaoApp').controller('ViewAuctionCtrl', ViewAuctionCtrl);

  function ViewAuctionCtrl($scope, $rootScope, $location, Modal, Auth, AuctionSvc, UtilSvc, LocationSvc, $stateParams, $state, $uibModal, uiGmapGoogleMapApi, uiGmapIsReady, userRegForAuctionSvc) {
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
    vm.show=false;
    /* vm.timediff=timediff;*/
    vm.auctionListing = [];
    $scope.closeAuctionItems = 0;
    $scope.openAuctionItems = 0;
    //vm.openMap = openMap;
    vm.showAddress = showAddress;
    vm.closeMap = closeMap;

    vm.fireCommand = fireCommand;
    vm.fireCommandType = fireCommandType;
    //vm.getProductData = getProductData;
    $scope.auctionType = 'upcoming';
    $scope.auctionOnMap = false;
    
    var dataToSend = {};
    var query = $location.search();

    vm.openBidModal = openBidModal;


    // bid summary
    function openBidModal(auction){
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
    }
    
    function save(dataObj){
      userRegForAuctionSvc.save(dataObj)
      .then(function(){
          Modal.alert('Your request has been successfully submitted!');
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
      //dataToSend.pagination = true;
      //dataToSend.itemsPerPage = vm.itemsPerPage;
      var filter = {};
      if ($stateParams.type) {
        $scope.auctionType = $stateParams.type;
        filter.auctionType = $stateParams.type;
      }
      //angular.copy(dataToSend, filter);
      getAuctions(filter);

    }

    init();

    function getAuctions(filter) {
      // filter.prevPage = prevPage;
      // filter.currentPage = vm.currentPage;
      // filter.first_id = first_id;
      // filter.last_id = last_id;
      vm.auctionListing =[];
      if(!filter.auctionType)
        filter.auctionType = $stateParams.type;
      filter.addAuctionType = true;
      AuctionSvc.getAuctionDateData(filter).then(function(result) {
        vm.auctionListing = result.items;
        if(vm.auctionListing.length < 1){
          vm.show=true;
        }
        else{
          vm.show=false;
        }
      }).catch(function(err) {
        //Modal.alert("Error in geting auction master data");
      });
    }
    /*   function timediff(start, end){
  return moment.utc(moment(end).diff(moment(start))).format("mm")
}
*/

    function fireCommand(reset, filterObj) {
      // if (reset)
      //   resetPagination();
      // var filter = {};
      // if (!filterObj)
      //   angular.copy(dataToSend, filter);
      // else
      //   filter = filterObj;

      if(vm.statusType)
        filter.statusType = vm.statusType;
      else 
        delete filter.statusType;

      getAuctions(filter);
    }

    function fireCommandType(auctionType) {
      //resetPagination();
      var filter = {};
      //angular.copy(dataToSend, filter);

      if(vm.statusType)
        filter.statusType=vm.statusType;
      else 
        delete filter.statusType;

      $scope.auctionType = auctionType;
      filter.auctionType = auctionType;
      $state.go("viewauctions", {type: auctionType}, {notify: false});
      getAuctions(filter);
    }

    function resetPagination() {
      prevPage = 0;
      vm.currentPage = 1;
      vm.totalItems = 0;
      first_id = null;
      last_id = null;
      vm.auctionListing=[];
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

    function closeMap() {
      geocoder = null;
      $scope.auctionOnMap = false;
    }
  }

})();