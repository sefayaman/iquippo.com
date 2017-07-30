(function() {
  'use strict';

angular.module('sreizaoApp').controller('SelectPaymentCtrl', SelectPaymentCtrl);

function SelectPaymentCtrl($scope, $rootScope, Modal, Auth, $uibModal, $uibModalInstance) {
  var vm = this;
  vm.closeDialog = closeDialog;
  vm.submit = submit;

  	function init(){
  		if($scope.bidData)
			vm.amount = $scope.bidData.emdAmount;
	}

  function submit() {
    
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