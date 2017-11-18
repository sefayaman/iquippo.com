(function() {
  'use strict';

  angular.module('sreizaoApp').controller('AssetInAuctionCtrl', AssetInAuctionCtrl);

  function AssetInAuctionCtrl($scope, $state,$stateParams, $rootScope, $window, categorySvc, Auth, Modal, brandSvc, LocationSvc, modelSvc,groupSvc, userRegForAuctionSvc, productSvc, AuctionSvc, $location,PagerSvc) {
    var vm = this;
    var dbAuctionId = $stateParams.dbAuctionId;
    $scope.equipmentSearchFilter = {};
    $scope.pager = PagerSvc.getPager(null,1,24);
    vm.onGroupChange = onGroupChange;
    vm.onCategoryChange= onCategoryChange;
    vm.onBrandChange= onBrandChange;
    vm.openBidModal = openBidModal;
    vm.onPageChange = onPageChange;
    vm.fireCommand = fireCommand;
    //vm.productSearchOnMfg = productSearchOnMfg;

    var allCategory = [];
    var allBrand = [];

    $scope.auctionData = null;
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

    // bid summary
    function openBidModal(){
      Auth.isLoggedInAsync(function(loggedIn) {
        if (loggedIn) {
              var dataObj = {};
              dataObj.auction = {};
              dataObj.user = {};
              dataObj.auction.dbAuctionId = auctionData._id;
              dataObj.auction.name = auctionData.name;
              dataObj.auction.auctionId = auctionData.auctionId;
              dataObj.auction.emdAmount = auctionData.emdAmount;
              dataObj.auction.auctionOwnerMobile = auctionData.auctionOwnerMobile;
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
          regUserAuctionScope._id = dbAuctionId;
          regUserAuctionScope.emdAmount = $scope.auctionData.emdAmount;
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

    function openUrl(_id) {
      if (!_id)
        return;
      $window.open('/productdetail/' + _id, '_blank');
    }

    function backButton() {
      $window.history.back();
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
      filter['status'] = "request_approved";
      $scope.searching = true;
      getAssetsInAuction(filter);
  }

  function getAssetsInAuction(filter){
    //var assetIds = [];
    filter.dbAuctionId = dbAuctionId;
    $scope.searching = true;
    $scope.noResult = false;
    AuctionSvc.getOnFilter(filter)
        .then(function(result) {
           $scope.searching = false;
           $scope.noResult = false;
          if (result) {
            $scope.pager.update(null,result.length,$stateParams.currentPage || 1);
            vm.auctionDetailListing = result
          }
          if(!result || !result.length)
             $scope.noResult = true;
        });
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