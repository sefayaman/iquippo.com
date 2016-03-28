'use strict';

angular.module('sreizaoApp')
  .controller('CallbackCtrl', function ($scope, $location, $window, $rootScope, $http, $uibModalInstance, notificationSvc, Modal) {
    $scope.callback = {};

     $scope.sendCallback = function(callback) {
      var ret = false; 
      if($scope.form.$invalid || ret){
        $scope.form.submitted = true;
        return;
      }
      
      var dataToSend = {};
      dataToSend['fname'] = callback.fname;
      dataToSend['mname'] = callback.mname;
      dataToSend['lname'] = callback.lname;
      dataToSend['phone'] = callback.phone;
      dataToSend['mobile'] = callback.mobile;
      dataToSend['email'] = callback.email;

      $http.post('/api/callback',dataToSend).success(function(result) {
        $scope.closeDialog();
        $scope.callback = {};
        var data = {};
        Modal.alert(informationMessage.callbackSuccess,true);
        data['to'] = supportMail;
        data['subject'] = 'Callback request';
        dataToSend['serverPath'] = serverPath;
        notificationSvc.sendNotification('callbackEmail',data,dataToSend,'email');
        data['to'] = dataToSend['email'];
        notificationSvc.sendNotification('callbackEmailToCustomer',data,dataToSend,'email');
      }).error(function(res){
          Modal.alert(res,true);
      });
  };

  $scope.closeDialog = function () {
   $uibModalInstance.dismiss('cancel');
  };

});



  
