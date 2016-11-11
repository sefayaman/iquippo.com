(function(){
'use strict';
angular.module('sreizaoApp').controller('BidCtrl',BidCtrl);
angular.module('sreizaoApp').controller('BidListingCtrl', BidListingCtrl);
function BidCtrl($scope, $rootScope, Modal, Auth, BiddingSvc, $uibModalInstance) {
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
	 	
	 	vm.biddingInfo.bannerInfo.name = $scope.slideInfo.name;
	 	vm.biddingInfo.bannerInfo.code = $scope.slideInfo.code;
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
					var filter = {};
					vm.biddingInfo = {};
					closeDialog();
					getBids(filter);
				}
				else
					Modal.alert(res.message);
			})
		}
 	}

 	function getBids(filter){
      BiddingSvc.getOnFilter(filter)
      .then(function(result){
        $rootScope.bidListing = result;
      });
    }

   function closeDialog() {
     $uibModalInstance.dismiss('cancel');
     $rootScope.$broadcast('resetBannerTimer');
   };
}

function BidListingCtrl($scope, $rootScope, Modal, Auth, BiddingSvc) {
 var vm = this;
 
 vm.getDateFormat = getDateFormat;
 vm.biddingInfo = {};
 vm.payNow = payNow;
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

 function getDateFormat(date){
		if(!date)
			return;
		return moment(date).format('DD/MM/YYYY');
	}
	
	function payNow(index){
		angular.copy($rootScope.bidListing[index], vm.biddingInfo)
		var biddingScope = $rootScope.$new();
        biddingScope.biddingInfo = vm.biddingInfo;
        biddingScope.isPayNow = true;
        Modal.openDialog('biddingReq',biddingScope);
	}


 function getBids(filter){
      BiddingSvc.getOnFilter(filter)
      .then(function(result){
        $rootScope.bidListing = result;
      });
    }
}

})();
