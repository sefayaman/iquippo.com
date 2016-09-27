(function(){

'use strict';
angular.module('manpower').controller('ManpowerCtrl',ManpowerCtrl);

//controller function
function ManpowerCtrl($scope, $rootScope, $window,  Auth, $http, $log, Modal, $uibModal, notificationSvc, uploadSvc, LocationSvc, productSvc, ManpowerSvc) {
    var vm = this;
    vm.manpower = {};
    vm.manpowerFilter = {};
    $scope.assetsList = [];
    $scope.allManpowerUserList = [];
    vm.resetClick = resetClick;
    vm.register = register;
    vm.onChangedValue = onChangedValue;
    vm.onLocationChange = onLocationChange;
    vm.viewAllUser = viewAllUser;
    vm.getEquipmentHelp = getEquipmentHelp;
    vm.getLocationHelp = getLocationHelp;
    vm.myFunct = myFunct;
    vm.doSearch = doSearch;
    vm.login = login;
    vm.forgotPassword = forgotPassword;
    
    $scope.uploadDoc = uploadDoc;
    $scope.updateAvatar = updateAvatar;
    $scope.open1 = open1;
    $scope.loginObj = {};

    function init(){
      LocationSvc.getAllLocation()
      .then(function(result){
        $scope.locationList = result;
      });
      var dataToSend = {};
      dataToSend["status"] = true;
      ManpowerSvc.getProductOnFilter(dataToSend)
       .then(function(result){
          $scope.assetsList = result;
       });

      getAllUsers();
    }
    init();

    function getEquipmentHelp(val) {
      var serData = {};
      serData['searchStr'] = vm.manpowerFilter.equipmentSearchText;
      serData["status"] = true;
      return ManpowerSvc.getProductOnFilter(serData)
      .then(function(result){
         return result.map(function(item){
              return item;
        });
      })
    };

    function getLocationHelp(val) {
      var serData = {};
      serData['searchStr'] = vm.manpowerFilter.locationText;
     return LocationSvc.getLocationHelp(serData)
      .then(function(result){
         return result.map(function(item){
             return item.name;
        });
      });
    };

    function myFunct(keyEvent) {
      if(keyEvent)
          keyEvent.stopPropagation();
      if (keyEvent.which === 13){
        doSearch();
      }
    }

    function forgotPassword(){
      $scope.openDialog('forgotpassword');
    };

    function doSearch(){
      var filter = {};
      filter['role'] = "manpower";
      if(vm.manpowerFilter && vm.manpowerFilter.locationText)
        filter['location'] = vm.manpowerFilter.locationText;
      else
        delete vm.manpowerFilter.locationText;
      if(vm.manpowerFilter && vm.manpowerFilter.equipmentSearchText)
        filter['searchStr'] = vm.manpowerFilter.equipmentSearchText;
      else
        delete vm.manpowerFilter.equipmentSearchText;
      ManpowerSvc.getManpowerUserOnFilter(filter).then(function(result){
        $scope.allManpowerUserList = result;
      })
      .catch(function(){
        //error handling
      });
    }

    function validateCategory(){
      var ret = false;
      for(var i =0; i < vm.assetsList.length ; i++){
        if(vm.assetsList[i] == vm.manpowerFilter.equipmentSearchText){
          ret  = true;
          break;
        }
      }
      return ret;
    }

    function getAllUsers(){
      var filter = {};
      ManpowerSvc.getManpowerUserOnFilter(filter).then(function(result){
        $scope.allManpowerUserList = result;
      });
    }

    function onLocationChange(city){
      vm.manpower.state = LocationSvc.getStateByCity(city);
    }
    
    function onChangedValue(selectedAssets){
      $scope.selectedAssetsArr = [];
      if (angular.isUndefined(selectedAssets)){
        return;
       }
        angular.forEach(selectedAssets, function (val) {  
         $scope.selectedAssetsArr.push(val);  
       });
      };

    function register(form) {

      var ret = false;
    
      if(!$scope.selectedAssetsArr){
        form.selectedAssets.$invalid = true;
      } else {
        form.selectedAssets.$invalid = false;
      }
      if(!vm.manpower.resumeDoc){
        Modal.alert("Please upload resume.",true);
        return;
      }
      if(form.$invalid || ret){
        $scope.submitted = true;
        return;
      }
      vm.manpower.assetOperated = $scope.selectedAssetsArr;
      //vm.manpower.role = "manpower";
      /*adding manpower info */
      var dataToSend = {};
      if(vm.manpower.email) 
        dataToSend['email'] = vm.manpower.email;
      if(vm.manpower.mobile) 
        dataToSend['mobile'] = vm.manpower.mobile;

      Auth.validateSignup(dataToSend).then(function(data){
          if(data.errorCode == 1){
             Modal.alert("Mobile number already in use. Please use another mobile number",true);
             return;
          }else if(data.errorCode == 2){
            Modal.alert("Email address already in use. Please use another email address",true);
             return;
          }else{
            saveNewManpowerUser();
          }
        });
    }

    function saveNewManpowerUser(){
      vm.manpower.isManpower =  true;    
      ManpowerSvc.createUser(vm.manpower).then(function(result) {
        vm.manpower.user = {};
        if(result && result._id)
          vm.manpower.user.userId = result._id;
        ManpowerSvc.createManpower(vm.manpower).then(function(result){
        Modal.alert("You have registered successfully");
        var data = {};
        if(vm.manpower.mobile)
          data['to'] = vm.manpower.mobile;
        data['subject'] = 'New User Registration: Success';
        var dataToSend = {};
        dataToSend['fname'] = vm.manpower.fname; 
        dataToSend['lname'] = vm.manpower.lname;
        dataToSend['serverPath'] = serverPath;
        notificationSvc.sendNotification('manpowerRegSmsToUser', data, dataToSend,'sms');
        if(vm.manpower.email) {
          data['to'] = vm.manpower.email;
          notificationSvc.sendNotification('userRegEmail', data, dataToSend,'email');
        }
        //Start NJ : push manpowerSubmit object in GTM dataLayer
        dataLayer.push(gaMasterObject.manpowerSubmit);
        //NJ : set manpowerSubmitTime
        var manpowerSubmitTime = new Date();
        var timeDiff = Math.floor(((manpowerSubmitTime - $scope.manpowerStartTime)/1000)*1000);
        gaMasterObject.manpowerSubmitTime.timingValue = timeDiff;
        ga('send', gaMasterObject.manpowerSubmitTime);
        //End
        getAllUsers();
        vm.manpower = {};
        $scope.submitted = false;
        $scope.selectedAssetsArr = [];
        });
      });
    }

    function viewAllUser(){ 
          var viewAllScope = $rootScope.$new();
          var viewAllUser = [];
          angular.copy($scope.allManpowerUserList, viewAllUser);
          
          viewAllScope.allUsers = viewAllUser;
          var viewAllUserModal = $uibModal.open({
              templateUrl: "viewAllUserProfile.html",
              scope: viewAllScope,
              size: 'lg'
          });
          viewAllScope.close = function(){
            viewAllUserModal.close();
          }
     }

    function resetClick() {
      //Start NJ : push manpowerReset object in GTM dataLayer
      dataLayer.push(gaMasterObject.manpowerReset);
      //NJ : set manpowerResetTime
      var manpowerResetTime = new Date();
      var timeDiff = Math.floor(((manpowerResetTime - $scope.manpowerStartTime)/1000)*1000);
      gaMasterObject.manpowerResetTime.timingValue = timeDiff;
      ga('send', gaMasterObject.manpowerResetTime);
      //End
      vm.manpower = {};
      $scope.selectedAssetsArr = [];
    }

    function updateAvatar(files){
      if(files.length == 0)
        return;
      uploadSvc.upload(files[0], avatarDir).then(function(result){
      	vm.manpower.imgsrc = result.data.filename;
      	});
    }

    function uploadDoc(files){
      if(files.length == 0)
        return;

      uploadSvc.upload(files[0], manpowerDir).then(function(result){
        vm.manpower.docDir = result.data.assetDir;
        vm.manpower.resumeDoc = result.data.filename;
        });
        
    }
    
    $scope.errors = {};
    function login(form) {
      $scope.submitted = true;
      var dataToSend = {};
      dataToSend['userId'] = $scope.loginObj.userId;
      dataToSend['password'] = $scope.loginObj.password;
      dataToSend['isManpower'] = true;
      if(form.$valid) {
        Auth.login(dataToSend)
        .then( function() {
          $scope.loginObj = {};

          /*Loading cart and other data if user is logged in*/
          $rootScope.loading = true;
         Auth.isLoggedInAsync(function(loggedIn){
           $rootScope.loading = false;
           if(loggedIn){
               if(Auth.getCurrentUser()._id){
                 //NJ: set currentUser id in sessionStorage and pass into GTM
                  $window.sessionStorage.currentUser = Auth.getCurrentUser()._id;
                  dataLayer.push({'userID': $window.sessionStorage.currentUser});
                 //cartSvc.getCartData(Auth.getCurrentUser()._id);
              }
              if(Auth.postLoginCallback)
                  Auth.postLoginCallback();

           }
         });

        })
        .catch( function(err) {
          $scope.errors.other = err.message;
        });
      }
    };

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

  function open1() {
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


})();
