'use strict';

angular.module('sreizaoApp')
  .controller('FooterCtrl', function ($scope, $http, $location, Auth,Modal, notificationSvc, subscribeSvc) {
    $scope.menu = [{
      'title': 'Home',
      'link': '/'
    }];

    $scope.isCollapsed = true;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.isAdmin = Auth.isAdmin;
    $scope.getCurrentUser = Auth.getCurrentUser;
    $scope.contact = {};
    $scope.subscribe ={};
    var path = '/api/common';

    $scope.logout = function() {
      Auth.logout();
      $location.path('/login');
    };

    $scope.isActive = function(route) {
      return route === $location.path();
    };

  $scope.createSubscribe = function(subscribe) {
    if($scope.form.$invalid){
      $scope.form.submitted = true;
      return;
    }

    var dataToSend = {};
    dataToSend['email'] = subscribe.email;
    subscribeSvc.createSubscribeUsers(subscribe).then(function(result){
      if(result && result.errorCode == 1){
        Modal.alert(result.message, true);
      } else { 
        $scope.subscribe = {};
        $scope.form.submitted = false;
/*        var data = {};
        data['to'] = supportMail;
        data['subject'] = 'Request for Subscribe';
        dataToSend['serverPath'] = serverPath;
        notificationSvc.sendNotification('subscribeEmailToAdmin', data, dataToSend,'email');
        data['to'] = dataToSend.email;
        data['subject'] = 'No reply: Subscribe request received';
        notificationSvc.sendNotification('subscribeEmailToCustomer', data, {fname:dataToSend.name},'email');*/
        Modal.alert(result.message,true);
      }      
    });
  }
});