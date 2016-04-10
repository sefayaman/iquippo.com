'use strict';
//Application sub Module
angular.module("account",[]);
angular.module("classifiedAd",[]);
angular.module("product",[]);
angular.module("admin",[]);
//Application module
angular.module('sreizaoApp',[
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ui.router', 
  'ui.bootstrap',
  'datatables',
  'ui.tinymce',
  "account",
  'classifiedAd',
  'product',
  'admin'
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
    $urlRouterProvider
      .otherwise('/');

    $locationProvider.html5Mode(true);
    if (!$httpProvider.defaults.headers.get) {
        $httpProvider.defaults.headers.get = {};    
    }
    //disable IE ajax request caching
    $httpProvider.defaults.headers.get['If-Modified-Since'] = 'Mon, 26 Jul 1997 05:00:00 GMT';
    
    $httpProvider.interceptors.push('authInterceptor');
    tinyMCE.baseURL = '/bower_components/tinymce-dist';
    tinyMCE.suffix = '.min';    
  })
  .run(function ($rootScope, $location, Auth,Modal, $state,$http, groupSvc, categorySvc,$timeout, vendorSvc, $uibModal,countrySvc,cartSvc,modelSvc,brandSvc) {
    // Redirect to login if route requires auth and you're not logged in

    $rootScope.uploadImagePrefix = "assets/uploads/";
    $rootScope.categoryDir = categoryDir;
    $rootScope.avatarDir = avatarDir;
    $rootScope.classifiedAdDir = classifiedAdDir;
    $rootScope.refresh = true;

    $rootScope.isSuccess = false;
    $rootScope.isError = false;
    
    $rootScope.successMessage = "";
    $rootScope.errorMessage = "";
    $rootScope.cartCounter = 0;
    $rootScope.cart = null;


    $rootScope.currentProduct = null;
    $rootScope.currentProductListingPage = 0;

    // Get all global data
    $rootScope.loadingCount = 0;
    $rootScope.loading = true;

    $rootScope.allCountries = allCountries;
    $rootScope.valuationList = valuationList;
    $rootScope.tradeType = tradeType;
    $rootScope.locationList = locationList;
    $rootScope.rateMyEquipmentOpt = rateMyEquipmentOpt;

    $rootScope.loadingCount = $rootScope.loadingCount + 2;

    if($rootScope.allCountries.length > 0) {
      for(var i=0; i< $rootScope.allCountries.length; i++)
          $rootScope.allCountries[i]['count'] = 0;
    }

   /* countrySvc.getAllCountries().then(function(response){
        $rootScope.loadingCount --;
        $rootScope.loading = $rootScope.loadingCount !=0;
        $rootScope.allCountries = response.data;
        for(var i=0; i< $rootScope.allCountries.length; i++)
          $rootScope.allCountries[i]['count'] = 0;
    });*/

    groupSvc.getAllGroup().then(function(response){
      $rootScope.loadingCount --;
      $rootScope.loading = $rootScope.loadingCount !=0;
      //$rootScope.allGroup = response.data;
    });

   categorySvc.getAllCategory().then(function(response){
      $rootScope.loadingCount --;
      $rootScope.loading = $rootScope.loadingCount !=0;
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
           cartSvc.getCartData(Auth.getCurrentUser()._id);
        }
     }
   });

    //global logout
    $rootScope.logout = function() {
      Auth.logout();
      $state.go("main");
    };
 
  });
  