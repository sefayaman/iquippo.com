'use strict';

angular.module('sreizaoApp')
  .controller('UserManagementCtrl', ['$scope', '$rootScope', 'DTOptionsBuilder','Auth','userSvc', 'Modal','$http', function ($scope, $rootScope, DTOptionsBuilder, Auth, userSvc, Modal,$http) {
   	var self = this;

    $scope.dtOptions = DTOptionsBuilder.newOptions().withOption('bFilter', true).withOption('lengthChange', true);
    $rootScope.users = [];
    $scope.userList = [];
    $rootScope.globleUsers = [];
    $scope.getUsersOnRole = [];
    self.getAllUser = function(){
      var filter = {};

      if(Auth.getCurrentUser()._id && Auth.getCurrentUser().role == 'channelpartner') {
        filter["userId"] = Auth.getCurrentUser()._id;
      }
      userSvc.getUsers(filter).then(function(data){
        data.forEach(function(item){
          if(!item.isManpower || item.isPartner)
            $scope.userList[$scope.userList.length] = item;
        });

        $rootScope.globleUsers = $rootScope.users = data;
        getChannelUser("channelpartner");
      })
      .catch(function(err){
        Modal.alert("Error in geting user");
      })
    }

    function getChannelUser(role) {
      if($rootScope.globleUsers) {
        $scope.getUsersOnRole = $rootScope.globleUsers.filter(function(d){
          return role == d.role;
        });
      }
    }

    $scope.onUserChange = function(user){
      if(!user) {
        $rootScope.users = $rootScope.globleUsers;
        return;
      }
      $rootScope.users = $rootScope.globleUsers.filter(function(d){
        if(!angular.isUndefined(d.createdBy))
            return user._id == d.createdBy._id;
      });
    }

     $scope.exportExcel = function(){
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
    
    $scope.deleteUser = function(user){
      Modal.confirm(informationMessage.deleteChannelPartnerConfirm,function(isGo){
        if(isGo == 'no')
          return;
        $rootScope.loading = true;
        userSvc.deleteUser(user._id).then(function(result){
          $rootScope.loading = false;
          self.getAllUser();
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

    $scope.updateUser = function(user){
      $rootScope.loading = true;
      userSvc.updateUser(user).then(function(result){
        $rootScope.loading = false;
        self.getAllUser();
        if(result.status)
          Modal.alert("User Activated",true);
        else
          Modal.alert("User Deactivated",true);
      })
      .catch(function(err){
        console.log("error in user update", err);
      });
    }

    self.getAllUser();
}])

  .controller('AddUserCtrl', ['$scope', '$rootScope','LocationSvc', '$http', 'Auth', 'Modal', 'uploadSvc', 'notificationSvc', 'userSvc', '$uibModalInstance',
   function ($scope, $rootScope,LocationSvc, $http, Auth, Modal, uploadSvc ,notificationSvc, userSvc, $uibModalInstance) {
    var self = this;
    $scope.newUser ={};
    $scope.errors = {};
    //$scope.editImage = false;
    $scope.users = [];
    $scope.locationList = [];
    LocationSvc.getAllLocation()
    .then(function(result){
      $scope.locationList = result;
    });

    self.getAllUser = function(){
      var filter = {};

      if(Auth.getCurrentUser()._id && Auth.getCurrentUser().role == 'channelpartner') {
        filter["userId"] = Auth.getCurrentUser()._id;
      }
      userSvc.getUsers(filter).then(function(data){
        $rootScope.users = data;
      })
      .catch(function(err){
        Modal.alert("Error in geting user");
      })
    }

    $scope.register = function(evt){
    var ret = false;
    if($scope.form.$invalid || ret) {
        $scope.submitted = true;
        return;
    }

    if($scope.newUser.agree) {
      var dataToSend = {};
      if($scope.newUser.email) 
        dataToSend['email'] = $scope.newUser.email;
      if($scope.newUser.mobile) 
        dataToSend['mobile'] = $scope.newUser.mobile;
      
      Auth.validateSignup(dataToSend).then(function(data){
        if(data.errorCode == 1){
           Modal.alert("Mobile number already in use. Please use another mobile number",true);
           return;
        } else if(data.errorCode == 2){
          Modal.alert("Email address already in use. Please use another email address",true);
           return;
        } else {
          /*if(!$scope.newUser.imgsrc || angular.isUndefined($scope.newUser.imgsrc)){
            saveNewUser();
            return;
          }
          uploadSvc.upload($scope[$scope.imgsrc],avatarDir).then(function(result){
            $scope.newUser.imgsrc = result.data.filename;
            saveNewUser();
          });*/
          saveNewUser();
        }
      });
    } else {
           Modal.alert("Please Agree to the Terms & Conditions",true);
    }

      if($scope.newUser.country == 'Other')
          $scope.newUser.country = $scope.newUser.otherCountry;
    };

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
      $scope.newUser.createdBy.email = $rootScope.getCurrentUser().email;
      $scope.newUser.createdBy.country = $rootScope.getCurrentUser().country;
      $scope.newUser.createdBy.company = $rootScope.getCurrentUser().company;
    } else {
      delete newUser.createdBy;
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
        else
          data['subject'] = 'New Channel Partner Registration: Success';
        $scope.newUser.serverPath = serverPath;
        notificationSvc.sendNotification('userRegEmailFromAdminChannelPartner', data, $scope.newUser,'email');
        $scope.closeDialog();
        self.getAllUser();
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


