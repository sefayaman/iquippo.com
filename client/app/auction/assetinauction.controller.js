(function() {
  'use strict';

  angular.module('sreizaoApp').controller('AssetInAuctionCtrl', AssetInAuctionCtrl);

  function AssetInAuctionCtrl($scope, $state,$stateParams, $rootScope, $window, categorySvc, Auth, Modal, brandSvc, LocationSvc, modelSvc,groupSvc, userRegForAuctionSvc, productSvc, AuctionSvc, $location,PagerSvc) {
    var vm = this;
    var dbAuctionId = $stateParams.dbAuctionId;
    $scope.equipmentSearchFilter = {};
    $scope.pager = PagerSvc.getPager(null,1,1);
    vm.onGroupChange = onGroupChange;
    vm.onCategoryChange= onCategoryChange;
    vm.onBrandChange= onBrandChange;
    vm.openBidModal = openBidModal;
    vm.onPageChange = onPageChange;
    vm.fireCommand = fireCommand;
    vm.productSearchOnMfg = productSearchOnMfg;

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
    AuctionSvc.getOnFilter(filter)
        .then(function(result) {
          if (result) {
            vm.show = false;
            if(result.length <= 0){
              vm.show= true;  
            }
            $scope.pager.update(null,result.length,$stateParams.currentPage || 1);
            vm.auctionDetailListing = result
          }
        });
  }


//Date picker start

  $scope.today = function() {
    $scope.mfgyr = new Date();
  };
  $scope.today();
  $scope.datepickers = {
    min: false,
    max: false
  };
  $scope.clear = function () {
    $scope.mfgyr = null;
  };

  // Disable weekend selection
  $scope.disabled = function(date, mode) {
    return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
  };

  $scope.toggleMin = function() {
    $scope.minDate = $scope.minDate ? null : new Date();
  };
  $scope.toggleMin();
  $scope.maxDate = new Date(2020, 5, 22);

  $scope.open = function($event, which) {
    $event.preventDefault();
    $event.stopPropagation();

    if($scope.datepickers[which]== false && which=='min'){
    $scope.datepickers[which]= true;
    $scope.datepickers.max=false;
}
  else if($scope.datepickers[which]==false && which=='max'){
      $scope.datepickers[which]= true;
      $scope.datepickers.min=false;
    }
    else
      $scope.datepickers[which]= false;
  
  }

  $scope.close=function($event,which){
    $scope.datepickers[which]=false;
  }


  $scope.setDate = function(year, month, day,key) {
    $scope.mfgyr[key] = new Date(year, month, day);
  };

  $scope.datepickerOptions = {
    datepickerMode:"'year'",
    minMode:"'year'",
    minDate:"minDate",
    showWeeks:"false",
  };

  $scope.formats = ['yyyy', 'dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
  $scope.format = $scope.formats[0];

  $scope.status = {
    opened: false
  };

  //date picker end

  function productSearchOnMfg(){

    if(!$scope.mfgyr.min && !$scope.mfgyr.max){
      delete $scope.equipmentSearchFilter.mfgYear;
      fireCommand();
      return;
    }

    //$scope.equipmentSearchFilter.mfgYear = {};
    if($scope.mfgyr.min)
      $scope.equipmentSearchFilter.mfgYearMin = $scope.mfgyr.min.getFullYear();
    else
      delete $scope.equipmentSearchFilter.mfgYearMin;

    if($scope.mfgyr.max)
      $scope.equipmentSearchFilter.mfgYearMax = $scope.mfgyr.max.getFullYear();
    else
      delete $scope.equipmentSearchFilter.mfgYearMax;
      fireCommand();
  }

  function onPageChange(){
    $window.scrollTo(0, 0);
    saveState(true);
  }

   function saveState(retainState){
    $scope.equipmentSearchFilter.currentPage = $scope.pager.currentPage + "";
    //if(retainState)
    $state.go($state.current.name,$scope.equipmentSearchFilter,{location:'replace',notify:false});
    //else
     // $state.go("viewproduct",$scope.equipmentSearchFilter,{location:'replace',notify:false});
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