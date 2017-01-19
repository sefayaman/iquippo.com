'use strict';

angular.module('sreizaoApp')
  .controller('ContactUsCtrl', function ($scope, $location, $window, $rootScope, $http,notificationSvc,Modal,MarketingSvc) {
    $scope.contact = {};
    $rootScope.searchFilter = {};
    $rootScope.equipmentSearchFilter = {};
    var facebookConversionSent = false;
    
    $scope.sendContact = function(contact) {
     if($scope.form.$invalid){
        $scope.form.submitted = true;
        return;
     }
    var dataToSend = {};
    dataToSend['name'] = contact.name;
    dataToSend['email'] = contact.email;
    dataToSend['mobile'] = contact.mobile;
    dataToSend['message'] = contact.message;
    $http.post('/api/contactus', dataToSend).success(function(result) {
        //Start > NJ :push contactUsSend object in GTM dataLayer
        dataLayer.push(gaMasterObject.contactUsSend);
        //End

        //Google and Facbook conversion start
            MarketingSvc.googleConversion();
            if(!facebookConversionSent){
                MarketingSvc.facebookConversion();
                facebookConversionSent = true;
            }
        //Google and Facbook conversion end

        $scope.contact = {};
        $scope.form.submitted = false;
        var data = {};
        data['to'] = supportMail;
        data['subject'] = 'Request for contact';
        dataToSend['serverPath'] = serverPath;
        notificationSvc.sendNotification('contactusEmailToAdmin',data,dataToSend,'email');
        data['to'] = dataToSend.email;
        data['subject'] = 'No reply: contact request received';
        notificationSvc.sendNotification('contactusEmailToCustomer',data,{fname:dataToSend.name},'email');
        Modal.alert(informationMessage.contactUsSuccess,true);
    }).error(function(res){
        Modal.alert(res);
    });
  };

});
