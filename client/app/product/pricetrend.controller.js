(function() {
  'use strict';
  angular.module('sreizaoApp').controller('PriceTrendSurveyCtrl', PriceTrendSurveyCtrl);
  
  function PriceTrendSurveyCtrl($scope, Auth, $uibModalInstance, PriceTrendSvc, LocationSvc, UtilSvc) {
    var vm = this;
    vm.priceTrendSurvey = {};
    vm.priceTrendSurvey.user = {};
    vm.priceTrendSurvey.product = {};
    vm.priceTrendSurvey.priceTrend = {};
    
    vm.save = save;
    vm.close = close;
    vm.onCodeChange = onCodeChange;

    function init() {

      vm.priceTrendSurvey.agree = $scope.agree;
      if (Auth.getCurrentUser()._id) {
        vm.priceTrendSurvey.user._id = Auth.getCurrentUser()._id;
        vm.priceTrendSurvey.user.fname = Auth.getCurrentUser().fname;
        vm.priceTrendSurvey.user.lname = Auth.getCurrentUser().lname;
        vm.priceTrendSurvey.user.email = Auth.getCurrentUser().email;
        vm.priceTrendSurvey.user.mobile = Auth.getCurrentUser().mobile;
        vm.priceTrendSurvey.user.country = Auth.getCurrentUser().country;
        if (Auth.getCurrentUser().country)
          vm.priceTrendSurvey.user.countryCode = LocationSvc.getCountryCode(Auth.getCurrentUser().country);
      }

      vm.priceTrendSurvey.product._id = $scope.currentProduct._id;
      vm.priceTrendSurvey.product.name = $scope.currentProduct.name;
      vm.priceTrendSurvey.product.mfgYear = $scope.currentProduct.mfgYear;

      if ($scope.currentProduct.category.name == "Other")
        vm.priceTrendSurvey.product.category = $scope.currentProduct.category.otherName;
      else
        vm.priceTrendSurvey.product.category = $scope.currentProduct.category.name;

      if ($scope.currentProduct.brand.name == "Other")
        vm.priceTrendSurvey.product.brand = $scope.currentProduct.brand.otherName;
      else
        vm.priceTrendSurvey.product.brand = $scope.currentProduct.brand.name;

      if ($scope.currentProduct.model.name == "Other")
        vm.priceTrendSurvey.product.model = $scope.currentProduct.model.otherName;
      else
        vm.priceTrendSurvey.product.model = $scope.currentProduct.model.name;

      vm.priceTrendSurvey.priceTrend._id = $scope.priceTrend._id;
      vm.priceTrendSurvey.priceTrend.saleYear = $scope.priceTrend.saleYear;

    }

    function onCodeChange(code) {
      vm.priceTrendSurvey.user.country = LocationSvc.getCountryNameByCode(code);
    }

    function save(form) {
      var ret = false;
      if (vm.priceTrendSurvey.user.country && vm.priceTrendSurvey.user.mobile) {
        var value = UtilSvc.validateMobile(vm.priceTrendSurvey.user.country, vm.priceTrendSurvey.user.mobile);
        if (!value) {
          $scope.surveyForm.mobile.$invalid = true;
          ret = true;
        } else {
          $scope.surveyForm.mobile.$invalid = false;
          ret = false;
        }
      }
      if (form.$invalid || ret) {
        $scope.submitted = true;
        return;
      }

      PriceTrendSvc.saveSurvey(vm.priceTrendSurvey)
        .then(function(result) {
          close("success");
        })
        .catch(function(err) {
          //close("success");

        });
      //console.log("hiiiiiii",vm.priceTrendSurvey);
    }

    function close(param) {
      $uibModalInstance.close(param);
    }

    init();

  }

})();