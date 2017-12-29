(function(){

'use strict';
angular.module('account').controller('MyAccountCtrl',MyAccountCtrl);

//controller function
function MyAccountCtrl($scope,$rootScope,Auth,$state,Modal,LocationSvc,userSvc,User,uploadSvc,productSvc, UtilSvc, ManpowerSvc, InvitationSvc, SubCategorySvc, categorySvc) {
    var vm = this;
    vm.editClicked = editClicked;
    vm.cancelClicked = cancelClicked;
    vm.save = save;
    $scope.updateAvatar = updateAvatar;
    vm.onCountryChange = onCountryChange;
    vm.onStateChange = onStateChange;
    
    vm.editBasicInfo = false;
    vm.editAdditionalInfo = false;
    vm.validateAadhaar = validateAadhaar;
    var FIELDS_MAPPING = {
                            basicInfo:['fname','lname','email','mobile', 'aadhaarNumber','panNumber','country','state','city'],
                            AdditionalInfo:['userType','company','socialInfo','profession','jobProfile']
                        };

    function init(){
      vm.userInfo = angular.copy(Auth.getCurrentUser());
      onCountryChange(vm.userInfo.country,true);
      onStateChange(vm.userInfo.state,true);
    }

    function editClicked(prop){
      vm.editBasicInfo = false;
      vm.editAdditionalInfo = false;
      if(prop === 'editBasicInfo')
        vm.editBasicInfo = true;
      if(prop === 'editAdditionalInfo')
        vm.editAdditionalInfo = true;

    }

    function cancelClicked(){
      vm.editBasicInfo = false;
      vm.editAdditionalInfo = false;
      vm.userInfo = angular.copy(Auth.getCurrentUser());
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

    function updateAvatar(files){
      if(files.length == 0)
        return;
      $rootScope.loading = true;
      uploadSvc.upload(files[0],avatarDir).then(function(result){
          $rootScope.loading = false;
          var userData = {_id:vm.userInfo._id};
          userData.imgsrc = result.data.filename;
          updateUser(userData,true);
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
