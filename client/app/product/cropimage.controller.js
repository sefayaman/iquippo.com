(function() {
  'use strict';
  angular.module('sreizaoApp').controller('CropImageCtrl', CropImageCtrl);

  //Crop Image Controller
  function CropImageCtrl($scope, Auth, $location, $window, $http, $uibModalInstance) {
    $scope.imageOut = '';
    $scope.options = {};
    var imgParts = $scope.imgSrc.split(".");
    var imgExt = imgParts[imgParts.length - 1];
    $scope.options.image = $scope.prefix + $scope.imgSrc + "?timestamp=" + new Date().getTime();
    $scope.options.viewSizeWidth = 500;
    $scope.options.viewSizeHeight = 500;

    $scope.options.viewShowRotateBtn = false;
    $scope.options.rotateRadiansLock = false;

    $scope.options.outputImageWidth = 0;
    $scope.options.outputImageHeight = 0;
    $scope.options.outputImageRatioFixed = false;
    $scope.options.outputImageType = imgExt;
    $scope.options.outputImageSelfSizeCrop = true;
    $scope.options.viewShowCropTool = true;
    $scope.options.inModal = true;
    $scope.options.watermarkType = 'image';
    $scope.options.watermarkImage = null;

    $scope.cropImage = function() {
      $scope.$broadcast('cropImage');
    };

    $scope.saveImage = function() {
      $scope.$broadcast('cropImageSave');
    };

    $scope.saveCrop = function(data) {
      var serData = {};
      serData['data'] = data;
      //serData["imgExt"] = imgExt;
      serData['assetdir'] = $scope.assetDir;
      serData['filename'] = $scope.imgSrc;
      $http.post('/api/common/saveasimage', serData)
        .then(function(res) {
          $uibModalInstance.close("ok");
        })
        .catch(function(res) {
          console.log(res);
        })
    };
    $scope.closeModal = function() {
      $uibModalInstance.close();
    }
    $scope.dismissModal = function() {
      $uibModalInstance.dismiss();
    }

  }



})();