'use strict';

angular.module('sreizaoApp')
  .config(function ($stateProvider,$httpProvider) {
    $stateProvider
      .state('main', {
        url: '/?promo',
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl as mainVm',
        layout:'client',
        onEnter:function($rootScope,$stateParams,Modal,Auth,$state){
          $rootScope.choosenTitle=pagesTitles.index.title;
          $rootScope.metaDescription=pagesTitles.index.meta;
          Auth.isLoggedInAsync(function(isLoggedin){
            if(isLoggedin){
                $state.go('main',{promo:''},{location:'replace',notify:false});
                return;
            }
            if($stateParams.promo === 'register'){
              var scope = $rootScope.$new();
              scope.autoOpen = true;
              Modal.openDialog('signup',scope);
            }
          })
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
        layout:'client'
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
            "searchstr&operatingHour&mileage&productName&location&locationName",
        templateUrl: 'app/product/viewproducts.html',
        controller: 'ViewProductsCtrl as viewproductVm',
         layout:'client'
      })
      .state('aboutus', {
        url:"/aboutus",
        templateUrl: 'app/staticpages/aboutus.html',
         controller:"StaticCtrl",
         layout:'client',
         onEnter:function($rootScope){
          $rootScope.choosenTitle=pagesTitles.aboutus.title;
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
    	  layout:'client',
        onEnter:function($rootScope){
          $rootScope.choosenTitle=pagesTitles.index.title;
          $rootScope.metaDescription=pagesTitles.index.meta;
        }
      })
      .state('valuation', {
        url:"/valuation",
        templateUrl: 'app/staticpages/valuation.html',
        /*controller:"ValuationCtrl",*/
        layout:'client',
        onEnter:function($rootScope){
          $rootScope.choosenTitle=pagesTitles.valuation.title;
          $rootScope.metaDescription=pagesTitles.valuation.meta;
        }
      })
      // .state('financing', {
      //   url:"/financing",
      //   templateUrl: 'app/staticpages/financing.html',
      //   controller:"FinanceCtrl",
      //   layout:'client',
      //   onEnter:function($rootScope){
      //     $rootScope.choosenTitle=pagesTitles.financing.title;
      //     $rootScope.metaDescription=pagesTitles.financing.meta;
      //   }
      // })
      .state('finance', {
        url:"/finance",
        templateUrl: 'app/finance/finance.html',
        controller: 'FinancingCtrl as financingVm',
        layout:'client',
        onEnter:function($rootScope){
          $rootScope.choosenTitle=pagesTitles.financing.title;
          $rootScope.metaDescription=pagesTitles.financing.meta;
        }
      })
      .state('cme', {
        url:"/financing/CME",
        //templateUrl: 'app/staticpages/financingcme.html',
        controller:"FinanceCmeCtrl",
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
      .state('gSettings', {
        url: '/gsettings',
        views : {
          '' : {
            templateUrl: 'app/admin/gsettings/gsettings.html',
            controller: 'GSettingCtrl as gsettingVm',
          },
          // 'yardassettype@gSettings' : {
          //   templateUrl: 'app/admin/gsettings/yards/assetType/assetType.html',
          //   controller: 'AssetTypeCtrl as AssetTypeVm', 
          // },
          // 'yardasservices@gSettings' : {
          //   templateUrl: 'app/admin/gsettings/yards/assetType/assetType.html',
          //   controller: 'AssetTypeCtrl as AssetTypeVm', 
          // },
          // 'yardasmanagement@gSettings' : {
          //   templateUrl: 'app/admin/gsettings/yards/assetType/assetType.html',
          //   controller: 'AssetTypeCtrl as AssetTypeVm', 
          // }
        },
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
      .state('inputform', {
        url: '/inputform',
        templateUrl: 'app/inputform/inputformrequests.html',
        controller: 'InputFormListingCtrl as inputformListingVm',
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
      .state('policies', {
        url: '/policies',
        templateUrl: 'app/admin/policies/policies.html',
        controller: 'policyCtrl as policiesVm',
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
      .state('auctionregreport', {
        url: '/auctionregreport',
        templateUrl: 'app/auction/auctionregreport.html',
        controller: 'AuctionRegReportCtrl as auctionRegVm',
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
      //  .state('yardlisting', {
      //   url: '/yardlisting',
      //   templateUrl: 'app/yard/yardlisting.html',
      //   controller: 'YardListingCtrl as yardlistingVm',
      //   authenticate:true,
      //   layout:'admin'
      // })
      //  .state('yardupload', {
      //   url: '/yardupload',
      //   templateUrl: 'app/yard/yardupload.html',
      //   controller: 'YardListingCtrl as YardListingVm',
      //   authenticate:true,
      //   layout:'admin'
      // })
      // .state('yard', {
      //   url: '/yard',
      //   templateUrl: 'app/yard/yard.html',
      //   controller: 'YardListingCtrl as YardListingVm',
      //   layout:'client'
      // })
      .state('enterprisevaluation', {
        url: '/enterprisevaluation',
        abstract:true,
        templateUrl: 'app/enterprise/enterprisevaluation.html',
        controller: 'EnterpriseValuationCtrl as enterpriseVm'
      })
      .state('enterprisevaluation.dashborad', {
        url: '/dashboard',
        templateUrl: 'app/enterprise/dashborad.html',
        controller: 'EnterpriseDashboradCtrl as enterpriseDashboradVm',
        layout:'admin',
        authenticate:true
      })
      .state('enterprisevaluation.transaction', {
        url: '/transaction',
        templateUrl: 'app/enterprise/transaction.html',
        controller: 'EnterpriseTransactionCtrl as enterpriseTransactionVm',
        layout:'admin',
        authenticate:true
      })
      .state('enterprisevaluation.invoicing', {
        url: '/invoicing',
        templateUrl: 'app/enterprise/invoicing.html',
        controller: 'EnterpriseInvoiceCtrl as enterpriseInvoiceVm',
        layout:'admin',
        authenticate:true

      })
       .state('enterprisevaluation.paymentmade', {
        url: '/paymentmade',
        templateUrl: 'app/enterprise/paymentmade.html',
        controller: 'EnterprisePaymentMadeCtrl as enterprisePaymentMadeVm',
        layout:'admin',
        authenticate:true,
        restrict:true
      })
        .state('enterprisevaluation.paymentreceived', {
        url: '/paymentreceived',
        templateUrl: 'app/enterprise/paymentreceived.html',
        controller: 'EnterprisePaymentReceivedCtrl as enterprisePaymentReceivedVm',
        layout:'admin',
        authenticate:true,
        restrict:true
      })
      .state('enterprisevaluation.addtransaction', {
        url: '/addtransaction',
        templateUrl: 'app/enterprise/addtransaction.html',
        controller: 'AddTransactionCtrl as addTransactionVm',
        authenticate:true,
        layout:'admin'
      })
      .state('enterprisevaluation.edittransaction', {
        url: '/addtransaction/:id',
        templateUrl: 'app/enterprise/addtransaction.html',
        controller: 'AddTransactionCtrl as addTransactionVm',
        authenticate:true,
        layout:'admin'
      })
      .state('assetsale', {
        url: '/assetsale',
        abstract:true,
        templateUrl: 'app/assetsale/assetsale.html',
        controller: 'AssetSaleCtrl as assetsaleVm'
      })
      /*.state('assetsale.administrator', {
        url: '/administrator',
        templateUrl: 'app/assetsale/bidproduct.html',
        controller:'BidProductCtrl as bidproductVm',
        layout:'admin',
        authenticate:true,
        restrict:true
      })
      .state('assetsale.adminproductbidrequest', {
        url: '/adminproductbidrequest?assetId&productId',
        templateUrl: 'app/assetsale/productbidrequest.html',
        controller:'ProductBidRequestCtrl as productBidRequestVm',
        layout:'admin',
        authenticate:true,
        restrict:true
      })*/
      .state('assetsale.bidproduct', {
        url: '/bidproduct?t',
        templateUrl: 'app/assetsale/bidproduct.html',
        controller:'BidProductCtrl as bidproductVm',
        layout:'admin',
        authenticate:true
      })
      .state('assetsale.bidrequests', {
        url: '/bidrequests?assetId&productId',
        templateUrl: 'app/assetsale/productbidrequest.html',
        controller:'ProductBidRequestCtrl as productBidRequestVm',
        layout:'admin',
        authenticate:true
      })
      .state('assetsale.buyer', {
        url: '/buyer?t',
        templateUrl: 'app/assetsale/buyerproductbidrequest.html',
        controller:'BuyerProductBidRequestCtrl as buyerProductBidRequestVm',
        layout:'admin',
        authenticate:true
      })
      .state('assetsale.fulfilmentagency', {
        url: '/fulfilmentagency?t',
        templateUrl: 'app/assetsale/faprocess.html',
        controller:'FAProcessCtrl as faVm',
        layout:'admin',
        authenticate:true
      })
     /* .state('assetsale.fulfilmentagency', {
        url: '/fulfilmentagency?assetId&productId',
        templateUrl: 'app/assetsale/productbidrequest.html',
        controller:'ProductBidRequestCtrl as productBidRequestVm',
        layout:'admin',
        authenticate:true
      })*/
      .state('assetbidhistory', {
        url: '/bidhistory',
        templateUrl: 'app/assetsale/bidhistory.html',
        layout:'client',
        authenticate:true
      })

      $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
  });