(function(){
'use strict';
angular.module('sreizaoApp').controller('AuctionListingCtrl',AuctionListingCtrl);

function AuctionListingCtrl($scope,Modal,Auth,AuctionSvc,UtilSvc) {
 var vm = this;
 vm.auctions = [];
 vm.master = false;

 $scope.auctionStatuses = auctionStatuses;
 $scope.valuationStatuses = valuationStatuses;
 vm.updateSelection = updateSelection;
 vm.exportExcel = exportExcel;
 vm.updateStatus = updateStatus;
 var selectedIds = [];


 function init(){
 	Auth.isLoggedInAsync(function(loggedIn){
 		if(loggedIn){
 			var filter = {};
 			if(!Auth.isAdmin())
 				filter['userId'] = Auth.getCurrentUser()._id;

 				getAuctions(filter);
 		}
 	})
 }
 
 init();
 function getAuctions(filter){
 	AuctionSvc.getOnFilter(filter)
 	.then(function(result){
 		vm.auctions = result;
 	})

 }

  function exportExcel(){
        var dataToSend ={};
        if(Auth.getCurrentUser()._id && Auth.getCurrentUser().role != 'admin') 
        dataToSend["userid"] = Auth.getCurrentUser()._id;
    	if(!vm.master && selectedIds.length == 0){
    		Modal.alert("Please select auction to export.");
    		return;
    	}
    	if(!vm.master)
    		dataToSend['ids'] = selectedIds;
        AuctionSvc.export(dataToSend)
        .then(function(buffData){
          saveAs(new Blob([s2ab(buffData)],{type:"application/octet-stream"}), "auctions_"+ new Date().getTime() +".xlsx")
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

    function updateStatus(auctionReq,status){
      if(!status)
        return;
      AuctionSvc.updateStatus(auctionReq,status)
      .then(function(result){
        AuctionSvc.sendNotification(auctionReq,UtilSvc.getStatusOnCode(auctionStatuses,status).notificationText,2);
      });
    }
}

})();
