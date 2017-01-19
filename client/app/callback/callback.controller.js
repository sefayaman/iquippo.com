(function(){

'use strict';
angular.module('sreizaoApp').controller('CallbackCtrl',CallbackCtrl);

  function CallbackCtrl($scope,$http, $uibModalInstance, notificationSvc, Modal,MarketingSvc) {
    //Start > NJ:push callBackOpen object in GTM dataLayer
    dataLayer.push(gaMasterObject.callBackOpen);
    //End
    var vm = this;
    vm.callback = {};
    vm.sendCallback = sendCallback;
    vm.closeDialog = closeDialog;
    var facebookConversionSent = false;
    function sendCallback(callback) {
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
        //Start > NJ :push callBackOpen object in GTM dataLayer
        dataLayer.push(gaMasterObject.callBackSubmit);
        //End
        closeDialog();
        vm.callback = {};
        var data = {};
        Modal.alert(informationMessage.callbackSuccess,true);
        data['to'] = supportMail;
        data['subject'] = 'Callback request';
        dataToSend['serverPath'] = serverPath;
        notificationSvc.sendNotification('callbackEmail',data,dataToSend,'email');
        data['to'] = dataToSend['email'];
        notificationSvc.sendNotification('callbackEmailToCustomer',data,dataToSend,'email');

        //Google and Facbook conversion start
            MarketingSvc.googleConversion();
            if(!facebookConversionSent){
                MarketingSvc.facebookConversion();
                facebookConversionSent = true;
            }
        //Google and Facbook conversion end

      }).error(function(res){
          Modal.alert(res,true);
      });
  };

  function closeDialog() {
    //Start > NJ :push callBackOpen object in GTM dataLayer
    dataLayer.push(gaMasterObject.callbackClose);
    //End
    $uibModalInstance.dismiss('cancel');
  };

}

})();
