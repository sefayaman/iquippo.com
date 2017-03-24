(function() {
  'use strict';

  angular.module('admin').controller('AssetGroupCtrl', AssetGroupCtrl);

  function AssetGroupCtrl($rootScope, $scope, Modal, Auth, $filter, AssetGroupSvc, uploadSvc, notificationSvc) {
    var vm = this;
    vm.assetGroupList = [];
    vm.assetGroup = {};
    vm.assetGroup.user = {};
    vm.fireCommand = fireCommand;
    vm.submitUploadTemp = submitUploadTemp;
    vm.deleteAssetGroup = deleteAssetGroup;
    vm.uploadTemplate = 'Asset_Group_Master.xlsx';
    var prevPage = 0;
    vm.itemsPerPage = 50;
    vm.currentPage = 1;
    vm.totalItems = 0;
    vm.maxSize = 6;
    $scope.uploadedExcel = '';
    var first_id = null;
    var last_id = null;


    $scope.$on("fileSelected", function(event, args) {
      if (args.files.length == 0)
        return;
      $scope.$apply(function() {
        uploadExcel(args.files[0]);
      });
    });

    function uploadExcel(file) {
      if (!file) {
        Modal.alert('Please select a file');
        return;
      }
      if (file.name.indexOf('.xlsx') === -1) {
        Modal.alert('Please upload a valid file');
        return;
      }

      uploadSvc.upload(file, importDir)
        .then(function(result) {
          $scope.uploadedExcel = result.data.filename;
          $rootScope.loading = false;
        }).catch(function(err) {
          console.log(err);
          Modal.alert("error in file upload", true);
        });
    }

    function setUser() {
      vm.assetGroup.user = {};
      vm.assetGroup.user._id = Auth.getCurrentUser()._id;
      vm.assetGroup.user.userName = Auth.getCurrentUser().fname + ' ' + Auth.getCurrentUser().lname;
      vm.assetGroup.user.mobile = Auth.getCurrentUser().mobile;
      vm.assetGroup.user.email = Auth.getCurrentUser().email;
      vm.assetGroup.user.role = Auth.getCurrentUser().role;
    }

    function submitUploadTemp() {
      var uploadData = {};
      setUser();
      uploadData = {
        fileName: $scope.uploadedExcel,
        user: vm.assetGroup.user
      };

      AssetGroupSvc.uploadExcel(uploadData).then(function(res) {
        vm.assetGroup = {};
        $scope.uploadedExcel = '';
        var message = res.msg;
        if (res.errObj.length > 0) {
          var data = {};
          var subject = 'Bulk Asset Group upload error details.';
          var template = 'BulkSpareUploadError';
          data.to = Auth.getCurrentUser().email;
          data.subject = subject;
          var serData = {};
          serData.serverPath = serverPath;
          serData.errorList = res.errObj;

          notificationSvc.sendNotification(template, data, serData, 'email');
          message += " Error details have been sent on registered email id.";
        }
        fireCommand(true);
        return Modal.alert(message);
      }).catch(function(err) {
        Modal.alert('Error while uploading');
      });
    }

    function deleteAssetGroup(id) {
      if (!id) {
        Modal.alert('Please select an id');
      }

      Modal.confirm('Would you want to delete?.', function(ret) {
        if (ret === 'yes') {
          AssetGroupSvc.destroy(id).then(function(infoCount) {
            fireCommand(true);
            return Modal.alert('Deleted Successfully');
          }).catch(function(err) {
            return Modal.alert('Error while deleting');
          });
        }
      });
    }

    function getAssetGroup(filter) {
      var countFlag = false;
      filter.prevPage = prevPage;
      filter.currentPage = vm.currentPage;
      filter.first_id = first_id;
      filter.last_id = last_id;
      filter.limit = vm.itemsPerPage;


      if (!vm.totalItems) {
        countFlag = true;
      } else if (vm.currentPage > prevPage) {
        countFlag = false;
        filter.first_id = null;
        filter.last_id = vm.assetGroupList[vm.assetGroupList.length - 1].id;
        filter.offset = ((vm.currentPage - prevPage) * vm.itemsPerPage) - vm.itemsPerPage;
      } else {
        countFlag = false;
        filter.first_id = vm.assetGroupList[0].id;
        filter.last_id = null;
        filter.offset = ((vm.currentPage - prevPage) * vm.itemsPerPage) + vm.itemsPerPage;
      }

      if (filter.searchStr) {
        countFlag = true;
      }

      if (countFlag) {
        AssetGroupSvc.getCount({
          count: true
        }).then(function(infoCount) {
          vm.totalItems = infoCount.count;
          renderResult(filter);
        }).catch(function(err) {
          Modal.alert('Error while fetching count');
        });
      } else {
        renderResult(filter);
      }
    }

    function renderResult(filter) {
      AssetGroupSvc.get(filter).then(function(result) {
        if (result && result.length) {
          vm.assetGroupList = result;
          prevPage = vm.currentPage;
          first_id = vm.assetGroupList[0].id;
          last_id = vm.assetGroupList[vm.assetGroupList.length - 1].id;
        }
      }).catch(function(err) {
        Modal.alert('Error while fetching');
      });
    }

    fireCommand();

    function fireCommand(reset, filterObj) {
      var dataToSend = {};
      if (reset) {
        resetPagination();
      }
      var filter = {};
      if (!filterObj) {
        angular.copy(dataToSend, filter);
      } else {
        filter = filterObj;
      }
      if (vm.searchStr) {
        filter.searchStr = vm.searchStr;
      }
      getAssetGroup(filter);
    }



    function resetPagination() {
      prevPage = 0;
      vm.currentPage = 1;
      vm.totalItems = 0;
      vm.totalMItems = 0;
      first_id = null;
      last_id = null;
      vm.totalItems = 0;
    }

  }

})();