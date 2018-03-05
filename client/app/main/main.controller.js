(function(){

'use strict';
angular.module('sreizaoApp').controller('MainCtrl',MainCtrl);

  function MainCtrl($scope, $rootScope, $uibModal, Auth, productSvc, categorySvc,groupSvc,brandSvc,LocationSvc,$state, Modal, UtilSvc,spareSvc,ManpowerSvc,BannerSvc,BiddingSvc,CountSvc,AuctionSvc,CertificateMasterSvc) {
    var vm = this;
    vm.allCategoryList = [];
    //vm.categoryList = [];
    $scope.newsEvents = newsEvents;
    vm.myInterval = 7000;
    vm.noWrapSlides = false;
    vm.slides = [];
    $scope.toggle1=true;
    $scope.toggle2=true;
    $scope.toggle3=true;
    $scope.searchstr = "";
    $scope.filter = {};
    //$scope.categorySearchText = "";
    //$scope.locationSearchText = "";
    //$scope.groupSearchText = "";
    //$scope.brandSearchText = "";

    vm.newBrand = true;
    vm.newCategory = true;
    vm.newGroup = true;

    $scope.singleBox = true;

    $scope.toggling=function(val){
      if(val=="vid1")
      $scope.toggle1=false;
    if(val=="vid2")
      $scope.toggle2=false;
    if(val=="vid3")
      $scope.toggle3=false;
    }
    
    $scope.doSearch = doSearch;
    $scope.myFunct = myFunct;
    vm.openBidModal = openBidModal;
    vm.openLeadCaptureModal = openLeadCaptureModal;
    $scope.openPrintMedia = openPrintMedia;
    $scope.toggleSearchBox = toggleSearchBox;
    vm.getBrandCount = getBrandCount;
    vm.getCategoryCount = getCategoryCount;
    vm.toggleTab = toggleTab;
    vm.openSearchModal = openSearchModal;

    var usedFilter = {
      isForUsed : true,
      visibleOnUsed :true,
      sortBy:'priorityForUsed'
    };

    var newFilter = {
      isForNew : true,
      visibleOnNew :true,
      sortBy:'priorityForNew'
    };
  
    $scope.$on('resetBannerTimer',function(){
      vm.myInterval = 7000;
      getHighestBids();
    });

    function toggleTab(tabType,isNew){
      if(tabType === 0)
        vm.newBrand = isNew;
      else if(tabType === 1)
        vm.newCategory = isNew;
      else if(tabType === 2)
        vm.newGroup = isNew;
    }

    function toggleSearchBox(showSingleBox){
       $scope.submitted = false;
      $scope.singleBox = showSingleBox;
    }

    function openPrintMedia(imageName) {
      var prMediaScope = $rootScope.$new();
      prMediaScope.url = $rootScope.uploadImagePrefix + $rootScope.newsEventsDir  + "/" + imageName;
      var printMediaModal = $uibModal.open({
          templateUrl: "printmedia.html",
          scope: prMediaScope
      });

      prMediaScope.close = function(){
        printMediaModal.close();
      }
    }

    function openSearchModal(imageName) {
      var searchModal = $uibModal.open({
          templateUrl: "search.html",
          scope: $scope
      });

      $scope.close = function(){
        searchModal.close();
      }
    }

    function getHomeBanner(){
      BannerSvc.getHomeBanner()
      .then(function(slides){
          vm.slides = slides;
          getHighestBids();
      })
      .catch(function(){
        vm.slides = HOME_BANNER;
      })
    }

    function getHighestBids(){
      var filter = {};
      var bIds = [];
      vm.slides.forEach(function(item){
        if(item.ticker == 'Yes')
          bIds[bIds.length] = item._id;
      });
      filter.bannerIds = bIds;
      BiddingSvc.getHighestBids(filter)
      .then(function(bids){
          vm.getBids = bids;
      })
      .catch(function(){
      })
    }

    function openBidModal(currentSlide){
      if(Auth.isAdmin())
        return;
      if (!Auth.getCurrentUser()._id) {
        Modal.alert("Please Login/Register for submitting your request!", true);
        return;
      }
      var inputFormScope = $rootScope.$new();
      inputFormScope.slideInfo = currentSlide;
      vm.myInterval = 1*2*60*60*1000;
      Modal.openDialog('inputFormReq', inputFormScope);
    }

    function openLeadCaptureModal(currentSlide){
      var leadCaptureScope = $rootScope.$new();
      leadCaptureScope.slideInfo = currentSlide;
       vm.myInterval = 1*2*60*60*1000;
      Modal.openDialog('bannerLeads', leadCaptureScope);
    }

    function getCategories(){
      var filter = angular.copy(usedFilter);
      filter.productCount = true;
      categorySvc.getCategoryOnFilter(filter)
      .then(function(result){
          vm.categoryList = result;
      })
      .catch(function(res){
        //error handling
      });

    }

    function getCategoriesForNew(){
      var filter = angular.copy(newFilter);
      filter.productCount = true;
      categorySvc.getCategoryOnFilter(filter)
      .then(function(result){
          vm.categoryListForNew = result;
      })
      .catch(function(res){
        //error handling
      });

    }

    function getGroup(){
     var filter = angular.copy(usedFilter);
     filter.categoryCount = true;
       groupSvc.getAllGroup(filter)
      .then(function(groups){
        vm.groups = groups;
      })
      .catch(function(err){
        //Modal.alert("Error in fetching group");
      });
    }

    function getGroupForNew(){
    var filter = angular.copy(newFilter);
     filter.categoryCount = true;
      groupSvc.getAllGroup(filter)
      .then(function(groups){
        vm.groupsForNew = groups;
      })
      .catch(function(err){
       // Modal.alert("Error in fetching group");
      });
    }

    function getCertification(){
      CertificateMasterSvc.get({})
      .then(function(certList){
        vm.certificationList = certList;
      })
      .catch(function(err){
        //Modal.alert("Error in fetching group");
      });
    }

    function getBrands(){
      brandSvc.getBrandOnFilter(usedFilter)
      .then(function(brands){
        vm.brands = brands;
      })
      .catch(function(err){
        //Modal.alert("Error in fetching brands");
      });
    }

    function getBrandsForNew(){
      brandSvc.getBrandOnFilter(newFilter)
      .then(function(newBrands){
        vm.brandsForNew = newBrands;
      })
      .catch(function(err){
        //Modal.alert("Error in fetching brands");
      });
    }

    function getBrandCount(){
      brandSvc.getCount({isForUsed:true})
      .then(function(brandCount){
        vm.brandCount = brandCount;
      });
    }

    function getBrandCountForNew(){
      brandSvc.getCount({isForNew:true})
      .then(function(brandCount){
        vm.brandCountForNew = brandCount;
      });
    }

     function getAuctions() {
        
        var filter = {};
        vm.auctionListing =[];
        filter.auctionType = "upcoming";
        filter.addAuctionType = true;
        filter.pagination = true;
        filter.itemsPerPage = 3;
        AuctionSvc.getAuctionDateData(filter)
        .then(function(result) {
          filter = {};      
          var auctionIds = []; 
          if(result && result.items) {
            vm.auctionListing = result.items;     
            result.items.forEach(function(item) { 
            auctionIds[auctionIds.length] = item._id;
          });
          if(!auctionIds.length)
            return;
          filter.auctionIds = auctionIds; 
          filter.status = "request_approved";  
          filter.isClosed = $scope.auctionType == 'closed' ? 'y' : 'n';
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
            })  
        });
      };
      });
    }

    function getCategoryCount(){
      categorySvc.getCount({isForUsed:true})
      .then(function(categoryCount){
        vm.categoryCount = categoryCount;
      });
    }

    function getCategoryCountForNew(){
      categorySvc.getCount({isForNew:true})
      .then(function(categoryCount){
        vm.categoryCountForNew = categoryCount;
      });
    }

     function myFunct(keyEvent) {
      if(keyEvent)
          keyEvent.stopPropagation();
      if (keyEvent.which === 13){
        doSearch();
      }
    }
 
 $scope.checkIfEnterKeyWasPressed = function($event,searchHome){
    $scope.submitted = false;
    var keyCode = $event.which || $event.keyCode;
    if (keyCode === 13) {
        doSearch(false,searchHome);
    }

  };

    function doSearch(isNew,searchHome){

      if((searchHome && searchHome.$invalid) ||(!$scope.filter.searchstr && !$scope.filter.categorySearchText && !$scope.filter.locationSearchText && !$scope.filter.groupSearchText && !$scope.filter.brandSearchText)){
          //$scope.filter.searchstr.$invalid = true;
        $scope.submitted = true;
        Modal.alert('Please specify your search criteria.');
        return;
      }
      var filter = {};
      if($scope.filter.categorySearchText)
        filter['category'] = $scope.filter.categorySearchText.trim();
      if($scope.filter.groupSearchText)
        filter['group'] = $scope.filter.groupSearchText.trim();
      if($scope.filter.brandSearchText)
        filter['brand'] = $scope.filter.brandSearchText.trim();
      /*if($scope.radioModel)
        filter['type'] = $scope.radioModel;
      */if($scope.filter.locationSearchText)
        filter['location'] = $scope.filter.locationSearchText.trim();
      if($scope.filter.searchstr)
        filter['searchstr'] = $scope.filter.searchstr.trim();

      //productSvc.setFilter(filter);
      if(!isNew)
        $state.go('viewproduct',filter);
      else
        $state.go('newviewproduct',filter);
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
    
    //Clearing Finance integration cookie
    Auth.removeCookies();
    getHomeBanner();
    getGroup();
    getGroupForNew();
    getCategories();
    getCategoriesForNew();
    getBrands();
    getBrandsForNew();
    getBrandCount();
    getBrandCountForNew();
    getCategoryCount();
    getCategoryCountForNew();
    getAuctions();
    getCertification();
    getAuctionCount();
  }
})();
