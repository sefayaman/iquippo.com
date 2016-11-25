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
    vm.fireCommand = fireCommand;
    vm.userSearchFilter = {};
    var dataToSend = {};
    vm.getProductData = getProductData;
    $scope.getConcatData = [];
    $scope.$on('updateUserList',function(){
      fireCommand(true);
    })

    function init(){
      Auth.isLoggedInAsync(function(loggedIn){
        if(loggedIn){
          if(Auth.getCurrentUser().role == 'admin') {
            var filter = {};
            filter.role = "channelpartner";
            userSvc.getUsers(filter).then(function(data){
            vm.getUsersOnRole = data;
            })
            .catch(function(err){
              Modal.alert("Error in geting user");
            })
          }

          if(Auth.getCurrentUser()._id && Auth.getCurrentUser().role == 'channelpartner') {
            dataToSend["userId"] = Auth.getCurrentUser()._id;
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

  .controller('AddUserCtrl', ['$scope', '$rootScope','LocationSvc', '$http', 'Auth', 'Modal', 'uploadSvc', 'notificationSvc', 'userSvc', '$uibModalInstance',
   function ($scope, $rootScope,LocationSvc, $http, Auth, Modal, uploadSvc ,notificationSvc, userSvc, $uibModalInstance) {
    $scope.newUser ={};
    $scope.errors = {};
    //$scope.editImage = false;
    //$scope.users = [];
    $rootScope.userList = [];
    $scope.locationList = [];
    LocationSvc.getAllLocation()
    .then(function(result){
      $scope.locationList = result;
    });

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


