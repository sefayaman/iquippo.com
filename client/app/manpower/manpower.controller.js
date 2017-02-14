(function(){

'use strict';
angular.module('manpower').controller('ManpowerCtrl',ManpowerCtrl);

//controller function
function ManpowerCtrl($scope, $rootScope, $window,  Auth, $http, $log, Modal, $uibModal, categorySvc, notificationSvc, uploadSvc, LocationSvc, productSvc, ManpowerSvc,MarketingSvc) {
    var vm = this;
    var facebookConversionSent = false;
    vm.manpower = {};
    vm.manpowerFilter = {};
    vm.assetsList = [];
    vm.allManpowerUserList = [];
    $scope.noUserExist = false;
    vm.resetClick = resetClick;
    $scope.selectedAssetsArr = [];
    vm.register = register;
    vm.onChangedValue = onChangedValue;
    vm.onLocationChange = onLocationChange;
    vm.viewAllUser = viewAllUser;
    vm.viewUserProfile = viewUserProfile;
    //vm.getEquipmentHelp = getEquipmentHelp;
    vm.getLocationHelp = getLocationHelp;
    vm.myFunct = myFunct;
    vm.doSearch = doSearch;
    vm.onExpRangeChange = onExpRangeChange;
   

    //vm.exportExcel=exportExcel;
    //vm.login = login;
    //vm.forgotPassword = forgotPassword;
    
    $scope.uploadDoc = uploadDoc;
    $scope.updateAvatar = updateAvatar;
    $scope.open1 = open1;
    //$scope.loginObj = {};

    function init(){
      LocationSvc.getAllLocation()
      .then(function(result){
        $scope.locationList = result;
      });
      /*var dataToSend = {};
      ManpowerSvc.getCatSubCatOnFilter(dataToSend)
       .then(function(result){
        result.forEach(function(item){
          vm.assetsList[vm.assetsList.length] =  item.category.name + "-" + item.name;
        });
       }).catch(function(err){
        //Modal.alert("Error in getting list");
      });*/
      categorySvc.getAllCategory()
       .then(function(result){
        result.forEach(function(item){
          vm.assetsList[vm.assetsList.length] =  item.name + "";
        });
       }).catch(function(err){
        //Modal.alert("Error in getting list");
      });

      getAllUsers();
    }

    init();

    /*function getEquipmentHelp(val) {
      var serData = {};
      serData['searchStr'] = vm.manpowerFilter.equipmentSearchText;
      return ManpowerSvc.getCatSubCatOnFilter(serData)
      .then(function(result){
        return result.map(function(item){
          return item.category.name + "-" + item.name;;
        });
      })
    };*/

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

    /*function forgotPassword(){
      $scope.openDialog('forgotpassword');
    };*/


    function onExpRangeChange(exp){ 
      vm.manpowerFilter.experience = {};
      
      switch(exp){
        case "1": 
          vm.manpowerFilter.experience.min = 0;
          vm.manpowerFilter.experience.max = 1;
          break;
        case '3':
          vm.manpowerFilter.experience.min = 1;
          vm.manpowerFilter.experience.max = 3;
          break;
        case '5':
          vm.manpowerFilter.experience.min = 3;
          vm.manpowerFilter.experience.max = 5;
          break;
        case 'plus':
          vm.manpowerFilter.experience.min = 5;
          vm.manpowerFilter.experience.max = 'plus';
          break;
        default:
          delete vm.manpowerFilter.experience;
      }
    }

    function doSearch(){
      var filter = {};
      //filter['isManpower'] = true;
      if(vm.manpowerFilter && vm.manpowerFilter.locationText)
        filter['location'] = vm.manpowerFilter.locationText;

      else
        delete vm.manpowerFilter.locationText;
      if(vm.manpowerFilter && vm.manpowerFilter.equipmentSearchText)
        filter['searchStr'] = vm.manpowerFilter.equipmentSearchText;
      else
        delete vm.manpowerFilter.equipmentSearchText;
      if(vm.experienceValue)
        filter['experience'] = vm.manpowerFilter.experience;
      else
        delete vm.manpowerFilter.experience;
      filter['status'] = true;

      ManpowerSvc.getManpowerUserOnFilter(filter).then(function(result){
        vm.allManpowerUserList = result;
        if(result.length == 0)
          $scope.noUserExist = true;
        else
          $scope.noUserExist = false;
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
      filter['status'] = true;
      ManpowerSvc.getManpowerUserOnFilter(filter).then(function(result){
        vm.allManpowerUserList = result;
        if(result.length == 0)
          $scope.noUserExist = true;
        else
          $scope.noUserExist = false;
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
    
      /*if($scope.selectedAssetsArr.length < 1){
        form.selectedAssets.$invalid = true;
        ret = true;
      } else {
        form.selectedAssets.$invalid = false;
        ret = false;
      }*/
      /*if(!vm.manpower.resumeDoc){
        Modal.alert("Please upload resume.",true);
        return;
      }*/
      if(form.$invalid || ret){
        $scope.submitted = true;
        return;
      }
      //vm.manpower.assetOperated = $scope.selectedAssetsArr;
      //vm.manpower.role = "manpower";
      /*adding manpower info */
      if(vm.manpower.agree) {
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
      } else {
          Modal.alert("Please Agree to the Terms & Conditions", true);
      }
    }

    function setManpowerDate(user){
      vm.manpower.user.userId = user._id;
      vm.manpower.user.fname = user.fname;
      if(user.mname)
        vm.manpower.user.mname = user.mname;
      vm.manpower.user.lname = user.lname;
      if(user.email)
        vm.manpower.user.email = user.email;
      vm.manpower.user.mobile = user.mobile;
      if(user.phone)
        vm.manpower.user.phone = user.phone;
      if(user.city)
        vm.manpower.user.city = user.city;
      vm.manpower.user.state = user.state;
      vm.manpower.user.country = user.country;
      if(user.imgsrc)
        vm.manpower.user.imgsrc = user.imgsrc; 
      //if(user.password)
      vm.manpower.user.password = vm.manpower.password;
    }

    function saveNewManpowerUser(){
      vm.manpower.isManpower =  true; 
      vm.manpower.country = $rootScope.allCountries[0].name;
      vm.manpower.status =  false; 
      vm.manpower.createdBy = {
        name : 'Self'
      };

      vm.manpower.updatedBy = {
        name : 'Self'
      }

      $rootScope.loading = true; 
      ManpowerSvc.createUser(vm.manpower).then(function(result) {
        vm.manpower.user = {};
        setManpowerDate(result);
        // if(result && result._id)
        //   vm.manpower.user.userId = result._id;
        ManpowerSvc.createManpower(vm.manpower).then(function(result){
        $rootScope.loading = false;
        Modal.alert("Thank you for Registering with iQuippo.");
        var data = {};
        if(vm.manpower.mobile)
          data['to'] = vm.manpower.mobile;
        data['subject'] = 'New User Registration: Success';
        var dataToSend = {};
        dataToSend['fname'] = vm.manpower.fname; 
        dataToSend['lname'] = vm.manpower.lname;
        dataToSend['mobile'] = vm.manpower.mobile;
        dataToSend['email'] = vm.manpower.email;
        dataToSend['password'] = vm.manpower.password;
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
        //Google and Facbook conversion start
            MarketingSvc.googleConversion();
            if(!facebookConversionSent){
                MarketingSvc.facebookConversion();
                facebookConversionSent = true;
            }
        //Google and Facbook conversion end
        });
      });
    }

    function viewAllUser(){ 
      var viewAllScope = $rootScope.$new();
      var viewAllUser = [];
      angular.copy(vm.allManpowerUserList, viewAllUser);
      
      viewAllScope.allUsers = viewAllUser;
      var viewAllUserModal = $uibModal.open({
          templateUrl: "viewAllUserProfile.html",
          scope: viewAllScope,
          size: 'lg'
      });

      viewAllScope.openUserProfile = function(userData){
        viewUserProfile(userData);
      }

      viewAllScope.close = function(){
        viewAllUserModal.close();
      }
    }

     function viewUserProfile(userData){ 
      var viewUserProfileScope = $rootScope.$new();
      viewUserProfileScope.userData = userData;
      var viewUserProfileModal = $uibModal.open({
          templateUrl: "viewManpoerUserProfile.html",
          scope: viewUserProfileScope,
          size: 'lg'
      });

      viewUserProfileScope.close = function(){
        viewUserProfileModal.close();
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

      uploadSvc.upload(files[0], manpowerDir,null,true).then(function(result){
        vm.manpower.docDir = result.data.assetDir;
        vm.manpower.resumeDoc = result.data.filename;
        });
        
    }
    
    /*$scope.errors = {};
    function login(form) {
      $scope.submitted = true;
      var dataToSend = {};
      dataToSend['userId'] = $scope.loginObj.userId;
      dataToSend['password'] = $scope.loginObj.password;
      //dataToSend['isManpower'] = true;
      if(form.$valid) {
        Auth.login(dataToSend)
        .then( function() {
          $scope.loginObj = {};

          //Loading cart and other data if user is logged in*
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
    };*/

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

/* listing controller*/
angular.module('manpower').controller('ManpowerListingCtrl', ManpowerListingCtrl);
function ManpowerListingCtrl($scope, $rootScope, $window,  Auth, $http, $log, Modal, $uibModal, LocationSvc, ManpowerSvc) {
    var vm = this;
    vm.manpower = {};
    vm.allManpowerList = [];
    //pagination variables
    var prevPage = 0;
    vm.itemsPerPage = 50;
    vm.currentPage = 1;
    vm.totalItems = 0;
    vm.maxSize = 6;
    var first_id = null;
    var last_id = null;
  
    vm.fireCommand = fireCommand;
    vm.updateManpowerUser = updateManpowerUser;
    vm.exportExcel=exportExcel;

    vm.updateSelection = updateSelection;
    vm.bulkUpdate = bulkUpdate;
    var selectedIds =[];
    vm.deleteManPower = deleteManPower;
    vm.searchType = '';
    vm.showFilter = showFilter;
    vm.coulmnSearchStr = '';

    function showFilter(type)
    {
      vm.coulmnSearchStr = "";
      fireCommand(true);
    }


    function deleteManPower(manpower){
      var id = manpower._id;
      ManpowerSvc.deleteManPower(id).then(function(result){
        $rootScope.loading = false;
        //getAllUsers();
        Modal.alert(result.res,true);
        fireCommand(true);
      })
      .catch(function(err){
        console.log("error in manpower user update", err);
      });
    }

    var dataToSend = {};
    
    function init(){
      dataToSend.pagination = true;
      dataToSend.itemsPerPage = vm.itemsPerPage;
      getAllUsers(dataToSend);
    }
    init();

    function updateManpowerUser(user){
      $rootScope.loading = true;
      user.updatedBy = {userId : Auth.getCurrentUser()._id,
                        email:Auth.getCurrentUser().email,
                        name : Auth.getCurrentUser().fname +' ' + Auth.getCurrentUser().lname,
                        mobile : Auth.getCurrentUser().mobile};
      
      ManpowerSvc.updateManpower(user).then(function(result){
        $rootScope.loading = false;
        //getAllUsers();
        fireCommand(true);
        if(result.status)
          Modal.alert("User Activated",true);
        else
          Modal.alert("User Deactivated",true);
      })
      .catch(function(err){
        console.log("error in manpower user update", err);
      });
    }


    function bulkUpdate(action){
      var body = {};
      body.ids = selectedIds;
      console.log(selectedIds.join(','));
      body.status = action === 'active' ? true : false;
      body.updatedBy = {userId : Auth.getCurrentUser()._id,
                        email:Auth.getCurrentUser().email,
                        name : Auth.getCurrentUser().fname + ' ' +Auth.getCurrentUser().lname,
                        mobile : Auth.getCurrentUser().mobile};

      ManpowerSvc.bulkUpdate(body).then(function(result){
        $rootScope.loading = false;
        //getAllUsers();
        Modal.alert(result.data.res,true);
        fireCommand(true);
        
      })
      .catch(function(err){
        console.log("error in manpower user update", err);
      });
    }

    function updateSelection(event,id){
        var checkbox = event.target;
        var action = checkbox.checked?'add':'remove';
        if(action == 'add' && selectedIds.indexOf(id) == -1)
          selectedIds.push(id)
        if(action == 'remove' && selectedIds.indexOf(id) != -1)
          selectedIds.splice(selectedIds.indexOf(id),1);
     }

    function fireCommand(reset,filterObj){
      if(reset)
        resetPagination();
      var filter = {};
      if(!filterObj)
          angular.copy(dataToSend, filter);
      else
        filter = filterObj;
      if(vm.searchStr)
        filter['searchstr'] = vm.searchStr;
      if(vm.coulmnSearchStr)
        filter[vm.searchType] = vm.coulmnSearchStr;
      
      getAllUsers(filter);
    }

    function getAllUsers(filter){
      filter.prevPage = prevPage;
      filter.currentPage = vm.currentPage;
      filter.first_id = first_id;
      filter.last_id = last_id;
      selectedIds = [];
      //var filter = {};
      //filter['status'] = true;
      ManpowerSvc.getManpowerUserOnFilter(filter).then(function(result){
        //vm.allManpowerList = result;
        console.log(result.items);
        vm.allManpowerList = result.items;
        vm.totalItems = result.totalItems;
        prevPage = vm.currentPage;
        if(vm.allManpowerList.length > 0){
          first_id = vm.allManpowerList[0]._id;
          last_id = vm.allManpowerList[vm.allManpowerList.length - 1]._id;
        }
      });
    }

    function openWindow(url){
      return $window.open(url);

    }

    function resetPagination(){
      prevPage = 0;
      vm.currentPage = 1;
      vm.totalItems = 0;
      first_id = null;
      last_id = null;
    }

    function exportExcel(){
      return openWindow('/api/manpower/data/fetch.xlsx');

  }
}

})();
