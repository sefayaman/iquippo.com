'use strict';

angular.module('sreizaoApp')
  .controller('UserManagementCtrl', ['$scope', '$rootScope', 'DTOptionsBuilder','Auth','userSvc', 'Modal','$http', function ($scope, $rootScope, DTOptionsBuilder, Auth, userSvc, Modal,$http) {
   	var vm = this;
    //pagination variables
    var prevPage = 0;
    vm.itemsPerPage = 50;
    vm.currentPage = 1;
    vm.totalItems = 0;
    vm.maxSize = 6;
    var first_id = null;
    var last_id = null;

    vm.userList = [];
    //vm.globleUsers = [];
    vm.getUsersOnRole = [];
    vm.exportExcel = exportExcel;
    vm.onUserChange = onUserChange;
    vm.deleteUser = deleteUser;
    vm.updateUser = updateUser;
    vm.fireCommand = fireCommand;
    vm.getRegisteredBy = getRegisteredBy;
    vm.editUserClick = editUserClick;
    vm.openAddUserDialog = openAddUserDialog;
    
    vm.userSearchFilter = {};
    var dataToSend = {};
    vm.getProductData = getProductData;
    $scope.getConcatData = [];
    $scope.userInfo = {};
    $scope.$on('updateUserList',function(){
      fireCommand(true);
    })

    function editUserClick(userData) {
      angular.copy(userData, $scope.userInfo)
      var userScope = $rootScope.$new();
      userScope.userInfo = $scope.userInfo;
      userScope.isEdit = true;
      Modal.openDialog('adduser', userScope);
    }

    function openAddUserDialog() {
      $scope.isEdit = false;
      Modal.openDialog('adduser');
    } 

    function init(){
      Auth.isLoggedInAsync(function(loggedIn){
        if(loggedIn){
          if(Auth.isAdmin()) {
            var filter = {};
            filter.role = "channelpartner";
            userSvc.getUsers(filter).then(function(data){
            vm.getUsersOnRole = data;
            })
            .catch(function(err){
              Modal.alert("Error in geting user");
            })

            filter.role = "enterprise";
            filter.enterprise = true;
            userSvc.getUsers(filter).then(function(data){
              vm.enterprises = data;
            })
          }

          if(Auth.isChannelPartner()) {
            dataToSend["userId"] = Auth.getCurrentUser()._id;
          }

          if(Auth.isEnterprise()){
            dataToSend["enterpriseId"] = Auth.getCurrentUser().enterpriseId; 
          }

          dataToSend.pagination = true;
          dataToSend.itemsPerPage = vm.itemsPerPage;
          getUser(dataToSend);
        }
      });

    }
    init();
    
     function getUser(filter){
      filter.prevPage = prevPage;
      filter.currentPage = vm.currentPage;
      filter.first_id = first_id;
      filter.last_id = last_id;
      filter.notManpower = true;
      userSvc.getUsers(filter).then(function(result){
        getProductsCountWithUser(result);
        vm.userList  = result.users;
        vm.totalItems = result.totalItems;
        prevPage = vm.currentPage;
        if(vm.userList.length > 0){
          first_id = vm.userList[0]._id;
          last_id = vm.userList[vm.userList.length - 1]._id;
        }
      })
      .catch(function(err){
        Modal.alert("Error in geting user");
      })
    }
    function getProductData(id, type){
      if(angular.isUndefined($scope.getConcatData)) {
        if(type == "total_products")
          return 0;
        if(type == "have_products") 
            return "No";
      } else {
        var count = 0;
        $scope.getConcatData.forEach(function(data){
            if(id == data._id) 
              count = data.total_products;
          });
        if(type == "total_products") {
          if(count > 0)
            return count;
          else
            return 0;
        }
        if(type == "have_products"){
          if(count > 0)
            return "Yes";
          else
            return "No";
        }
      }
    }

    function getRegisteredBy(user){
      if(!user.createdBy)
        return user.fname + " " + user.lname + ' (Self)';

      if(user.createdBy.role == 'admin')
        return user.createdBy.fname + " " + user.createdBy.lname + ' (Admin)';
      else if(user.createdBy.role == 'channelpartner') 
        return user.createdBy.fname + " " + user.createdBy.lname + ' (Channel Partner)';
      else if(user.createdBy.role == 'enterprise')
        return user.createdBy.fname + " " + user.createdBy.lname + ' (Eneterprise)';
      else
        return user.createdBy.fname + " " + user.createdBy.lname + ' (Self)';
    }

    function getProductsCountWithUser(result){
      var filter = {};
      var userIds = [];
      result.users.forEach(function(item){
        userIds[userIds.length] = item._id;
      });
      filter.userIds = userIds;
      userSvc.getProductsCountOnUserIds(filter)
      .then(function(data){
        $scope.getConcatData = data;
        //return data;
      })
      .catch(function(){
      })
    }

    function fireCommand(reset,filterObj){
    if(reset)
      resetPagination();
    var filter = {};
    if(!filterObj)
        angular.copy(dataToSend, filter);
    else
      filter = filterObj;
    if(vm.userSearchFilter.createdBy)
      filter['userId'] = vm.userSearchFilter.createdBy;

    if(vm.userSearchFilter.searchStr)
      filter['searchstr'] = vm.userSearchFilter.searchStr;
    getUser(filter);
  }

  function resetPagination(){
     prevPage = 0;
     vm.currentPage = 1;
     vm.totalItems = 0;
     first_id = null;
     last_id = null;
  }

    function onUserChange(user){
      if(!user) {
        delete vm.userSearchFilter.createdBy;
        fireCommand(true);
        return;
      }
      
      vm.userSearchFilter.createdBy = user._id;
      fireCommand(true);
    }

     function exportExcel(){
      var dataToSend ={};
      if(Auth.getCurrentUser()._id && Auth.getCurrentUser().role == 'channelpartner') {
        dataToSend["userId"] = Auth.getCurrentUser()._id;
      }
      $http.post('/api/users/export', dataToSend)
      .then(function(res){
        var data = res.data;
        saveAs(new Blob([s2ab(data)],{type:"application/octet-stream"}), "userlist_"+ new Date().getTime() +".xlsx")
      },
      function(res){
        console.log(res)
      })
     }
    
    function deleteUser(user){
      Modal.confirm(informationMessage.deleteChannelPartnerConfirm,function(isGo){
        if(isGo == 'no')
          return;
        $rootScope.loading = true;
        userSvc.deleteUser(user._id).then(function(result){
          $rootScope.loading = false;
          fireCommand(true);
          if(result.errorCode == 0)
           Modal.alert("User deleted succesfully",true);
         else
          Modal.alert(result.message,true);
        })
        .catch(function(err){
           $rootScope.loading = false;
        });
      });
    }

    function updateUser(user){
      $rootScope.loading = true;
      userSvc.updateUser(user).then(function(result){
        $rootScope.loading = false;
        fireCommand(true);
        if(result.status)
          Modal.alert("User Activated",true);
        else
          Modal.alert("User Deactivated",true);
      })
      .catch(function(err){
        console.log("error in user update", err);
      });
    }

}])

  .controller('AddUserCtrl', ['$scope', '$rootScope','LocationSvc', '$http', 'Auth', 'Modal', 'uploadSvc', 'notificationSvc', 'userSvc', '$uibModalInstance', 'UtilSvc',
   function ($scope, $rootScope,LocationSvc, $http, Auth, Modal, uploadSvc ,notificationSvc, userSvc, $uibModalInstance, UtilSvc) {
    $scope.newUser ={};
    $scope.newUser.isOtherCountry=false;
    $scope.newUser.isOtherState=false;
    $scope.newUser.isOtherCity=false;
    $scope.errors = {};
    //$scope.editImage = false;
    //$scope.users = [];
    $rootScope.userList = [];
    $scope.locationList = [];
    $scope.enterprises = [];
    $scope.onLocationChange = onLocationChange;
    $scope.getCountryWiseState=getCountryWiseState;
    $scope.getStateWiseLocation=getStateWiseLocation;
    
    function init(){
      if($scope.isEdit) {
        angular.copy($scope.userInfo, $scope.newUser);
        if($scope.newUser.isOtherCountry == true){
          $scope.newUser.otherCountry = $scope.newUser.country;
          $scope.newUser.country = "Other"
          } else 
          getCountryWiseState($scope.newUser.country, true);

        if($scope.newUser.isOtherState == true){
          $scope.newUser.otherState = $scope.newUser.state; 
          $scope.newUser.state = "Other"
        } else 
          getStateWiseLocation($scope.newUser.state, true);
        
        if($scope.newUser.isOtherCity == true){
          $scope.newUser.otherCity = $scope.newUser.city;
          $scope.newUser.city = "Other"
        }
        $scope.headerName = "Edit User";
      }
      else {
        $scope.newUser = {};
        if(Auth.isEnterprise()){
          $scope.newUser.role = "enterprise";
          $scope.newUser.enterpriseId = Auth.getCurrentUser().enterpriseId;
        }
        $scope.headerName = "Add User";
      }
      getEnterprises();
    }

    init();

    function getEnterprises(){
      if(!Auth.isAdmin() && !Auth.isEnterprise())
        return;
      var serData = {};
      serData['status'] = true;
      serData['role'] = 'enterprise';
      serData['enterprise'] = true;
      if(Auth.isEnterprise())
        serData['enterpriseId'] = Auth.getCurrentUser().enterpriseId;
      userSvc.getUsers(serData).then(function(data){
            $scope.enterprises = data;
      });

    }

    function getCountryWiseState(country, noChange){
      if(!noChange) {
        $scope.newUser.state="";
        $scope.newUser.city="";
      }
      var filter={};
      filter.country = country;
      LocationSvc.getStateHelp(filter).then(function(result){
          $scope.stateList = result;
          $scope.locationList="";
      });
      $scope.code=LocationSvc.getCountryCode(country);
      if(country=="Other"){
        $scope.code="";
      }

  }
  function getStateWiseLocation(state,noChange){
    if(!noChange) {
      $scope.newUser.city="";
    }
     var filter={};
     filter.stateName = state;
      LocationSvc.getLocationOnFilter(filter).then(function(result){
          $scope.locationList = result;
      });
  }

    function onLocationChange(city){ 
      $scope.newUser.state = LocationSvc.getStateByCity(city);  
    }


    $scope.register = function(evt){
    var ret = false;
    if($scope.newUser.country && $scope.newUser.mobile) { 
      var value = UtilSvc.validateMobile($scope.newUser.country, $scope.newUser.mobile);
      if(!value) {
        $scope.form.mobile.$invalid = true;
        ret = true;
      } else {
        $scope.form.mobile.$invalid = false;
        ret = false;
      }
    }

    if($scope.form.$invalid || ret) {
        $scope.submitted = true;
        return;
    }

    if($scope.newUser.agree) {
      if(!$scope.isEdit) {
        var dataToSend = {};
        if($scope.newUser.email) 
          dataToSend['email'] = $scope.newUser.email;
        if($scope.newUser.mobile) 
          dataToSend['mobile'] = $scope.newUser.mobile;
        if($scope.newUser.alternateMobile) 
          dataToSend['alternateMobile']=$scope.newUser.alternateMobile;
        Auth.validateSignup(dataToSend).then(function(data){
          if(data.errorCode == 1){
             Modal.alert("Mobile number already in use. Please use another mobile number",true);
             return;
          } else if(data.errorCode == 2){
            Modal.alert("Email address already in use. Please use another email address",true);
             return;
          } else {
            saveNewUser();
          }
        });
      } else {
        updateUser();
      }
    } else {
           Modal.alert("Please Agree to the Terms & Conditions",true);
    }

    };

    function updateUser(){
      $rootScope.loading = true;
      setLocationData();
      userSvc.updateUser($scope.newUser).then(function(result){
        $rootScope.loading = false;
        $scope.closeDialog();
        Modal.alert("User updated successfully!",true);
        $scope.newUser = {};
        $rootScope.$broadcast('updateUserList');
      })
      .catch(function(err){
        console.log("error in user update", err);
      });
    }

    function setLocationData() {
      if($scope.newUser.country == "Other"){
      $scope.newUser.isOtherCountry=true;
      $scope.newUser.country=$scope.newUser.otherCountry;
    }

    if($scope.newUser.state == "Other"){
      $scope.newUser.isOtherState=true;
     $scope.newUser.state=$scope.newUser.otherState; 
    }

    
    if($scope.newUser.city == "Other"){
      $scope.newUser.isOtherCity=true;
      $scope.newUser.city=$scope.newUser.otherCity;
    }
    }
  function saveNewUser(){
     $scope.newUser.createdBy = {};
    if(Auth.getCurrentUser()._id) {
      $scope.newUser.createdBy._id = $rootScope.getCurrentUser()._id;
      $scope.newUser.createdBy.fname = $rootScope.getCurrentUser().fname;
      $scope.newUser.createdBy.mname = $rootScope.getCurrentUser().mname;
      $scope.newUser.createdBy.lname = $rootScope.getCurrentUser().lname;
      $scope.newUser.createdBy.role = $rootScope.getCurrentUser().role;
      $scope.newUser.createdBy.userType = $rootScope.getCurrentUser().userType;
      $scope.newUser.createdBy.phone = $rootScope.getCurrentUser().phone;
      $scope.newUser.createdBy.mobile = $rootScope.getCurrentUser().mobile;
      $scope.newUser.createdBy.alternateMobile = $rootScope.getCurrentUser().alternateMobile;
      $scope.newUser.createdBy.email = $rootScope.getCurrentUser().email;
      $scope.newUser.createdBy.country = $rootScope.getCurrentUser().country;
      $scope.newUser.createdBy.company = $rootScope.getCurrentUser().company;
    } else {
      delete newUser.createdBy;
    }
    
    setLocationData();

    if($scope.newUser.role == 'enterprise' && $scope.newUser.enterprise){
      $scope.newUser.enterpriseId = "E" + $scope.newUser.mobile + "" + Math.floor(Math.random() *10);
    }

    $http.post('/api/users/register',$scope.newUser).success(function(result) {
      if(result && result.errorCode == 1){
        Modal.alert(result.message, true);
      } else {
        //$scope.editImage = false;
        var data = {};
        data['to'] = $scope.newUser.email;
        if($scope.newUser.role == 'customer')
          data['subject'] = 'New User Registration: Success';
        else if($scope.newUser.role == 'enterprise')
          data['subject'] = 'New Enterprise Registration: Success'
        else
          data['subject'] = 'New Channel Partner Registration: Success';
        $scope.newUser.serverPath = serverPath;
        notificationSvc.sendNotification('userRegEmailFromAdminChannelPartner', data, $scope.newUser,'email');
        $scope.closeDialog();
        $rootScope.$broadcast('updateUserList');
        $scope.newUser = {};
        } 
      }).error(function(res){
          Modal.alert(res,true);
      });
  }

    $scope.closeDialog = function () {
       $uibModalInstance.dismiss('cancel');
    };
}]);


