(function() {
  'use strict';

  angular.module('sreizaoApp').controller('ViewAuctionCtrl', ViewAuctionCtrl);

  function ViewAuctionCtrl($scope, $rootScope, $location, Modal, Auth, AuctionSvc, UtilSvc, $stateParams, $state, $uibModal, uiGmapGoogleMapApi, uiGmapIsReady) {
    var vm = this;
    //pagination variables
    var prevPage = 0;
    vm.itemsPerPage = 50;
    vm.currentPage = 1;
    vm.totalItems = 0;
    vm.maxSize = 6;
    var first_id = null;
    var last_id = null;

    var ongoingAuctions = [];
    var upcomingAuctions = [];

    var listingCount = {};
    vm.totalItemsInAuction = 0
    vm.totalItemsSold = 0;
    vm.totalSaleValue = 0;
    /* vm.timediff=timediff;*/

    vm.auctionListing = [];
    $scope.closeAuctionItems = 0;
    $scope.openAuctionItems = 0;
    //vm.openMap = openMap;
    vm.showAddress = showAddress;
    vm.closeMap = closeMap;

    vm.fireCommand = fireCommand;
    vm.fireCommandType = fireCommandType;
    vm.getProductData = getProductData;
    $scope.auctionType = 'upcoming';
    $scope.auctionOnMap = false;

    var dataToSend = {};
    $scope.getConcatData = [];
    var query = $location.search();

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
      //dataToSend.auctionType = $scope.auctionType;

      dataToSend.pagination = true;
      dataToSend.itemsPerPage = vm.itemsPerPage;
      if ($stateParams.type)
        $scope.auctionType = $stateParams.type;
      var filter = {};
      angular.copy(dataToSend, filter);
      getAuctions(filter);

    }

    init();

    function getAuctions(filter) {

      filter.prevPage = prevPage;
      filter.currentPage = vm.currentPage;
      filter.first_id = first_id;
      filter.last_id = last_id;
      if ($scope.auctionType && $scope.auctionType !== 'ongoing')
        filter['auctionType'] = $scope.auctionType;
      else
        filter['auctionType'] = "upcoming";

      AuctionSvc.getAuctionDateData(filter).then(function(result) {
          getAuctionWiseProductData(result);
          if (filter.auctionType == "upcoming") {
            upcomingAuctions = result.items;
          } else {
            vm.auctionListing = result.items;
            vm.auctionListing.forEach(function(x) {
              var currentDate = moment(new Date());
              var startDate = moment(x.startDate);
              var endDate = moment(x.endDate).valueOf();
              console.log("endDaate", endDate);
              x.endTimer = endDate;
              if (startDate > currentDate) {
                x.auctionValue = "upcomingAuctions";
                console.log("Upco", x.auctionValue);
              } else if (startDate < currentDate && endDate > currentDate) {
                x.auctionValue = "ongoingAuctions";
                console.log("ongoing", x.auctionValue);
              } else if (endDate < currentDate) {
                x.auctionValue = "closedAuctions";
                console.log("closed", x.auctionValue);
              }
            })
            return true;
          }
          filter.auctionType = "ongoing";
          return AuctionSvc.getAuctionDateData(filter);

          /* console.log("Auctions",vm.auctionListing);
          vm.totalItems = result.totalItems;
          prevPage = vm.currentPage;
          if(vm.auctionListing.length > 0){
            first_id = vm.auctionListing[0]._id;
            last_id = vm.auctionListing[vm.auctionListing.length - 1]._id;
          }*/
        })
        .then(function(result) {
          console.log(result);
          getAuctionWiseProductData(result);
          ongoingAuctions = result.items;
          console.log("ongoingAuctions",ongoingAuctions);
          console.log("upcomingAuctions",upcomingAuctions);
          vm.auctionListing = ongoingAuctions.concat(upcomingAuctions);
          console.log("typeof", vm.auctionListing);
          vm.auctionListing.forEach(function(x) {
            var currentDate = moment(new Date());
            var startDate = moment(x.startDate);
            var endDate = moment(x.endDate).valueOf();
            console.log("endDaate", endDate);
            x.endTimer = endDate;
            if (startDate > currentDate) {
              x.auctionValue = "upcomingAuctions";
              console.log("Upco", x.auctionValue);
            } else if (startDate < currentDate && endDate > currentDate) {
              x.auctionValue = "ongoingAuctions";
              console.log("ongoing", x.auctionValue);
            } else if (endDate < currentDate) {
              x.auctionValue = "closedAuctions";
              console.log("closed", x.auctionValue);
            }
          })
        })
        .catch(function(err) {
          //Modal.alert("Error in geting auction master data");
        })
    }

    /*   function timediff(start, end){
  return moment.utc(moment(end).diff(moment(start))).format("mm")
}
*/
    function getAuctionWiseProductData(result) {
      var filter = {};
      var auctionIds = [];
      result.items.forEach(function(item) {
        auctionIds[auctionIds.length] = item._id;
      });
      filter.auctionIds = auctionIds;
      filter.status = "request_approved";
      filter.isClosed = $scope.auctionType == 'closed' ? 'y' : 'n';
      AuctionSvc.getAuctionWiseProductData(filter)
        .then(function(data) {
          $scope.getConcatData = data;
        })
        .catch(function() {})
    }

    function getProductData(id, type) {
      if (angular.isUndefined($scope.getConcatData)) {
        if (type == "total_products")
          return 0;
        if (type == "total_amount")
          return 0;
        if (type == "total_sold")
          return 0;
      } else {
        var totalItemsInAuction = 0;
        var totalSaleValue = 0;
        var totalsold = 0;
        $scope.getConcatData.forEach(function(data) {
          if (id == data._id) {
            totalItemsInAuction = data.total_products;
            totalSaleValue = data.sumOfInsale;
            totalsold = data.isSoldCount;
          }
        });
        if (type == "total_products") {
          if (totalItemsInAuction > 0)
            return totalItemsInAuction;
        }
        if (type == "total_amount") {
          if (totalSaleValue > 0)
            return totalSaleValue;
        }
        if (type == "total_sold") {
          if (totalsold > 0)
            return totalsold;
        }
        return 0;
      }
    }

    function fireCommand(reset, filterObj) {
      if (reset)
        resetPagination();
      var filter = {};
      if (!filterObj)
        angular.copy(dataToSend, filter);
      else
        filter = filterObj;

      if(vm.statusType){
        filter.statusType=vm.statusType;
      }
      getAuctions(filter);
    }

    function fireCommandType(auctionType) {
      resetPagination();
      var filter = {};
      angular.copy(dataToSend, filter);
      $scope.auctionType = auctionType;
      $state.go("viewauctions", {
        type: auctionType
      }, {
        notify: false
      });
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

    /*$scope.CountDown = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    getTimeRemaining: function(endtime) {
      var t = Date.parse(endtime) - Date.parse(new Date());
      var seconds = Math.floor((t / 1000) % 60);
      var minutes = Math.floor((t / 1000 / 60) % 60);
      var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
      var days = Math.floor(t / (1000 * 60 * 60 * 24));
      return {
        'total': t,
        'days': days,
        'hours': hours,
        'minutes': minutes,
        'seconds': seconds
      };
    },

    initializeClock: function(endtime) {
      function updateClock() {
        var t = $scope.CountDown.getTimeRemaining(endtime);

        $scope.CountDown.days = t.days < 10 ? '0' + t.days : t.days;
        $scope.CountDown.hours = ('0' + t.hours).slice(-2);
        $scope.CountDown.minutes = ('0' + t.minutes).slice(-2);
        $scope.CountDown.seconds = ('0' + t.seconds).slice(-2);

        if (t.total <= 0) {
          $interval.cancel(timeinterval);
        }
      }

      updateClock();
      var timeinterval = $interval(updateClock, 1000);
    }
  }

  var deadline = new Date(Date.parse(new Date()) + 2 * 12 * 60 * 60 * 1000);
  $scope.CountDown.initializeClock(deadline);

*/
  }

})();