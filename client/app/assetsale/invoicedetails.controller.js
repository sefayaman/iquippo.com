(function() {
  'use strict';

angular.module('sreizaoApp').controller('invoiceDetailsCtrl', invoiceDetailsCtrl);

function invoiceDetailsCtrl($scope, $rootScope,Modal, Auth, $uibModal, AssetSaleSvc, LocationSvc, UtilSvc, $uibModalInstance) {
	var vm = this;
	$scope.option = {};
	vm.invoiceInfo = {};
	vm.closeDialog = closeDialog;
	vm.submit = submit;
	$scope.onCountryChange = onCountryChange;
    $scope.onStateChange = onStateChange;
    var filter = {};
    /*$scope.bidData ={};
  	function init(){
      angular.copy($scope.bidData, $scope.bidData);
    }*/

	function onCountryChange(country, noChange) {
      if (!noChange) {
        vm.invoiceInfo.state = "";
        vm.invoiceInfo.city = "";
      }
      $scope.stateList = [];
      $scope.locationList = [];
      if (!country)
        return;

      filter = {};
      filter.country = country;
      LocationSvc.getStateHelp(filter).then(function(result) {
        $scope.stateList = result;
      });
    }

    function onStateChange(state, noChange) {
      if (!noChange)
        vm.invoiceInfo.city = "";
      $scope.locationList = [];
      if (!state)
        return;

      filter = {};
      filter.stateName = state;
      LocationSvc.getLocationOnFilter(filter).then(function(result) {
        $scope.locationList = result;
      });
    }

    function onCodeChange(code) {
	    $scope.country = LocationSvc.getCountryNameByCode(code);
	}

	function submit(form) {
		if($scope.option.select == 'yes') {
			vm.invoiceInfo = {};
			if(Auth.getCurrentUser()._id) {
				vm.invoiceInfo.fname = Auth.getCurrentUser().fname;
				vm.invoiceInfo.lname = Auth.getCurrentUser().lname;
				vm.invoiceInfo.country = Auth.getCurrentUser().country;
				vm.invoiceInfo.state = Auth.getCurrentUser().state;
				vm.invoiceInfo.city = Auth.getCurrentUser().city;
				if(Auth.getCurrentUser().email)
					vm.invoiceInfo.email = Auth.getCurrentUser().email;
				vm.invoiceInfo.address = Auth.getCurrentUser().address;
				vm.invoiceInfo.countryCode = LocationSvc.getCountryCode(Auth.getCurrentUser().country);
				vm.invoiceInfo.mobile = Auth.getCurrentUser().mobile;
			}
		} else {
		  	var ret = false;
		  	if($scope.country && vm.invoiceInfo.mobile) { 
		      var value = UtilSvc.validateMobile($scope.country, vm.invoiceInfo.mobile);
		      if(!value) {
		        form.mobile.$invalid = true;
		        ret = true;
		      } else {
		        form.mobile.$invalid = false;
		        ret = false;
		      }
		    }
		  	if(form.$invalid || ret){
		      form.submitted = true;
		      return;
		    }
		}
		$scope.bidData.invoiceDetail = {};
	    $scope.bidData.invoiceDetail = vm.invoiceInfo;
	    AssetSaleSvc.update($scope.bidData, 'invoice').
	      then(function(res) {
	        if(res)
	        	Modal.alert(res, true);
	      	closeDialog();
	      })
	      .catch(function(res) {
	        console.log(res);
	      });
    }

	function closeDialog() {
		$uibModalInstance.dismiss('cancel');
	}

	//loading start
	/*Auth.isLoggedInAsync(function(loggedIn) {
		if(loggedIn)
			init();
		else
			$state.go('main');
	});*/
}

})();