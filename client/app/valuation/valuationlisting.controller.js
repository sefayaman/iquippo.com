(function(){
'use strict';
angular.module('sreizaoApp').controller('ValuationListingCtrl',ValuationListingCtrl);
function ValuationListingCtrl($scope,$stateParams,$state,Modal,Auth,ValuationSvc,AuctionSvc,UtilSvc,$rootScope,uploadSvc) {
 	 var vm = this;
	 vm.valuations = [];
	 var reqSent = [];
	 var reqReceived = [];
	 var filter = {};
	 $scope.valuationStatuses = valuationStatuses;
	 $scope.valType = "sent";
	 vm.master = false;
	 vm.searchStr = "";

	 //pagination variables
	  var prevPage = 0;
	  vm.itemsPerPage = 50;
	  vm.currentPage = 1;
	  vm.totalItems = 0;
	  vm.maxSize = 6;
	  var first_id = null;
	  var last_id = null;

	  vm.fireCommand = fireCommand;

	 vm.onValuationReqTypeChange = onValuationReqTypeChange;
	 vm.updateSelection = updateSelection;
	 vm.exportExcel = exportExcel;
	 vm.updateStatus = updateStatus;
	 $scope.uploadReport = uploadReport;
	 vm.isUserMode = isUserMode;
	 var selectedIds = [];

	 var mode = "user";

	 function init(){
	 	Auth.isLoggedInAsync(function(loggedIn){
	 		if(loggedIn){

	 			if($stateParams.mode=="myrequest"){
	 				mode = "user";
	 			}else if($stateParams.mode == "valuationpartner" && Auth.isPartner()){
	 				mode = "agency";
	 			}else{
	 				goToUserMode();
	 			}

	 			if(isUserMode()){
	 				filter = formFilter("sent");
	 				getValuations(filter,"sent");
	 			}else{
	 				filter = formFilter();
	 				getValuations(filter); 
	 			}
	 			
	 		}
	 	});
	 }
	 
	 function goToUserMode(){
	 	$state.go("valuationrequests",{mode:"myrequest"});
	 }

	 function isUserMode(){
	 	return mode == "user";
	 }

	 init();

	 function fireCommand(rstPagination){
	 	
	 	if(rstPagination)
	 		resetPagination();
	 	var fltr = formFilter($scope.valType);
	 	if(vm.searchStr)
	 		fltr.searchstr = vm.searchStr;
	 	if(isUserMode())
	 		getValuations(fltr,$scope.valType);
	 	else
	 		getValuations(fltr);
	 }

	 function getValuations(filter,valType){
	 	
	 	filter.pagination = true;
	 	filter.prevPage = prevPage;
	    filter.currentPage = vm.currentPage;
	    filter.first_id = first_id;
	    filter.last_id = last_id;
	    filter.itemsPerPage = vm.itemsPerPage;

	 	ValuationSvc.getOnFilter(filter)
	 	.then(function(result){
	 		if(valType && valType == 'sent'){
	 			$scope.valType = 'sent';
	 			vm.valuations = result.items;
	 		}else if(valType && valType == 'received'){
	 			$scope.valType = 'received';
	 			vm.valuations = result.items;
	 		}else{
	 			vm.valuations = result.items;
	 		}
	 		vm.totalItems = result.totalItems;
        	prevPage = vm.currentPage;
        	if(result.items.length > 0){
        		 first_id = result.items[0]._id;
          		 last_id = result.items[result.items.length - 1]._id;
        	}

	 	})

	 }

	 function onValuationReqTypeChange(val){
	 		resetPagination();
	 		getValuations(formFilter(val),val);
	 }

	 function formFilter(val){

	 	var filter = {};
	 	if(!isUserMode()){
			filter['partnerId'] = Auth.getCurrentUser().partnerInfo._id;
			filter['statuses'] = ['request_submitted','request_in_process','request_completed']; 
		}else if(isUserMode() && val && val == "sent"){
			filter['userId'] = Auth.getCurrentUser()._id;
		}else if(isUserMode() && val && val == "received"){
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
    	if(!toStatus)
    		return;
    	if(toStatus == 'request_completed' && !valuationReq.report){
    		Modal.alert("Please upload report.");
    		return;
    	}
    	ValuationSvc.updateStatus(valuationReq,toStatus,intermediateStatus)
    	.then(function(){
    		if(valuationReq.isAuction)
    			updateAuction(valuationReq,toStatus);

    		ValuationSvc.sendNotification(valuationReq,$scope.getStatusOnCode($scope.valuationStatuses,toStatus).notificationText,'customer');
    		if(intermediateStatus)
    			ValuationSvc.sendNotification(valuationReq,$scope.getStatusOnCode($scope.valuationStatuses,toStatus).notificationText,'valagency');
    	})
    }

    function updateAuction(valuationReq,toStatus){
    	AuctionSvc.getOnFilter({valuationId:valuationReq._id})
		.then(function(result){
			if(result.length > 0){
				var auctReq = result[0];
				auctReq.valuation.status = toStatus;
				AuctionSvc.update(auctReq);
			}
		});
    }

    function uploadReport(files,_this){
    	if(!files[0])
	 		return;
	 	var index = parseInt($(_this).data('index'));
	 	var valReq = vm.valuations[index];
	 	if(!valReq)
	 		return;
	 	$rootScope.loading = true;
	 	uploadSvc.upload(files[0],valReq.product.assetDir)
	 	.then(function(result){
	 		valReq.report = result.data.filename;
	 		$rootScope.loading = false;
	    })
	    .catch(function(err){
	    	$rootScope.loading = false;
	    })
	}

 function resetPagination(){
     prevPage = 0;
     vm.currentPage = 1;
     vm.totalItems = 0;
     first_id = null;
     last_id = null;
  }

}

})();
