(function(){

'use strict';
angular.module('sreizaoApp').controller('MainCtrl',MainCtrl);

  function MainCtrl($scope, $rootScope, $http,$window, $interval, $timeout, $uibModal, Auth, productSvc, categorySvc,classifiedSvc,LocationSvc,$state, Modal, UtilSvc,spareSvc,ManpowerSvc,BannerSvc,BiddingSvc) {
    var vm = this;
    vm.allCategoryList = [];
    vm.activeCategoryList = [];
    vm.newsEvents = newsEvents;
    vm.myInterval = 7000;
    vm.noWrapSlides = false;
    vm.slides = [];//HOME_BANNER;
    vm.featuredslides = [];
    
    /*vm.imgLeftTop = "";
    vm.imgLeftBottom = "";
    vm.imgBottomLeft = "";
    vm.imgBottomRight = "";*/
    vm.classifiedAd = {};

    vm.radioModel = 'SELL';
    vm.isCollapsed = true;
    vm.sortedFeaturedProduct = [];
    vm.productCountObj = {};
    vm.spareCountObj = {};
    vm.manPowerCountObj = {}

    vm.doSearch = doSearch;
    vm.myFunct = myFunct;
    vm.openBidModal = openBidModal;
    vm.openPrintMedia = openPrintMedia;
    // vm.toggleCategory = toggleCategory;

    $scope.ConfigureList = function() {};
    $scope.beginVertScroll = beginVertScroll;
    $scope.categoryList = [{},{},{}];

    $scope.$on('resetBannerTimer',function(){
      vm.myInterval = 7000;
      getHighestBids();
    })

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
      var biddingScope = $rootScope.$new();
      biddingScope.slideInfo = currentSlide;
      biddingScope.isPayNow = false;
      vm.myInterval = 1*2*60*60*1000;
      Modal.openDialog('biddingReq', biddingScope);
    }

    vm.toggleCategory = function(){
      vm.isCollapsed = !vm.isCollapsed;
      if(vm.isCollapsed)
         $scope.categoryList = vm.activeCategoryList.slice(0,12);
       else
        $scope.categoryList = vm.activeCategoryList;
    }

    function getFeaturedProduct(){

      productSvc.getFeaturedProduct().
      then(function(result){
         vm.featuredslides = result;
         sortProduct(result);
      })
      .catch(function(res){
        //error handling
      })

    }

     function getStatusWiseSpareCount(){
       spareSvc.getStatusWiseSpareCount()
      .then(function(result){
          vm.spareCountObj = result;
      })
      .catch(function(res){
        //error handling
      });

    }

    function getStatusWiseManPowerCount(){
       ManpowerSvc.getStatusWiseCount()
      .then(function(result){
          vm.manPowerCountObj = result;
      })
      .catch(function(res){
        //error handling
      });

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

     function getAllCategories(){

      categorySvc.getAllCategory()
      .then(function(result){
          vm.allCategoryList = result;
      })
      .catch(function(res){
        //error handling
      });

    }

    function getStatusWiseProductCount(){
       productSvc.statusWiseCount()
      .then(function(result){
          vm.productCountObj = result;
      })
      .catch(function(res){
        //error handling
      });

    }

    function getActiveClassifiedAd(){
      classifiedSvc.getActiveClassifiedAd()
      .then(function(srchres){
        vm.classifiedAd = classifiedSvc.sortClassifiedAd(srchres);
      });
    }

    getHomeBanner();
    getFeaturedProduct();
    getCategories();
    getActiveClassifiedAd();
    getAllCategories();
    getStatusWiseProductCount();
    getStatusWiseSpareCount();
    getStatusWiseManPowerCount();

     function myFunct(keyEvent) {
      if(keyEvent)
          keyEvent.stopPropagation();
      if (keyEvent.which === 13){
        doSearch();
      }
    }

    function doSearch(){

      if(!vm.searchstr && !vm.categorySearchText && !vm.locationSearchText){
        Modal.alert("Please enter category name or location or product name");
        return;
      }

      if(vm.categorySearchText && !UtilSvc.validateCategory(vm.allCategoryList, vm.categorySearchText)){
        Modal.alert("Please enter valid category");
        return;
      }
      
      var filter = {};
      if(vm.categorySearchText)
        filter['category'] = vm.categorySearchText.trim();
      if(vm.radioModel)
        filter['type'] = vm.radioModel;
      if(vm.locationSearchText)
        filter['location'] = vm.locationSearchText.trim();
      if(vm.searchstr)
        filter['searchstr'] = vm.searchstr.trim();

      //productSvc.setFilter(filter);
      $state.go('viewproduct',filter);
    }

    function beginVertScroll() {
      $timeout(
        function() {
          var firstElement = $('ul.verContainer li:first');
          var wdth = firstElement.width();
          var cntnt = firstElement.html();
          if(!cntnt)
            return;
          var HtmlStr = "<li>" + cntnt + "</li>";
          $("ul.verContainer").append(HtmlStr);
          cntnt = "";
          firstElement.animate({
            "marginLeft": -wdth
          }, 600, function() {
            $scope.itemToremove = $(this);
            $('ul.verContainer li').last().css({
              "background": $(this).css("background"),
              "color": $(this).css("color")
            });
            $(this).remove();
            beginVertScroll();
          });
          // alert(wdth);
        },
        1000*5
      );
    };

     $scope.setPopover = function(evt){
        var index = $(evt.currentTarget).data('index');
        $scope.popoverData = $scope.featuredslides[index];
    }

    function sortProduct(products){
        if(products.length == 0){
          return;
        }
        vm.sortedFeaturedProduct[vm.sortedFeaturedProduct.length] = [];
        var colCounter = 0;
        var rowCounter = 0;
        products.forEach(function(item){
            vm.sortedFeaturedProduct[rowCounter][colCounter] = item;
            colCounter ++;
            var totalCounter = (rowCounter +1)*6;
            if(colCounter == 6 && totalCounter < products.length){
                colCounter = 0;
                vm.sortedFeaturedProduct[vm.sortedFeaturedProduct.length] = [];
                rowCounter++;
            }
        })
    }
  }
})();
