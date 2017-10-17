(function() {
  'use strict';

  angular.module('sreizaoApp').controller('AssetInAuctionCtrl', AssetInAuctionCtrl);

  function AssetInAuctionCtrl($scope, $state, $rootScope, $window, categorySvc, Auth, Modal, brandSvc, LocationSvc, modelSvc, userRegForAuctionSvc, productSvc, AuctionSvc, $http, $location, $uibModal, $sce, LotSvc) {
    var vm = this;

    var query = $location.search();
    //$scope.auctionName=$location.search().auctionName;
    //console.log("query", query);
    console.log("userId", Auth.getCurrentUser()._id);
    var aswidgetUrl = "http://auctionsoftwaremarketplace.com:3007/bidwidget/{{lot.auctionId}}/{{lot.id}}/{{userId}}";
    $scope.asWidgetURLSCE = $sce.trustAsResourceUrl(aswidgetUrl);
     var liveAuctionUrl="http://auctionsoftwaremarketplace.com:3007/liveAuction/"+query.auctionId+"/"+Auth.getCurrentUser()._id;
    $scope.liveAuctionURLSCE=$sce.trustAsResourceUrl(liveAuctionUrl);
    console.log("url", $scope.liveAuctionURLSCE);

    $scope.auctionType = $location.search().auctionType;
    //$scope.auctionTypeValue = $location.search().auctionTypeValue;
    $scope.auctionOrientation = query.auctionOrientation;
    var filter = {};
    $scope.equipmentSearchFilter = {};
    $scope.mfgyr = {};
    vm.fireCommand = fireCommand;
    vm.productSearchOnMfg = productSearchOnMfg;
    vm.auctionDetailListing = [];
    vm.lotListing = [];
    vm.backButton = backButton;
    vm.auctionName = $location.search().auctionName;
    vm.auctionOwner = $location.search().auctionOwner;
    vm.auctionOwnerMobile = $location.search().auctionOwnerMobile;
    vm.auctionCity = $location.search().auctionCity;
    $scope.auctionValue = $location.search().auctionType;
    vm.auctionOwner = $location.search().auctionOwner;
    vm.auctionOwnerMobile = $location.search().auctionOwnerMobile;
    vm.auctionCity = $location.search().auctionCity;
    vm.auctionTypeValue = $location.search().auctionTypeValue;
    vm.termAuction = $location.search().termAuction;
    $scope.openUrl = openUrl;
    $scope.userId = Auth.getCurrentUser()._id;
    $scope.currentAuction = {};
    $scope.fetchAsset = fetchAsset;
    $scope.isVisible = false;
    //$scope.liveAuctionView=liveAuctionView;
    var temp = [];
    //registering category brand functions
    vm.onCategoryChange = onCategoryChange;
    vm.onBrandChange = onBrandChange;
    vm.openBidModal = openBidModal;
    vm.getAuctionById = getAuctionById;

    // bid summary
    function openBidModal(auction) {

      Auth.isLoggedInAsync(function(loggedIn) {
        if (loggedIn) {
          var auctionRegislogin = $rootScope.$new();
          auctionRegislogin.currentAuction = auction;
          Modal.openDialog('auctionRegislogin', auctionRegislogin);
        } else {

          var regUserAuctionScope = $rootScope.$new();
          regUserAuctionScope.currentAuction = auction;
          Modal.openDialog('auctionRegistration', regUserAuctionScope);
        }
      });
      /* Auth.isLoggedInAsync(function(loggedIn) {
         if (loggedIn) {
           filter = {};
           filter._id = $location.search().id;
           AuctionSvc.getAuctionDateData(filter)
             .then(function(result) {
               if(!result)
                 return;
               var dataObj = {};
               dataObj.auction = {};
               dataObj.user = {};
               dataObj.auction.dbAuctionId = result.items[0]._id;
               dataObj.auction.name = result.items[0].name;
               dataObj.auction.auctionId = result.items[0].auctionId;
               dataObj.auction.emdAmount = result.items[0].emdAmount;
               dataObj.auction.auctionOwnerMobile = result.items[0].auctionOwnerMobile;
               dataObj.user._id = Auth.getCurrentUser()._id;
               dataObj.user.fname = Auth.getCurrentUser().fname;
               dataObj.user.lname = Auth.getCurrentUser().lname;
               dataObj.user.countryCode = LocationSvc.getCountryCode(Auth.getCurrentUser().country);
               dataObj.user.mobile = Auth.getCurrentUser().mobile;
               if(Auth.getCurrentUser().email)
                 dataObj.user.email = Auth.getCurrentUser().email;
               save(dataObj);
             });
           } else {
              var regUserAuctionScope = $rootScope.$new();
              regUserAuctionScope._id = query.id;
              //regUserAuctionScope.emdAmount = query.emdAmount;
              Modal.openDialog('auctionRegistration', regUserAuctionScope);
             }
          });*/
    }


    function save(dataObj) {
      userRegForAuctionSvc.save(dataObj)
        .then(function() {
          Modal.alert('Your request has been successfully submitted!');
        })
        .catch(function(err) {
          if (err.data)
            Modal.alert(err.data);
        });
    }

    /* function fetchASURL(lotNumber,auctionOrientation){
       var displayBid='true';
       var aswidgetUrl="http://auctionsoftwaremarketplace.com:3007/bidwidget/";
       aswidgetUrl=aswidgetUrl + $scope.auctionId + '/' + lotNumber + '/' + Auth.getCurrentUser()._id; 
       $scope.aswidgetUrlSCE=$sce.trustAsResourceUrl(aswidgetUrl);
       console.log("URL",$scope.asWidgetURLSCE);
       return $scope.aswidgetUrlSCE;
     }*/

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
      //filter.status = "request_approved";
      getAuctionById(filter);
      vm.lotListing = [];

      getLotsInAuction(filter);
    }

    init();
    //load();

    function getAuctionById(filter) {
      var filter = {};
      filter._id = query.id;
      AuctionSvc.getAuctionDateData(filter)
        .then(function(res) {

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
          filter = {};
          filter.auctionId = res.items[0]._id;
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
      console.log("jh", id);
      var assetIds = [];
      filter = {};
      filter.lotNumber = id.lotNumber;
      filter.auctionid = id.auctionId;
      LotSvc.getData(filter).then(function(response) {

        console.log("response123", response);
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
      LotSvc.getLotsInAuction(filter)
        .then(function(res) {
          console.log(res);
          if (res && Object.keys(res).length) {
            Object.keys(res).forEach(function(key) {
               var obj={};
               console.log("key",key);
             obj.lotNumber=key;
             obj.assetDesc=res[key].assetDescription;
             obj.amount=res[key].amount;
             obj.id=res[key].id;
             obj.url="http://auctionsoftwaremarketplace.com:3007/bidwidget/" + query.auctionId + "/" + obj.id + "/" + $scope.userId;
             console.log("object",obj);
             vm.lotListing.push(obj);
            console.log("$scope.lotlist",vm.lotListing);
            });
          }
        })
        .catch(function(err) {
          throw err;
        });

    }

    /*function getAssetsInAuction(filter) {
      //console.log("AssetsInAuction");
      vm.lotListing = [];
      AuctionSvc.getOnFilter(filter)
        .then(function(result) {
          ///console.log("AuctionData", result);
          if (result) {
            filter = {};
            var lotArr = [];
            var lotDataArr = [];
            filter.auctionId = query.id;
            filter.listing = true;
            //console.log("vm.lotListing early", vm.lotListing);
            LotSvc.getData(filter).then(function(res) {
              //console.log("LotData", res);
              temp = res;
              temp.forEach(function(data) {
                //console.log("SingleLogData", data);
                var lot = {};
                lot.assetDesc = [];
                lot.amount = 0;
                console.log("vm.lotListing", vm.lotListing);
                if (data.assetId) {
                  var pos = vm.lotListing.map(function(e) {
                    return e.lotNumber;
                  }).indexOf(data.lotNumber);
                  if (pos > -1) {
                    vm.lotListing[pos].assetDesc.push(data.assetId);
                    vm.lotListing[pos].amount = vm.lotListing[pos].amount + data.startingPrice;
                  } else {
                    console.log("lotNumberNot found");
                    lot.auctionId = data.auctionId;
                    lot.id = data._id;
                    lot.lotNumber = data.lotNumber;
                    lot.assetDesc.push(data.assetId);
                    lot.amount = lot.amount + data.startingPrice;
                    lot.primaryImg = data.primaryImg;
                    lot.url = "http://auctionsoftwaremarketplace.com:3007/bidwidget/" + query.auctionId + "/" + lot.id + "/" + $scope.userId;
                    console.log("url lot", lot.url);
                    vm.lotListing.push(lot);
                    console.log("lot", lot);
                  }


                  /*code added for widgit visisbility*/
                  /*var dataObj = {};
                  dataObj.auction = {};
                  dataObj.user = {};
                  dataObj.auction.dbAuctionId = query.id;
                  dataObj.user._id = Auth.getCurrentUser()._id;
                  dataObj.lotNumber = data.lotNumber;

                  userRegForAuctionSvc.checkUserRegis(dataObj)
                    .then(function(result) {
                      if (result.data) {
                        if (result.data == "done") {

                          $scope.isVisible = true;


                        }
                        if (result.data == "undone") {
                          $scope.isVisible = false;

                        }
                      } else {
                        $scope.isVisible = false;
                      }
                    })

                  /*code ended for widgit visisbility*/
                /*}
              });

              /////
            });
          }
        });*/

    /*}*/

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
            window.open('/productdetail/' + res[0]._id + '?assetListedInAuction=true&auctionId=' + $scope.auctionId + '&lotId=' + lotNumber + '&userId=' + Auth.getCurrentUser()._id + '&displayBid=' + displayBid);
          } else {
            window.open('/productdetail/' + res[0]._id + '?assetListedInAuction=true&auctionId=' + $scope.auctionId + '&lotId=' + lotNumber + '&userId=' + Auth.getCurrentUser()._id + '&displayBid=' + displayBid);
          }
        })
        .catch(function(err) {
          if (err) throw err;
        });
    }

    /*function liveAuctionView(lotNumber,auctionId){
     console.log("auctionId",$scope.auctionId);
     console.log("lotNumber",lotNumber);

     $state.go('auctionlive',{"auctionId":auctionId,"lotNumber":lotNumber});
    }*/

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