'use strict';

angular.module('sreizaoApp')
  .controller('FooterCtrl', function ($scope, $http, $location, Auth,Modal, notificationSvc) {
    $scope.menu = [{
      'title': 'Home',
      'link': '/'
    }];

    $scope.isCollapsed = true;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.isAdmin = Auth.isAdmin;
    $scope.getCurrentUser = Auth.getCurrentUser;
    $scope.contact = {};

    $scope.logout = function() {
      Auth.logout();
      $location.path('/login');
    };

    $scope.isActive = function(route) {
      return route === $location.path();
    };

    $scope.sendContact = function(contact) {
      var ret = false;

      if($scope.form.$invalid || ret){
        $scope.form.submitted = true;
        return;
      }
      
        var dataToSend = {};
        dataToSend['name'] = contact.name;
        dataToSend['email'] = contact.email;
        dataToSend['mobile'] = contact.mobile;
        dataToSend['message'] = contact.message;

        $http.post('/api/contactus', dataToSend).success(function(result) {
          $scope.contact = {};
          $scope.form.submitted = false;
          var data = {};
          data['to'] = supportMail;
          data['subject'] = 'Request for contact';
          dataToSend['serverPath'] = serverPath;
          notificationSvc.sendNotification('contactusEmailToAdmin', data, dataToSend,'email');
          /*data['to'] = dataToSend['mobile'];
          notificationSvc.sendNotification('contactusSms',data,dataToSend,'sms');*/
          data['to'] = dataToSend.email;
          data['subject'] = 'No reply: contact request received';
          notificationSvc.sendNotification('contactusEmailToCustomer', data, {fname:dataToSend.name},'email');
          Modal.alert(informationMessage.contactUsSuccess,true);
          
        }).error(function(res){
          Modal.alert(res,true);
        });
  };

  })