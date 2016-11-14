(function(){
'use strict';
angular.module('sreizaoApp').controller('BidCtrl',BidCtrl);
angular.module('sreizaoApp').controller('BidListingCtrl', BidListingCtrl);
function BidCtrl($scope, $rootScope, Modal, Auth, BiddingSvc, $uibModalInstance, notificationSvc) {
 var vm = this;
 vm.biddingInfo = {};
 vm.biddingInfo.user = {};
 vm.biddingInfo.bannerInfo = {};
 vm.biddingInfo.paymentInfo = {};
 vm.biddingInfo.paymentmode = "Offline";
 vm.closeDialog = closeDialog;
 vm.submit = submit;
 function init(){
 	if(!$scope.isPayNow) {
	 	Auth.isLoggedInAsync(function(loggedIn){
	 		if(loggedIn){
	 		  vm.biddingInfo.user._id = Auth.getCurrentUser()._id;		
	 		  vm.biddingInfo.user.fname = Auth.getCurrentUser().fname;
		      vm.biddingInfo.user.mname = Auth.getCurrentUser().mname;
		      vm.biddingInfo.user.lname = Auth.getCurrentUser().lname;
		      vm.biddingInfo.user.mobile = Auth.getCurrentUser().mobile;
		      vm.biddingInfo.user.email = Auth.getCurrentUser().email;
	 		} else {
	 			vm.biddingInfo.user = {};
	 		}
	 	})
	 	
	 	vm.biddingInfo.bannerInfo._id = $scope.slideInfo._id;
	 	vm.biddingInfo.bannerInfo.name = $scope.slideInfo.name;
	 	vm.biddingInfo.bannerInfo.code = $scope.slideInfo.code;
	 	//vm.biddingInfo.bannerInfo.ticker = $scope.slideInfo.ticker;
 	} else {
 		vm.biddingInfo = $scope.biddingInfo;
 	} 
 }
 	init();

 	function submit(form){
 		if(form.$invalid){
			$scope.submitted = true;
			return;
		}
		$scope.submitted = false;
		if(!$scope.isPayNow) {
			BiddingSvc.save(vm.biddingInfo)
			.then(function(res){
				if(res.errorCode == 0){
					var data = {};
					var dataToSend = {};
      					dataToSend['promoname'] = vm.biddingInfo.bannerInfo.name;
					if(vm.biddingInfo.user.email)
			        	data['to'] = vm.biddingInfo.user.email;
			        data['subject'] = 'No Reply: Bid Request';
			        dataToSend['serverPath'] = serverPath;
			        notificationSvc.sendNotification('biddingEmailToCustomer', data, dataToSend,'email');
			        if(vm.biddingInfo.user.mobile)
			        	data['to'] = vm.biddingInfo.user.mobile;
			        notificationSvc.sendNotification('biddingSMSToCustomer', data, dataToSend,'sms');
			        vm.biddingInfo = {};
					closeDialog();
				}
				else
					Modal.alert(res.message);
			})
		} else {
			vm.biddingInfo.status = "Completed";
			BiddingSvc.update(vm.biddingInfo)
			.then(function(res){
				if(res.errorCode == 0){
					vm.biddingInfo = {};
					closeDialog();
					$rootScope.$broadcast('updateBidList');
				}
				else
					Modal.alert(res.message);
			})
		}
 	}

   function closeDialog() {
     $uibModalInstance.dismiss('cancel');
     $rootScope.$broadcast('resetBannerTimer');
   };
}

function BidListingCtrl($scope, $rootScope, Modal, Auth, BiddingSvc, DTOptionsBuilder) {
 var vm = this;
 
 vm.biddingInfo = {};
 vm.payNow = payNow;
 
  $scope.tableRef = {};
  $scope.dtOptions = DTOptionsBuilder.newOptions().withOption('bFilter', true).withOption('lengthChange', true).withOption('stateSave',true)
  .withOption('stateLoaded',function(){
    if($scope.tableRef.DataTable && $rootScope.currentProductListingPage > 0)
      $timeout(function(){
          $scope.tableRef.DataTable.page($rootScope.currentProductListingPage).draw(false);
          $rootScope.currentProductListingPage = 0;
      },10)  
  });

    $scope.$on('updateBidList',function(){
      init();
    })

 function init(){
  Auth.isLoggedInAsync(function(loggedIn){
  	var filter = {}
    if(loggedIn){
    	if(!Auth.isAdmin())
    		filter["userId"] = Auth.getCurrentUser()._id;
    }
    getBids(filter);
  })
  
 }

 init();
	
	function payNow(index){
		angular.copy(vm.bidListing[index], vm.biddingInfo)
		var biddingScope = $rootScope.$new();
        biddingScope.biddingInfo = vm.biddingInfo;
        biddingScope.isPayNow = true;
        Modal.openDialog('biddingReq',biddingScope);
	}


 function getBids(filter){
      BiddingSvc.getOnFilter(filter)
      .then(function(result){
        vm.bidListing = result;
      });
    }
}

})();
