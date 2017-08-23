(function() {
  'use strict';

angular.module('sreizaoApp').controller('SelectPaymentCtrl', SelectPaymentCtrl);

function SelectPaymentCtrl($scope, $rootScope, Modal, Auth, $uibModal, AssetSaleSvc, $uibModalInstance) {
  var vm = this;
  $scope.option = {};
  //ccavenue test  url
  //var ccavenueURL = "https://test.ccavenue.com";

  //ccavenue live  url
  var ccavenueURL = " https://secure.ccavenue.com";

  //localhost ccavennue test account crediential
  var currentURL = "http://localhost";
  var accessCode = 'AVSW00DJ54AN50WSNA';

  //Default parameter value

  var pinCode = "110017";
  var city = "Delhi";

  vm.closeDialog = closeDialog;
  vm.submit = submit;
  var action = $scope.formType == 'EMD' ? 'emdPayment' : 'fullPayment';

	function init(){
    if($scope.bidData.emdPayment && action == 'emdPayment') {
      vm.amount = $scope.bidData.emdAmount;
    } else if($scope.bidData.bidAmount && action == 'fullPayment') {
      vm.amount = ($scope.bidData.bidAmount - $scope.bidData.emdAmount) || 0;
    }
	}

  function save() {
    AssetSaleSvc.update($scope.bidData, action).
    then(function(res) {
      if (res)
        Modal.alert("Thank You , Fulfillment Team will contact you shortly , Please share your Payment details!", true);
      closeDialog();

    })
    .catch(function(res) {
      console.log(res);
    });
  }

  function submit() {
    if($scope.option.select == 'offline') {
      Modal.confirm("Please Contact at 033-66022059", function(ret) {
        if (ret == "yes") {
          switch (action) {
            case 'emdPayment':
                if(!$scope.bidData.emdPayment)
                  $scope.bidData.emdPayment = {};
                $scope.bidData.emdPayment.paymentMode = $scope.option.select;
                break;
            case 'fullPayment':
                if(!$scope.bidData.fullPayment)
                  $scope.bidData.fullPayment = {};
                $scope.bidData.fullPayment.paymentMode = $scope.option.select;
                break;
          }
          save();
        }
      });
      return;
    }

    if(vm.amount < 1){
      return;
    }
  }

  function closeDialog() {
    $uibModalInstance.dismiss('cancel');
  }

  //loading start
	Auth.isLoggedInAsync(function(loggedIn) {
		if(loggedIn)
			init();
		else
			$state.go('main');
	});
}

})();