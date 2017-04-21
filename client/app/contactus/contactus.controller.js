'use strict';

angular.module('sreizaoApp')
  .controller('ContactUsCtrl', function ($scope, $location, $window, $rootScope, $http, Auth, notificationSvc,Modal,MarketingSvc, LocationSvc, UtilSvc) {
    $scope.contact = {};
    $rootScope.searchFilter = {};
    $rootScope.equipmentSearchFilter = {};
    var facebookConversionSent = false;
    
    $scope.onCodeChange = function(code) {
        $scope.contact.country = LocationSvc.getCountryNameByCode(code);
    }    

    function init(){
        if(Auth.getCurrentUser()._id){
            var currUser = Auth.getCurrentUser();
            $scope.contact.name = currUser.fname + " " + currUser.lname;
            $scope.contact.mobile = currUser.mobile;
            if(currUser.email)
                $scope.contact.email = currUser.email;
            if(currUser.country)
                $scope.contact.countryCode = LocationSvc.getCountryCode(currUser.country);
        } else {
            $scope.contact = {};
        }
    }

    init();

    $scope.sendContact = function(contact) {
    var ret = false; 
    if(!$scope.contact.country && $scope.contact.countryCode)
        $scope.contact.country = LocationSvc.getCountryNameByCode($scope.contact.countryCode);

    if($scope.contact.country && $scope.contact.mobile) { 
      var value = UtilSvc.validateMobile($scope.contact.country, $scope.contact.mobile);
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
    dataToSend['name'] = contact.name;
    dataToSend['email'] = contact.email;
    dataToSend['country'] = contact.country;
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
