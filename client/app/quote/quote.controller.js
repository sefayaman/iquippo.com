'use strict';

angular.module('sreizaoApp')
  .controller('QuoteRequestCtrl', function ($scope, $location, $window, $rootScope, $http, $uibModalInstance, notificationSvc, Modal) {
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

  $scope.onGroupChange = function(group){
    $scope.categoryList = [];  
    $scope.categoryList = $rootScope.allCategory.filter(function(d){
        return name == d.group.name;
    }); 
  }

/*$scope.onGroupChange = function(group){
    if(!group)
      return;
    $scope.categoryList = [];
    $scope.brandList = [];
    $scope.modelList = [];
    $scope.categoryList = $rootScope.allCategory.filter(function(d){
          return group._id == d.group._id;
    });
    $scope.equipmentSearchFilter.group = group.name;
   $scope.fireCommand();
  }*/
  
  $scope.sendQuoteRequest = function(quote) {
      var ret = false;
      if($scope.form.$invalid || ret){
        $scope.form.submitted = true;
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
      dataToSend['brand']= quote.brand; 
      dataToSend['model']= quote.model; 
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



  
