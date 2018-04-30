(function(){

'use strict';
angular.module('sreizaoApp').controller('CallbackCtrl',CallbackCtrl);

  function CallbackCtrl($scope,$http, $uibModalInstance, notificationSvc, Modal,MarketingSvc, UtilSvc, LocationSvc, userSvc, Auth) {
    //Start > NJ:push callBackOpen object in GTM dataLayer
    dataLayer.push(gaMasterObject.callBackOpen);
    //End
    var vm = this;
    vm.callback = {};
    vm.disable = false;
    vm.sendCallback = sendCallback;
    vm.closeDialog = closeDialog;
    var facebookConversionSent = false;

    $scope.onCodeChange = function(code) {
      vm.callback.country = LocationSvc.getCountryNameByCode(code);
    } 

    function sendCallback(callback) {
      var ret = false;
      if(!vm.callback.country && vm.callback.countryCode)
        vm.callback.country = LocationSvc.getCountryNameByCode(vm.callback.countryCode);

      if(vm.callback.country && vm.callback.mobile) { 
        var value = UtilSvc.validateMobile(vm.callback.country, vm.callback.mobile);
        if(!value) {
          $scope.form.mobile.$invalid = true;
          ret = true;
        } else {
          $scope.form.mobile.$invalid = false;
          ret = false;
        }
      }
      if($scope.form.$invalid || ret){
        $scope.form.submitted = true;
        return;
      }

      var dataToSend = {};
      dataToSend['fname'] = callback.fname;
      dataToSend['mname'] = callback.mname;
      dataToSend['lname'] = callback.lname;
      dataToSend['country'] = callback.country;
      dataToSend['phone'] = callback.phone;
      dataToSend['mobile'] = callback.mobile;
      dataToSend['email'] = callback.email;
      dataToSend['comment'] = callback.comment;
      
      if(callback.customerId) {
        dataToSend['customerId'] = callback.customerId;
        callbackSave(dataToSend);
      } else {
        getCustomerId();     
      }

      function getCustomerId() {
        var userFilter = {};
        userFilter.mobile = callback.mobile;
        userSvc.getUsers(userFilter).then(function(data){
            if ( data.length ){
                dataToSend['customerId'] = data[0].customerId;
                callbackSave(dataToSend);
            }
            else {
                callbackSave(dataToSend);
            }
        });
      }
  };
  
  function callbackSave(dataToSend){
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
  }

  function closeDialog() {
    //Start > NJ :push callBackOpen object in GTM dataLayer
    dataLayer.push(gaMasterObject.callbackClose);
    //End
    $uibModalInstance.dismiss('cancel');
  };

  function init() {
    if(Auth.getCurrentUser()._id) {
        if(Auth.getCurrentUser().profileStatus == 'incomplete'){
          $state.go('myaccount');
          return;
        }
        vm.disable = true;
        vm.callback['fname'] = Auth.getCurrentUser().fname;
        vm.callback['mname'] = Auth.getCurrentUser().mname;
        vm.callback['lname'] = Auth.getCurrentUser().lname;
        vm.callback['country'] = Auth.getCurrentUser().country;
        vm.callback['phone'] = Auth.getCurrentUser().phone;
        vm.callback['mobile'] = Auth.getCurrentUser().mobile;
        vm.callback['email'] = Auth.getCurrentUser().email;
        vm.callback['customerId'] = Auth.getCurrentUser().customerId;
        vm.callback['countryCode'] = LocationSvc.getCountryCodeByName(vm.callback['country']);
    }
  }

  init()

}

})();
