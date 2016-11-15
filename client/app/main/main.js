'use strict';

angular.module('sreizaoApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('main', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl as mainVm',
        layout:'client'
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
        url: '/viewproducts/:id',
        templateUrl: 'app/product/viewproducts.html',
        controller: 'ViewProductsCtrl as viewproductVm',
        layout:'client'
      })
      .state('productdetail', {
        url: '/productdetail/:id',
        templateUrl: 'app/product/productdetail.html',
        controller: 'ProductDetailCtrl as productDetailVm',
        layout:'client'
      })
      .state('getquote', {
        url: '/getquote',
        templateUrl: 'app/product/getquote.html',
        controller: 'ProductQuoteCtrl',
        layout:'client'
      })
      .state('productlisting', {
        url: '/productlisting',
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
        url:"/viewproducts",
        templateUrl: 'app/product/viewproducts.html',
        controller: 'ViewProductsCtrl as viewproductVm',
         layout:'client'
      })
      .state('aboutus', {
        url:"/aboutus",
        templateUrl: 'app/staticpages/aboutus.html',
         controller:"StaticCtrl",
         layout:'client'
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
        layout:'client'
      })
      .state('financing', {
        url:"/financing",
        templateUrl: 'app/staticpages/financing.html',
        controller:"FinanceCtrl",
        layout:'client'
      })
      .state('insurance', {
        url:"/insurance",
        templateUrl: 'app/staticpages/insurance.html',
        controller:"InsuranceCtrl",
    	  layout:'client'
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
        controller: 'UserManagementCtrl',
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
      });
  });