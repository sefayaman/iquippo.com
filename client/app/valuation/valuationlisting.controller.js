(function(){
'use strict';
angular.module('sreizaoApp').controller('ValuationListingCtrl',ValuationListingCtrl);
function ValuationListingCtrl($scope,Modal,Auth,ValuationSvc,) {
 	var vm = this;
	 vm.valuations = [];
	 function init(){
	 	Auth.isLoggedInAsync(function(loggedIn){
	 		if(loggedIn){
	 			var filter = {};
	 			if(!Auth.isPartner()){
	 				filter['partnerId'] = Auth.getCurrentUser().partnerId;
	 				filter['statuses'] = ['request submitted','in process','completed']; 
	 			}else if(Auth.isCustomer()){
	 				filter['userId'] = Auth.getCurrentUser().userId;
	 			}
	 			getValuations(filter);
	 		}
	 	})
	 }
	 
	 init();
	 function getValuations(filter){
	 	ValuationSvc.getOnFilter(filter)
	 	.then(function(result){
	 		vm.valuations = result;
	 	})

	 }
}

})();
