(function() {
  'use strict';

  angular.module('sreizaoApp').controller('AssetInAuctionCtrl', AssetInAuctionCtrl);

  function AssetInAuctionCtrl($scope, $state, $rootScope, $window, categorySvc, Auth, Modal, brandSvc, LocationSvc, modelSvc, userRegForAuctionSvc, productSvc, AuctionSvc, $http, $location, $uibModal, $sce, LotSvc) {
    var vm = this;

    var query = $location.search();
    var aswidgetUrl = auctionURL + "/bidwidget/{{lot.auctionId}}/{{lot.id}}/{{userId}}";
    $scope.asWidgetURLSCE = $sce.trustAsResourceUrl(aswidgetUrl);
    var liveAuctionUrl = auctionURL + "/liveAuction/"+query.id+"/"+Auth.getCurrentUser()._id;
    $scope.liveAuctionURLSCE=$sce.trustAsResourceUrl(liveAuctionUrl);

    $scope.auctionOrientation = query.auctionOrientation;
    var filter = {};
    $scope.equipmentSearchFilter = {};
    $scope.mfgyr = {};
    vm.fireCommand = fireCommand;
    vm.productSearchOnMfg = productSearchOnMfg;
    vm.auctionDetailListing = [];
    vm.backButton = backButton;

    $scope.auctionType = $location.search().auctionType;
    // vm.auctionName = $location.search().auctionName;
    // vm.auctionOwner = $location.search().auctionOwner;
    // vm.auctionOwnerMobile = $location.search().auctionOwnerMobile;
    // vm.auctionCity = $location.search().auctionCity;
    $scope.auctionValue = $location.search().auctionType;
    // vm.auctionTypeValue = $location.search().auctionTypeValue;
    // vm.termAuction = $location.search().termAuction;
    $scope.openUrl = openUrl;
    //$scope.userId = Auth.getCurrentUser()._id;
    //$scope.currentAuction = {};
    $scope.fetchAsset = fetchAsset;
    vm.openLiveAuctionURL = openLiveAuctionURL;
    $scope.isVisible = false;
    $scope.msg="";
    vm.lotListing = [];
    //$scope.liveAuctionView=liveAuctionView;
    var temp = [];
    //registering category brand functions
    vm.onCategoryChange = onCategoryChange;
    vm.onBrandChange = onBrandChange;
    vm.openBidModal = openBidModal;
    vm.getAuctionById = getAuctionById;
    $scope.aucionData ={};

    var dataObj={};
    
    // bid summary
    function openBidModal(auction) {

      Auth.isLoggedInAsync(function(loggedIn) {
        if (loggedIn) {
          var auctionRegislogin = $rootScope.$new();
          auctionRegislogin.currentAuction = $scope.aucionData;
          Modal.openDialog('auctionRegislogin', auctionRegislogin);
        } else {

          var regUserAuctionScope = $rootScope.$new();
          regUserAuctionScope.currentAuction = $scope.aucionData;
          Modal.openDialog('auctionRegistration', regUserAuctionScope);
        }
      });
    }

    function openLiveAuctionURL() {
      if(!Auth.getCurrentUser()._id) {
        Modal.alert("Please Login/Register for uploading the products!", true);
        return;
      }
      dataObj = {};
      dataObj.auction = {};
      dataObj.user = {};
      dataObj.auction.dbAuctionId = query.id;
      dataObj.user._id = Auth.getCurrentUser()._id;
      dataObj.reqSubmitted = true;
      dataObj.emdTax = $scope.aucionData.emdTax;
      userRegForAuctionSvc.checkUserRegis(dataObj)
        .then(function(result) {
          console.log("User regis",result);
            if(result.errorCode === 0)
              window.open($scope.liveAuctionURLSCE,'_blank');
            else if(result.errorCode === 1)
              Modal.alert("You have done partial registration, payment part is pending with lotnumbers" + result.selectedLots +". If you have already paid please contact support team!");              
            else
              Modal.alert("You are not register for this auction.Please register to access this auction!");
        })
        .catch(function(err) {
          if (err && err.data)
            Modal.alert(err.data);
        });
    }

    function openUrl(_id) {
      if (!_id)
        return;

      $window.open('/productdetail/' + _id, '_blank');
    }

    function init() {
      categorySvc.getAllCategory()
        .then(function(result) {
          $scope.allCategory = result;
        });
      $scope.auctionId = query.auctionId;
      filter._id = query.id;
      getAuctionById(filter);
      getLotsInAuction(filter);
    }

    init();
    //load();

    function getAuctionById(filter) {
      var filter = {};
      filter._id = query.id;
      AuctionSvc.getAuctionDateData(filter)
        .then(function(res) {
          angular.copy(res.items[0], $scope.aucionData);
          console.log("getacu", res);
          $scope.auctionId = res.items[0].auctionId;
          $scope.auctionName = res.items[0].name;
          $scope.auctionOwner = res.items[0].auctionOwner;
          $scope.auctionTypeValue = res.items[0].auctionType;
          $scope.auctionOwnerMobile = res.items[0].auctionOwnerMobile;
          $scope.auctionCity = res.items[0].city;
          $scope.termAuction = res.items[0].termAuction;
          $scope.docName = res.items[0].docName;
          $scope.docNameProxy = res.items[0].docNameProxy;
          $scope.docType = res.items[0].docType;
          $scope.contactName = res.items[0].contactName;
          $scope.contactNumber = res.items[0].contactNumber;
          if (res.items[0].auctionType === 'S') {
            filter.status = "request_approved";
          }
          // filter = {};
          // filter.auctionId = res.items[0]._id;
          ///getAssetsInAuction(filter);
        })
        .catch(function(err) {

        });
    }

    function backButton() {
      $window.history.back();
      //$state.go("auctions?type="+ $scope.auctionType);
    }

    function onCategoryChange(category, noAction) {
      $scope.brandList = [];
      $scope.modelList = [];
      if (!noAction) {
        $scope.equipmentSearchFilter.brand = "";
        $scope.equipmentSearchFilter.model = "";
      }
      if (!category) {
        $scope.equipmentSearchFilter.category = "";
        fireCommand();
        return;
      }
      var filter = {};
      filter['categoryName'] = category;
      brandSvc.getBrandOnFilter(filter)
        .then(function(result) {
          $scope.brandList = result;
        });
      if (!noAction)
        fireCommand();

    }

    function onBrandChange(brand, noAction) {
      $scope.modelList = [];
      if (!noAction)
        $scope.equipmentSearchFilter.model = "";
      if (!brand) {
        fireCommand();
        return;
      }
      var filter = {};
      filter['brandName'] = brand;
      modelSvc.getModelOnFilter(filter)
        .then(function(result) {
          $scope.modelList = result;
        });
      if (!noAction)
        fireCommand();

    }

    function fireCommand(noReset, doNotSaveState) {
      if (vm.show == true)
        vm.show = false;
      if (!$scope.mfgyr.min && !$scope.mfgyr.max)
        delete $scope.equipmentSearchFilter.mfgYear;

      /*if(!noReset)
        vm.currentPage = 1;
      if(!doNotSaveState){
        saveState(false);
      

      }*/
      var filter = {};
      angular.copy($scope.equipmentSearchFilter, filter);

      filter['status'] = "request_approved";
      //filter['sort'] = {featured:-1};
      $scope.searching = true;

      if ($scope.equipmentSearchFilter && $scope.equipmentSearchFilter.locationName) {
        filter.location = $scope.equipmentSearchFilter.locationName;
        delete filter.locationName;
      }
      filter.auctionId = $scope.auctionId;
      //getAssetsInAuction(filter);
    }
    $scope.load = function() {
      var assetIds = [];
      filter = {};
      filter.lotNumber = id.lotNumber;
      filter.auctionid = id.auctionId;
      LotSvc.getData(filter).then(function(response) {

        response.forEach(function(item) {
          assetIds[assetIds.length] = item.assetId;
        });
        console.log("assetid", assetIds);
        var filter = {};
        if (assetIds.length > 0) {
          filter.assetIds = assetIds;
          productSvc.getProductOnFilter(filter)
            .then(function(data) {

              console.log("resultdata", data);
              vm.show = true;
              vm.auctionDetailListing.push(data);
              console.log("Array", vm.auctionDetailListing);
              $scope.auctionValue = $location.search().auctionType;
            });
        } else {
          assetIds = [];
          data = "No Asset";
          vm.auctionDetailListing = data;
          vm.show = false;
          $scope.auctionValue = $location.search().auctionType;
        }


      });
    }

    function getLotsInAuction(filter) {
      // if(Auth.getCurrentUser()._id)
      //   filter.userId = Auth.getCurrentUser()._id;
      LotSvc.getLotsInAuction(filter)
        .then(function(res) {
          console.log("gets",res);
          if (res && Object.keys(res).length) {
            Object.keys(res).forEach(function(key) {
              var obj={};
              obj.lotNumber=key;
              obj.assetDesc=res[key].assetDescription;
              obj.amount=res[key].amount;
              obj.id=res[key].id;
              obj.primaryImg= $rootScope.uploadImagePrefix + res[key].assetDir +"/" + res[key].primaryImg;
              obj.url = auctionURL+ "/bidwidget/" + query.id + "/" + obj.id + "/" + Auth.getCurrentUser()._id;
              var dataObj={};
              dataObj.auction = {};
              dataObj.user = {};
              dataObj.auction.dbAuctionId = query.id;
              dataObj.user._id = Auth.getCurrentUser()._id;
              dataObj.lotNumber = obj.lotNumber;
              userRegForAuctionSvc.checkUserRegis(dataObj)
                .then(function(result) {
                  console.log("User regis",result);
                  if (result.data) {
                    if (result.data == "done") {
                      obj.isVisible = true;
                    }
                    if (result.message == "No Data") {
                      obj.isVisible = false;
                    }
                  } else {
                    obj.isVisible = false;
                  }
                  vm.lotListing.push(obj);
                })
             //vm.lotListing.push(obj);
            console.log("$scope.lotlist",vm.lotListing);     
            });
          }
          else{
          $scope.msg=res.message;
          console.log("msg",$scope.msg);
        }
        })
        .catch(function(err) {
          throw err;
        });
       console.log("$scope.listing",vm.lotListing);
    }

    function fetchAsset(assetId, lotNumber, displayBid) {
      filter = {};
      filter.assetId = assetId;
      if ($scope.auctionOrientation === 'L') {
        displayBid = false;
      }
      console.log("displayBid", displayBid);
      productSvc.getProductOnFilter(filter)
        .then(function(res) {
          if (displayBid) {
            window.open('/productdetail/' + res[0]._id + '?assetListedInAuction=true&id=' + $scope.aucionData._id + '&lotId=' + lotNumber + '&displayBid=' + displayBid);
          } else {
            window.open('/productdetail/' + res[0]._id + '?assetListedInAuction=true&id=' + $scope.aucionData._id + '&lotId=' + lotNumber + '&displayBid=' + displayBid);
          }
        })
        .catch(function(err) {
          if (err) throw err;
        });
    }

    $scope.today = function() {
      $scope.mfgyr = new Date();
    };
    $scope.today();
    $scope.datepickers = {
      min: false,
      max: false
    };
    $scope.clear = function() {
      $scope.mfgyr = null;
    };

    // Disable weekend selection
    /*$scope.disabled = function(date, mode) {
      return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
    };*/

    $scope.toggleMin = function() {
      $scope.minDate = $scope.minDate ? null : new Date();
    };
    $scope.toggleMin();
    $scope.maxDate = new Date(2020, 5, 22);

    $scope.open = function($event, which) {
      $event.preventDefault();
      $event.stopPropagation();

      if ($scope.datepickers[which] == false && which == 'min') {
        $scope.datepickers[which] = true;
        $scope.datepickers.max = false;
      } else if ($scope.datepickers[which] == false && which == 'max') {
        $scope.datepickers[which] = true;
        $scope.datepickers.min = false;
      } else
        $scope.datepickers[which] = false;

    }

    $scope.close = function($event, which) {
      $scope.datepickers[which] = false;
    }


    $scope.setDate = function(year, month, day, key) {
      $scope.mfgyr[key] = new Date(year, month, day);
    };

    $scope.datepickerOptions = {
      datepickerMode: "'year'",
      minMode: "'year'",
      minDate: "minDate",
      showWeeks: "false",
    };

    $scope.formats = ['yyyy', 'dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
    $scope.format = $scope.formats[0];

    $scope.status = {
      opened: false
    };

    //date picker end

    function productSearchOnMfg() {

      if (!$scope.mfgyr.min && !$scope.mfgyr.max) {
        delete $scope.equipmentSearchFilter.mfgYear;
        fireCommand();
        return;
      }

      $scope.equipmentSearchFilter.mfgYear = {};
      if ($scope.mfgyr.min)
        $scope.equipmentSearchFilter.mfgYear.min = $scope.mfgyr.min.getFullYear();
      else
        delete $scope.equipmentSearchFilter.mfgYear.min;

      if ($scope.mfgyr.max)
        $scope.equipmentSearchFilter.mfgYear.max = $scope.mfgyr.max.getFullYear();
      else
        delete $scope.equipmentSearchFilter.mfgYear.max;
      fireCommand();
    }



  }
})();