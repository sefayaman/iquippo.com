(function(){

'use strict';
angular.module('account').controller('MyAccountCtrl',MyAccountCtrl);

//controller function
function MyAccountCtrl($scope,Auth,$state,Modal,LocationSvc,userSvc,User,uploadSvc,productSvc) {
    var vm = this;
    vm.currentTab = "basic";
    vm.userInfo = {};
    vm.editOrAddClick = editOrAddClick;
    vm.cancelEditOrAdd = cancelEditOrAdd;
    vm.save=save;
    $scope.updateAvatar = updateAvatar;

    vm.editBasicInfo = false;
    vm.editPersonalInfo = false;
    vm.editProfessionalInfo = false;
    vm.editSocialInfo = false;

    var path = '/api/products';

  
    function inti(){
        LocationSvc.getAllLocation()
            .then(function(result){
            $scope.locationList = result;
        })
        var dataToSend = {};

        if(Auth.getCurrentUser().role != 'admin')
          dataToSend["userId"] = Auth.getCurrentUser()._id;
        productSvc.userWiseProductCount(dataToSend)
        .then(function(count){
          vm.count = count;
        })
        cloneUser();
        if(Auth.getCurrentUser().profileStatus == 'incomplete')
          vm.editBasicInfo = true;
    }
    inti();

    function save(form,isBasic){
      if(form && form.$invalid){
        $scope.submitted = true;
        return;
      }
      if(isBasic){
        Auth.validateSignup({email:vm.userInfo.email,mobile:vm.userInfo.mobile,userid:vm.userInfo._id}).then(function(data){
         if(data.errorCode != 0){
            Modal.alert(data.message,true);
             return;
          }else{
                vm.userInfo.profileStatus = 'complete';
               updateUser(vm.userInfo);
          }
        });
      }else{
        updateUser();
      }
      //console.log("user information",vm.userInfo)
    }

    function editOrAddClick(param){
        vm.editBasicInfo = false;
        vm.editPersonalInfo = false;
        vm.editProfessionalInfo = false;
        vm.editSocialInfo = false;
        cloneUser();
        switch(param){
          case 'basic':
            vm.editBasicInfo = true; 
          break;
          case 'personal':
          vm.editPersonalInfo = true;
          break;
          case 'professional':
           vm.editProfessionalInfo = true;
          break;
          case 'social':
              vm.editSocialInfo = true;
          break;
        }
    }

    function cancelEditOrAdd(param){
        switch(param){
          case 'basic':
            vm.editBasicInfo = false; 
          break;
          case 'personal':
          vm.editPersonalInfo = false;
          break;
          case 'professional':
           vm.editProfessionalInfo = false;
          break;
          case 'social':
              vm.editSocialInfo = false;
          break;
        }
        cloneUser();

    }

     function updateUser(noAlert){
      //console.log("user info",vm.userInfo);
       userSvc.updateUser(vm.userInfo).then(function(result){
        Auth.refreshUser();
        vm.editBasicInfo = false;
        vm.editPersonalInfo = false;
        vm.editProfessionalInfo = false;
        vm.editSocialInfo = false;
        if(!noAlert)
          Modal.alert("User Updated.",true);
      });
    }

    function updateAvatar(files){
      if(files.length == 0)
        return;
      editOrAddClick();
      uploadSvc.upload(files[0],avatarDir).then(function(result){
          vm.userInfo.imgsrc = result.data.filename;
          updateUser(true);
        });
        
    }

    function cloneUser(){
       if(Auth.getCurrentUser()._id){
        angular.copy(Auth.getCurrentUser(), vm.userInfo);
      if(!vm.userInfo.personalInfo){
          vm.userInfo.personalInfo = {};
          vm.userInfo.personalInfo.educations = [{}];
      }
      if(!vm.userInfo.professionalInfo)
        vm.userInfo.professionalInfo = {};
      if(!vm.userInfo.socialInfo)
        vm.userInfo.socialInfo = {};
      
      }else{
        $state.go("main");
      }
    }

  }

})()
