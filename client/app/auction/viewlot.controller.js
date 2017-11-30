(function() {
  'use strict';

  angular.module('sreizaoApp').controller('ViewLotCtrl', ViewLotCtrl);

  function ViewLotCtrl($scope, $state,$stateParams, $rootScope, $window, categorySvc, Auth, Modal,groupSvc,brandSvc, LocationSvc, modelSvc, userRegForAuctionSvc, productSvc, AuctionSvc, $location, $uibModal, $sce, LotSvc,PagerSvc,$timeout) {
    var vm = this;
    var dbAuctionId = $stateParams.dbAuctionId;
    $scope.equipmentSearchFilter = {};
    $scope.pager = PagerSvc.getPager(null,1,24);
    vm.onGroupChange = onGroupChange;
    vm.onCategoryChange= onCategoryChange;
    vm.onBrandChange= onBrandChange;
    vm.openRegisterNow = openRegisterNow;
    vm.onPageChange = onPageChange;
    vm.fireCommand = fireCommand;
    $scope.clearAll = clearAll;
    vm.viewLotDetail = viewLotDetail;
    vm.openLiveAuctionURL = openLiveAuctionURL;

    var allCategory = [];
    var allBrand = [];

    $scope.auctionData = null;

    $scope.lotsArr = [];
    $scope.OverAll = "overall";
    $scope.LotWist = "lotwise";

    function init(){

      var filter = {};
      filter._id = dbAuctionId;
      $rootScope.loading = true;
      AuctionSvc.getAuctionDateData(filter)
        .then(function(result) {
          $rootScope.loading = false;
          if(result && result.items && result.items.length)
            $scope.auctionData = result.items[0];
          else
            return backButton();
        })
        .catch(function(res){
          $rootScope.loading = false;
          return backButton();
        });
        //getLotsInAuction({});
      groupSvc.getAllGroup({isForUsed:true})
      .then(function(result){
        $scope.allGroup = result;
      });

      categorySvc.getCategoryOnFilter({isForUsed:true})
      .then(function(result){
        $scope.categoryList = result;
        allCategory = result;
        if($stateParams.group)
            onGroupChange($stateParams.group,true);
      });

      brandSvc.getBrandOnFilter({isForUsed:true})
      .then(function(result){
        allBrand = result;
        $scope.brandList = result;
        if($stateParams.category)
            onCategoryChange($stateParams.category,true); 
      });
      restoreState();
      fireCommand(false,true);
    }

   function clearAll(){
    for(var key in $scope.equipmentSearchFilter){
      if(key !== 'mfgYearMax' && key !== 'mfgYearMin' && key !== 'dbAuctionId')
        $scope.equipmentSearchFilter[key] = "";
    }

    $scope.categoryList = allCategory;
    $scope.brandList = allBrand;
    saveState();
    fireCommand();
  }

     function onGroupChange(group,noAction){
        if(!noAction){
          $scope.equipmentSearchFilter.category = "";
          $scope.equipmentSearchFilter.brand = "";
          $scope.brandList = [];
        }

        $scope.categoryList = allCategory.filter(function(item){
          return item.group.name === group && item.isForUsed;
        });

        if(!noAction)
          fireCommand();
      }

      function onCategoryChange(category,noAction){
        if(!noAction){
          $scope.equipmentSearchFilter.brand = "";
        }
        $scope.brandList = allBrand.filter(function(item){
          return item.category.name === category && item.isForUsed;
        });
        if(!noAction)
          fireCommand();
      }

      function onBrandChange(brand,noAction){
        
        if(!brand) {
          fireCommand();
          return;
        }
       var filter = {};
       filter['brandName'] = brand;
        if(!noAction)
          fireCommand();
      }

    function backButton() {
      $window.history.back();
    }

    function openLiveAuctionURL() {
      if(!Auth.getCurrentUser()._id) {
        //Modal.alert("Please Login/Register for uploading the products!", true);
        Auth.goToLogin();
        return;
      }
      var dataObj = {};
      dataObj.auction = {};
      dataObj.user = {};
      dataObj.auction.dbAuctionId = dbAuctionId;
      dataObj.user._id = Auth.getCurrentUser()._id;
      dataObj.emdTax = $scope.auctionData.emdTax;
      if($scope.auctionData.emdTax === $scope.LotWist)
        dataObj.checkRegUser = true;
      userRegForAuctionSvc.checkUserRegis(dataObj)
        .then(function(result) {
          console.log("User regis",result);
            if(result.errorCode === 0){
              var liveAuctionUrl = auctionURL + "/liveAuction/"+dbAuctionId+"/"+Auth.getCurrentUser()._id;
              var liveAuctionURLSCE = $sce.trustAsResourceUrl(liveAuctionUrl);
              window.open(liveAuctionURLSCE,'_blank');
            }
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


  function fireCommand(noReset,initLoad){
      if(vm.show == true)
         vm.show=false;
      if(!noReset)
         $scope.pager.reset();
      if(!initLoad){
        saveState(false);
      }

      var filter = {};
      angular.copy($scope.equipmentSearchFilter,filter);
      getLotsInAuction(filter);
  }
  
  var loadCounter = 0;
  function getLotsInAuction(filter) {
      $scope.searching = true;
      $scope.noResult = false;
      filter._id = dbAuctionId;
      LotSvc.getLotsInAuction(filter)
        .then(function(res) {
          $scope.searching = false;
          $scope.noResult = false;
          if(res && res.length){
            vm.lotListing = res;
            vm.lotListing.forEach(function(lot){
              lot.isVisible = false;
              if(lot.assets.length && lot.assets[0].product)
                lot.primaryImg= $rootScope.uploadImagePrefix + lot.assets[0].product.assetDir +"/" + lot.assets[0].product.primaryImg;
              if(!Auth.getCurrentUser()._id)
                return;
              lot.isVisible = false;
              if($scope.auctionData.auctionType == 'L')
                return;
              var url = auctionURL+ "/bidwidget/" + dbAuctionId + "/" + lot._id + "/" + Auth.getCurrentUser()._id + "?random=" + Math.random();
              lot.url = $sce.trustAsResourceUrl(url);
              checkWidgetAccessOnLot(lot);
            });
          }else{
            $scope.noResult = true;
            $scope.msg = res.message;
          }
        })
        .catch(function(err) {
          throw err;
        });
    }

    function checkWidgetAccessOnLot(lot){
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
    }

  //Register Now
    function openRegisterNow(){
      Auth.isLoggedInAsync(function(loggedIn) {
        if (loggedIn && !Auth.isAdmin()) {
          var dataObj = {};
          dataObj.auction = {};
          dataObj.user = {};
          dataObj.auction.dbAuctionId = dbAuctionId;
          if(!Auth.isAdmin()) {
            dataObj.user._id = Auth.getCurrentUser()._id;
            dataObj.user.mobile = Auth.getCurrentUser().mobile;
          } else {
            dataObj.user._id = $scope.registerUser._id;
            dataObj.user.mobile = $scope.registerUser.mobile;
          }
          // if($scope.currentAuction.emdTax === $scope.LotWist) {
          //   dataObj.selectedLots =  vm.dataToSend.selectedLots;
          // }
          //else 
          if($scope.auctionData.emdTax === $scope.OverAll) {
            dataObj.selectedLots = [];
            vm.lotListing.forEach(function(item){
              dataObj.selectedLots[dataObj.selectedLots.length] = item.lotNumber;
            });
          } else {
            dataObj.emdTax = $scope.LotWist;
          }
          userRegForAuctionSvc.checkUserRegis(dataObj)
          .then(function(result){
            console.log("the registration",result);
            if(result.data){
              if(result.data =="done" && $scope.auctionData.emdTax === $scope.OverAll){
                 Modal.alert("You have already registered for this auction with lotnumbers" +" "+ result.selectedLots); 
                 return;
               }
              if(result.data =="undone" && $scope.auctionData.emdTax === $scope.OverAll){
                Modal.alert("Your EMD payment is still pending. Please pay the EMD amount and inform our customer care team.",true);
                return;
              }
            }
            if(result && result.length > 0 && $scope.auctionData.emdTax === $scope.LotWist)
            { $scope.lotsArr = [];
                result.forEach(function(item){
                  for (var i=0; i < item.selectedLots.length;i++)
                    $scope.lotsArr.push(item.selectedLots[i]);
                });
            }
            if(!Auth.isAdmin()) {
              var auctionRegislogin = $rootScope.$new();
              auctionRegislogin.currentAuction = $scope.auctionData;
              if($scope.lotsArr.length > 0 && $scope.auctionData.emdTax === $scope.LotWist)
                auctionRegislogin.regLots = $scope.lotsArr;
              Modal.openDialog('auctionRegislogin',auctionRegislogin);
            } else {
              var regUserAuctionScope = $rootScope.$new();
              regUserAuctionScope.currentAuction = $scope.auctionData;
              if($scope.lotsArr.length > 0 && $scope.auctionData.emdTax === $scope.LotWist)
                auctionRegislogin.regLots = $scope.lotsArr;
              Modal.openDialog('auctionRegistration', regUserAuctionScope);
            }
          }); 
        } else {
          var regUserAuctionScope = $rootScope.$new();
          regUserAuctionScope.currentAuction = $scope.auctionData;
          Modal.openDialog('auctionRegistration', regUserAuctionScope);
        }
      });
    }


    function viewLotDetail(lot){
      var lotDetailScope = $rootScope.$new();
      lotDetailScope.lot = lot;
      lotDetailScope.uploadImagePrefix = $rootScope.uploadImagePrefix;
      var lotDetailModal = $uibModal.open({
        templateUrl: "multipleasset.html",
        scope: lotDetailScope,
        size: 'lg'
      });

      lotDetailScope.close = function() {
        lotDetailModal.close();
      };

      lotDetailScope.goToProductDetail = function(asset){
        lotDetailModal.close();
        var statParam = {category:asset.category,
          brand:asset.brand,
          id:asset.assetId
        };
        if(Auth.isLoggedIn() && lot.isVisible)
          statParam.lot = lot._id;
        $state.go('productdetail',statParam);
      }
    }

  function onPageChange(){
    $window.scrollTo(0, 0);
    saveState(true);
  }

   function saveState(retainState){
    $scope.equipmentSearchFilter.currentPage = $scope.pager.currentPage + "";
    $state.go($state.current.name,$scope.equipmentSearchFilter,{location:'replace',notify:false});
  }

  function restoreState(){
      $scope.equipmentSearchFilter = $stateParams;
      $scope.pager.currentPage  = parseInt($stateParams.currentPage) || 1;
      $scope.equipmentSearchFilter.currentPage = $scope.pager.currentPage + "";
  }

  //Entry point
  init();

  }
})();