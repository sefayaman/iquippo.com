'use strict';
//Application sub Module
angular.module("account",[]);
angular.module("classifiedAd",[]);
angular.module("product",[]);
angular.module("newequipment",[]);
angular.module("admin",[]);
angular.module("manpower",[]);
angular.module("spare",[]);
angular.module("report",[]);
angular.module("negotiation",[]);
angular.module("yard",[]);
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
  'newequipment',
  'admin',
  'manpower',
  'spare',
  'report',
  'negotiation',
  'angularjs-datetime-picker',
   'uiGmapgoogle-maps',
   'yard',
   'viewhead',
   'nvd3',
   'timer'
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
    tinyMCE.baseURL = '/bower_components/tinymce';
    tinyMCE.suffix = '.min';
    //AIzaSyDg4HC7YOjDMLqBLX5rvnniMxix-YV7pK8
    uiGmapGoogleMapApiProvider.configure({
        key: 'AIzaSyBzzK9Zl6Ur1c44Dl_-sh9SPDL-fOtWA5s',
        v: '3.20', //defaults to latest 3.X anyhow
        libraries: 'weather,geometry,visualization,places'
    });
  })
  .run(function ($rootScope, $cookieStore, $location, Auth, Modal, $state, $http, groupSvc, categorySvc,$timeout, vendorSvc, $uibModal,CartSvc,modelSvc,brandSvc, settingSvc, InvitationSvc,UtilSvc,MarketingSvc,AppStateSvc, LocationSvc) {
    // Redirect to login if route requires auth and you're not logged in

    $rootScope.uploadImagePrefix = s3Detais.baseURL+"/"+s3Detais.s3bucket+"/assets/uploads/";
    $rootScope.templateDir = $rootScope.uploadImagePrefix  + 'templates';
    $rootScope.categoryDir = categoryDir;
    $rootScope.manpowerDir = manpowerDir;
    $rootScope.auctionDir = auctionDir;
    $rootScope.manufacturerDir = manufacturerDir;
    $rootScope.avatarDir = avatarDir;
    $rootScope.kycDocDir = kycDocDir;
    $rootScope.bannerDir = bannerDir;
    $rootScope.auctionmasterDir = auctionmasterDir;
    $rootScope.financemasterDir = financemasterDir;
    $rootScope.choosenTitle=choosenTitle;
    $rootScope.metaDescription=metaDescription;
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

    $rootScope.allCountries = [];
    $rootScope.valuationList = valuationList;
    $rootScope.tradeType = tradeType;
    $rootScope.rateMyEquipmentOpt = rateMyEquipmentOpt;
    $rootScope.invitationData = {};
    $rootScope.expValue = expValue;
    $rootScope.spareStatus = spareStatus;
    $rootScope.paymentOptions = paymentOptions;
    $rootScope.allMadeInCountries = allMadeInCountries;
    $rootScope.KYCType = KYCType;
    
    $rootScope.loadingCount = $rootScope.loadingCount + 1;
    
    /*groupSvc.getAllGroup().then(function(response){
      $rootScope.loadingCount --;
      $rootScope.loading = $rootScope.loadingCount !=0;
    });*/
   categorySvc.getAllCategory().then(function(response){
      $rootScope.loadingCount --;
      $rootScope.loading = $rootScope.loadingCount !=0;
    });

    LocationSvc.getAllCountry()
    .then(function(result){
      $rootScope.allCountries = result;

      if($rootScope.allCountries.length > 0) {
        for(var i=0; i< $rootScope.allCountries.length; i++)
            $rootScope.allCountries[i]['count'] = 0;
      }
    });
    
    settingSvc.getDevEnvironment()
    .then(function(res){
        DevEnvironment = res.mode === 'production'?false:true;
        $rootScope.liveOrUatFlag = DevEnvironment;
        setEnviormentVariables(res);
      })
      .catch(function(stRes){
      });

   settingSvc.get(UPDATE_INVITATION_MASTER)
    .then(function(res){
         $rootScope.invitationData = res;
      })
      .catch(function(stRes){
      });

    $rootScope.$on('$stateChangeStart', function (event, next,toParams, fromState, fromParams) {
    $('#jivo-iframe-container').css("opacity","1");
    AppStateSvc.set(fromState.name,fromParams);
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
        var google_tag_params = {
            dynx_itemid: 'REPLACE_WITH_VALUE',
            dynx_itemid2: 'REPLACE_WITH_VALUE',
            dynx_pagetype: 'REPLACE_WITH_VALUE',
            dynx_totalvalue: 'REPLACE_WITH_VALUE',
        };
        MarketingSvc.googleRemarketing(google_tag_params);
    });

    //$rootScope.isUploadEnable = Auth.isUploadProduct;
    $rootScope.isActive = Auth.isActive;
    $rootScope.isLoggedIn = Auth.isLoggedIn;
    $rootScope.isAdmin = Auth.isAdmin;
    $rootScope.isBulkUpload = Auth.isBulkUpload;
    $rootScope.isChannelPartner = Auth.isChannelPartner;
    $rootScope.isEnterprise = Auth.isEnterprise;
    $rootScope.isEnterpriseUser = Auth.isEnterpriseUser;
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
    $rootScope.getMonth = UtilSvc.getMonth;
    $rootScope.getDate = UtilSvc.getDate;
    $rootScope.getGroupHelp = groupSvc.getHelp;
    $rootScope.getBrandHelp = brandSvc.getHelp;
    $rootScope.getLocations = UtilSvc.getLocations;
    $rootScope.isServiceAvailed = Auth.isServiceAvailed;
    $rootScope.isApprovalRequired = Auth.isApprovalRequired;
    $rootScope.isServiceRequester = Auth.isServiceRequester;
    $rootScope.isServiceApprover = Auth.isServiceApprover;
    $rootScope.isAuctionPartner = Auth.isAuctionPartner;
    $rootScope.isFAgencyPartner = Auth.isFAgencyPartner;
    $rootScope.isValuationPartner = Auth.isValuationPartner;
    $rootScope.isBuySaleApprover = Auth.isBuySaleApprover;
    $rootScope.isBuySaleViewOnly = Auth.isBuySaleViewOnly;
    $rootScope.isAuctionRegPermission = Auth.isAuctionRegPermission;
    
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

    function setEnviormentVariables(res){
      if(DevEnvironment){
        supportMail = "iquippo.uat@gmail.com";
        auctionURL = "https://auctionsoftwaremarketplace.com:3007";
        ccavenueURL = "https://test.ccavenue.com";
        if(res.mode === 'development') {
          
          /*Payment setup for dev server*/
          currentURL = "http://dev.iquippo.com";
          accessCode = 'AVHH01FA38BL35HHLB';

          /*Payment setup for localhost server*/
         /* currentURL = "http://localhost";
          accessCode = 'AVSW00DJ54AN50WSNA';*/

        } else {
          currentURL = "http://uat.iquippo.com";
          accessCode = 'AVGH01FA38BL33HGLB';
        }
      }
    }
      
   Auth.removeCookies();
    //global logout
    $rootScope.logout = function() {
      Auth.logout();
      $state.go("main");
    };

  });
