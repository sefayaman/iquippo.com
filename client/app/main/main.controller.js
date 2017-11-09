(function(){

'use strict';
angular.module('sreizaoApp').controller('MainCtrl',MainCtrl);

  function MainCtrl($scope, $rootScope, $uibModal, Auth, productSvc, categorySvc,groupSvc,brandSvc,LocationSvc,$state, Modal, UtilSvc,spareSvc,ManpowerSvc,BannerSvc,BiddingSvc,CountSvc,AuctionSvc) {
    var vm = this;
    vm.allCategoryList = [];
    vm.activeCategoryList = [];
    vm.newsEvents = newsEvents;
    vm.myInterval = 7000;
    vm.noWrapSlides = false;
    vm.slides = [];
    $scope.toggle1=true;
    $scope.toggle2=true;
    $scope.toggle3=true;

    vm.singleBox = true;

    $scope.toggling=function(val){
      if(val=="vid1")
      $scope.toggle1=false;
    if(val=="vid2")
      $scope.toggle2=false;
    if(val=="vid3")
      $scope.toggle3=false;
    }
    
    vm.doSearch = doSearch;
    vm.myFunct = myFunct;
    vm.openBidModal = openBidModal;
    vm.openPrintMedia = openPrintMedia;
    vm.toggleSearchBox = toggleSearchBox;
    vm.getBrandCount = getBrandCount;
    vm.getCategoryCount = getCategoryCount;
  
    $scope.$on('resetBannerTimer',function(){
      vm.myInterval = 7000;
      getHighestBids();
    })

    function toggleSearchBox(showSingleBox){
      vm.singleBox = showSingleBox;
    }

    function openPrintMedia(imageName) {
      var prMediaScope = $rootScope.$new();
      prMediaScope.url = $rootScope.uploadImagePrefix + $rootScope.newsEventsDir  + "/" + imageName;
      var printMediaModal = $uibModal.open({
          templateUrl: "primtmedia.html",
          scope: prMediaScope
      });

      prMediaScope.close = function(){
        printMediaModal.close();
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



    function getCategories(){
      categorySvc.getCategoryForMain()
      .then(function(result){
          vm.activeCategoryList = result;
          $scope.categoryList = vm.activeCategoryList.slice(0,12);
      })
      .catch(function(res){
        //error handling
      });

    }

    function getGroup(){
      groupSvc.getAllGroup({isForUsed:true,visibleOnUsed:true})
      .then(function(groups){
        vm.groups = groups;
      })
      .catch(function(err){
        Modal.alert("Error in fetching group");
      });
    }

    function getBrands(){
      brandSvc.getBrandOnFilter({isForUsed:true,visibleOnUsed:true})
      .then(function(brands){
        vm.brands = brands;
      })
      .catch(function(err){
        Modal.alert("Error in fetching brands");
      });
    }

    function getBrandCount(){
      brandSvc.getCount({isForUsed:true})
      .then(function(brandCount){
        vm.brandCount = brandCount;
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
            vm.auctionListing = result.items; 
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

     function myFunct(keyEvent) {
      if(keyEvent)
          keyEvent.stopPropagation();
      if (keyEvent.which === 13){
        doSearch();
      }
    }
 

    function doSearch(){

      if(!vm.searchstr && !vm.categorySearchText && !vm.locationSearchText && !vm.groupSearchText && !vm.brandSearchText){
        //Modal.alert("Please enter category name or location or product name");
        return;
      }

      /*if(vm.categorySearchText && !UtilSvc.validateCategory(vm.allCategoryList, vm.categorySearchText)){
        Modal.alert("Please enter valid category");
        return;
      }

      if(vm.groupSearchText && !groupSvc.validateCategory(vm.allCategoryList, vm.categorySearchText)){
        Modal.alert("Please enter valid category");
        return;
      }*/
      
      var filter = {};
      if(vm.categorySearchText)
        filter['category'] = vm.categorySearchText.trim();
      if(vm.groupSearchText)
        filter['group'] = vm.groupSearchText.trim();
      if(vm.brandSearchText)
        filter['brand'] = vm.brandSearchText.trim();
      /*if(vm.radioModel)
        filter['type'] = vm.radioModel;
      */if(vm.locationSearchText)
        filter['location'] = vm.locationSearchText.trim();
      if(vm.searchstr)
        filter['searchstr'] = vm.searchstr.trim();

      //productSvc.setFilter(filter);
      $state.go('viewproduct',filter);
    }
    
    //Clearing Finance integration cookie
    Auth.removeCookies();
    getHomeBanner();
    getGroup();
    getCategories();
    getBrands();
    getBrandCount();
    getCategoryCount();
    getAuctions();
  }
})();
