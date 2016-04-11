'use strict';

angular.module('sreizaoApp')
  .controller('QuoteRequestCtrl', function ($scope, $location, $window, $rootScope,groupSvc,categorySvc,SubCategorySvc,LocationSvc, $http, $uibModalInstance, notificationSvc, Modal) {
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
      dataToSend['category']= quote.catName; 
      dataToSend['subcategory']= quote.subcategory; 
      dataToSend['brand']= quote.brand; 
      dataToSend['model']= quote.model; 
      dataToSend['expPrice']= quote.expPrice; 
      dataToSend['city']= quote.city;
      dataToSend['agree']= quote.agree; 

      dataToSend['comment']= quote.comment;
      $http.post('/api/quote',dataToSend).success(function(result) {
        $scope.closeDialog();
        $scope.quote = {};
        $scope.form.submitted = false;
        Modal.alert(informationMessage.quoteSuccess,true);
        dataToSend['serverPath']= serverPath;
        var data = {};
        data['to'] = supportMail;
        data['subject'] = 'Request for a Quote: New Product';
        notificationSvc.sendNotification('productEnquiriesRequestForQuoteToAdmin', data, dataToSend, 'email');
        data['to'] = dataToSend.email;
        data['subject'] = 'No reply: Request for a Quote received';
        notificationSvc.sendNotification('productEnquiriesRequestForQuoteToCustomer', data, {fname:dataToSend.fname, serverPath:dataToSend.serverPath},'email');
      }).error(function(res){
        Modal.alert(res,true);
      });
  };

  $scope.closeDialog = function () {
   $uibModalInstance.dismiss('cancel');
  };
});



  
