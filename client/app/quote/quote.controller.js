'use strict';

angular.module('sreizaoApp')
  .controller('QuoteRequestCtrl', function ($scope, $location, $window, $rootScope,groupSvc,categorySvc,SubCategorySvc,LocationSvc, $http, $uibModalInstance, notificationSvc, Modal) {
    //Start > NJ : push quickQueryOpen object in GTM data layer
    dataLayer.push(gaMasterObject.quickQueryOpen);
    //NJ: set quickQuery Start Time
    $scope.qcOpenStartTime = new Date();
    //End
    $scope.constant = gaMasterObject.quickQueryClose.eventLabel;
    $scope.currntUserInfo = {};
    $scope.quote = {};
    $scope.categoryList = [];
    if($rootScope.getCurrentUser()._id) {
      $scope.quote.fname = $rootScope.getCurrentUser().fname;
      $scope.quote.mname = $rootScope.getCurrentUser().mname;
      $scope.quote.lname = $rootScope.getCurrentUser().lname;
      $scope.quote.phone = $rootScope.getCurrentUser().phone;
      $scope.quote.mobile = $rootScope.getCurrentUser().mobile;
      $scope.quote.email = $rootScope.getCurrentUser().email;
    } else {
      $scope.quote = {}
    }

  groupSvc.getAllGroup()
  .then(function(result){
    $scope.allGroup = result;
  });

  categorySvc.getAllCategory()
    .then(function(result){
      $scope.allCategory = result;
    })


  $scope.onGroupChange = function(group){
    $scope.categoryList = [];
    categorySvc.getAllCategory()
    .then(function(result){
      $scope.categoryList = result.filter(function(d){
          return name == d.group.name;
      });
    })

  }

  SubCategorySvc.getAllSubCategory()
   .then(function(result){
    $scope.allSubcategory = result;
  });

  LocationSvc.getAllLocation()
   .then(function(result){
    $scope.locationList = result;
  });

  $scope.sendQuoteRequest = function(quote) {
      var ret = false;
      if($scope.form.$invalid || ret){
        $scope.form.submitted = true;
        return;
      }

      if(!quote.agree) {
        Modal.alert("Please Agree to the Terms & Conditions",true);
        return;
      }

      var dataToSend = {};
      dataToSend['fname'] =  quote.fname;
      dataToSend['mname']= quote.mname;
      dataToSend['lname'] = quote.lname;
      dataToSend['phone'] = quote.phone;
      dataToSend['mobile'] = quote.mobile;
      dataToSend['email']= quote.email;
      dataToSend['group']= quote.groupName;
      if(quote.catName != 'Other')
        dataToSend['category']= quote.catName;
      else
        dataToSend['category']= quote.otherCategory;
      dataToSend['subcategory']= quote.subcategory;
      dataToSend['brand']= quote.brand;
      dataToSend['model']= quote.model;
      dataToSend['expPrice']= quote.expPrice;
      dataToSend['city']= quote.city;
      dataToSend['agree']= quote.agree;

      dataToSend['comment']= quote.comment;
      $http.post('/api/quote',dataToSend).success(function(result) {
        //  Start > NJ : push quickQuerySubmit object in GTM data layer
        dataLayer.push(gaMasterObject.quickQuerySubmit);
        //NJ: set quick query Submit Time
        var qcSubmitTime = new Date();
        var timeDiff = Math.floor(((qcSubmitTime - $scope.qcOpenStartTime)/1000)*1000);
        gaMasterObject.quickQuerySubmitTime.timingValue = timeDiff;
        ga('send', gaMasterObject.quickQuerySubmitTime);
        //End
        $scope.closeDialog();
        $scope.quote = {};
        $scope.form.submitted = false;
        Modal.alert(informationMessage.quoteSuccess,true);
        dataToSend['serverPath']= serverPath;
        dataToSend['supportContact']= supportContact;
        var data = {};
        data['to'] = supportMail;
        data['subject'] = 'Request for a Quote: New Product';
        notificationSvc.sendNotification('productEnquiriesRequestForQuoteToAdmin', data, dataToSend, 'email');
        data['to'] = dataToSend.email;
        data['subject'] = 'No reply: Request for a Quote received';
        notificationSvc.sendNotification('productEnquiriesRequestForQuoteToCustomer', data, dataToSend,'email');
      }).error(function(res){
        Modal.alert(res,true);
      });
  };

  $scope.closeDialog = function () {
    //Start > NJ  : push quickQueryClose object in GTM data layer
    dataLayer.push(gaMasterObject.quickQueryClose);
    //NJ: set quick query Close Time 
    var qcCloseTime = new Date();
    var timeDiff = Math.floor(((qcCloseTime - $scope.qcOpenStartTime)/1000)*1000);
    gaMasterObject.quickQueryCloseTime.timingValue = timeDiff;
    ga('send', gaMasterObject.quickQueryCloseTime);
    //End
   $uibModalInstance.dismiss('cancel');
  };
});
