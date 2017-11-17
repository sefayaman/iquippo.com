'use strict';

angular.module('sreizaoApp')
  .controller('FooterCtrl', function ($scope, $rootScope, $http, $location, $uibModal, Auth,Modal, notificationSvc, subscribeSvc,MarketingSvc) {
    $scope.menu = [{
      'title': 'Home',
      'link': '/'
    }];
    var facebookConversionSent = false;
    $scope.isCollapsed = true;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.isAdmin = Auth.isAdmin;
    $scope.getCurrentUser = Auth.getCurrentUser;
    $scope.openPrintMedia = openPrintMedia;
    $scope.contact = {};
    $scope.subscribe ={};
    var path = '/api/common';

    $scope.logout = function() {
      Auth.logout();
      $location.path('/login');
    };

     function openPrintMedia(imageName) {
      var prMediaScope = $rootScope.$new();
      prMediaScope.url = $rootScope.uploadImagePrefix + $rootScope.newsEventsDir  + "/" + imageName;
      var printMediaModal = $uibModal.open({
          templateUrl: "printmedia.html",
          scope: prMediaScope
      });

      prMediaScope.close = function(){
        printMediaModal.close();
      }
    }
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
        //Google and Facbook conversion start
          MarketingSvc.googleConversion();
          if(!facebookConversionSent){
              MarketingSvc.facebookConversion();
              facebookConversionSent = true;
          }
        //Google and Facbook conversion end
      }      
    });
  }
});