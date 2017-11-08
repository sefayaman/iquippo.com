(function(){

'use strict';
angular.module('sreizaoApp').controller('AuctionPaymentListingCtrl',AuctionPaymentListingCtrl);

function AuctionPaymentListingCtrl($scope,$rootScope,Modal,Auth,PaymentSvc) {
	var vm = this;
	vm.trasactions = [];
	var filter = {};
	$scope.transactionStatuses = transactionStatuses;

	vm.updateSelection = updateSelection;
	vm.exportExcel = exportExcel;
	vm.openPaymentModel = openPaymentModel;
	var selectedIds = [];
	$scope.ReqSubmitStatuses = ReqSubmitStatuses;
	vm.resendUserData = resendUserData;

	$scope.$on('refreshPaymentHistroyList',function(){
        getTrasactions(filter);
    });

	function openPaymentModel(paymentData){
		Auth.isLoggedInAsync(function(loggedIn) {
		    if (loggedIn) {
		       var OfflinePaymentScope = $rootScope.$new();
		       OfflinePaymentScope.offlinePayment = paymentData;
		        Modal.openDialog('OfflinePaymentPopup',OfflinePaymentScope);
		    }
		});
	}

	 function init(){
	 	Auth.isLoggedInAsync(function(loggedIn){
	 		if(loggedIn){
	 			getTrasactions(filter);	
	 		}
	 	})
	 }

	 init();

	 function getTrasactions(filterObj){
		 //console.log("filter",filterObj);
		filterObj.auctionPaymentReq = "Auction Request";
	 	PaymentSvc.getOnFilter(filterObj)
	 	.then(function(result){
	 		vm.transactions = result;
	 	})
	 	.catch(function(err){
	 		//error handling
	 	});
	 }

	 function exportExcel(){
        var dataToSend ={};
        if(Auth.getCurrentUser()._id && Auth.getCurrentUser().role != 'admin') 
        dataToSend["userid"] = Auth.getCurrentUser()._id;
    	if(!vm.master && selectedIds.length == 0){
    		Modal.alert("Please select valuation request to export.");
    		return;
    	}
    	if(!vm.master)
    		dataToSend['ids'] = selectedIds;
        PaymentSvc.export(dataToSend)
        .then(function(buffData){
          saveAs(new Blob([s2ab(buffData)],{type:"application/octet-stream"}), "payment_"+ new Date().getTime() +".xlsx")
        });
    }

  function updateSelection(event,id){
  		if(vm.master){
  			vm.master = false;
  			selectedIds = [];
  		}
        var checkbox = event.target;
        var action = checkbox.checked?'add':'remove';
        if(action == 'add' && selectedIds.indexOf(id) == -1)
          selectedIds.push(id)
        if(action == 'remove' && selectedIds.indexOf(id) != -1)
          selectedIds.splice(selectedIds.indexOf(id),1);
    }

  function resendUserData(data) {
    $rootScope.loading = true;
    PaymentSvc.sendReqToCreateUser(data)
      .then(function(res) {
          if (res.errorCode == 0) {
            getTrasactions(filter);
          }
          Modal.alert(res.message);
          $rootScope.loading = false;
      })
      .catch(function(err){
        if(err)
          Modal.alert(err.data);
        $rootScope.loading = false;
      });
  }
}

})();
