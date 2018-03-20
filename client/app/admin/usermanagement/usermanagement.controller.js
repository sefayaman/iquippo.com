'use strict';

angular.module('sreizaoApp')
  .controller('UserManagementCtrl', ['$scope', '$rootScope', '$stateParams', '$state', 'Auth', 'uploadSvc', 'notificationSvc', 'userSvc', 'Modal', '$http', function ($scope, $rootScope, $stateParams, $state, Auth, uploadSvc, notificationSvc, userSvc, Modal, $http) {
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
    vm.uploadExcel = uploadExcel;
    vm.openAddUserDialog = openAddUserDialog;
    $scope.bulkUserUpload = {};
    $scope.bulkUserUpload.template = "BulkUserUpload.xlsx";
    vm.userSearchFilter = {};
    var dataToSend = {};
    vm.getProductData = getProductData;
    $scope.getConcatData = [];
    $scope.userInfo = {};
    $scope.dateFilter = {};
    vm.getUserExportFileName = getUserExportFileName;
    $scope.$on('updateUserList', function () {
      fireCommand(true);
    });

    function uploadExcel(excelData) {
      if (!excelData || !excelData.length)
        return;
      var user = {};
      user._id = Auth.getCurrentUser()._id;
      user.fname = Auth.getCurrentUser().fname;
      user.mname = Auth.getCurrentUser().mname;
      user.lname = Auth.getCurrentUser().lname;
      user.role = Auth.getCurrentUser().role;
      user.userType = Auth.getCurrentUser().userType;
      user.phone = Auth.getCurrentUser().phone;
      user.mobile = Auth.getCurrentUser().mobile;
      user.email = Auth.getCurrentUser().email;
      user.country = Auth.getCurrentUser().country;
      user.company = Auth.getCurrentUser().company;
      $rootScope.loading = true;
      userSvc.parseExcel(excelData, user)
        .then(function (res) {
          $rootScope.loading = false;
          var totalRecord = res.totalCount;
          var message = res.successCount + " out of " + totalRecord + " records are  processed successfully.";
          if (res.errorList.length > 0) {
            var data = {};
            data.to = Auth.getCurrentUser().email;
            data.subject = 'Bulk user upload error details.';
            var serData = {};
            serData.serverPath = serverPath;
            serData.errorList = res.errorList;
            notificationSvc.sendNotification('BulkUserUploadError', data, serData, 'email');
            message += "Error details have been sent on registered email id.";
          }
          $scope.successMessage = message;
          $scope.autoSuccessMessage(20);
          resetPagination();
          var filter = {};
          filter.role = "channelpartner";
          userSvc.getUsers(filter).then(function (data) {
            vm.getUsersOnRole = data;
          })
            .catch(function (err) {
              Modal.alert("Error in geting user");
            });
          filter.role = "enterprise";
          filter.enterprise = true;
          filter.status = true;
          userSvc.getUsers(filter).then(function (data) {
            vm.enterprises = data;
            dataToSend.pagination = true;
            dataToSend.itemsPerPage = vm.itemsPerPage;
            getUser(dataToSend);
          })
            .catch(function (err) {
              Modal.alert("Error in geting user");
            });
        })
        .catch(function (res) {
          $rootScope.loading = false;
          console.log("Error response ", res);
        });
    }

    function editUserClick(userData) {
      angular.copy(userData, $scope.userInfo)
      var userScope = $rootScope.$new();
      userScope.userInfo = $scope.userInfo;
      userScope.isEdit = true;
      Modal.openDialog('adduser', userScope);
      //$state.go('useraccountedit', {id:userData._id});
    }

    function openAddUserDialog() {
      $scope.isEdit = false;
      Modal.openDialog('adduser', null, "enterpriseClass");
    }

    function init() {
      Auth.isLoggedInAsync(function (loggedIn) {
        if (loggedIn) {
          if (Auth.isAdmin()) {
            var filter = {};
            filter.isAdminRole = true;
            userSvc.getUsers(filter).then(function (data) {
              vm.getUsersOnRole = data;
            })
              .catch(function (err) {
                Modal.alert("Error in geting user");
              })
            var entFilter = {};

            entFilter.role = "enterprise";
            entFilter.enterprise = true;
            entFilter.status = true;
            userSvc.getUsers(entFilter).then(function (data) {
              vm.enterprises = data;
            })
          }

          if (Auth.isChannelPartner()) {
            dataToSend["userId"] = Auth.getCurrentUser()._id;
          }

          if (Auth.isEnterprise()) {
            dataToSend["enterpriseId"] = Auth.getCurrentUser().enterpriseId;
          }

          dataToSend.pagination = true;
          dataToSend.itemsPerPage = vm.itemsPerPage;
          restoreState();
          //getUser(dataToSend);
          fireCommand(false);
        }
        //getUserExportFileName();
      });

    }
    init();

    function getUser(filter) {
      if (vm.currentPage == prevPage)
        return;

      filter.prevPage = prevPage;
      filter.currentPage = vm.currentPage;
      filter.first_id = first_id;
      filter.last_id = last_id;
      filter.notManpower = true;
      saveState();
      userSvc.getUsers(filter).then(function (result) {
        getProductsCountWithUser(result);
        vm.userList = result.users;
        vm.totalItems = result.totalItems;
        prevPage = vm.currentPage;
        if (vm.userList.length > 0) {
          first_id = vm.userList[0]._id;
          last_id = vm.userList[vm.userList.length - 1]._id;
        }
      })
        .catch(function (err) {
          Modal.alert("Error in geting user");
        })
    }

    function restoreState() {
      if ($stateParams.searchstr)
        vm.userSearchFilter.searchStr = $stateParams.searchstr;
      if ($stateParams.first_id)
        first_id = $stateParams.first_id;
      if ($stateParams.last_id)
        last_id = $stateParams.last_id;
      if ($stateParams.currentPage) {
        var currentPage = parseInt($stateParams.currentPage);
        prevPage = parseInt($stateParams.prevPage);
        vm.totalItems = vm.itemsPerPage * currentPage;
        vm.currentPage = currentPage;
      }
    }

    function saveState() {
      var statObj = {};
      statObj['first_id'] = first_id;
      statObj['last_id'] = last_id;
      statObj['currentPage'] = vm.currentPage;
      statObj['prevPage'] = prevPage;
      if (vm.userSearchFilter.searchStr)
        statObj['searchstr'] = vm.userSearchFilter.searchStr;
      else
        statObj['searchstr'] = "";

      $state.go("usermanagment", statObj, { location: 'replace', notify: false });
    }

    function getUserExportFileName() {

      userSvc.getUserExportFileName().then(function (result) {
        if (result)
          vm.userExportLink = result;
      })
        .catch(function (err) {
          Modal.alert("Error in geting export url");
        })
    }
    function getProductData(id, type) {
      if (angular.isUndefined($scope.getConcatData)) {
        if (type == "total_products")
          return 0;
        if (type == "have_products")
          return "No";
      } else {
        var count = 0;
        $scope.getConcatData.forEach(function (data) {
          if (id == data._id)
            count = data.total_products;
        });
        if (type == "total_products") {
          if (count > 0)
            return count;
          else
            return 0;
        }
        if (type == "have_products") {
          if (count > 0)
            return "Yes";
          else
            return "No";
        }
      }
    }

    function getRegisteredBy(user) {
      if (!user.createdBy)
        return user.fname + " " + user.lname + ' (Self)';

      if (user.createdBy.role == 'admin')
        return user.createdBy.fname + " " + user.createdBy.lname + ' (Admin)';
      else if (user.createdBy.role == 'channelpartner')
        return user.createdBy.fname + " " + user.createdBy.lname + ' (Channel Partner)';
      else if (user.createdBy.role == 'enterprise')
        return user.createdBy.fname + " " + user.createdBy.lname + ' (Eneterprise)';
      else
        return user.createdBy.fname + " " + user.createdBy.lname + ' (Self)';
    }

    function getProductsCountWithUser(result) {
      var filter = {};
      var userIds = [];
      result.users.forEach(function (item) {
        userIds[userIds.length] = item._id;
      });
      filter.userIds = userIds;
      userSvc.getProductsCountOnUserIds(filter)
        .then(function (data) {
          $scope.getConcatData = data;
          //return data;
        })
        .catch(function () {
        })
    }

    function fireCommand(reset, filterObj) {
      if (reset)
        resetPagination();
      var filter = {};
      if (!filterObj)
        angular.copy(dataToSend, filter);
      else
        filter = filterObj;

      if (vm.userSearchFilter.createdBy)
        filter['userId'] = vm.userSearchFilter.createdBy;

      if (vm.userSearchFilter.enterpriseId)
        filter['enterpriseId'] = vm.userSearchFilter.enterpriseId;

      if (vm.userSearchFilter.searchStr)
        filter['searchstr'] = vm.userSearchFilter.searchStr;
      getUser(filter);
    }

    function resetPagination() {
      prevPage = 0;
      vm.currentPage = 1;
      vm.totalItems = 0;
      first_id = null;
      last_id = null;
    }

    function onUserChange(user) {
      delete vm.userSearchFilter.enterpriseId;
      delete vm.userSearchFilter.createdBy;
      if (!user) {
        fireCommand(true);
        return;
      }
      if (user.role == 'enterprise')
        vm.userSearchFilter.enterpriseId = user.enterpriseId;
      else
        vm.userSearchFilter['createdBy'] = user._id;
      fireCommand(true);
    }

    function exportExcel(data) {
      var serverData = {};
      serverData["exportType"] = data;
      if (Auth.getCurrentUser()._id && Auth.getCurrentUser().role == 'channelpartner') {
        serverData["userId"] = Auth.getCurrentUser()._id;
      }

      if (Auth.isEnterprise()) {
        serverData["enterpriseId"] = Auth.getCurrentUser().enterpriseId;
      }

      if ($scope.dateFilter.fromDate)
        serverData["fromDate"] = $scope.dateFilter.fromDate;

      if ($scope.dateFilter.toDate)
        serverData["toDate"] = $scope.dateFilter.toDate;

      var exportObj = { filter: serverData };
      exportObj.method = "POST";
      exportObj.action = "api/users/export";
      $scope.$broadcast("submit", exportObj);

      /*$http.post('/api/users/export', dataToSend)
      .then(function(res){console.log("res===",res);
      console.log("data==",res.data);
        var data = res.data;
        saveAs(new Blob([s2ab(data)],{type:"application/octet-stream"}), "userlist_"+ new Date().getTime() +".xlsx")
      },
      function(res){
        console.log(res)
      })*/
    }


    function deleteUser(user) {
      Modal.confirm(informationMessage.deleteChannelPartnerConfirm, function (isGo) {
        if (isGo == 'no')
          return;
        $rootScope.loading = true;
        userSvc.deleteUser(user._id).then(function (result) {
          $rootScope.loading = false;
          fireCommand(true);
          if (result.errorCode == 0)
            Modal.alert("User deleted succesfully", true);
          else
            Modal.alert(result.message, true);
        })
          .catch(function (err) {
            $rootScope.loading = false;
          });
      });
    }

    function updateUser(user) {
      $rootScope.loading = true;
      userSvc.updateUser(user).then(function (result) {
        $rootScope.loading = false;
        fireCommand(true);
        if (result.status)
          Modal.alert("User Activated", true);
        else
          Modal.alert("User Deactivated", true);
      })
        .catch(function (err) {
          console.log("error in user update", err);
        });
    }

  }])


