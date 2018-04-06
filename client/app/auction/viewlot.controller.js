(function () {
  'use strict';

  angular.module('sreizaoApp').controller('ViewLotCtrl', ViewLotCtrl);

  function ViewLotCtrl($scope, $state, $stateParams, $rootScope, $window, categorySvc, Auth, Modal, groupSvc, brandSvc, LocationSvc, modelSvc, userRegForAuctionSvc, productSvc, AuctionSvc, $location, $uibModal, $sce, LotSvc, PagerSvc, $timeout) {
    var vm = this;
    var dbAuctionId = $stateParams.dbAuctionId;
    $scope.equipmentSearchFilter = {};
    $stateParams.group = $scope.removeUnderScore($stateParams.group);
    $stateParams.brand = $scope.removeUnderScore($stateParams.brand);
    $stateParams.location = $scope.removeUnderScore($stateParams.location);
    //$scope.pager = PagerSvc.getPager(null,1,24);
    //pagination variables
    var prevPage = 0;
    vm.itemsPerPage = 24;
    vm.currentPage = 1;
    vm.totalItems = 0;
    vm.maxSize = 6;

    vm.onGroupChange = onGroupChange;
    vm.onCategoryChange = onCategoryChange;
    vm.onBrandChange = onBrandChange;
    vm.openRegisterNow = openRegisterNow;
    vm.onPageChange = onPageChange;
    vm.fireCommand = fireCommand;
    $scope.clearAll = clearAll;
    vm.viewLotDetail = viewLotDetail;
    vm.openLiveAuctionURL = openLiveAuctionURL;

    var allCategory = [];
    var allBrand = [];
    $scope.regLotForUser = [];

    $scope.auctionData = null;

    $scope.lotsArr = [];
    vm.lotListing = [];
    $scope.OverAll = "overall";
    $scope.LotWist = "lotwise";
    $scope.redirectToLiveAuction = false;

    function init() {
      var filter = {};
      filter._id = dbAuctionId;
      $rootScope.loading = true;
      AuctionSvc.getAuctionDateData(filter)
        .then(function (result) {
          $rootScope.loading = false;
          if (result && result.items && result.items.length) {
            $scope.auctionData = result.items[0];
            $scope.contactDetailsVisible = false;
            if ($scope.auctionData.contactDetails && $scope.auctionData.contactDetails.length > 0)
              $scope.contactDetailsVisible = true;
            openLiveAuctionURL(false);
            if (Auth.getCurrentUser()._id)
              checkWidgetAccessOnLot();
            restoreState();
            fireCommand(true, true); // previously fireCommand(false, true) // Changed for on back press it was not navigating to the respective page where it was triggered from.
          }
          else
            return backButton();
        })
        .catch(function (res) {
          $rootScope.loading = false;
          return backButton();
        });
      //getLotsInAuction({});
      groupSvc.getAllGroup({ isForUsed: true })
        .then(function (result) {
          $scope.allGroup = result;
        });

      categorySvc.getCategoryOnFilter({ isForUsed: true })
        .then(function (result) {
          $scope.categoryList = result;
          allCategory = result;
          if ($stateParams.group)
            onGroupChange($stateParams.group, true);
        });

      brandSvc.getBrandOnFilter({ isForUsed: true })
        .then(function (result) {
          allBrand = result;
          $scope.brandList = result;
          if ($stateParams.category)
            onCategoryChange($stateParams.category, true);
        });
      //restoreState();
      //fireCommand(false,true);
    }

    function checkWidgetAccessOnLot() {
      var dataObj = {};
      dataObj.auction = {};
      dataObj.user = {};
      dataObj.auction.dbAuctionId = dbAuctionId;
      dataObj.user._id = Auth.getCurrentUser()._id;
      dataObj.emdTax = $scope.auctionData.emdTax;
      if ($scope.auctionData.emdTax === $scope.LotWist)
        dataObj.checkRegUser = true;
      dataObj.onlyRegLotForUser = true;
      userRegForAuctionSvc.checkUserRegis(dataObj)
        .then(function (result) {
          $scope.regLotForUser = result.regLot;
        });
    }

    function clearAll() {
      for (var key in $scope.equipmentSearchFilter) {
        if (key !== 'mfgYearMax' && key !== 'mfgYearMin' && key !== 'dbAuctionId')
          $scope.equipmentSearchFilter[key] = "";
      }

      $scope.categoryList = allCategory;
      $scope.brandList = allBrand;
      saveState();
      fireCommand();
    }

    function onGroupChange(group, noAction) {
      if (!noAction) {
        $scope.equipmentSearchFilter.category = "";
        $scope.equipmentSearchFilter.brand = "";
        $scope.brandList = [];
      }

      $scope.categoryList = allCategory.filter(function (item) {
        return item.group.name === group && item.isForUsed;
      });

      if (!noAction)
        fireCommand();
    }

    function onCategoryChange(category, noAction) {
      if (!noAction) {
        $scope.equipmentSearchFilter.brand = "";
      }
      $scope.brandList = allBrand.filter(function (item) {
        return item.category.name === category && item.isForUsed;
      });
      if (!noAction)
        fireCommand();
    }

    function onBrandChange(brand, noAction) {

      if (!brand) {
        fireCommand();
        return;
      }
      var filter = {};
      filter['brandName'] = brand;
      if (!noAction)
        fireCommand();
    }

    function backButton() {
      $window.history.back();
    }

    function openLiveAuctionURL(initFlag) {
      if (!Auth.getCurrentUser()._id && initFlag) {
        Auth.goToLogin();
        return;
      }
      var dataObj = {};
      dataObj.auction = {};
      dataObj.user = {};
      dataObj.auction.dbAuctionId = dbAuctionId;
      dataObj.user._id = Auth.getCurrentUser()._id;
      dataObj.emdTax = $scope.auctionData.emdTax;
      if ($scope.auctionData.emdTax === $scope.LotWist)
        dataObj.checkRegUser = true;
      userRegForAuctionSvc.checkUserRegis(dataObj)
        .then(function (result) {
          $scope.redirectToLiveAuction = false;
          if (!initFlag) {
            if (result.errorCode === 0 && Auth.getCurrentUser()._id) {
              $scope.redirectToLiveAuction = true;
              var liveAuctionUrl = auctionURL + "/liveAuction/"+dbAuctionId+"/"+Auth.getCurrentUser()._id;
              if($scope.auctionData.auctionType === 'A')
                liveAuctionUrl = auctionURL + "/onlineAuction/"+dbAuctionId+"/"+Auth.getCurrentUser()._id;
              $scope.liveAuctionURLSCE = $sce.trustAsResourceUrl(liveAuctionUrl);
            }
            return;
          }

          if (result.errorCode === 0) {
            $scope.redirectToLiveAuction = true;
            var liveAuctionUrl = auctionURL + "/liveAuction/"+dbAuctionId+"/"+Auth.getCurrentUser()._id;
            if($scope.auctionData.auctionType === 'A')
                liveAuctionUrl = auctionURL + "/onlineAuction/"+dbAuctionId+"/"+Auth.getCurrentUser()._id;
            $scope.liveAuctionURLSCE = $sce.trustAsResourceUrl(liveAuctionUrl);
            //window.open(liveAuctionURLSCE,'_blank');
          }
          else if (result.errorCode === 1)
            Modal.alert("You have done partial registration, payment part is pending with lotnumbers" + result.selectedLots + ". If you have already paid please contact support team!");
          else
            Modal.alert("You are not registered for this auction. Please register to access this auction!");
        })
        .catch(function (err) {
          if (err && err.data)
            Modal.alert(err.data);
        });
    }

    function fireCommand(noReset, initLoad) {
      if (vm.show == true)
        vm.show = false;
      if (!noReset)
        vm.currentPage = 1;
      if (!initLoad) {
        saveState(false);
      }
      $scope.equipmentSearchFilter.location = $scope.removeUnderScore($scope.equipmentSearchFilter.location)
      var filter = {};
      angular.copy($scope.equipmentSearchFilter, filter);
      getLotsInAuction(filter);
    }

    var loadCounter = 0;
    function getLotsInAuction(filter) {
      $scope.searching = true;
      $scope.noResult = false;
      filter._id = dbAuctionId;
      LotSvc.getLotsInAuction(filter)
        .then(function (res) {
          $scope.searching = false;
          $scope.noResult = false;
          if (res && res.length) {
            vm.totalItems = res.length;
            vm.lotListing = res;
            vm.lotListing.forEach(function (lot) {
              //lot.isVisible = false;
              if (lot.assets.length && lot.assets[0].product)
                lot.primaryImg = $rootScope.uploadImagePrefix + lot.assets[0].product.assetDir + "/" + lot.assets[0].product.primaryImg;
              if (!Auth.getCurrentUser()._id)
                return;
              if ($scope.auctionData.auctionType == 'L')
                return;
              var url = auctionURL + "/bidwidget/" + dbAuctionId + "/" + lot._id + "/" + Auth.getCurrentUser()._id + "?random=" + Math.random();
              lot.url = $sce.trustAsResourceUrl(url);
              //checkWidgetAccessOnLot(lot);
            });

            vm.lotListing = _sortByLotNumber(vm.lotListing);

          } else {
            $scope.noResult = true;
            $scope.msg = res.message;
          }
        })
        .catch(function (err) {
          $scope.noResult = true;
          $scope.searching = false;
          throw err;
        });
    }

    /*function checkWidgetAccessOnLot(lot){
      $timeout(function() {
       var lotObj = lot;
        var dataObj = {};
        dataObj.auction = {};
        dataObj.user = {};
        dataObj.auction.dbAuctionId = dbAuctionId;
        dataObj.user._id = Auth.getCurrentUser()._id;
        dataObj.lotNumber = lotObj.lotNumber;
        userRegForAuctionSvc.checkUserRegis(dataObj)
        .then(function(result) {
          if (result.data) {
            if (result.data == "done") {
              lotObj.isVisible = true;
            }
            if (result.message == "No Data") {
              lotObj.isVisible = false;
            }
          } else {
            lotObj.isVisible = false;
          }
        });
      },0);
    }*/

    //Register Now
    function openRegisterNow() {
      Auth.isLoggedInAsync(function (loggedIn) {
        if (loggedIn && !Auth.isAdmin() && !Auth.isAuctionRegPermission()) {
          var dataObj = {};
          dataObj.auction = {};
          dataObj.user = {};
          dataObj.auction.dbAuctionId = dbAuctionId;
          //if(!Auth.isAdmin()) {
          dataObj.user._id = Auth.getCurrentUser()._id;
          dataObj.user.mobile = Auth.getCurrentUser().mobile;
          // } else {
          //   dataObj.user._id = $scope.registerUser._id;
          //   dataObj.user.mobile = $scope.registerUser.mobile;
          // }
          // if($scope.currentAuction.emdTax === $scope.LotWist) {
          //   dataObj.selectedLots =  vm.dataToSend.selectedLots;
          // }
          //else 
          if ($scope.auctionData.emdTax === $scope.OverAll) {
            dataObj.selectedLots = [];
            if (vm.lotListing) {
              vm.lotListing.forEach(function (item) {
                dataObj.selectedLots[dataObj.selectedLots.length] = item.lotNumber;
              });
            }
          } else {
            dataObj.emdTax = $scope.LotWist;
          }
          userRegForAuctionSvc.checkUserRegis(dataObj)
            .then(function (result) {
              if (result.data) {
                if (result.data == "done" && $scope.auctionData.emdTax === $scope.OverAll) {
                  Modal.alert(informationMessage.auctionRegMsg, true);
                  return;
                }
                if (result.data == "undone" && $scope.auctionData.emdTax === $scope.OverAll) {
                  Modal.alert(informationMessage.auctionPaymentPendingMsg, true);
                  return;
                }
              }
              $scope.lotsArr = [];
              if (result && result.length > 0 && $scope.auctionData.emdTax === $scope.LotWist) {
                result.forEach(function (item) {
                  for (var i = 0; i < item.selectedLots.length; i++)
                    $scope.lotsArr.push(item.selectedLots[i]);
                });
              }
              //if(!Auth.isAdmin()) {
              var auctionRegislogin = $rootScope.$new();
              auctionRegislogin.currentAuction = $scope.auctionData;
              if ($scope.lotsArr.length > 0 && $scope.auctionData.emdTax === $scope.LotWist)
                auctionRegislogin.regLots = $scope.lotsArr;
              Modal.openDialog('auctionRegislogin', auctionRegislogin);
              // } else {
              //   var regUserAuctionScope = $rootScope.$new();
              //   regUserAuctionScope.currentAuction = $scope.auctionData;
              //   if($scope.lotsArr.length > 0 && $scope.auctionData.emdTax === $scope.LotWist)
              //     auctionRegislogin.regLots = $scope.lotsArr;
              //   Modal.openDialog('auctionRegistration', regUserAuctionScope);
              // }
            });
        } else {
          var regUserAuctionScope = $rootScope.$new();
          regUserAuctionScope.currentAuction = $scope.auctionData;
          Modal.openDialog('auctionRegistration', regUserAuctionScope);
        }
      });
    }


    function viewLotDetail(lot) {
      var lotDetailScope = $rootScope.$new();
      lotDetailScope.lot = lot;
      lotDetailScope.uploadImagePrefix = $rootScope.uploadImagePrefix;
      var lotDetailModal = $uibModal.open({
        templateUrl: "multipleasset.html",
        scope: lotDetailScope,
        size: 'lg'
      });

      lotDetailScope.close = function () {
        lotDetailModal.close();
      };

      lotDetailScope.goToProductDetail = function (asset) {
        lotDetailModal.close();
        var statParam = {
          category: $scope.removeSpace(asset.category),
          brand: $scope.removeSpace(asset.brand),
          id: asset.assetId
        };
        if (Auth.isLoggedIn() && $scope.regLotForUser && $scope.regLotForUser.indexOf(lot.lotNumber) !== -1)
          statParam.lot = lot._id;
        $state.go('productdetail', statParam);
      }
    }

    function onPageChange() {
      $window.scrollTo(0, 0);
      saveState(true);
    }

    function saveState(retainState) {
      $scope.equipmentSearchFilter.currentPage = vm.currentPage + "";
      $scope.equipmentSearchFilter.location = $scope.removeSpace($scope.equipmentSearchFilter.location);
      $state.go($state.current.name, $scope.equipmentSearchFilter, { location: 'replace', notify: false });
    }

    function restoreState() {
      $scope.equipmentSearchFilter = $stateParams;
      vm.currentPage = parseInt($stateParams.currentPage) || 1;
      $scope.equipmentSearchFilter.currentPage = vm.currentPage + "";
    }

    function _sortByLotNumber(dataModel) {
      return dataModel.sort(_customComparator);
    }

    function _customComparator(a, b) {
      var splitter = /^(\d+)([a-zA-Z]*)/;
      a = a.lotNumber.match(splitter);
      b = b.lotNumber.match(splitter);

      var aNum = parseInt(a[1], 10);
      var bNum = parseInt(b[1], 10);
      if (aNum === bNum) {
        return a[2].toUpperCase() < b[2].toUpperCase() ? -1 : a[2].toUpperCase() > b[2].toUpperCase() ? 1 : 0;
      }
      return aNum - bNum;
    }

    //Entry point
    init();

  }
})();