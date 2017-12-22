(function(){
'use strict';
angular.module('sreizaoApp').controller('PartnerManagementCtrl', PartnerManagementCtrl);

//controller function
function PartnerManagementCtrl($scope, DTOptionsBuilder, $rootScope, $http, Auth, User, Modal, userSvc, uploadSvc, UtilSvc, notificationSvc, vendorSvc, LocationSvc) {
  var vm = this;
	vm.vendorReg ={};
  vm.existingUser ={};
 	$scope.errors = {};
  $scope.services = [];
  vm.vendorReg.user = {};
  $scope.isEdit = false;
  $rootScope.isSuccess = false;
  $rootScope.isError = false;
  vm.existFlag = false;
  vm.register = register;
  vm.verify = verify;
  vm.onLocationChange = onLocationChange;
  vm.getServiceString = getServiceString;
  vm.updateVendorUser = updateVendorUser;
  vm.editVendorClick = editVendorClick;
  $scope.updateAvatar = updateAvatar;
  vm.resetClick = resetClick;

  $scope.dtOptions = DTOptionsBuilder.newOptions().withOption('bFilter', true).withOption('lengthChange', true);
  
  function init(){
    LocationSvc.getAllLocation()
    .then(function(result){
      $scope.locationList = result;
    });
    loadVendors();
  }

  function loadVendors(){
    vendorSvc.getAllVendors()
    .then(function(result){
      $scope.vendorList = result;
    })  
  }

  init();

  function onLocationChange(city){
    vm.vendorReg.user.state = LocationSvc.getCountryStateByCity(vm.vendorReg.user.city).state;
    vm.vendorReg.user.country = LocationSvc.getCountryStateByCity(vm.vendorReg.user.city).country;
  }

  function verify(){

    var dataToSend = {};
    vm.existFlag = false;

    if(vm.vendorReg.user.email) 
      dataToSend['email'] = vm.vendorReg.user.email;
    if(vm.vendorReg.user.mobile) 
      dataToSend['mobile'] = vm.vendorReg.user.mobile;

    vendorSvc.validate(dataToSend).then(function(data){
      if(data.errorCode == 1){
         setPartnerDate(data.user);
         return;
      } else if(data.errorCode == 2){
        setPartnerDate(data.user);
        return;
      } else {
        vm.existFlag = false;
        return;
      }
    });
  }

  function setPartnerDate(user){
    vm.existingUser = user;
    if(user) {
      if(!$scope.isEdit)
        vm.vendorReg.user.userId = user._id;
      vm.vendorReg.user.fname = user.fname;
      if(user.mname)
        vm.vendorReg.user.mname = user.mname;
      else
        delete vm.vendorReg.user.mname;
      vm.vendorReg.user.lname = user.lname;
      if(user.email)
        vm.vendorReg.user.email = user.email;
      else
        delete vm.vendorReg.user.email;
      vm.vendorReg.user.mobile = user.mobile;
      if(user.phone)
        vm.vendorReg.user.phone = user.phone;
      else
        delete vm.vendorReg.user.phone;
      if(user.city)
        vm.vendorReg.user.city = user.city;
      else
        delete vm.vendorReg.user.city;
      if(user.state)
        vm.vendorReg.user.state = user.state;
      else
        vm.vendorReg.user.state = LocationSvc.getCountryStateByCity(user.city).state;
      if(user.country)
        vm.vendorReg.user.country = user.country;
      else
        vm.vendorReg.user.country = LocationSvc.getCountryStateByCity(user.city).country;
      if(user.imgsrc)
        vm.vendorReg.user.imgsrc = user.imgsrc; 
      else
        delete vm.vendorReg.user.imgsrc; 
      vm.existFlag = true;
    }
    else
      vm.existFlag = false;
  }

  function register(form){
    var ret = false;
    if(!vm.vendorReg.user.imgsrc){
      Modal.alert("Please upload the partner logo image.",true);
      return;
    }
    if(vm.existFlag && !vm.vendorReg.user.password)
      form.password.$invalid = false;
    else if(vm.vendorReg.user.password)
      form.password.$invalid = false;
    else
      form.password.$invalid = true;
    
    if(vm.vendorReg.user.country && vm.vendorReg.user.mobile) { 
      var value = UtilSvc.validateMobile(vm.vendorReg.user.country, vm.vendorReg.user.mobile);
      if(!value) {
        form.mobile.$invalid = true;
        ret = true
      } else {
        form.mobile.$invalid = false;
        ret = false;
      }
    }

    if(form.$invalid || ret){
      $scope.submitted = true;
      return;
    }

    $scope.services =[];
    if($scope.Shipping)
      $scope.services.push($scope.Shipping);
    if($scope.Valuation)
      $scope.services.push($scope.Valuation);
    if($scope.CertifiedByIQuippo)
      $scope.services.push($scope.CertifiedByIQuippo);
    if($scope.ManPower)
      $scope.services.push($scope.ManPower);
    if($scope.Finance)
      $scope.services.push($scope.Finance);
    if($scope.Auction)
      $scope.services.push($scope.Auction);
    if($scope.Dealer)
      $scope.services.push($scope.Dealer);
    if($scope.Inspection)
      $scope.services.push($scope.Inspection);
    if($scope.Sale_Fulfilment)
      $scope.services.push($scope.Sale_Fulfilment);
    if($scope.Auction_Registration)
      $scope.services.push($scope.Auction_Registration);

    vm.vendorReg.services = $scope.services;
    if(!vm.vendorReg.user.state)
      vm.vendorReg.user.state = LocationSvc.getCountryStateByCity(vm.vendorReg.user.city).state; 

    if(!vm.vendorReg.user.country)     
      vm.vendorReg.user.country = LocationSvc.getCountryStateByCity(vm.vendorReg.user.city).country;
    setUserData(vm.vendorReg);
    
    var dataToSend = {};
    if(vm.vendorReg.user.email) 
      dataToSend['email'] = vm.vendorReg.user.email;
    if(vm.vendorReg.user.mobile) 
      dataToSend['mobile'] = vm.vendorReg.user.mobile;
    if(vm.vendorReg.user.userId && $scope.isEdit) 
      dataToSend['userid'] = vm.vendorReg.user.userId;
    dataToSend['isPartner'] = true;

    vendorSvc.validate(dataToSend).then(function(data){
    if(data.errorCode != 0){
        Modal.alert(data.message,true);
         return;
      } else {
          if(!$scope.isEdit) {
            savePartner();
          } else {
            updateVendor(vm.vendorReg);
        }
      }
    });
  }

  function resetClick(form){
    clearData();
  }

  function clearData(){
    vm.vendorReg ={};
    vm.existingUser ={};
    vm.vendorReg.user = {};
    $scope.errors = {};
    $scope.services = [];
    $scope.Shipping = "";
    $scope.Valuation = "";
    $scope.CertifiedByIQuippo = "";
    $scope.ManPower = "";
    $scope.Finance = "";
    $scope.Auction = "";
    $scope.Sale_Fulfilment = "";
    $scope.Auction_Registration = "";
    $scope.isEdit = false;
    $rootScope.isSuccess = false;
    $rootScope.isError = false;
    vm.existFlag = false;
    $scope.submitted = false;
  }

  function updateAvatar(files){
    if(files.length == 0)
      return;
    uploadSvc.upload(files[0], avatarDir).then(function(result){
      vm.vendorReg.user.imgsrc = result.data.filename;
    });
  }

  function savePartner(){
    vm.existingUser.isPartner = true;
    if(vm.existFlag) {
      userSvc.updateUser(vm.existingUser).then(function(result){
        createPartner(vm.vendorReg);
      });
    } else {
      if(vm.existingUser._id)
        delete vm.existingUser._id;
      vendorSvc.createUser(vm.existingUser).then(function(result) {
        if(result && result._id) {
          vm.vendorReg.user.userId = result._id;
        }
        createPartner(vm.vendorReg);
      });
    }   
  }

  function setUserData(userData){
    if(!vm.existFlag)
      vm.existingUser = {};
    vm.existingUser.fname = userData.user.fname;
    if(userData.user.mname)
      vm.existingUser.mname = userData.user.mname;
    vm.existingUser.lname = userData.user.lname;
    if(userData.user.email)
      vm.existingUser.email = userData.user.email;
    vm.existingUser.mobile = userData.user.mobile;
    if(userData.user.phone)
      vm.existingUser.phone = userData.user.phone;
    vm.existingUser.city = userData.user.city;
    vm.existingUser.state = userData.user.state;
    if(userData.user.country)
      vm.existingUser.country = userData.user.country;
    else
      vm.existingUser.country = LocationSvc.getCountryStateByCity(userData.user.city).country;
    vm.existingUser.imgsrc = userData.user.imgsrc;
    if(userData.user.password && !vm.existFlag)
      vm.existingUser.password = userData.user.password;
  }

  function createPartner(data){
    
    vendorSvc.createPartner(vm.vendorReg)
      .then(function(result){
        if(result && result.errorCode == 1){
        Modal.alert(result.message, true);
      } else {
          $scope.successMessage = "Partner added successfully";
          $scope.autoSuccessMessage(20);
          var data = {};
          if(vm.vendorReg.user.mobile)
          data['to'] = vm.vendorReg.user.mobile;
          data['countryCode']=LocationSvc.getCountryCode(vm.vendorReg.user.country);
          data['subject'] = 'Partner Registration: Success';
          var dataToSend = {};
          dataToSend['fname'] = vm.vendorReg.user.fname; 
          dataToSend['lname'] = vm.vendorReg.user.lname;
          if(vm.vendorReg.user.mobile)
            dataToSend['userId'] = vm.vendorReg.user.mobile;  
          dataToSend['password'] = vm.vendorReg.user.password;
          dataToSend['existFlag'] = vm.existFlag;
          dataToSend['serverPath'] = serverPath;
          notificationSvc.sendNotification('partnerRegSmsToUser', data, dataToSend,'sms');
          if(vm.vendorReg.user.email) {
            data['to'] = vm.vendorReg.user.email;
            notificationSvc.sendNotification('vendorRegEmail', data, dataToSend,'email');
          }
          clearData();
          loadVendors();
          $scope.submitted = false;
        }  
    })
    .catch(function(res){
      Modal.alert(res,true);
    })
  }
  function getServiceString(services){
    var tempArr = [];
    var serviceArr = [];

    if(!services)
      return;

    tempArr = services.split(",");
    for (var i in tempArr) {
      if(tempArr[i] == 'Shipping')
        serviceArr.push('Shipping');
      else if(tempArr[i] == 'Valuation')
        serviceArr.push('Valuation');
      else if(tempArr[i] == 'CertifiedByIQuippo')
         serviceArr.push('Certified by iQuippo');
       else if(tempArr[i] == 'ManPower')
         serviceArr.push('ManPower');
       else if(tempArr[i] == 'Finance')
         serviceArr.push('Finance');
       else if(tempArr[i] == 'Auction')
         serviceArr.push('Auction');
       else if(tempArr[i] == 'Dealer')
         serviceArr.push('Dealer');
       else if(tempArr[i] == 'Inspection')
       serviceArr.push('Inspection');
       else if(tempArr[i] == 'Sale Fulfilment')
       serviceArr.push('Sale Fulfilment');
     else if(tempArr[i] == 'Auction Registration')
       serviceArr.push('Auction Registration');
    }
    return serviceArr.join();
  }

function updateVendor(vendor) {
  vendorSvc.updateVendor(vendor).then(function(result){
    if(result && result.errorCode != 0){
      Modal.alert(result.message,true);
       return;
      } else {
        $scope.successMessage = "Partner updated successfully";
        $scope.autoSuccessMessage(5);
        clearData();
        $scope.isCollapsed = true;
        loadVendors();
      }
  })
  .catch(function(err){
    console.log("error in vendor update",err);
  });
}

 $scope.isCollapsed = true;

  function updateVendorUser(vendor){
      $rootScope.loading = true;
      vendorSvc.updateVendor(vendor).then(function(result){
        $rootScope.loading = false;
        loadVendors();
        if(result.status)
          Modal.alert("User Activated",true);
        else
          Modal.alert("User Deactivated",true);
      })
      .catch(function(err){
         console.log("error in vendor delete", err);
      });
    }

  function editVendorClick(vendor){
    $scope.isCollapsed = false;

    vm.vendorReg = vendor;
    
    $scope.Shipping = "";
    $scope.Valuation = "";
    $scope.CertifiedByIQuippo = "";
    $scope.Finance = "";
    $scope.ManPower = "";
    $scope.Auction = "";
    $scope.Dealer = "";
    for (var i=0; i< vendor.services.length; i++) {
      if(vendor.services[i] == 'Shipping')
        $scope.Shipping = vendor.services[i];
      else if(vendor.services[i] == 'Valuation')
        $scope.Valuation = vendor.services[i];
      else if(vendor.services[i] == 'CertifiedByIQuippo')
        $scope.CertifiedByIQuippo = vendor.services[i];
      else if(vendor.services[i] == 'ManPower')
        $scope.ManPower = vendor.services[i];
      else if(vendor.services[i] == 'Finance')
        $scope.Finance = vendor.services[i];
      else if(vendor.services[i] == 'Auction')
        $scope.Auction = vendor.services[i];
      else if(vendor.services[i] == 'Dealer')
        $scope.Dealer = vendor.services[i];
       else if(vendor.services[i] == 'Inspection')
        $scope.Inspection = vendor.services[i];
       else if(vendor.services[i] == 'Sale Fulfilment')
        $scope.Sale_Fulfilment = vendor.services[i];
      else if(vendor.services[i] == 'Auction Registration')
        $scope.Auction_Registration = vendor.services[i];
    }
    $scope.isEdit = true;
    vm.existFlag = true;
  }
}
})();

