(function() {
  'use strict';
  angular.module('sreizaoApp').controller('StaticCtrl', StaticCtrl);
  angular.module('sreizaoApp').controller('ShippingCtrl', ShippingCtrl);
  angular.module('sreizaoApp').controller('ValuationCtrl', ValuationCtrl);
  angular.module('sreizaoApp').controller('FinanceCtrl', FinanceCtrl);
  angular.module('sreizaoApp').controller('FinanceCmeCtrl', FinanceCmeCtrl);
  angular.module('sreizaoApp').controller('InsuranceCtrl', InsuranceCtrl);
  angular.module('sreizaoApp').controller('CetifiedByiQuippoCtrl', CetifiedByiQuippoCtrl);

  //Controller for static pages
  function StaticCtrl($scope, $rootScope) {

  }

  //Shipping controller function
  function ShippingCtrl($scope, $rootScope, Auth, $http, Modal, notificationSvc, LocationSvc, MarketingSvc, UtilSvc) {
    //NJ start:set current time
    $scope.shippingStartTime = new Date();
    //End
    var facebookConversionSent = false;
    $scope.addShippingQuote = addShippingQuote;
    $scope.resetClick = resetClick;
    $scope.onCountryChange = onCountryChange;
    $scope.onStateChange = onStateChange;
    $scope.shippingService = {};
    $scope.shippingQuote = {};
    var filter = {};

    function init() {
      if (Auth.getCurrentUser()._id) {
        var currUser = Auth.getCurrentUser();
        $scope.shippingQuote.fname = currUser.fname;
        $scope.shippingQuote.mname = currUser.mname;
        $scope.shippingQuote.lname = currUser.lname;

        $scope.shippingQuote.mobile = currUser.mobile;
        $scope.shippingQuote.email = currUser.email;
        $scope.shippingQuote.phone = currUser.phone;
        $scope.shippingQuote.country = currUser.country;
        $scope.shippingQuote.city = currUser.city;
        $scope.shippingQuote.state = currUser.state;
        onCountryChange(currUser.country, true);
        onStateChange(currUser.state, true);
      }

      /* LocationSvc.getAllLocation()
        .then(function(result){
         $scope.locationList = result;
       });*/
    }

    function onCountryChange(country, noChange) {
      if (!noChange) {
        $scope.shippingQuote.state = "";
        $scope.shippingQuote.city = "";
      }

      $scope.stateList = [];
      $scope.locationList = [];
      filter = {};
      filter.country = country;
      LocationSvc.getStateHelp(filter).then(function(result) {
        $scope.stateList = result;
      });
    }

    function onStateChange(state, noChange) {
      if (!noChange)
        $scope.shippingQuote.city = "";

      $scope.locationList = [];
      filter = {};
      filter.stateName = state;
      LocationSvc.getLocationOnFilter(filter).then(function(result) {
        $scope.locationList = result;
      });
    }


    init();

    function addShippingQuote(evt) {
      var ret = false;
      if ($scope.shippingQuote.country && $scope.shippingQuote.mobile) {
        var value = UtilSvc.validateMobile($scope.shippingQuote.country, $scope.shippingQuote.mobile);
        if (!value) {
          $scope.form.mobile.$invalid = true;
          ret = true;
        } else {
          $scope.form.mobile.$invalid = false;
          ret = false;
        }
      }
      if ($scope.form.$invalid || ret) {
        $scope.form.submitted = true;
        return;
      }

      $scope.shippingService.type = "shipping";
      $scope.shippingService.quote = $scope.shippingQuote;
      $http.post('/api/services', $scope.shippingService).then(function(res) {

          //Start NJ : push shippingSubmit object in GTM dataLayer
          dataLayer.push(gaMasterObject.shippingSubmit);
          //NJ : set shipping form submit time
          var shippingSubmitTime = new Date();
          var timeDiff = Math.floor(((shippingSubmitTime - $scope.shippingStartTime) / 1000) * 1000);
          gaMasterObject.shippingSubmitTime.timingValue = timeDiff;
          ga('send', gaMasterObject.shippingSubmitTime);
          //End

          var data = {};
          data['to'] = supportMail;
          data['subject'] = 'Request for a Quote: Shipping';
          $scope.shippingService.serverPath = serverPath;
          notificationSvc.sendNotification('enquiriesQuoteShippingEmailToAdmin', data, $scope.shippingService.quote, 'email');

          data['to'] = $scope.shippingService.quote.email;
          data['subject'] = 'No reply: Request a Quote';
          notificationSvc.sendNotification('enquiriesQuoteServicesEmailToCustomer', data, {
            serverPath: $scope.shippingService.serverPath
          }, 'email');
          $scope.shippingQuote = {};
          $scope.form.submitted = false;
          Modal.alert(informationMessage.productQuoteSuccess, true);

          //Google and Facbook conversion start
          MarketingSvc.googleConversion();
          if (!facebookConversionSent) {
            MarketingSvc.facebookConversion();
            facebookConversionSent = true;
          }
          //Google and Facbook conversion end

        })
        .catch(function(res) {
          //Modal.alert("",true);
        });
    }

    function resetClick() {
      //Start NJ : push shippingReset object in GTM dataLayer
      dataLayer.push(gaMasterObject.shippingReset);
      //NJ : set shipping Reset time
      var shippingResetTime = new Date();
      var timeDiff = Math.floor(((shippingResetTime - $scope.shippingStartTime) / 1000) * 1000);
      gaMasterObject.shippingResetTime.timingValue = timeDiff;
      ga('send', gaMasterObject.shippingResetTime);
      //End

      $scope.shippingQuote = {};
    };
  }

  //Valuation controller function

  function ValuationCtrl($scope, $rootScope, PaymentMasterSvc, Auth, $http, $log, Modal, ValuationPurposeSvc, notificationSvc, LocationSvc, ValuationSvc, userSvc, categorySvc, brandSvc, modelSvc, MarketingSvc, UtilSvc, $state, AssetGroupSvc, vendorSvc, EnterpriseSvc) {

    //NJ Start: set valuationStartTime
    $scope.valuationStartTime = new Date();
    //End
    var facebookConversionSent = false;
    $scope.addValuationQuote = addValuationQuote;
    $scope.resetClick = resetData;
    $scope.onCategoryChange = onCategoryChange;
    $scope.onBrandChange = onBrandChange;
    $scope.onChange = onChange;
    $scope.onCountryChange = onCountryChange;
    $scope.onStateChange = onStateChange;
    $scope.onPrdCountryChange = onPrdCountryChange;
    $scope.onPrdStateChange = onPrdStateChange;
    $scope.getVendors = getVendors;

    $scope.valuationQuote = {};
    $scope.valuationQuote.requestType = "Valuation";
    $scope.valuationQuote.product = {};
    $scope.valuationService = {};
    $scope.currentYear = new Date().getFullYear();
    var filter = {};
    $scope.valuationQuote.product.country = "India";
    $scope.valuationQuote.valuation = "Financing";

    function init() {
      loadCategory();
      if ($scope.valuationQuote.product && $scope.valuationQuote.product.country)
        onPrdCountryChange($scope.valuationQuote.product.country)
      ValuationPurposeSvc.get(null)
      .then(function(result) {
        $scope.valuationList = result;
      });
      vendorSvc.getAllVendors()
       .then(function(){
         $scope.vendorList = vendorSvc.getVendorsOnCode($scope.valuationQuote.requestType);
       });

       PaymentMasterSvc.getAll();

      Auth.isLoggedInAsync(function(loggedIn){
      if(loggedIn)
         setUser();
      });
    }

    function loadCategory() {
      categorySvc.getAllCategory()
        .then(function(result) {
          $scope.allCategory = result;
        });
      $scope.isEnterprise = false;
      $scope.mytime = new Date();
      $scope.hstep = 1;
      $scope.mstep = 1;
      $scope.ismeridian = true;
    }

    function onCountryChange(country, noChange) {
      if (!noChange) {
        $scope.valuationQuote.state = "";
        $scope.valuationQuote.city = "";
      }
      $scope.stateList = [];
      $scope.locationList = [];
      if (!country)
        return;

      filter = {};
      filter.country = country;
      LocationSvc.getStateHelp(filter).then(function(result) {
        $scope.stateList = result;
      });
    }

    function onStateChange(state, noChange) {
      if (!noChange)
        $scope.valuationQuote.city = "";
      $scope.locationList = [];
      if (!state)
        return;

      filter = {};
      filter.stateName = state;
      LocationSvc.getLocationOnFilter(filter).then(function(result) {
        $scope.locationList = result;
      });
    }

    function onPrdCountryChange(country) {
      $scope.valuationQuote.product.state = "";
      $scope.valuationQuote.product.city = "";
      $scope.prdStateList = [];
      $scope.prdLocationList = [];
      if (!country)
        return;
      filter = {};
      filter.country = country;
      LocationSvc.getStateHelp(filter).then(function(result) {
        $scope.prdStateList = result;
      });
    }

    function onPrdStateChange(state) {
      $scope.valuationQuote.product.city = "";
      $scope.prdLocationList = [];
      if (!state)
        return;
      filter = {};
      filter.stateName = state;
      LocationSvc.getLocationOnFilter(filter).then(function(result) {
        $scope.prdLocationList = result;
      });
    }

    function setUser() {
      if (Auth.getCurrentUser()._id) {
        var currUser = Auth.getCurrentUser();
        $scope.valuationQuote.fname = currUser.fname;
        $scope.valuationQuote.mname = currUser.mname;
        $scope.valuationQuote.lname = currUser.lname;
        $scope.valuationQuote.mobile = currUser.mobile;
        if (currUser.email)
          $scope.valuationQuote.email = currUser.email;
        $scope.valuationQuote.phone = currUser.phone;
        $scope.valuationQuote.country = currUser.country;
        $scope.valuationQuote.state = currUser.state;
        $scope.valuationQuote.city = currUser.city;
        onCountryChange(currUser.country, true);
        onStateChange(currUser.state, true);
      }
    }

    function onCategoryChange(categoryName) {
      $scope.brandList = [];
      $scope.modelList = [];
      $scope.valuationQuote.product.brand = "";
      $scope.valuationQuote.product.model = "";
      if (!categoryName)
        return;
      var filter = {};
      filter['categoryName'] = categoryName;
      brandSvc.getBrandOnFilter(filter)
        .then(function(result) {
          $scope.brandList = result;
        })
        .catch(function(res) {
          console.log("error in fetching brand", res);
        })
    }

    function onBrandChange(brandName) {
      
      $scope.modelList = [];
      $scope.valuationQuote.product.model = "";
      if (!brandName)
        return;
      var filter = {};
      filter['brandName'] = brandName;
      filter.categoryName= $scope.valuationQuote.product.category;
      modelSvc.getModelOnFilter(filter)
        .then(function(result) {
          $scope.modelList = result;
        })
        .catch(function(res) {
          console.log("error in fetching model", res);
        })
    }

    init();

    function onChange(val) {
      if (val == 'contactPerson') {
        if ($scope.valuationQuote.product.contactPersonAsAbove)
          $scope.valuationQuote.product.contactPerson = $scope.valuationQuote.fname + " " + $scope.valuationQuote.lname;
        else
          $scope.valuationQuote.product.contactPerson = "";
      }
      if (val == 'contactNumber') {
        if ($scope.valuationQuote.product.contactNumberAsAbove)
          $scope.valuationQuote.product.contactNumber = $scope.valuationQuote.mobile;
        else
          $scope.valuationQuote.product.contactNumber = "";
      }
    }

    function getVendors(requestType) {
      $scope.vendorList = [];
      if(requestType) 
        $scope.vendorList = vendorSvc.getVendorsOnCode(requestType);
      return $scope.vendorList;
    }

    function addValuationQuote(form) {
      
      if (!Auth.getCurrentUser()._id) {
        Modal.alert("Please Login/Register for submitting your Valuation Request.", true);
        $scope.submitted = false;
        return;
      }

      var ret = false;
      /*if ($scope.valuationQuote.country && $scope.valuationQuote.mobile) {
        var value = UtilSvc.validateMobile($scope.valuationQuote.country, $scope.valuationQuote.mobile);
        if (!value) {
          form.mobile.$invalid = true;
          ret = true;
        } else {
          form.mobile.$invalid = false;
          ret = false;
        }
      }*/

      if ($scope.valuationQuote.schedule == 'yes') {
        if (angular.isUndefined($scope.valuationQuote.scheduleDate))
          form.scheduleDate.$invalid = true;
        else
          form.scheduleDate.$invalid = false;
      }

      if (form.$invalid || ret) {
        $scope.submitted = true;
        return;
      }

      if ($scope.valuationQuote.product.contactPersonAsAbove)
        $scope.valuationQuote.product.contactPerson = $scope.valuationQuote.fname + " " + $scope.valuationQuote.lname;

      if ($scope.valuationQuote.product.contactNumberAsAbove)
        $scope.valuationQuote.product.contactNumber = $scope.valuationQuote.mobile;
        valuationQuoteSave();

    }


    function valuationQuoteSave() {

      var paymentTransaction = {};
      paymentTransaction.payments = [];
      paymentTransaction.totalAmount = 0;
      paymentTransaction.requestType = $scope.valuationQuote.requestType;

      var payObj = {};
      var pyMaster = PaymentMasterSvc.getPaymentMasterOnSvcCode($scope.valuationQuote.requestType, $scope.valuationQuote.partnerId);
      if(!pyMaster)
        pyMaster = PaymentMasterSvc.getPaymentMasterOnSvcCode($scope.enterpriseValuation.requestType);

      payObj.type = "valuationEnquiries";
      payObj.charge = pyMaster.fees || 5000;
      paymentTransaction.totalAmount += payObj.charge;
      paymentTransaction.payments[paymentTransaction.payments.length] = payObj;
      paymentTransaction.product = $scope.valuationQuote.product;
      paymentTransaction.user = {};
      paymentTransaction.user._id = Auth.getCurrentUser()._id;
      paymentTransaction.user.fname = Auth.getCurrentUser().fname;
      paymentTransaction.user.lname = Auth.getCurrentUser().lname;
      paymentTransaction.user.country = Auth.getCurrentUser().country;
      paymentTransaction.user.city = Auth.getCurrentUser().city;
      paymentTransaction.user.phone = Auth.getCurrentUser().phone;
      paymentTransaction.user.mobile = Auth.getCurrentUser().mobile;
      paymentTransaction.user.email = Auth.getCurrentUser().email;

      paymentTransaction.status = transactionStatuses[0].code;
      paymentTransaction.statuses = [];
      var sObj = {};
      sObj.createdAt = new Date();
      sObj.status = transactionStatuses[0].code;
      sObj.userId = Auth.getCurrentUser()._id;
      paymentTransaction.statuses[paymentTransaction.statuses.length] = sObj;
      paymentTransaction.paymentMode = "online";

      if (!$scope.valuationQuote.scheduledTime && $scope.valuationQuote.schedule == "yes")
        $scope.changed($scope.mytime);
      $scope.valuationService.type = "valuation";
      $scope.valuationService.quote = $scope.valuationQuote;

      ValuationSvc.saveService({
          valuation: $scope.valuationService,
          payment: paymentTransaction
        })
        .then(function(result) {
          if (result && result.errorCode != 0) {
            //Modal.alert(result.message, true);  
            $state.go('main');
            return;
          }
          if (result.transactionId){
            MarketingSvc.googleConversion();
          if (!facebookConversionSent) {
            MarketingSvc.facebookConversion();
            facebookConversionSent = true;
          }
      var data = {};
      data['to'] = supportMail;
      data['subject'] = 'Valuation';
      var dataToSend={};
      dataToSend=$scope.valuationService.quote;
      dataToSend.serverPath=serverPath;
      dataToSend.transactionId=result.transactionId;
      notificationSvc.sendNotification('enquiriesQuoteValuationEmailToAdmin', data, dataToSend,'email');
      
      data={};
      data['to'] = $scope.valuationService.quote.email;
      data['subject'] = 'Your request has been initiated successfully';
      dataToSend={};
      dataToSend.serverPath=serverPath;
      notificationSvc.sendNotification('enquiriesQuoteServicesEmailToCustomer', data,dataToSend,'email');
        $state.go('payment', {
            tid: result.transactionId
          });
      }
        })
        .catch(function(err) {
          Modal.alert('Error while sending email');
        });
    }

    function resetData() {
      $scope.valuationQuote = {};
      $scope.valuationQuote.requestType = "Valuation";
      $scope.valuationQuote.product = {};
      $scope.valuationQuote.valuation = "Financing";
      $scope.valuationQuote.product.country = "India";
      $scope.submitted = false;
      setUser();
    }

    $scope.changed = function(mytime) {
      if (mytime) {
        var hours = mytime.getHours();
        var minutes = mytime.getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        $scope.valuationQuote.scheduledTime = hours + ':' + minutes + ' ' + ampm;
      }
    };

    $scope.toggleMode = function() {
      $scope.isShow = !$scope.isShow;
    };

    //date picker
    $scope.today = function() {
      $scope.scheduleDate = new Date();
    };
    $scope.today();

    $scope.clear = function() {
      $scope.scheduleDate = null;
    };

    $scope.toggleMin = function() {
      $scope.minDate = $scope.minDate ? null : new Date();
    };

    $scope.toggleMin();
    $scope.maxDate = new Date(2020, 5, 22);
    $scope.minDate = new Date();

    $scope.open1 = function() {
      $scope.popup1.opened = true;
    };

    $scope.setDate = function(year, month, day) {
      $scope.scheduleDate = new Date(year, month, day);
    };

    $scope.dateOptions = {
      formatYear: 'yy',
      startingDay: 1
    };

    $scope.formats = ['dd/MM/yyyy', 'dd.MM.yyyy', 'shortDate'];
    $scope.format = $scope.formats[0];

    $scope.popup1 = {
      opened: false
    };
  }

  //Finance Controller function
  function FinanceCtrl($scope, $rootScope, Auth, $http, $log, Modal, notificationSvc, LocationSvc, categorySvc, brandSvc, modelSvc, MarketingSvc, UtilSvc) {
    var facebookConversionSent = false;
    $scope.addFinanceQuote = addFinanceQuote;
    $scope.resetClick = resetClick;
    $scope.onCategoryChange = onCategoryChange;
    $scope.onBrandChange = onBrandChange;
    $scope.currentYear = new Date().getFullYear();
    $scope.onCountryChange = onCountryChange;
    $scope.onStateChange = onStateChange;
    $scope.onPrdCountryChange = onPrdCountryChange;
    $scope.onPrdStateChange = onPrdStateChange;

    $scope.financeQuote = {};
    $scope.financeQuote.product = {};
    $scope.financeService = {};
    var filter = {};

    function init() {
      setUserData();
      /*LocationSvc.getAllLocation()
       .then(function(result){
        $scope.locationList = result;
      });*/

      categorySvc.getAllCategory()
        .then(function(result) {
          $scope.allCategory = result;
        });
    }

    function setUserData() {

      if (Auth.getCurrentUser()._id) {
        var currUser = Auth.getCurrentUser();
        $scope.financeQuote.fname = currUser.fname;
        $scope.financeQuote.mname = currUser.mname;
        $scope.financeQuote.lname = currUser.lname;

        $scope.financeQuote.mobile = currUser.mobile;
        $scope.financeQuote.email = currUser.email;
        $scope.financeQuote.phone = currUser.phone;
        $scope.financeQuote.country = currUser.country;
        $scope.financeQuote.state = currUser.state;
        $scope.financeQuote.city = currUser.city;
        onCountryChange(currUser.country, true);
        onStateChange(currUser.state, true);
      }
    }

    function onCountryChange(country, noChange) {
      if (!noChange) {
        $scope.financeQuote.state = "";
        $scope.financeQuote.city = "";
      }
      $scope.stateList = [];
      $scope.locationList = [];
      filter = {};
      filter.country = country;
      LocationSvc.getStateHelp(filter).then(function(result) {
        $scope.stateList = result;
      });
    }

    function onStateChange(state, noChange) {
      if (!noChange)
        $scope.financeQuote.city = "";

      $scope.locationList = [];
      filter = {};
      filter.stateName = state;
      LocationSvc.getLocationOnFilter(filter).then(function(result) {
        $scope.locationList = result;
      });
    }

    function onPrdCountryChange(country) {
      $scope.financeQuote.product.state = "";
      $scope.financeQuote.product.city = "";

      $scope.prdStateList = [];
      $scope.prdLocationList = [];
      filter = {};
      filter.country = country;
      LocationSvc.getStateHelp(filter).then(function(result) {
        $scope.prdStateList = result;
      });
    }

    function onPrdStateChange(state) {
      $scope.financeQuote.product.city = "";

      $scope.prdLocationList = [];
      filter = {};
      filter.stateName = state;
      LocationSvc.getLocationOnFilter(filter).then(function(result) {
        $scope.prdLocationList = result;
      });
    }

    function onCategoryChange(categoryName) {
      $scope.brandList = [];
      $scope.modelList = [];
      $scope.financeQuote.product.brand = "";
      $scope.financeQuote.product.model = "";
      if (!categoryName)
        return;
      var filter = {};
      filter['categoryName'] = categoryName;
      brandSvc.getBrandOnFilter(filter)
        .then(function(result) {
          $scope.brandList = result;

        })
        .catch(function(res) {
          console.log("error in fetching brand", res);
        })
    }

    function onBrandChange(brandName) {
      $scope.modelList = [];
      $scope.financeQuote.product.model = "";
      if (!brandName)
        return;
      var filter = {};
      filter['brandName'] = brandName;
      modelSvc.getModelOnFilter(filter)
        .then(function(result) {
          $scope.modelList = result;
        })
        .catch(function(res) {
          console.log("error in fetching model", res);
        })
    }

    init();

    function addFinanceQuote(evt) {
      var ret = false;
      if ($scope.financeQuote.country && $scope.financeQuote.mobile) {
        var value = UtilSvc.validateMobile($scope.financeQuote.country, $scope.financeQuote.mobile);
        if (!value) {
          $scope.form.mobile.$invalid = true;
          ret = true;
        } else {
          $scope.form.mobile.$invalid = false;
          ret = false;
        }
      }

      if ($scope.form.$invalid || ret) {
        $scope.form.submitted = true;
        return;
      }

      $scope.financeService.type = "finance";
      $scope.financeService.quote = $scope.financeQuote;
      $http.post('/api/services', $scope.financeService).then(function(res) {
          var data = {};
          data['to'] = supportMail;
          data['subject'] = 'Request for a Quote: Finance';
          $scope.financeService.serverPath = serverPath;
          notificationSvc.sendNotification('enquiriesQuoteFinanceEmailToAdmin', data, $scope.financeService.quote, 'email');

          data['to'] = $scope.financeService.quote.email || "";
          data['subject'] = 'No reply: Request a Quote';
          notificationSvc.sendNotification('enquiriesQuoteServicesEmailToCustomer', data, {
            serverPath: serverPath
          }, 'email');
          $scope.financeQuote = {};
          $scope.financeQuote.product = {};
          setUserData();
          $scope.form.submitted = false;
          Modal.alert(informationMessage.productQuoteSuccess, true);
          //Google and Facbook conversion start
          MarketingSvc.googleConversion();
          if (!facebookConversionSent) {
            MarketingSvc.facebookConversion();
            facebookConversionSent = true;
          }
          //Google and Facbook conversion end
        })
        .catch(function(res) {
          //error handling
        });
    }

    function resetClick() {
      $scope.financeQuote = {};
      $scope.financeQuote.product = {};
      setUserData();
    };


  }
  //CME controller
  function FinanceCmeCtrl($state, $scope, $rootScope, $http,$location, Auth,$uibModal,Modal,notificationSvc, AuctionSvc,$window) {
  
    var userId = "";
      Auth.removeCookies();
      function init(){
        if(Auth.getCurrentUser()._id)
        userId = Auth.getCurrentUser()._id;
        $http.get("/api/common/redirecttorapid?_id=" + userId)
        .then(function(res){
          $window.location.href = res.data;
          //$window.open(res.data,"_blank");
        });
      }
     Auth.isLoggedInAsync(function(loggedIn){
       init();
     })
      
  }

  //Valuation controller function
  function InsuranceCtrl($scope, $rootScope, Auth, $http, Modal, notificationSvc, LocationSvc, categorySvc, brandSvc, modelSvc, MarketingSvc, UtilSvc) {
    var facebookConversionSent = false;
    $scope.addInsuranceQuote = addInsuranceQuote;
    $scope.resetClick = resetClick;
    $scope.onCategoryChange = onCategoryChange;
    $scope.onBrandChange = onBrandChange;
    $scope.onCountryChange = onCountryChange;
    $scope.onStateChange = onStateChange;
    $scope.onPrdCountryChange = onPrdCountryChange;
    $scope.onPrdStateChange = onPrdStateChange;

    $scope.insuranceQuote = {};
    $scope.insuranceQuote.product = {};
    var insuranceService = {};
    $scope.currentYear = new Date().getFullYear();
    var filter = {};

    function init() {
      setUserData();
      /*LocationSvc.getAllLocation()
       .then(function(result){
        $scope.locationList = result;
      });*/

      categorySvc.getAllCategory()
        .then(function(result) {
          $scope.allCategory = result;
        });
    }

    function setUserData() {
      if (Auth.getCurrentUser()._id) {
        var currUser = Auth.getCurrentUser();
        $scope.insuranceQuote.fname = currUser.fname;
        $scope.insuranceQuote.mname = currUser.mname;
        $scope.insuranceQuote.lname = currUser.lname;

        $scope.insuranceQuote.mobile = currUser.mobile;
        $scope.insuranceQuote.email = currUser.email;
        $scope.insuranceQuote.phone = currUser.phone;
        $scope.insuranceQuote.country = currUser.country;
        $scope.insuranceQuote.state = currUser.state;
        $scope.insuranceQuote.city = currUser.city;
        onCountryChange(currUser.country, true);
        onStateChange(currUser.state, true);
      }
    }

    function onCountryChange(country, noChange) {
      if (!noChange) {
        $scope.insuranceQuote.state = "";
        $scope.insuranceQuote.city = "";
      }
      $scope.stateList = [];
      $scope.locationList = [];
      filter = {};
      filter.country = country;
      LocationSvc.getStateHelp(filter).then(function(result) {
        $scope.stateList = result;
      });
    }

    function onStateChange(state, noChange) {
      if (!noChange)
        $scope.insuranceQuote.city = "";

      $scope.locationList = [];
      filter = {};
      filter.stateName = state;
      LocationSvc.getLocationOnFilter(filter).then(function(result) {
        $scope.locationList = result;
      });
    }

    function onPrdCountryChange(country) {
      $scope.insuranceQuote.product.state = "";
      $scope.insuranceQuote.product.city = "";

      $scope.prdStateList = [];
      $scope.prdLocationList = [];
      filter = {};
      filter.country = country;
      LocationSvc.getStateHelp(filter).then(function(result) {
        $scope.prdStateList = result;
      });
    }

    function onPrdStateChange(state) {
      $scope.insuranceQuote.product.city = "";

      $scope.prdLocationList = [];
      filter = {};
      filter.stateName = state;
      LocationSvc.getLocationOnFilter(filter).then(function(result) {
        $scope.prdLocationList = result;
      });
    }

    function onCategoryChange(categoryName) {
      $scope.brandList = [];
      $scope.modelList = [];
      $scope.insuranceQuote.product.brand = "";
      $scope.insuranceQuote.product.model = "";
      if (!categoryName)
        return;
      var filter = {};
      filter['categoryName'] = categoryName;
      brandSvc.getBrandOnFilter(filter)
        .then(function(result) {
          $scope.brandList = result;

        })
        .catch(function(res) {
          console.log("error in fetching brand", res);
        })
    }

    function onBrandChange(brandName) {
      $scope.modelList = [];
      $scope.insuranceQuote.product.model = "";
      if (!brandName)
        return;
      var filter = {};
      filter['brandName'] = brandName;
      modelSvc.getModelOnFilter(filter)
        .then(function(result) {
          $scope.modelList = result;
        })
        .catch(function(res) {
          console.log("error in fetching model", res);
        })
    }

    init();

    function addInsuranceQuote(evt) {
      var ret = false;
      if ($scope.insuranceQuote.country && $scope.insuranceQuote.mobile) {
        var value = UtilSvc.validateMobile($scope.insuranceQuote.country, $scope.insuranceQuote.mobile);
        if (!value) {
          $scope.form.mobile.$invalid = true;
          ret = true;
        } else {
          $scope.form.mobile.$invalid = false;
          ret = false;
        }
      }

      if ($scope.form.$invalid || ret) {
        $scope.form.submitted = true;
        return;
      }

      insuranceService.type = "insurance";
      insuranceService.quote = $scope.insuranceQuote;
      $http.post('/api/services', insuranceService).then(function(res) {
          var data = {};
          data['to'] = supportMail;
          data['subject'] = 'Request for a Quote: Insurance';
          notificationSvc.sendNotification('enquiriesQuoteInsuranceEmailToAdmin', data, insuranceService.quote, 'email');

          data['to'] = insuranceService.quote.email || "";
          data['subject'] = 'No reply: Request a Quote';
          notificationSvc.sendNotification('enquiriesQuoteServicesEmailToCustomer', data, {
            serverPath: serverPath
          }, 'email');
          $scope.insuranceQuote = {};
          $scope.insuranceQuote.product = {};
          setUserData();
          $scope.form.submitted = false;
          Modal.alert(informationMessage.productQuoteSuccess, true);
          //Google and Facbook conversion start
          MarketingSvc.googleConversion();
          if (!facebookConversionSent) {
            MarketingSvc.facebookConversion();
            facebookConversionSent = true;
          }
          //Google and Facbook conversion end
        })
        .catch(function(res) {
          //error handling
        });
    }

    function resetClick() {
      $scope.valuationQuote = {};
      $scope.insuranceQuote.product = {};
      setUserData();
    };

  }

  function CetifiedByiQuippoCtrl($scope, $rootScope, Auth, $http, $log, Modal, notificationSvc, LocationSvc, UtilSvc) {
    //NJ Start: set certifiedbyiquippoStartTime
    $scope.certifiedbyiquippoStartTime = new Date();
    //End

    $scope.addCetifiedByiQuippoQuote = addCetifiedByiQuippoQuote;
    $scope.cetifiedByiQuippoQuote = {};
    $scope.cetifiedByiQuippoService = {};
    $scope.mytime = new Date();
    $scope.hstep = 1;
    $scope.mstep = 1;
    $scope.ismeridian = true;

    function init() {
      if (Auth.getCurrentUser()._id) {
        var currUser = Auth.getCurrentUser();
        $scope.cetifiedByiQuippoQuote.fname = currUser.fname;
        $scope.cetifiedByiQuippoQuote.mname = currUser.mname;
        $scope.cetifiedByiQuippoQuote.lname = currUser.lname;

        $scope.cetifiedByiQuippoQuote.mobile = currUser.mobile;
        $scope.cetifiedByiQuippoQuote.email = currUser.email;
        $scope.cetifiedByiQuippoQuote.phone = currUser.phone;
        $scope.cetifiedByiQuippoQuote.country = currUser.country;
      }

      LocationSvc.getAllLocation()
        .then(function(result) {
          $scope.locationList = result;
        });
    }

    init();

    function addCetifiedByiQuippoQuote(evt) {
      var ret = false;
      if ($scope.cetifiedByiQuippoQuote.country && $scope.cetifiedByiQuippoQuote.mobile) {
        var value = UtilSvc.validateMobile($scope.cetifiedByiQuippoQuote.country, $scope.cetifiedByiQuippoQuote.mobile);
        if (!value) {
          $scope.form.mobile.$invalid = true;
          ret = true;
        } else {
          $scope.form.mobile.$invalid = false;
          ret = false;
        }
      }

      if ($scope.cetifiedByiQuippoQuote.schedule == 'yes') {
        if (angular.isUndefined($scope.cetifiedByiQuippoQuote.scheduleDate))
          $scope.form.scheduleDate.$invalid = true;
        else
          $scope.form.scheduleDate.$invalid = false;
      }

      if ($scope.form.$invalid || ret) {
        $scope.form.submitted = true;
        return;
      }

      if (!$scope.cetifiedByiQuippoQuote.scheduledTime && $scope.cetifiedByiQuippoQuote.schedule == "yes")
        $scope.changed($scope.mytime);
      $scope.cetifiedByiQuippoService.type = "cetifiedByiQuippo";
      $scope.cetifiedByiQuippoService.quote = $scope.cetifiedByiQuippoQuote;
      $http.post('/api/services', $scope.cetifiedByiQuippoService).then(function(res) {
        //Start NJ : push certifiedbyiquippoSubmit object in GTM dataLayer
        dataLayer.push(gaMasterObject.certifiedbyiquippoSubmit);
        //NJ : set certifiedbyiquippoSubmitTime
        var certifiedbyiquippoSubmitTime = new Date();
        var timeDiff = Math.floor(((certifiedbyiquippoSubmitTime - $scope.certifiedbyiquippoStartTime) / 1000) * 1000);
        gaMasterObject.certifiedbyiquippoSubmitTime.timingValue = timeDiff;
        ga('send', gaMasterObject.certifiedbyiquippoSubmitTime);
        //End
        var data = {};
        data['to'] = supportMail;
        data['subject'] = 'Request for a Quote: Certified by iQuippo';
        $scope.cetifiedByiQuippoService.serverPath = serverPath;
        $scope.cetifiedByiQuippoService.quote.date = moment($scope.cetifiedByiQuippoService.quote.scheduleDate).format('DD/MM/YYYY');
        notificationSvc.sendNotification('enquiriesQuoteCertifiedByiQuippoEmailToAdmin', data, $scope.cetifiedByiQuippoService.quote, 'email');

        data['to'] = $scope.cetifiedByiQuippoService.quote.email;
        data['subject'] = 'No reply: Request a Quote';
        notificationSvc.sendNotification('enquiriesQuoteServicesEmailToCustomer', data, {
          serverPath: $scope.cetifiedByiQuippoService.serverPath
        }, 'email');
        $scope.cetifiedByiQuippoQuote = {};
        $scope.form.submitted = false;
        Modal.alert(informationMessage.productQuoteSuccess, true);
      }, function(res) {
        Modal.alert(res, true);
      });
    }

    function resetClick() {
      //Start NJ : push certifiedbyiquippoReset object in GTM dataLayer
      dataLayer.push(gaMasterObject.certifiedbyiquippoReset);
      //NJ : set certifiedbyiquippoResetTime
      var certifiedbyiquippoResetTime = new Date();
      var timeDiff = Math.floor(((certifiedbyiquippoResetTime - $scope.certifiedbyiquippoStartTime) / 1000) * 1000);
      gaMasterObject.certifiedbyiquippoResetTime.timingValue = timeDiff;
      ga('send', gaMasterObject.certifiedbyiquippoResetTime);
      //End
      $scope.cetifiedByiQuippoQuote = {};
    };

    $scope.changed = function(mytime) {
      if (mytime) {
        var hours = mytime.getHours();
        var minutes = mytime.getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        $scope.cetifiedByiQuippoQuote.scheduledTime = hours + ':' + minutes + ' ' + ampm;
      }
    };

    $scope.toggleMode = function() {
      $scope.isShow = !$scope.isShow;
    };
    // date picker
    $scope.today = function() {
      $scope.scheduleDate = new Date();
    };
    $scope.today();

    $scope.clear = function() {
      $scope.scheduleDate = null;
    };

    $scope.toggleMin = function() {
      $scope.minDate = $scope.minDate ? null : new Date();
    };

    $scope.toggleMin();
    $scope.maxDate = new Date(2020, 5, 22);
    $scope.minDate = new Date();

    $scope.open2 = function() {
      $scope.popup2.opened = true;
    };

    $scope.setDate = function(year, month, day) {
      $scope.scheduleDate = new Date(year, month, day);
    };

    $scope.dateOptions = {
      formatYear: 'yy',
      startingDay: 1
    };

    $scope.formats = ['dd/MM/yyyy', 'dd.MM.yyyy', 'shortDate'];
    $scope.format = $scope.formats[0];

    $scope.popup2 = {
      opened: false
    };
  }
})();