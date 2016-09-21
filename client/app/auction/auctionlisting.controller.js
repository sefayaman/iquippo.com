(function(){
'use strict';
angular.module('sreizaoApp').controller('AuctionListingCtrl',AuctionListingCtrl);

function AuctionListingCtrl($scope,Modal,Auth,AuctionSvc) {
 var vm = this;
 vm.auctions = [];
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
}

})();
