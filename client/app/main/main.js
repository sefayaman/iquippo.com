'use strict';

angular.module('sreizaoApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('main', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl',
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
        controller: 'ProductCtrl',
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
        controller: 'ViewProductsCtrl',
        layout:'client'
      })
      .state('productdetail', {
        url: '/productdetail/:id',
        templateUrl: 'app/product/productdetail.html',
        controller: 'productDetailCtrl',
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
        controller: 'ProductListingCtrl',
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
      .state('search', {
        url:"/search",
        templateUrl: 'app/product/viewproducts.html',
        controller: 'ViewProductsCtrl',
         layout:'client'
      })
      .state('viewproduct', {
        url:"/viewproducts",
        templateUrl: 'app/product/viewproducts.html',
        controller: 'ViewProductsCtrl',
         layout:'client'
      })
      .state('aboutus', {
        url:"/aboutus",
        templateUrl: 'app/staticpages/aboutus.html',
         controller:"StaticCtrl",
         layout:'client'
      })
      /*.state('service', {
        url:"/service",
        templateUrl: 'app/staticpages/service.html',
         layout:'client'
      })*/
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
        controller: 'MasterDataCtrl',
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
        controller: 'PartnerManagementCtrl',
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
        controller: 'EmailerCtrl',
        authenticate:true,
        layout:'admin',
        restrict:true
      })
      .state('gSettings', {
        url: '/gsettings',
        templateUrl: 'app/admin/gsettings/gsettings.html',
        authenticate:true,
        layout:'admin',
        restrict:true
      })
      .state('services', {
        url: '/services',
        templateUrl: 'app/admin/services/services.html',
        controller: 'ServiceCtrl',
        authenticate:true,
        layout:'admin',
        restrict:true
      })
  });