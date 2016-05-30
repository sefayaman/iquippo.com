'use strict';
angular.module('sreizaoApp')
  .controller('StaticCtrl', ['$scope', '$rootScope', function($scope, $rootScope) {
    $rootScope.searchFilter = {};
    $rootScope.equipmentSearchFilter = {};
    
  }])

  .controller('ShippingCtrl', ['$scope', '$rootScope', 'Auth', '$http' , 'Modal', 'notificationSvc', 'LocationSvc', function($scope, $rootScope, Auth, $http, Modal, notificationSvc, LocationSvc) {
    $rootScope.searchFilter = {};
    $rootScope.equipmentSearchFilter = {};
    $scope.shippingService = {};
    $scope.shippingQuote = {};
    
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

    $scope.addShippingQuote = function(evt) {
      if($scope.form.$invalid){
        $scope.form.submitted = true;
        return;
      }
      $scope.shippingService.type = "shipping";
      $scope.shippingService.quote = $scope.shippingQuote;
      $http.post('/api/services', $scope.shippingService).then(function(res){
      var data = {};
      data['to'] = supportMail;
      data['subject'] = 'Request for a Quote: Shipping';
      $scope.shippingService.serverPath = serverPath;
      notificationSvc.sendNotification('enquiriesQuoteShippingEmailToAdmin', data, $scope.shippingService.quote,'email');

      data['to'] = $scope.shippingService.quote.email;
      data['subject'] = 'No reply: Request a Quote';
      notificationSvc.sendNotification('enquiriesQuoteServicesEmailToCustomer', data, {serverPath:$scope.shippingService.serverPath},'email');

      Modal.alert(informationMessage.productQuoteSuccess,true);
      },function(res){
          Modal.alert(res,true);
      });
    }

    $scope.resetClick = function () {
       $scope.shippingQuote = {};
    };
  }])
  .controller('ValuationCtrl', ['$scope', '$rootScope', 'Auth', '$http', '$log', 'Modal', 'notificationSvc', 'LocationSvc', function($scope, $rootScope, Auth, $http, $log, Modal, notificationSvc, LocationSvc) {
    $rootScope.searchFilter = {};
    $rootScope.equipmentSearchFilter = {};
    $scope.valuationQuote = {};
    $scope.valuationService = {};
    
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
    $scope.mytime = new Date();
    $scope.hstep = 1;
    $scope.mstep = 1;
    $scope.ismeridian = true;

    LocationSvc.getAllLocation()
     .then(function(result){
      $scope.locationList = result;
    });

    $scope.addValuationQuote = function(evt) {
      
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
      if(!$scope.valuationQuote.scheduledTime
        && $scope.valuationQuote.schedule == "yes")
        $scope.changed($scope.mytime);
      $scope.valuationService.type = "valuation";
      $scope.valuationService.quote = $scope.valuationQuote;
      $http.post('/api/services', $scope.valuationService).then(function(res){
      var data = {};
      data['to'] = supportMail;
      data['subject'] = 'Request for a Quote: Valuation';
      $scope.valuationService.serverPath = serverPath;
      $scope.valuationService.quote.date = moment($scope.valuationService.quote.scheduleDate).format('DD/MM/YYYY');
      notificationSvc.sendNotification('enquiriesQuoteValuationEmailToAdmin', data, $scope.valuationService.quote,'email');

      data['to'] = $scope.valuationService.quote.email;
      data['subject'] = 'No reply: Request a Quote';
      notificationSvc.sendNotification('enquiriesQuoteServicesEmailToCustomer', data, {serverPath:$scope.valuationService.serverPath},'email');

      Modal.alert(informationMessage.productQuoteSuccess,true);
      },function(res){
          Modal.alert(res,true);
      });
    }

    $scope.resetClick = function () {
       $scope.valuationQuote = {};
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
  }])

  .controller('CetifiedByiQuippoCtrl', ['$scope', '$rootScope', 'Auth', '$http', '$log', 'Modal', 'notificationSvc', 'LocationSvc', function($scope, $rootScope, Auth, $http, $log, Modal, notificationSvc, LocationSvc) {
    $rootScope.searchFilter = {};
    $rootScope.equipmentSearchFilter = {};
    $scope.cetifiedByiQuippoQuote = {};
    $scope.cetifiedByiQuippoService = {};
    $scope.mytime = new Date();
    $scope.hstep = 1;
    $scope.mstep = 1;
    $scope.ismeridian = true;

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

    $scope.addCetifiedByiQuippoQuote = function(evt) {

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
      var data = {};
      data['to'] = supportMail;
      data['subject'] = 'Request for a Quote: Certified by iQuippo';
      $scope.cetifiedByiQuippoService.serverPath = serverPath;
      $scope.cetifiedByiQuippoService.quote.date = moment($scope.cetifiedByiQuippoService.quote.scheduleDate).format('DD/MM/YYYY');
      notificationSvc.sendNotification('enquiriesQuoteCertifiedByiQuippoEmailToAdmin', data, $scope.cetifiedByiQuippoService.quote,'email');

      data['to'] = $scope.cetifiedByiQuippoService.quote.email;
      data['subject'] = 'No reply: Request a Quote';
      notificationSvc.sendNotification('enquiriesQuoteServicesEmailToCustomer', data, {serverPath:$scope.cetifiedByiQuippoService.serverPath},'email');
      
      Modal.alert(informationMessage.productQuoteSuccess,true);
      },function(res){
          Modal.alert(res,true);
      });
    }

    $scope.resetClick = function () {
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
  }])
  .controller('ManpowerCtrl', ['$scope', '$rootScope', 'Auth', '$http', '$log', 'Modal', 'notificationSvc', 'LocationSvc', function($scope, $rootScope, Auth, $http, $log, Modal, notificationSvc, LocationSvc) {
    $rootScope.searchFilter = {};
    $rootScope.equipmentSearchFilter = {};
    $scope.manpowerQuote = {};
    $scope.manpowerService = {};
    $scope.manpowerQuote.usedBy = "Operators";
    $scope.mytime = new Date();
    $scope.hstep = 1;
    $scope.mstep = 1;
    $scope.ismeridian = true;

    if(Auth.getCurrentUser()._id){
      var currUser = Auth.getCurrentUser();
      $scope.manpowerQuote.fname = currUser.fname;
      $scope.manpowerQuote.mname = currUser.mname; 
      $scope.manpowerQuote.lname = currUser.lname;
      
      $scope.manpowerQuote.mobile = currUser.mobile;
      $scope.manpowerQuote.email = currUser.email;
      $scope.manpowerQuote.phone = currUser.phone;
      $scope.manpowerQuote.country = currUser.country;
    }
    
    LocationSvc.getAllLocation()
     .then(function(result){
      $scope.locationList = result;
    });

    $scope.addManpowerQuote = function() {

      if($scope.manpowerQuote.schedule == 'yes') {
        if(angular.isUndefined($scope.manpowerQuote.scheduleDate))
          $scope.form.scheduleDate.$invalid = true;
         else 
          $scope.form.scheduleDate.$invalid = false;
      }

      if($scope.form.$invalid){
        $scope.form.submitted = true;
        return;
      }

      if(!$scope.manpowerQuote.scheduledTime 
        && $scope.manpowerQuote.schedule == "yes")
        $scope.changed($scope.mytime);
      $scope.manpowerService.type = "manpowerQuote";
      $scope.manpowerService.quote = $scope.manpowerQuote;
      $http.post('/api/services', $scope.manpowerService).then(function(res){
      var data = {};
      data['to'] = supportMail;
      data['subject'] = 'Request for a Quote: Manpower Quote';
      $scope.manpowerService.serverPath = serverPath;
      $scope.manpowerService.quote.date = moment($scope.manpowerService.quote.scheduleDate).format('DD/MM/YYYY');
      notificationSvc.sendNotification('enquiriesQuoteManpowerQuoteEmailToAdmin', data, $scope.manpowerService.quote,'email');

      data['to'] = $scope.manpowerService.quote.email;
      data['subject'] = 'No reply: Request a Quote';
      notificationSvc.sendNotification('enquiriesQuoteServicesEmailToCustomer', data, {serverPath:$scope.manpowerService.serverPath},'email');
      
      Modal.alert(informationMessage.productQuoteSuccess,true);
      $scope.manpowerQuote = {};
      $scope.manpowerQuote.usedBy = "Operators";
      },function(res){
          Modal.alert(res,true);
      });
    }

    $scope.resetClick = function () {
       $scope.manpowerQuote = {};
       $scope.manpowerQuote.usedBy = "Operators";
    };

  $scope.changed = function (mytime) {
      if(mytime) {
        var hours = mytime.getHours();
        var minutes = mytime.getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        $scope.manpowerQuote.scheduledTime = hours + ':' + minutes + ' ' + ampm;
      }
    };
  //$scope.isShow = false;
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
  }]);