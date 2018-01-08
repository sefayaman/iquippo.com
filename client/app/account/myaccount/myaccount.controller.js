(function(){

'use strict';
angular.module('account').controller('MyAccountCtrl',MyAccountCtrl);

//controller function
function MyAccountCtrl($scope,$rootScope,Auth,$state,Modal,commonSvc,LegalTypeSvc,KYCSvc,LocationSvc,userSvc,User,uploadSvc,productSvc, UtilSvc, ManpowerSvc, InvitationSvc, SubCategorySvc, categorySvc) {
    var vm = this;
    vm.editClicked = editClicked;
    vm.cancelClicked = cancelClicked;
    vm.save = save;
    $scope.updateAvatar = updateAvatar;
    vm.onCountryChange = onCountryChange;
    vm.onStateChange = onStateChange;
    
    vm.editBasicInfo = false;
    vm.editAdditionalInfo = false;
    vm.editKYCInfo = false;
    vm.editBankInfo = false;
    vm.editGstInfo = false;
    vm.editMobile = false;
    vm.edit = true;
    vm.submit = false;
    vm.verify = false;
    vm.validateAadhaar = validateAadhaar;
    vm.updateMobile = updateMobile;
    vm.verifyOtp = verifyOtp;
    $scope.legalTypeList = [];
    $scope.bankNameList = bankNameList;
    vm.addressProofList = [];
    vm.idProofList = [];
    $scope.kycInfo = {};
    $scope.kycList = [];
    $scope.type = ['Address Proof', 'Identity Proof'];
    var FIELDS_MAPPING = {
                            basicInfo:['fname','lname','email','mobile', 'aadhaarNumber','panNumber','country','state','city'],
                            AdditionalInfo:['userType','company','socialInfo','profession','jobProfile','legalType'],
                            KycInfo:['kycInfo'],
                            BankInfo:['bankInfo'],
                            GstInfo:['GSTInfo']
                        };

    function init(){
      vm.userInfo = angular.copy(Auth.getCurrentUser());
      if(vm.userInfo.bankInfo.length < 1)
        vm.userInfo.bankInfo = [{}];
      if(vm.userInfo.GSTInfo.length < 1)
        vm.userInfo.GSTInfo = [{}];
      if(vm.userInfo.kycInfo.length < 1) {
        vm.userInfo.kycInfo = [{}];
        $scope.kycInfo = {};
      }
      else {
        $scope.kycList = [];
        angular.copy(vm.userInfo.kycInfo, $scope.kycList);
        $scope.kycList.forEach(function(item){
          if(item.type == $scope.type[0]){
            $scope.kycInfo.addressProof = item.name;
            $scope.kycInfo.addressProofDocName = item.docName;
          } else if(item.type == $scope.type[1]){
            $scope.kycInfo.idProof = item.name;
            $scope.kycInfo.idProofDocName = item.docName;
          }
        });
      }
      onCountryChange(vm.userInfo.country,true);
      onStateChange(vm.userInfo.state,true);
      loadLegalTypeData();
      loadAllState();
      getKYCData();
    }

    function loadLegalTypeData() {
      LegalTypeSvc.get()
        .then(function(result){
          $scope.legalTypeList = result;
      });
    }

    function loadAllState() {
      LocationSvc.getAllState()
      .then(function(result) {
          $scope.allStateList = result;
      });
    }

    function getKYCData() {
      KYCSvc.get().then(function(result) {
        if(!result)
          return;
        
        result.forEach(function(item){
          if(item.kycType == $scope.type[0])
            vm.addressProofList[vm.addressProofList.length] = item;
          if(item.kycType == $scope.type[1])
            vm.idProofList[vm.idProofList.length] = item; 
        });
      });
    }

    function updateMobile(prop){
      vm.editMobile = false;
      vm.edit = false;
      vm.submit = false;
      vm.verify = false;
      switch (prop) {
        case 'editMobile':
            vm.userInfo.otp = "";
            vm.oldMobile = vm.userInfo.mobile;
            vm.editMobile = true;
            vm.edit = false;
            vm.submit = true;
            break;
        case 'submit':
            if(vm.userInfo.country)
              $scope.code = LocationSvc.getCountryCode(vm.userInfo.country);
            validateMobile();
            vm.submit = false;
            vm.verify = true;
            break;
        case 'reset':
            vm.edit = true;
            break;
      }
    }

    function validateMobile(){
      var dataToSend = {};
      if (vm.userInfo.mobile)
        dataToSend['mobile'] = vm.userInfo.mobile;
      Auth.validateSignup(dataToSend).then(function(data){
        if (data.errorCode == 1) {
          Modal.alert("Mobile number already in use. Please use another mobile number", true);
          return;
        } else {
          sendOTP();
        }
      });
    }

    function sendOTP() {
      var dataToSend = {};
      dataToSend['content'] = informationMessage.otpMessage;
      dataToSend['sendToClient'] = 'y';
      if(vm.userInfo.mobile){
        if ($scope.code)
          dataToSend.countryCode = $scope.code;
        dataToSend['mobile'] = vm.userInfo.mobile;
      }
      if(!dataToSend.mobile){
        Modal.alert('Please enter the mobile number', true);
        return;
      }

      commonSvc.sendOtp(dataToSend)
        .then(function(result) {
          vm.otpCode = result;
          Modal.alert('OTP has been sent successfully', true);
        })
        .catch(function(res) {
          Modal.alert("Error occured in sending OTP.Please try again.", true);
        });
    }

    function verifyOtp(form){
      if(form.$invalid){
        $scope.submitted = true;
        return;
      }
      if (!angular.isUndefined(vm.otpCode) && !angular.isUndefined(vm.userInfo.otp) && vm.otpCode == vm.userInfo.otp){
        var userData = {_id:vm.userInfo._id};
        userData.mobile = vm.userInfo.mobile;
        userData.oldMobile = vm.oldMobile;
        userData.mobileUpdate = true;
        updateUser(userData,false);
        vm.edit = true;
        vm.verify = false;
      }else{
        Modal.alert("Incorrect OTP please enter correct OTP.", true);
      }
    }

    function editClicked(prop){
      vm.editBasicInfo = false;
      vm.editAdditionalInfo = false;
      vm.editKYCInfo = false;
      vm.editBankInfo = false;
      vm.editGstInfo = false;
      if(prop === 'editBasicInfo')
        vm.editBasicInfo = true;
      if(prop === 'editAdditionalInfo')
        vm.editAdditionalInfo = true;
      if(prop === 'editKYCInfo')
        vm.editKYCInfo = true;
      if(prop === 'editBankInfo')
        vm.editBankInfo = true;
      if(prop === 'editGstInfo')
        vm.editGstInfo = true;
    }

    function cancelClicked(){
      vm.editBasicInfo = false;
      vm.editAdditionalInfo = false;
      vm.editKYCInfo = false;
      vm.editBankInfo = false;
      vm.editGstInfo = false;
      vm.userInfo = angular.copy(Auth.getCurrentUser());
      if(!vm.userInfo.bankInfo || vm.userInfo.bankInfo.length < 1)
        vm.userInfo.bankInfo = [{}];
      if(!vm.userInfo.kycInfo || vm.userInfo.kycInfo.length < 1){
        vm.userInfo.kycInfo = [{}];
        $scope.kycInfo = {};
      }
      else {
        $scope.kycList = [];
        angular.copy(vm.userInfo.kycInfo, $scope.kycList);
        $scope.kycList.forEach(function(item){
          if(item.type == $scope.type[0]){
            $scope.kycInfo.addressProof = item.name;
            $scope.kycInfo.addressProofDocName = item.docName;
          } else if(item.type == $scope.type[1]){
            $scope.kycInfo.idProof = item.name;
            $scope.kycInfo.idProofDocName = item.docName;
          }
        });
      }
      if(!vm.userInfo.GSTInfo || vm.userInfo.GSTInfo.length < 1)
        vm.userInfo.GSTInfo = [{}];
    }
    
    function validateAadhaar(aadhaarNumber) {
      if(!aadhaarNumber)
        return;

      vm.userInfo.aadhaarNumber = UtilSvc.validateAadhaar(aadhaarNumber, false);
    }

    function save(form,fieldKey){
      if(form.$invalid){
        $scope.submitted = true;
        return;
      }

      var userData = {_id:vm.userInfo._id};
      if(vm.editKYCInfo) {
        var addProofObj = {};
        if($scope.kycInfo.addressProof) {
          vm.userInfo.kycInfo = [{}];
          addProofObj.type = $scope.type[0];
          addProofObj.name = $scope.kycInfo.addressProof;
          addProofObj.isActive = false;
          if($scope.kycInfo.addressProofDocName)
           addProofObj.docName = $scope.kycInfo.addressProofDocName;
          else {
            Modal.alert("Please upload address proof document.", true);
            return;
          }
          vm.userInfo.kycInfo[vm.userInfo.kycInfo.length] = addProofObj;
        }
        var idProofObj = {};
        if($scope.kycInfo.idProof) {
          idProofObj.type = $scope.type[1];
          idProofObj.name = $scope.kycInfo.idProof;
          idProofObj.isActive = false;
          if($scope.kycInfo.idProofDocName)
           idProofObj.docName = $scope.kycInfo.idProofDocName;
          else {
            Modal.alert("Please upload ID proof document.", true);
            return;
          }
          vm.userInfo.kycInfo[vm.userInfo.kycInfo.length] = idProofObj;
        }
        vm.userInfo.kycInfo = vm.userInfo.kycInfo.filter(function(item, idx) {
          if (item && item.docName)
            return true;
          else
            return false;
        });
        if(!vm.userInfo.kycInfo || vm.userInfo.kycInfo.length < 1) {
          Modal.alert("Please upload KYC document.", true);
          return;
        }
      }

      FIELDS_MAPPING[fieldKey].forEach(function(key){
        if(vm.userInfo[key])
          userData[key] = vm.userInfo[key];
      });

      var ret = false;
      if(userData.country && userData.mobile) { 
        var value = UtilSvc.validateMobile(userData.country, userData.mobile);
        if(!value) {
          form.mobile.$invalid = true;
          ret = true;
        } 
      }

      if(userData.aadhaarNumber) {
        var validFlag = UtilSvc.validateAadhaar(userData.aadhaarNumber, true);  
        form.aadhaarNumber.$invalid = validFlag;
        ret = validFlag;
      }


      if(ret){
        $scope.submitted = true;
        return;
      }

      var dataToSend = {};
      var checkUser = false;
      if(userData.email){
        dataToSend['email'] = userData.email;
        checkUser = true;
      } 
      if(userData.mobile){
        dataToSend['mobile'] = userData.mobile;
        checkUser = true;
      }
      if(userData._id) 
        dataToSend['userid'] = userData._id;
      if(!checkUser)
        return updateUser(userData);

      Auth.validateSignup(dataToSend).then(function(data){
       if(data.errorCode != 0){
          Modal.alert(data.message,true);
           return;
        }else{
             vm.userInfo.profileStatus = 'complete';
             updateUser(userData,false);
        }
      });
    }

     function updateUser(userData,noAlert){
        $rootScope.loading = true;
       userSvc.updateUser(userData).then(function(result){
        $rootScope.loading = false;
        Auth.refreshUser(init);
        vm.editBasicInfo = false;
        vm.editAdditionalInfo = false;
        vm.editKYCInfo = false;
        vm.editBankInfo = false;
        vm.editGstInfo = false;
        if(!noAlert)
            Modal.alert("User Updated.",true);
        updateCoupon();
      })
       .catch(function(){
          $rootScope.loading = false;
       });
    }

    function updateCoupon(){
       InvitationSvc.getCouponOnId(vm.userInfo._id)
        .then(function(couponData){
          if(couponData.errorCode == 1){
            console.log("Coupon not created.");
          } else {
            var dataToSend = {}
            dataToSend = couponData;
            dataToSend.user._id = couponData.user._id;
            dataToSend.user.fname = vm.userInfo.fname;
            dataToSend.user.lname = vm.userInfo.lname;
            dataToSend.user.email = vm.userInfo.email;
            dataToSend.user.mobile = vm.userInfo.mobile;
            if(vm.userInfo.imgsrc)
              dataToSend.user.imgsrc = vm.userInfo.imgsrc;
            InvitationSvc.updateCoupon(dataToSend);
        }
      });
    }

    function updateAvatar(files, _this, type){
      if(files.length == 0)
        return;
      $rootScope.loading = true;
      uploadSvc.upload(files[0], avatarDir).then(function(result){
          $rootScope.loading = false;
          if(!type) {
            var userData = {_id:vm.userInfo._id};
            userData.imgsrc = result.data.filename;
            updateUser(userData,true);
          } else {
            if(type == 'addressProof'){
              $scope.kycInfo.addressProofDocName = result.data.filename;
            }
            if(type == 'idProof'){
                $scope.kycInfo.idProofDocName = result.data.filename;
            }
          }
        })
        .catch(function(err){
          $rootScope.loading = false;
        });
    }

    function onCountryChange(country,noChange){
      if(!noChange) {
        vm.userInfo.state = "";
        vm.userInfo.city = "";
      }
      
      $scope.stateList = [];
      $scope.locationList = [];
      var filter = {};
      filter.country = country;
      LocationSvc.getStateHelp(filter).then(function(result){
          $scope.stateList = result;
      });
    }

     function onStateChange(state,noChange){
      if(!noChange)
        vm.userInfo.city = "";
      
      $scope.locationList = [];
      var filter = {};
      filter.stateName = state;
      LocationSvc.getLocationOnFilter(filter).then(function(result){
          $scope.locationList = result;
      });
    }

    //Entry point
     Auth.isLoggedInAsync(function(loggedIn){
          if(loggedIn)
            return init();
          else
            $state.go('main');
        });
  }

})()
