(function() {
  'use strict';

  angular.module('sreizaoApp').controller('BannerLeadCtrl', BannerLeadCtrl);

  function BannerLeadCtrl($scope, $rootScope, Auth, Modal,LocationSvc,notificationSvc,$uibModalInstance,BannerLeadSvc) {
    var vm = this;
    vm.close = close;
    vm.submit = submit;
    vm.bannerLead = {};
    $scope.stateList = [];

    function init(){
    	LocationSvc.getStateHelp({})
    	.then(function(stateList){
    		$scope.stateList = stateList;
    	});

    	if(Auth.getCurrentUser()._id){
    		vm.bannerLead.email = Auth.getCurrentUser().email;
    		vm.bannerLead.mobile = Auth.getCurrentUser().mobile;
    		vm.bannerLead.fname = Auth.getCurrentUser().fname ;
    		vm.bannerLead.lname = Auth.getCurrentUser().lname;
    	}
    }

    function submit(form){
    	if(form.$invalid){
    		$scope.submitted = true;
    		return;
    	}
    	$scope.loading = true;
    	if(Auth.getCurrentUser()._id){
    		vm.bannerLead.user = {};
    		vm.bannerLead.user._id = Auth.getCurrentUser()._id;
    		vm.bannerLead.user.customerId = Auth.getCurrentUser().customerId;
    		vm.bannerLead.user.email = Auth.getCurrentUser().email;
    		vm.bannerLead.user.mobile = Auth.getCurrentUser().mobile;
    		vm.bannerLead.user.name = Auth.getCurrentUser().fname + " " + Auth.getCurrentUser().lname;
    	}

    	vm.bannerLead.country = country(vm.bannerLead.state);
    	BannerLeadSvc.save(vm.bannerLead)
    	.then(function(response){
    		close();
    		$scope.loading = false;
				Modal.alert("Your request - " + response.ticketId + " has been submitted successfully.");
				ga('send', 'event', { eventCategory: 'Submit', eventAction: 'Button Click', eventLabel: 'TH Loader campaign'});
    	})
    	.catch(function(err){
    		$scope.loading = false;
    	})

    }

    function country(state){
    	for(var i=0;i < $scope.stateList.length;i++){
    		if($scope.stateList[i].name == state){
    			return $scope.stateList[i].country;
    		}
    	}
    	return "";
    }
    
    function close(){
      $uibModalInstance.dismiss('cancel');
    }

    //Entry point
    Auth.isLoggedInAsync(function(loggedIn){
      init();
    });

  }
})();