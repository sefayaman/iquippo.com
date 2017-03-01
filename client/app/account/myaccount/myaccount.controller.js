(function(){

'use strict';
angular.module('account').controller('MyAccountCtrl',MyAccountCtrl);

//controller function
function MyAccountCtrl($scope,Auth,$state,Modal,LocationSvc,userSvc,User,uploadSvc,productSvc, ManpowerSvc, InvitationSvc, SubCategorySvc, categorySvc) {
    var vm = this;
    vm.currentTab = "basic";
    vm.userInfo = {};
    vm.assetsList = [];
    vm.manpowerInfo = {};
    vm.editOrAddClick = editOrAddClick;
    vm.cancelEditOrAdd = cancelEditOrAdd;
    vm.save=save;
    $scope.updateAvatar = updateAvatar;
    $scope.uploadDoc = uploadDoc;
    vm.updateManpowerUser = updateManpowerUser;
    vm.onCountryChange = onCountryChange;
    vm.onLocationChange = onLocationChange;

    vm.editBasicInfo = false;
    vm.editPersonalInfo = false;
    vm.editProfessionalInfo = false;
    vm.editSocialInfo = false;
    vm.editManpowerInfo = false;
    vm.getDateFormat = getDateFormat;
    var path = '/api/products';
    $scope.docDir = "";
  
    function inti(){
      /*LocationSvc.getAllLocation()
          .then(function(result){
          $scope.locationList = result;
      });*/
      /*SubCategorySvc.getAllSubCategory()
      .then(function(result){
        result.forEach(function(item){
          vm.assetsList[vm.assetsList.length] =  item.category.name + "-" + item.name;
        });
      })*/ 
      categorySvc.getAllCategory()
       .then(function(result){
        result.forEach(function(item){
          vm.assetsList[vm.assetsList.length] = item.name;
        });
       });
        
      var dataToSend = {};

      Auth.isLoggedInAsync(function(loggedIn){
       if(loggedIn){
          if(Auth.getCurrentUser().role != 'admin')
              dataToSend["userId"] = Auth.getCurrentUser()._id;
            productSvc.userWiseProductCount(dataToSend)
            .then(function(count){
              vm.count = count;
            });

          cloneUser();
        if(Auth.getCurrentUser().profileStatus == 'incomplete')
          vm.editBasicInfo = true;
         }else{
          $state.go("main");
        }
     });
        
    }
    inti();
   
    function save(form,isBasic){
      if(form && form.$invalid){
        $scope.submitted = true;
        return;
      }
      if(isBasic){
        var dataToSend = {};
        if(vm.userInfo.email) 
          dataToSend['email'] = vm.userInfo.email;
        if(vm.userInfo.mobile) 
          dataToSend['mobile'] = vm.userInfo.mobile;
        if(vm.userInfo._id) 
          dataToSend['userid'] = vm.userInfo._id;
        Auth.validateSignup(dataToSend).then(function(data){
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
        vm.editManpowerInfo = false;
        cloneUser();
        switch(param){
          case 'basic':
            vm.editBasicInfo = true; 
          break;
          case 'personal':
          vm.editPersonalInfo = true;
          $scope.panNumber = "";
          $scope.aadhaarNumber = "";
          if(vm.userInfo.panNumber)
            $scope.panNumber = vm.userInfo.panNumber;
          if(vm.userInfo.aadhaarNumber)
            $scope.aadhaarNumber = vm.userInfo.aadhaarNumber;
          break;
          case 'professional':
           vm.editProfessionalInfo = true;
          break;
          case 'social':
              vm.editSocialInfo = true;
          break;
          case 'manpower':
              vm.editManpowerInfo = true;
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
          case 'manpower':
              vm.editManpowerInfo = false;
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
        vm.editManpowerInfo = false;
        if(!noAlert)
          Modal.alert("User Updated.",true);
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
      });
    }

    function updateManpowerUser(form){
      if(form && form.$invalid){
        $scope.submitted = true;
        return;
      }
      ManpowerSvc.updateManpower(vm.manpowerInfo).then(function(result){
        Modal.alert("User Updated.",true);
        vm.editBasicInfo = false;
        vm.editPersonalInfo = false;
        vm.editProfessionalInfo = false;
        vm.editSocialInfo = false;
        vm.editManpowerInfo = false;
      });
    }

    function getDateFormat(date) {
      if(!date)
        return;
      return moment(date).format('DD/MM/YYYY');
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

    function uploadDoc(files){
      if(files.length == 0)
        return;
      if(vm.manpowerInfo.docDir)
        $scope.docDir = vm.manpowerInfo.docDir;
      else
        $scope.docDir = manpowerDir;
      uploadSvc.upload(files[0], $scope.docDir, null, true).then(function(result){
      /*if(files[0].name.indexOf('.docx') == -1){
        Modal.alert('Please upload a valid file');
        return;
      }*/
      vm.manpowerInfo.docDir = result.data.assetDir;
      vm.manpowerInfo.resumeDoc = result.data.filename;
      });
    }

    function onCountryChange(country,noChange){
      if(!noChange)
        vm.userInfo.city = "";
      
      $scope.locationList = [];
      var filter = {};
      filter.country = country;
      LocationSvc.getLocationOnFilter(filter).then(function(result){
          $scope.locationList = result;
      });
    }

    function onLocationChange(city) {
      vm.userInfo.state = LocationSvc.getStateByCity(city);
    }

    function cloneUser(){
       if(Auth.getCurrentUser()._id){
        angular.copy(Auth.getCurrentUser(), vm.userInfo);
      onCountryChange(vm.userInfo.country, true);  
      ManpowerSvc.getManpowerDataOnUserId(Auth.getCurrentUser()._id).then(function(data){
        angular.copy(data, vm.manpowerInfo);
        if(vm.manpowerInfo.availableFrom)
          vm.manpowerInfo.availableFrom = moment(vm.manpowerInfo.availableFrom).toDate();
      });

      if(!vm.userInfo.personalInfo){
          vm.userInfo.personalInfo = {};
          
      }
      if(!vm.userInfo.personalInfo.educations)
          vm.userInfo.personalInfo.educations = [{}];
      vm.userInfo.personalInfo.educations.forEach(function(item,index){
        if(!item){
           vm.userInfo.personalInfo.educations.splice(index,1);
           vm.userInfo.personalInfo.educations.push({});
        }
      })
      if(!vm.userInfo.professionalInfo)
        vm.userInfo.professionalInfo = {};
      if(!vm.userInfo.socialInfo)
        vm.userInfo.socialInfo = {};
      if(!vm.manpowerInfo)
        vm.manpowerInfo = {};
      
      }
    }
  //date picker
  $scope.today = function() {
    $scope.availableFrom = new Date();
  };
  $scope.today();

  $scope.clear = function() {
    $scope.availableFrom = null;
  };

  $scope.toggleMin = function() {
    $scope.minDate = $scope.minDate ? null : new Date();
  };

  $scope.toggleMin();
  //$scope.maxDate = new Date(2020, 5, 22);
  $scope.minDate = new Date();

  //function open1() {
  $scope.open1 = function() {
    $scope.popup1.opened = true;
  };

   $scope.setDate = function(year, month, day) {
    $scope.availableFrom = new Date(year, month, day);
  };

  $scope.dateOptions = {
    formatYear: 'yy',
    startingDay: 1
  };

  $scope.formats = ['dd/MM/yyyy', 'dd.MM.yyyy', 'shortDate'];
  $scope.format = $scope.formats[0];

  $scope.popup1 = {
    opened: false
  };
  }

})()
