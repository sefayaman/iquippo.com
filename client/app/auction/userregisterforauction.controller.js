(function() {
  'use strict';

angular.module('sreizaoApp').controller('userRegForAuctionCtrl', userRegForAuctionCtrl);

function userRegForAuctionCtrl($scope, $rootScope, userRegForAuctionSvc, LocationSvc, Modal, Auth, AuctionSvc, UtilSvc, $uibModal, $uibModalInstance) {
  var vm = this;
  vm.closeDialog = closeDialog;
  vm.submit = submit;
  vm.onCodeChange = onCodeChange;
  $scope.option = {};
  vm.user = {};
  vm.user.countryCode = "91";
  function init() {
  	if($scope._id) {
  		var filter = {};
    	filter._id = $scope._id;
    	AuctionSvc.getAuctionDateData(filter)
      .then(function(result) {
        if(!result)
          return;
        $scope.currentAuction = {};
        angular.copy(result.items[0], $scope.currentAuction);	
      });
  	}
  	onCodeChange(vm.user.countryCode);
  }

  init();

  function onCodeChange(code) {
    $scope.country = LocationSvc.getCountryNameByCode(code);
  }

  function submit(form) {
  	var ret = false;
  	if($scope.country && vm.user.mobile) { 
      var value = UtilSvc.validateMobile($scope.country, vm.user.mobile);
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
 		if($scope.option.select === 'yes') {
      var data = {};
    if(vm.userId)
			data.userId = vm.userId;
		
    userRegForAuctionSvc.validateUser(data).
      success(function(res) {
        if (res && res.errorCode === 0) {
        	createReqData($scope.currentAuction, res.user);
        } else {
          Modal.alert("We are unable to find your account.Please provide correct Mobile / Email Id", true);
        }
      }).
      error(function(res) {
        console.log(res);
      });
      } else {
      	createReqData($scope.currentAuction, vm.user);
      }
    }

  function createReqData(auctionData, userData) {
  	var dataObj = {};
  	dataObj.auction = {};
  	dataObj.user = {};
  	dataObj.auction.dbAuctionId = auctionData._id;
  	dataObj.auction.name = auctionData.name;
  	dataObj.auction.auctionId = auctionData.auctionId;
  	dataObj.auction.emdAmount = auctionData.emdAmount;
    dataObj.auction.auctionOwnerMobile = auctionData.auctionOwnerMobile;
  	if(userData._id)
  		dataObj.user._id = userData._id;
  	dataObj.user.fname = userData.fname;
  	dataObj.user.lname = userData.lname;
  	dataObj.user.countryCode = userData.countryCode ? userData.countryCode : LocationSvc.getCountryCode(userData.country);
  	dataObj.user.mobile = userData.mobile;
  	if(userData.email)
  		dataObj.user.email = userData.email;
  	save(dataObj);
  }

  function save(dataObj){
    userRegForAuctionSvc.save(dataObj)
    .then(function(){
    	  closeDialog();
        Modal.alert('Your request has been successfully submitted!');
    })
    .catch(function(err){
       if(err.data)
            Modal.alert(err.data); 
    });
  }

  function closeDialog() {
    $uibModalInstance.dismiss('cancel');
  }
}

})();