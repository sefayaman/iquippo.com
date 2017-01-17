'use strict';
//Application sub Module
angular.module("account",[]);
angular.module("classifiedAd",[]);
angular.module("product",[]);
angular.module("admin",[]);
angular.module("manpower",[]);
angular.module("spare",[]);
angular.module("report",[]);
angular.module("negotiation",[]);
//Application module
angular.module('sreizaoApp',[
  'ngCookies',
  'ngResource',
  'ngAnimate',
  'ngSanitize',
  'ui.router',
  'ui.bootstrap',
  'datatables',
  'ui.tinymce',
  "account",
  'classifiedAd',
  'product',
  'admin',
  'manpower',
  'spare',
  'report',
  'negotiation',
  'angularjs-datetime-picker',
   'uiGmapgoogle-maps',
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider,uiGmapGoogleMapApiProvider) {
    $urlRouterProvider
      .otherwise('/');

    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

    $locationProvider.html5Mode(true);
    if (!$httpProvider.defaults.headers.get) {
        $httpProvider.defaults.headers.get = {};
    }
    //disable IE ajax request caching
    $httpProvider.defaults.headers.get['If-Modified-Since'] = 'Mon, 26 Jul 1997 05:00:00 GMT';

    $httpProvider.interceptors.push('authInterceptor');
    tinyMCE.baseURL = '/bower_components/tinymce-dist';
    tinyMCE.suffix = '.min';
    //AIzaSyDg4HC7YOjDMLqBLX5rvnniMxix-YV7pK8
    uiGmapGoogleMapApiProvider.configure({
        key: 'AIzaSyBzzK9Zl6Ur1c44Dl_-sh9SPDL-fOtWA5s',
        v: '3.20', //defaults to latest 3.X anyhow
        libraries: 'weather,geometry,visualization,places'
    });
  })
  .run(function ($rootScope, $cookieStore, $location, Auth,Modal, $state,$http, groupSvc, categorySvc,$timeout, vendorSvc, $uibModal,countrySvc,CartSvc,modelSvc,brandSvc, settingSvc, InvitationSvc,UtilSvc) {
    // Redirect to login if route requires auth and you're not logged in

    $rootScope.uploadImagePrefix = "assets/uploads/";
    $rootScope.categoryDir = categoryDir;
    $rootScope.manpowerDir = manpowerDir;
    $rootScope.auctionDir = auctionDir;
    $rootScope.manufacturerDir = manufacturerDir;
    $rootScope.avatarDir = avatarDir;
    $rootScope.bannerDir = bannerDir;
    $rootScope.classifiedAdDir = classifiedAdDir;
    $rootScope.newsEventsDir = newsEventsDir;
    $rootScope.refresh = true;

    $rootScope.isSuccess = false;
    $rootScope.isError = false;

    $rootScope.successMessage = "";
    $rootScope.errorMessage = "";
    $rootScope.cartCounter = 0;
    $rootScope.cart = null;


    $rootScope.currentProduct = null;
    $rootScope.currentSpare = null;
    $rootScope.currentProductListingPage = 0;

    // Get all global data
    $rootScope.loadingCount = 0;
    $rootScope.loading = true;

    $rootScope.allCountries = allCountries;
    $rootScope.valuationList = valuationList;
    $rootScope.tradeType = tradeType;
    $rootScope.rateMyEquipmentOpt = rateMyEquipmentOpt;
    $rootScope.invitationData = {};
    $rootScope.expValue = expValue;
    $rootScope.spareStatus = spareStatus;
    $rootScope.paymentOptions = paymentOptions;
    $rootScope.allMadeInCountries = allMadeInCountries;
    
    $rootScope.loadingCount = $rootScope.loadingCount + 2;

    if($rootScope.allCountries.length > 0) {
      for(var i=0; i< $rootScope.allCountries.length; i++)
          $rootScope.allCountries[i]['count'] = 0;
    }

    groupSvc.getAllGroup().then(function(response){
      $rootScope.loadingCount --;
      $rootScope.loading = $rootScope.loadingCount !=0;
    });

   categorySvc.getAllCategory().then(function(response){
      $rootScope.loadingCount --;
      $rootScope.loading = $rootScope.loadingCount !=0;
    });

   settingSvc.get(UPDATE_INVITATION_MASTER)
    .then(function(res){
         $rootScope.invitationData = res;
      })
      .catch(function(stRes){
      });

    $rootScope.$on('$stateChangeStart', function (event, next) {
    $('#jivo-iframe-container').css("opacity","1");
      Auth.isLoggedInAsync(function(loggedIn) {
        if (next.authenticate && !loggedIn) {
          event.preventDefault();
          $rootScope.isAdminLayout = false;
          $state.go('main');
        }else if(next.authenticate && loggedIn){
           if(next.layout == 'admin'){
              $rootScope.isAdminLayout = true;
              $('#jivo-iframe-container').css("opacity","0");
           }
           else
              $rootScope.isAdminLayout = false;
          if(next.restrict && !Auth.isAdmin()){
             event.preventDefault();
             $rootScope.isAdminLayout = false;
             $state.go('main');
          }

        }else
          $rootScope.isAdminLayout = false;
      });

    });

    $rootScope.$on('$stateChangeSuccess', function(ev, to, toParams, from, fromParams) {
        $rootScope.previousState = from.name;
        $rootScope.previousParams = fromParams;
        $rootScope.currentState = to.name;
        if($rootScope.currentState != 'productlisting' && $rootScope.currentState != 'productedit' && $rootScope.currentState != 'producthistory')
          $rootScope.currentProductListingPage = 0;
        setScroll(0);
    });

    //$rootScope.isUploadEnable = Auth.isUploadProduct;
    $rootScope.isActive = Auth.isActive;
    $rootScope.isLoggedIn = Auth.isLoggedIn;
    $rootScope.isAdmin = Auth.isAdmin;
    $rootScope.isBulkUpload = Auth.isBulkUpload;
    $rootScope.isChannelPartner = Auth.isChannelPartner;
    $rootScope.getCurrentUser = Auth.getCurrentUser;
    $rootScope.openDialog = Modal.openDialog;
    $rootScope.logout = Auth.logout;
    $rootScope.clearCache = CartSvc.clearCache;
    $rootScope.isProfileIncomplete = Auth.isProfileIncomplete;
    $rootScope.isCustomer = Auth.isCustomer;
    $rootScope.isPartner = Auth.isPartner;
    $rootScope.getStatusOnCode = UtilSvc.getStatusOnCode;
    $rootScope.validateCategory = UtilSvc.validateCategory;
    $rootScope.getCategoryHelp = UtilSvc.getCategoryHelp;
    $rootScope.getLocationHelp = UtilSvc.getLocationHelp;
    $rootScope.getLocations = UtilSvc.getLocations;

    $rootScope.closeMeassage = function(){
      $rootScope.isSuccess = false;
      $rootScope.isError = false;
    }

    $rootScope.autoSuccessMessage = function(interval){
      $rootScope.isSuccess = true;
      $timeout(function(){
           $rootScope.isSuccess = false;
      },1000*interval);
    }

    $rootScope.autoErrorMessage = function(interval){
      $rootScope.isError = true;
      setTimeout(function(){
           $rootScope.isError = false;
      },1000*interval);
    }

     /*Loading cart and other data if user is logged in*/
   Auth.isLoggedInAsync(function(loggedIn){
     if(loggedIn){
         if(Auth.getCurrentUser()._id){
           CartSvc.loadCart();
        }
        if(!Auth.getCurrentUser().status){
          Modal.alert("This account is deactivated by admin.Please contact our support team.");
          Auth.logout();
          return;
        }
       if(Auth.isProfileIncomplete()){
           $rootScope.isAdminLayout = false;
          $state.go('myaccount');
        }

        if($cookieStore.get('refUserId') && $cookieStore.get('promoCode')) {
          var couponData = {};
          couponData.user = {};
          couponData.refBy = {};
          couponData.user = Auth.getCurrentUser();
          couponData.refBy.refId = $cookieStore.get('refUserId');
          couponData.refBy.code = $cookieStore.get('promoCode');
          InvitationSvc.createCoupon(couponData)
          .then(function(res){
            console.log("Coupon Created");
            $cookieStore.remove('refUserId'); 
            $cookieStore.remove('promoCode');
          });
        } 
     }
   });

    //global logout
    $rootScope.logout = function() {
      Auth.logout();
      $state.go("main");
    };

  });
