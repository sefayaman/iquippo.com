(function(){
'use strict';
angular.module('sreizaoApp').controller('StaticCtrl',StaticCtrl);
angular.module('sreizaoApp').controller('ShippingCtrl',ShippingCtrl);
angular.module('sreizaoApp').controller('ValuationCtrl',ValuationCtrl);
angular.module('sreizaoApp').controller('FinanceCtrl',FinanceCtrl);
angular.module('sreizaoApp').controller('InsuranceCtrl',InsuranceCtrl);
angular.module('sreizaoApp').controller('CetifiedByiQuippoCtrl',CetifiedByiQuippoCtrl);
  
  //Controller for static pages
  function StaticCtrl($scope, $rootScope) {
          
  }

  //Shipping controller function
  function ShippingCtrl($scope, $rootScope, Auth, $http, Modal, notificationSvc, LocationSvc,MarketingSvc) {
    //NJ start:set current time
    $scope.shippingStartTime = new Date();
    //End
    var facebookConversionSent = false;
    $scope.addShippingQuote = addShippingQuote;
    $scope.resetClick = resetClick;

    $scope.shippingService = {};
    $scope.shippingQuote = {};

    function init(){
      if(Auth.getCurrentUser()._id){
        var currUser = Auth.getCurrentUser();
        $scope.shippingQuote.fname = currUser.fname;
        $scope.shippingQuote.mname = currUser.mname;
        $scope.shippingQuote.lname = currUser.lname;

        $scope.shippingQuote.mobile = currUser.mobile;
        $scope.shippingQuote.email = currUser.email;
        $scope.shippingQuote.phone = currUser.phone;
        $scope.shippingQuote.country = currUser.country;
      }

      LocationSvc.getAllLocation()
       .then(function(result){
        $scope.locationList = result;
      });
    }
    
    init();

    function addShippingQuote(evt) {

      if($scope.form.$invalid){
        $scope.form.submitted = true;
        return;
      }

      $scope.shippingService.type = "shipping";
      $scope.shippingService.quote = $scope.shippingQuote;
      $http.post('/api/services', $scope.shippingService).then(function(res){

          //Start NJ : push shippingSubmit object in GTM dataLayer
          dataLayer.push(gaMasterObject.shippingSubmit);
          //NJ : set shipping form submit time
          var shippingSubmitTime = new Date();
          var timeDiff = Math.floor(((shippingSubmitTime - $scope.shippingStartTime)/1000)*1000);
          gaMasterObject.shippingSubmitTime.timingValue = timeDiff;
          ga('send', gaMasterObject.shippingSubmitTime);
          //End

          var data = {};
          data['to'] = supportMail;
          data['subject'] = 'Request for a Quote: Shipping';
          $scope.shippingService.serverPath = serverPath;
          notificationSvc.sendNotification('enquiriesQuoteShippingEmailToAdmin', data, $scope.shippingService.quote,'email');

          data['to'] = $scope.shippingService.quote.email;
          data['subject'] = 'No reply: Request a Quote';
          notificationSvc.sendNotification('enquiriesQuoteServicesEmailToCustomer', data, {serverPath:$scope.shippingService.serverPath},'email');
          $scope.shippingQuote = {};
          $scope.form.submitted = false;
          Modal.alert(informationMessage.productQuoteSuccess,true);

          //Google and Facbook conversion start
            MarketingSvc.googleConversion();
            if(!facebookConversionSent){
                MarketingSvc.facebookConversion();
                facebookConversionSent = true;
            }
         //Google and Facbook conversion end

      })
      .catch(function(res){
          //Modal.alert("",true);
      });
    }

    function resetClick() {
        //Start NJ : push shippingReset object in GTM dataLayer
        dataLayer.push(gaMasterObject.shippingReset);
        //NJ : set shipping Reset time
        var shippingResetTime = new Date();
        var timeDiff = Math.floor(((shippingResetTime - $scope.shippingStartTime)/1000)*1000);
        gaMasterObject.shippingResetTime.timingValue = timeDiff;
        ga('send', gaMasterObject.shippingResetTime);
        //End

       $scope.shippingQuote = {};
    };
  }

  //Valuation controller function
  function ValuationCtrl($scope, $rootScope, Auth, $http, $log, Modal, notificationSvc, LocationSvc,categorySvc,brandSvc,modelSvc,MarketingSvc) {
    //NJ Start: set valuationStartTime
    $scope.valuationStartTime = new Date();
    //End
    var facebookConversionSent = false;
    $scope.addValuationQuote = addValuationQuote;
    $scope.resetClick = resetClick;
    $scope.onCategoryChange = onCategoryChange;
    $scope.onBrandChange = onBrandChange;
    $scope.onChange = onChange;

    $scope.valuationQuote = {};
    $scope.valuationQuote.product = {};
    $scope.valuationService = {};
    $scope.currentYear = new Date().getFullYear();


    function init(){
         setUser();
        $scope.mytime = new Date();
        $scope.hstep = 1;
        $scope.mstep = 1;
        $scope.ismeridian = true;

        LocationSvc.getAllLocation()
         .then(function(result){
          $scope.locationList = result;
        });

        categorySvc.getAllCategory()
        .then(function(result){
          $scope.allCategory = result;
        });
    }

    function setUser(){
       if(Auth.getCurrentUser()._id){
          var currUser = Auth.getCurrentUser();
          $scope.valuationQuote.fname = currUser.fname;
          $scope.valuationQuote.mname = currUser.mname;
          $scope.valuationQuote.lname = currUser.lname;

          $scope.valuationQuote.mobile = currUser.mobile;
          $scope.valuationQuote.email = currUser.email;
          $scope.valuationQuote.phone = currUser.phone;
          $scope.valuationQuote.country = currUser.country;
        }
    }

    function onCategoryChange(categoryName){
      $scope.brandList = [];
      $scope.modelList = [];
      $scope.valuationQuote.product.brand = "";
      $scope.valuationQuote.product.model = "";
       if(!categoryName)
        return;
      var filter = {};
      filter['categoryName'] = categoryName;
      brandSvc.getBrandOnFilter(filter)
      .then(function(result){
        $scope.brandList = result;

      })
      .catch(function(res){
        console.log("error in fetching brand",res);
      })
  }

  function onBrandChange(brandName){
    
    $scope.modelList = [];
    $scope.valuationQuote.product.model = "";
    if(!brandName)
      return;
    var filter = {};
    filter['brandName'] = brandName;
    modelSvc.getModelOnFilter(filter)
    .then(function(result){
      $scope.modelList = result;
    })
    .catch(function(res){
      console.log("error in fetching model",res);
    })

  }

    init();

    function onChange(val){
      if(val == 'contactPerson') {
        if($scope.valuationQuote.product.contactPersonAsAbove)
          $scope.valuationQuote.product.contactPerson = $scope.valuationQuote.fname + " " + $scope.valuationQuote.lname;
        else
          $scope.valuationQuote.product.contactPerson = "";
      }
      if(val == 'contactNumber') {
        if($scope.valuationQuote.product.contactNumberAsAbove)
          $scope.valuationQuote.product.contactNumber = $scope.valuationQuote.mobile;
        else
          $scope.valuationQuote.product.contactNumber = "";
      }
    }

    function addValuationQuote(evt) {

      if($scope.valuationQuote.schedule == 'yes') {
        if(angular.isUndefined($scope.valuationQuote.scheduleDate))
          $scope.form.scheduleDate.$invalid = true;
         else
          $scope.form.scheduleDate.$invalid = false;
      }

      if($scope.form.$invalid){
        $scope.form.submitted = true;
        return;
      }

      if($scope.valuationQuote.product.contactPersonAsAbove)
        $scope.valuationQuote.product.contactPerson = $scope.valuationQuote.fname + " " + $scope.valuationQuote.lname;

     if($scope.valuationQuote.product.contactNumberAsAbove)
        $scope.valuationQuote.product.contactNumber = $scope.valuationQuote.mobile;

      if(!$scope.valuationQuote.scheduledTime
        && $scope.valuationQuote.schedule == "yes")
        $scope.changed($scope.mytime);
      $scope.valuationService.type = "valuation";
      $scope.valuationService.quote = $scope.valuationQuote;
      $http.post('/api/services', $scope.valuationService).then(function(res){
      //Start NJ : push valuationSubmit object in GTM dataLayer
      dataLayer.push(gaMasterObject.valuationSubmit);
      //NJ : set valuationSubmit time
      var valuationSubmitTime = new Date();
      var timeDiff = Math.floor(((valuationSubmitTime - $scope.valuationStartTime)/1000)*1000);
      gaMasterObject.valuationSubmitTime.timingValue = timeDiff;
      ga('send', gaMasterObject.valuationSubmitTime);
      //End
      var data = {};
      data['to'] = supportMail;
      data['subject'] = 'Request for a Quote: Valuation';
      $scope.valuationService.serverPath = serverPath;
      $scope.valuationService.quote.date = moment($scope.valuationService.quote.scheduleDate).format('DD/MM/YYYY');
      notificationSvc.sendNotification('enquiriesQuoteValuationEmailToAdmin', data, $scope.valuationService.quote,'email');

      data['to'] = $scope.valuationService.quote.email;
      data['subject'] = 'No reply: Request a Quote';
      notificationSvc.sendNotification('enquiriesQuoteServicesEmailToCustomer', data, {serverPath:$scope.valuationService.serverPath},'email');
      $scope.valuationQuote = {};
       $scope.valuationQuote.product = {};
        setUser();
      $scope.form.submitted = false;
      Modal.alert(informationMessage.productQuoteSuccess,true);
      //Google and Facbook conversion start
          MarketingSvc.googleConversion();
          if(!facebookConversionSent){
              MarketingSvc.facebookConversion();
              facebookConversionSent = true;
          }
      //Google and Facbook conversion end
      },function(res){
          Modal.alert(res,true);
      });
    }

    function resetClick() {
      //Start NJ : push valuationReset object in GTM dataLayer
      dataLayer.push(gaMasterObject.valuationReset);
      //NJ : set valuationResetTime
      var valuationResetTime = new Date();
      var timeDiff = Math.floor(((valuationResetTime - $scope.valuationStartTime)/1000)*1000);
      gaMasterObject.valuationResetTime.timingValue = timeDiff;
      ga('send', gaMasterObject.valuationResetTime);
      //End
       $scope.valuationQuote = {};
        $scope.valuationQuote.product = {};
         setUser();
    };

    $scope.changed = function (mytime) {
      if(mytime) {
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
      $scope.isShow = ! $scope.isShow;
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
  function FinanceCtrl($scope, $rootScope, Auth, $http, $log, Modal, notificationSvc, LocationSvc,categorySvc,brandSvc,modelSvc,MarketingSvc) {
    var facebookConversionSent = false;
    $scope.addFinanceQuote = addFinanceQuote;
    $scope.resetClick = resetClick;
    $scope.onCategoryChange = onCategoryChange;
    $scope.onBrandChange = onBrandChange;
    $scope.currentYear = new Date().getFullYear();


    $scope.financeQuote = {};
    $scope.financeQuote.product = {};
    $scope.financeService = {};

    function init(){
        setUserData();
        LocationSvc.getAllLocation()
         .then(function(result){
          $scope.locationList = result;
        });

        categorySvc.getAllCategory()
        .then(function(result){
          $scope.allCategory = result;
        });
    }

    function setUserData(){

       if(Auth.getCurrentUser()._id){
          var currUser = Auth.getCurrentUser();
          $scope.financeQuote.fname = currUser.fname;
          $scope.financeQuote.mname = currUser.mname;
          $scope.financeQuote.lname = currUser.lname;

          $scope.financeQuote.mobile = currUser.mobile;
          $scope.financeQuote.email = currUser.email;
          $scope.financeQuote.phone = currUser.phone;
          $scope.financeQuote.country = currUser.country;
        }
    }

    function onCategoryChange(categoryName){
      $scope.brandList = [];
      $scope.modelList = [];
      $scope.financeQuote.product.brand = "";
      $scope.financeQuote.product.model = "";
       if(!categoryName)
        return;
      var filter = {};
      filter['categoryName'] = categoryName;
      brandSvc.getBrandOnFilter(filter)
      .then(function(result){
        $scope.brandList = result;

      })
      .catch(function(res){
        console.log("error in fetching brand",res);
      })
  }

  function onBrandChange(brandName){
    
    $scope.modelList = [];
    $scope.financeQuote.product.model = "";
    if(!brandName)
      return;
    var filter = {};
    filter['brandName'] = brandName;
    modelSvc.getModelOnFilter(filter)
    .then(function(result){
      $scope.modelList = result;
    })
    .catch(function(res){
      console.log("error in fetching model",res);
    })

  }

    init();

    function addFinanceQuote(evt) {

      if($scope.form.$invalid){
        $scope.form.submitted = true;
        return;
      }

      $scope.financeService.type = "finance";
      $scope.financeService.quote = $scope.financeQuote;
      $http.post('/api/services',  $scope.financeService).then(function(res){
        var data = {};
        data['to'] = supportMail;
        data['subject'] = 'Request for a Quote: Finance';
        $scope.financeService.serverPath = serverPath;
        notificationSvc.sendNotification('enquiriesQuoteFinanceEmailToAdmin', data, $scope.financeService.quote,'email');

        data['to'] = $scope.financeService.quote.email || "";
        data['subject'] = 'No reply: Request a Quote';
        notificationSvc.sendNotification('enquiriesQuoteServicesEmailToCustomer', data, {serverPath:serverPath},'email');
        $scope.financeQuote = {};
        $scope.financeQuote.product = {};
        setUserData();
        $scope.form.submitted = false;
        Modal.alert(informationMessage.productQuoteSuccess,true);
        //Google and Facbook conversion start
          MarketingSvc.googleConversion();
          if(!facebookConversionSent){
              MarketingSvc.facebookConversion();
              facebookConversionSent = true;
          }
      //Google and Facbook conversion end
      })
      .catch(function(res){
          //error handling
      });
    }

    function resetClick() {
       $scope.financeQuote = {};
       $scope.financeQuote.product = {};
       setUserData();
    };


  }
  //Valuation controller function
  function InsuranceCtrl($scope, $rootScope, Auth, $http, Modal, notificationSvc, LocationSvc,categorySvc,brandSvc,modelSvc,MarketingSvc) {
   var facebookConversionSent = false;
    $scope.addInsuranceQuote = addInsuranceQuote;
    $scope.resetClick = resetClick;
    $scope.onCategoryChange = onCategoryChange;
    $scope.onBrandChange = onBrandChange;


    $scope.insuranceQuote = {};
    $scope.insuranceQuote.product = {};
    var insuranceService = {};
    $scope.currentYear = new Date().getFullYear();

    function init(){
        setUserData();
        LocationSvc.getAllLocation()
         .then(function(result){
          $scope.locationList = result;
        });

        categorySvc.getAllCategory()
        .then(function(result){
          $scope.allCategory = result;
        });
    }

    function setUserData(){

       if(Auth.getCurrentUser()._id){
          var currUser = Auth.getCurrentUser();
          $scope.insuranceQuote.fname = currUser.fname;
          $scope.insuranceQuote.mname = currUser.mname;
          $scope.insuranceQuote.lname = currUser.lname;

          $scope.insuranceQuote.mobile = currUser.mobile;
          $scope.insuranceQuote.email = currUser.email;
          $scope.insuranceQuote.phone = currUser.phone;
          $scope.insuranceQuote.country = currUser.country;
        }
    }

    function onCategoryChange(categoryName){
      $scope.brandList = [];
      $scope.modelList = [];
      $scope.insuranceQuote.brand = "";
      $scope.insuranceQuote.model = "";
       if(!categoryName)
        return;
      var filter = {};
      filter['categoryName'] = categoryName;
      brandSvc.getBrandOnFilter(filter)
      .then(function(result){
        $scope.brandList = result;

      })
      .catch(function(res){
        console.log("error in fetching brand",res);
      })
  }

  function onBrandChange(brandName){
    
    $scope.modelList = [];
    $scope.insuranceQuote.model = "";
    if(!brandName)
      return;
    var filter = {};
    filter['brandName'] = brandName;
    modelSvc.getModelOnFilter(filter)
    .then(function(result){
      $scope.modelList = result;
    })
    .catch(function(res){
      console.log("error in fetching model",res);
    })

  }

    init();

    function addInsuranceQuote(evt) {

      if($scope.form.$invalid){
        $scope.form.submitted = true;
        return;
      }

      insuranceService.type = "insurance";
      insuranceService.quote = $scope.insuranceQuote;
      $http.post('/api/services',  insuranceService).then(function(res){
        var data = {};
        data['to'] = supportMail;
        data['subject'] = 'Request for a Quote: Insurance';
        notificationSvc.sendNotification('enquiriesQuoteInsuranceEmailToAdmin', data, insuranceService.quote,'email');

        data['to'] = insuranceService.quote.email || "";
        data['subject'] = 'No reply: Request a Quote';
        notificationSvc.sendNotification('enquiriesQuoteServicesEmailToCustomer', data, {serverPath:serverPath},'email');
        $scope.insuranceQuote = {};
        $scope.insuranceQuote.product = {};
        setUserData();
        $scope.form.submitted = false;
        Modal.alert(informationMessage.productQuoteSuccess,true);
        //Google and Facbook conversion start
          MarketingSvc.googleConversion();
          if(!facebookConversionSent){
              MarketingSvc.facebookConversion();
              facebookConversionSent = true;
          }
      //Google and Facbook conversion end
      })
      .catch(function(res){
          //error handling
      });
    }

    function resetClick() {
       $scope.valuationQuote = {};
       $scope.insuranceQuote.product = {};
       setUserData();
    };

  }

  function CetifiedByiQuippoCtrl($scope, $rootScope, Auth, $http, $log, Modal, notificationSvc, LocationSvc) {
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

    function init(){
      if(Auth.getCurrentUser()._id){
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
       .then(function(result){
        $scope.locationList = result;
      });
    }

    init();

   function addCetifiedByiQuippoQuote(evt) {

      if($scope.cetifiedByiQuippoQuote.schedule == 'yes') {
        if(angular.isUndefined($scope.cetifiedByiQuippoQuote.scheduleDate))
          $scope.form.scheduleDate.$invalid = true;
         else
          $scope.form.scheduleDate.$invalid = false;
      }

      if($scope.form.$invalid){
        $scope.form.submitted = true;
        return;
      }

      if(!$scope.cetifiedByiQuippoQuote.scheduledTime
        && $scope.cetifiedByiQuippoQuote.schedule == "yes")
        $scope.changed($scope.mytime);
      $scope.cetifiedByiQuippoService.type = "cetifiedByiQuippo";
      $scope.cetifiedByiQuippoService.quote = $scope.cetifiedByiQuippoQuote;
      $http.post('/api/services', $scope.cetifiedByiQuippoService).then(function(res){
      //Start NJ : push certifiedbyiquippoSubmit object in GTM dataLayer
      dataLayer.push(gaMasterObject.certifiedbyiquippoSubmit);
      //NJ : set certifiedbyiquippoSubmitTime
      var certifiedbyiquippoSubmitTime = new Date();
      var timeDiff = Math.floor(((certifiedbyiquippoSubmitTime - $scope.certifiedbyiquippoStartTime)/1000)*1000);
      gaMasterObject.certifiedbyiquippoSubmitTime.timingValue = timeDiff;
      ga('send', gaMasterObject.certifiedbyiquippoSubmitTime);
      //End
      var data = {};
      data['to'] = supportMail;
      data['subject'] = 'Request for a Quote: Certified by iQuippo';
      $scope.cetifiedByiQuippoService.serverPath = serverPath;
      $scope.cetifiedByiQuippoService.quote.date = moment($scope.cetifiedByiQuippoService.quote.scheduleDate).format('DD/MM/YYYY');
      notificationSvc.sendNotification('enquiriesQuoteCertifiedByiQuippoEmailToAdmin', data, $scope.cetifiedByiQuippoService.quote,'email');

      data['to'] = $scope.cetifiedByiQuippoService.quote.email;
      data['subject'] = 'No reply: Request a Quote';
      notificationSvc.sendNotification('enquiriesQuoteServicesEmailToCustomer', data, {serverPath:$scope.cetifiedByiQuippoService.serverPath},'email');
      $scope.cetifiedByiQuippoQuote = {};
      $scope.form.submitted = false;
      Modal.alert(informationMessage.productQuoteSuccess,true);
      },function(res){
          Modal.alert(res,true);
      });
    }

    function resetClick() {
      //Start NJ : push certifiedbyiquippoReset object in GTM dataLayer
      dataLayer.push(gaMasterObject.certifiedbyiquippoReset);
      //NJ : set certifiedbyiquippoResetTime
      var certifiedbyiquippoResetTime = new Date();
      var timeDiff = Math.floor(((certifiedbyiquippoResetTime - $scope.certifiedbyiquippoStartTime)/1000)*1000);
      gaMasterObject.certifiedbyiquippoResetTime.timingValue = timeDiff;
      ga('send', gaMasterObject.certifiedbyiquippoResetTime);
      //End
       $scope.cetifiedByiQuippoQuote = {};
    };

    $scope.changed = function (mytime) {
        if(mytime) {
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
        $scope.isShow = ! $scope.isShow;
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
