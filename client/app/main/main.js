'use strict';

angular.module('sreizaoApp')
  .config(function ($stateProvider,$httpProvider) {
    $stateProvider
      .state('main', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl as mainVm',
        layout:'client',
        onEnter: function ($rootScope) {
         $rootScope.choosenTitle=pagesTitles.index.title;
         $rootScope.metaDescription=pagesTitles.index.meta;
       }
      })
      .state('contactus', {
        url: '/contactus',
        templateUrl: 'app/contactus/contactus.html',
        controller: 'ContactUsCtrl',
        layout:'client'
      })
      .state('product', {
        url: '/product',
        templateUrl: 'app/product/product.html',
        controller: 'ProductCtrl as productVm',
        authenticate:true,
        layout:'admin'
      })
       .state('bulkproduct', {
        url: '/bulkproduct',
        templateUrl: 'app/product/bulkproduct.html',
        controller: 'BulkProductCtrl as bulkProduct',
        authenticate:true,
        layout:'admin'
      })
       .state('bulkupload', {
        url: '/bulkupload',
        templateUrl: 'app/bulkupload/bulkupload.html',
        controller: 'BulkUploadCtrl as BulkUploadCtrl',
        authenticate:true,
        layout:'admin'
      })
      .state('callback', {
        url: '/callback',
        templateUrl: 'app/callback/callback.html',
        controller: 'CallbackCtrl',
        layout:'client'
      })
      .state('classifiedad', {
        url: '/classifiedad',
        templateUrl: 'app/classifiedaddes/classifiedadd.html',
        controller: 'ClassifiedAdCtrl',
        layout:'client'
      })
      .state('categoryproduct', {
        url: '/viewproducts/:id?currentPage',
        templateUrl: 'app/product/viewproducts.html',
        controller: 'ViewProductsCtrl as viewproductVm',
        


          /*switch($stateParams.id){
          case "570e04e0213d8d7c368252e2"
            $rootScope.choosenTitle=pagesTitles.viewproducts.backhoeloadersmachine.title;
            $rootScope.metaDescription=pagesTitles.viewproducts.backhoeloadersmachine.meta;
          break;
          case "570e04e0213d8d7c368252df"
          $rootScope.choosenTitle=pagesTitles.viewproducts.excavators.title;
            $rootScope.metaDescription=pagesTitles.viewproducts.excavators.meta;
          break;
          case "570e04e0213d8d7c368252e9"
          $rootScope.choosenTitle=pagesTitles.viewproducts.tractors.title;
            $rootScope.metaDescription=pagesTitles.viewproducts.tractors.meta;
          break;
          case "570e04e0213d8d7c368252dc"
          $rootScope.choosenTitle=pagesTitles.viewproducts.tippers.title;
            $rootScope.metaDescription=pagesTitles.viewproducts.tippers.meta;
          break;
          case "570f5c79d74e41dc2f99bc12"
          $rootScope.choosenTitle=pagesTitles.viewproducts.cranes.title;
            $rootScope.metaDescription=pagesTitles.viewproducts.cranes.meta;
          break;
          case "5732f7ea58ef5de755086622"
          $rootScope.choosenTitle=pagesTitles.viewproducts.transitmixers.title;
            $rootScope.metaDescription=pagesTitles.viewproducts.transitmixers.meta;
          break;*/
         
        layout:'client',
        onEnter:function ($rootScope,$stateParams,$http){
          $http.post('/api/getseo/',{categoryId:$stateParams.id})
          .then(function(res){
            if(res && res.data.length > 0) {
              $rootScope.choosenTitle=res.data[res.data.length-1].title;
              $rootScope.metaDescription=res.data[res.data.length-1].meta;
            }
          })
          .catch(function(err){
           
          })
        }
      })
      .state('productdetail', {
        url: '/productdetail/:id',
        templateUrl: 'app/product/productdetail.html',
        controller: 'ProductDetailCtrl as productDetailVm',
        layout:'client',
        onEnter:function($rootScope){
          //console.log(url);
        }
      })
      .state('getquote', {
        url: '/getquote',
        templateUrl: 'app/product/getquote.html',
        controller: 'ProductQuoteCtrl',
        layout:'client'
      })
      .state('productlisting', {
        url: '/productlisting?first_id&last_id&currentPage&prevPage&searchstr&statusText' +
              '&featured&tradeValue&assetStatus&searchType&coulmnSearchStr&reset',
        templateUrl: 'app/product/productlisting.html',
        controller: 'ProductListingCtrl as productListingVm',
        authenticate:true,
        layout:'admin'
      })
      .state('classifiedadlisting', {
        url: '/classifiedadlisting',
        templateUrl: 'app/classifiedaddes/classifiedadlisting.html',
        controller: 'ClassifiedAdListingCtrl as classifiedadLstVm',
        authenticate:true,
        layout:'admin'
      })
      .state('productedit', {
        url: '/product/:id',
        templateUrl: 'app/product/product.html',
        controller: 'ProductCtrl',
        authenticate:true,
        layout:'admin'
      })
       .state('productrelisting', {
        url: '/relisting/:id',
        templateUrl: 'app/product/product.html',
        controller: 'ProductCtrl',
        authenticate:true,
        layout:'admin'
      })
      .state('producthistory', {
        url: '/producthistory/:id',
        templateUrl: 'app/product/producthistory.html',
        controller: 'ProductHistoryCtrl',
        authenticate:true,
        layout:'admin'
      })
      .state('quote', {
        url: '/quote',
        templateUrl: 'app/quote/quote.html',
        controller: 'QuoteRequestCtrl',
        layout:'client'
      })
      .state('myaccount', {
        url:"/myaccount",
        templateUrl: 'app/account/myaccount/myaccount.html',
        controller: 'MyAccountCtrl as myAccountVm',
         layout:'client'
      })
      .state('viewproduct', {
        url:"/viewproducts?currentPage&group&category&brand&model" + 
            "&type&currencyType&currencyMin&currencyMax&" +
            "&mfgYearMin&mfgYearMax&stateName&cityName&assetId&"+
            "searchstr&operatingHour&mileage&productName&location",
        templateUrl: 'app/product/viewproducts.html',
        controller: 'ViewProductsCtrl as viewproductVm',
         layout:'client'
      })
      .state('aboutus', {
        url:"/aboutus",
        templateUrl: 'app/staticpages/aboutus.html',
         controller:"StaticCtrl",
         layout:'client',
         onEnter: function ($rootScope) {
           console.log("aboutus");
           $rootScope.choosenTitle = pagesTitles.aboutus.title;
           $rootScope.metaDescription=pagesTitles.aboutus.meta;
       }
      })
      .state('manpower', {
        url:"/manpower",
        templateUrl: 'app/manpower/manpower.html',
        controller:"ManpowerCtrl as manpowerVm",
        layout:'client'
      })
      .state('manpowerlisting', {
        url: '/manpowerlisting',
        templateUrl: 'app/manpower/manpowerlisting.html',
        controller: 'ManpowerListingCtrl as manpowerListingVm',
        authenticate:true,
        layout:'admin'
      })
      
      .state('certifiedbyiquippo', {
        url:"/certifiedbyiquippo",
        templateUrl: 'app/staticpages/certifiedByiQuippo.html',
        controller:"CetifiedByiQuippoCtrl",
    	  layout:'client'
      })
      .state('shipping', {
        url:"/shipping",
        templateUrl: 'app/staticpages/shipping.html',
        controller:"ShippingCtrl",
    	  layout:'client'
      })
      .state('valuation', {
        url:"/valuation",
        templateUrl: 'app/staticpages/valuation.html',
        controller:"ValuationCtrl",
        layout:'client',
        onEnter:function($rootScope){
          $rootScope.choosenTitle=pagesTitles.valuation.title;
          $rootScope.metaDescription=pagesTitles.valuation.meta;
        }
      })
      .state('financing', {
        url:"/financing",
        templateUrl: 'app/staticpages/financing.html',
        controller:"FinanceCtrl",
        layout:'client',
        onEnter:function($rootScope){
          $rootScope.choosenTitle=pagesTitles.financing.title;
          $rootScope.metaDescription=pagesTitles.financing.meta;
        }
      })
      .state('insurance', {
        url:"/insurance",
        templateUrl: 'app/staticpages/insurance.html',
        controller:"InsuranceCtrl",
    	  layout:'client',
        onEnter:function($rootScope){
          $rootScope.choosenTitle=pagesTitles.insurance.title;
          $rootScope.metaDescription=pagesTitles.insurance.meta;
        }
      })
      .state('privacy', {
        url:"/privacy",
        templateUrl: 'app/staticpages/privacy.html',
        controller:"StaticCtrl",
        layout:'client'
      })
      .state('termscondition', {
        url:"/termscondition",
        templateUrl: 'app/staticpages/termscondition.html',
        controller:"StaticCtrl",
        layout:'client'
      })
      .state('cart', {
        url:"/cart/:id",
        templateUrl: 'app/cart/viewcart.html',
        controller: 'ViewCartCtrl as cartVm',
        layout:'client'
      })
      .state('masterdata', {
        url: '/masterdata',
        templateUrl: 'app/admin/masterdata/masterdata.html',
        controller: 'MasterDataCtrl as masterDataVm',
        authenticate:true,
        layout:'admin',
        restrict:true
      })
      .state('usermanagment', {
        url: '/usermanagement',
        templateUrl: 'app/admin/usermanagement/usermanagement.html',
        controller: 'UserManagementCtrl as userManagementVm',
        authenticate:true,
        layout:'admin'
      })
      .state('partnermanagement', {
        url: '/partnermanagement',
        templateUrl: 'app/admin/partnermanagement/partnermanagement.html',
        controller: 'PartnerManagementCtrl as partnerVM',
        authenticate:true,
        layout:'admin',
        restrict:true
      })
      .state('dashboard', {
        url: '/dashboard',
        templateUrl: 'app/admin/dashboard/dashboard.html',
        controller: 'DashboardCtrl',
        authenticate:true,
        layout:'admin',
        restrict:true
      })
      .state('emailer', {
        url: '/emailer',
        templateUrl: 'app/admin/emailer/emailer.html',
        controller: 'EmailerCtrl as emailerVm',
        authenticate:true,
        layout:'admin',
        restrict:true
      })
       .state('policies', {
        url: '/policies',
        templateUrl: 'app/admin/policies/policies.html',
        controller: 'policyCtrl as policiesVm',
        authenticate:true,
        layout:'admin',
        restrict:true
      })
       .state('metaData', {
        url: '/metaData',
        templateUrl: 'app/admin/meta/meta.html',
        controller: 'metaCtrl as metaVm',
        authenticate:true,
        layout:'admin',
        restrict:true
      })
      .state('gSettings', {
        url: '/gsettings',
        templateUrl: 'app/admin/gsettings/gsettings.html',
         controller: 'GSettingCtrl as gsettingVm',
        authenticate:true,
        layout:'admin',
        restrict:true
      })
      .state('bidValue', {
        url: '/bidValue',
        templateUrl: 'app/bidValue/bidlisting.html',
        controller: 'BidListingCtrl as bidListingVm',
        authenticate:true,
        layout:'admin'
      })
      .state('reports', {
        url: '/reports',
        templateUrl: 'app/admin/reports/reports.html',
        controller: 'ReportsCtrl as reportsVm',
        authenticate:true,
        layout:'admin'
      })
      .state('services', {
        url: '/services',
        templateUrl: 'app/admin/services/services.html',
        controller: 'ServiceCtrl',
        authenticate:true,
        layout:'admin',
        restrict:true
      })
      .state('accept', {
        url: '/accept',
        templateUrl: 'app/invitationaccept/invitationaccept.html',
        controller: 'InvitationAcceptCtrl as invitationAcceptVm',
        layout:'client'
      })
      .state('auctionrequests', {
        url: '/auctionrequets',
        templateUrl: 'app/auction/auctionlisting.html',
        controller: 'AuctionListingCtrl as auctionListingVm',
        authenticate:true,
        layout:'admin'
      })
      .state('viewauctions', {
        url: '/viewauctions?type',
        templateUrl: 'app/auction/auction.html',
        controller: 'ViewAuctionCtrl as auctionDateVm',
        layout:'client',
        onEnter:function($rootScope){
          $rootScope.choosenTitle=pagesTitles.viewauctions.title;
          $rootScope.metaDescription=pagesTitles.viewauctions.meta;
        }
      })
      .state('assetinacuction', {
        url: '/assetinauction',
        templateUrl: 'app/auction/auctionsdetail.html',
        controller: 'AssetInAuctionCtrl as auctionDetailsVm',
        layout:'client'
      })
      .state('valuationrequests', {
        url: '/valuationrequests/:mode',
        templateUrl: 'app/valuation/valuationlisting.html',
        controller: 'ValuationListingCtrl as valuationListingVm',
        authenticate:true,
        layout:'admin'
      })
      .state('paymenthistory', {
        url: '/paymenthistory',
        templateUrl: 'app/payment/paymentlisting.html',
        controller: 'PaymentListingCtrl as paymentListingVm',
        authenticate:true,
        layout:'admin'
      })
      .state('payment', {
        url: '/payment/:tid',
        templateUrl: 'app/payment/payment.html',
        controller: 'PaymentCtrl as paymentVm',
        authenticate:true,
        layout:'admin'
      })
       .state('paymentresponse', {
        url: '/paymentresponse/:tid',
        templateUrl: 'app/payment/paymentresponse.html',
        controller: 'PaymentResponseCtrl as paymentResponseVm',
        authenticate:true,
        layout:'admin'
      })
      .state('spareupload', {
        url: '/spareupload',
        templateUrl: 'app/spare/spareupload.html',
        controller: 'SpareUploadCtrl as spareVm',
        authenticate:true,
        layout:'admin'
      })
      .state('sparelisting', {
        url: '/sparelisting',
        templateUrl: 'app/spare/sparelisting.html',
        controller: 'SpareListingCtrl as spareListingVm',
        authenticate:true,
        layout:'admin'
      })
      .state('spareedit', {
        url: '/spareedit/:id',
        templateUrl: 'app/spare/spareupload.html',
        controller: 'SpareUploadCtrl as spareVm',
        authenticate:true,
        layout:'admin'
      })
      .state('viewspares', {
        url: '/viewspares',
        templateUrl: 'app/spare/viewspares.html',
        controller: 'ViewSpareCtrl as viewSpareVm',
        layout:'client'
      })
      .state('manufacturerspare', {
        url: '/viewspares/:id',
        templateUrl: 'app/spare/viewspares.html',
        controller: 'ViewSpareCtrl as viewSpareVm',
        layout:'client'
      })
      .state('sparedetail', {
        url: '/sparedetail/:id',
        templateUrl: 'app/spare/sparedetail.html',
        controller: 'SpareDetailCtrl as spareDetailVm',
        layout:'client'
      })
      .state('sparehome', {
        url:"/sparehome",
        templateUrl: 'app/spare/sparehome.html',
        controller:"SpareHomeCtrl as spareHomeVm",
        layout:'client'
      })
      .state('pricetrend', {
        url: '/pricetrend',
        templateUrl: 'app/admin/pricetrend/pricetrend.html',
        controller: 'PriceTrendCtrl as priceTrendVm',
        authenticate:true,
        layout:'admin'
      })
       .state('pricetrendcomment', {
        url: '/pricetrendcomment',
        templateUrl: 'app/admin/pricetrend/pricetrendsurveylisting.html',
        controller: 'PriceTrendSurveyListingCtrl as priceTrendSurveyListingVm',
        authenticate:true,
        layout:'admin'
      })

       $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
  });