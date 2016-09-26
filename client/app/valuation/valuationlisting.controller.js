(function(){
'use strict';
angular.module('sreizaoApp').controller('ValuationListingCtrl',ValuationListingCtrl);
function ValuationListingCtrl($scope,Modal,Auth,ValuationSvc,UtilSvc) {
 	var vm = this;
	 vm.valuations = [];
	 var reqSent = [];
	 var reqReceived = [];
	 var filter = {};
	 $scope.valuationStatuses = valuationStatuses;
	 $scope.valType = "sent";
	 vm.master = false;

	 vm.onValuationReqTypeChange = onValuationReqTypeChange;
	 vm.updateSelection = updateSelection;
	 vm.exportExcel = exportExcel;
	 vm.updateStatus = updateStatus;
	 var selectedIds = [];

	 function init(){
	 	Auth.isLoggedInAsync(function(loggedIn){
	 		if(loggedIn){
	 			if(Auth.isCustomer()){
	 				filter = formFilter("sent");
	 				getValuations(filter,"sent");
	 			}else{
	 				filter = formFilter();
	 				getValuations(filter); 
	 			}
	 			
	 		}
	 	});
	 }
	 
	 init();
	 function getValuations(filter,valType){

	 	ValuationSvc.getOnFilter(filter)
	 	.then(function(result){
	 		if(valType && valType == 'sent'){
	 			$scope.valType = 'sent';
	 			vm.valuations = result;
	 			reqSent = result;
	 		}else if(valType && valType == 'received'){
	 			$scope.valType = 'received';
	 			vm.valuations = result;
	 			reqReceived = result;
	 		}else{
	 			vm.valuations = result;
	 		}
	 		
	 	})

	 }

	 function onValuationReqTypeChange(val){
	 		getValuations(formFilter(val),val);
	 }

	 function formFilter(val){

	 	var filter = {};
	 	if(Auth.isPartner()){
			filter['partnerId'] = Auth.getCurrentUser().partnerId;
			filter['statuses'] = ['request_submitted','request_in_process','request_completed']; 
		}else if(Auth.isCustomer() && val && val == "sent"){
			filter['userId'] = Auth.getCurrentUser()._id;
		}else if(Auth.isCustomer() && val && val == "received"){
			filter['sellerId'] = Auth.getCurrentUser()._id;
		}

		return filter;
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
        ValuationSvc.export(dataToSend)
        .then(function(buffData){
          saveAs(new Blob([s2ab(buffData)],{type:"application/octet-stream"}), "valuations_"+ new Date().getTime() +".xlsx")
        });
    }

  function updateSelection(event,id){
  		if(vm.master)
  			vm.master = false;
        var checkbox = event.target;
        var action = checkbox.checked?'add':'remove';
        if(action == 'add' && selectedIds.indexOf(id) == -1)
          selectedIds.push(id)
        if(action == 'remove' && selectedIds.indexOf(id) != -1)
          selectedIds.splice(selectedIds.indexOf(id),1);
    }

    function updateStatus(valuationReq,toStatus,intermediateStatus){
    	valuationReq.report = "abc.pdf";
    	if(toStatus == 'request_completed' && !valuationReq.report){
    		Modal.alert("Please upload report.");
    		return;
    	}
    	
    	ValuationSvc.updateStatus(valuationReq,toStatus,intermediateStatus)
    	.then(function(){
    		ValuationSvc.sendNotification(valuationReq,$scope.getStatusOnCode($scope.valuationStatuses,toStatus),'customer');
    		if(intermediateStatus)
    			ValuationSvc.sendNotification(valuationReq,$scope.getStatusOnCode($scope.valuationStatuses,toStatus),'valagency');
    	})
    }
}

})();
