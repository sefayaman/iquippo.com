(function(){
	'use strict';

angular.module('sreizaoApp').controller('LiveAuctionCtrl', LiveAuctionCtrl);

function LiveAuctionCtrl($scope,$state,Auth, $http,socketSvc,AuctionSvc,$location) {
 $scope.chatStatus=false;
 $scope.chat=chat;
 var query=$location.search();
 var filter={};
  $scope.currentPrice=0;
 $scope.reservePrice=0; 
 
 filter.auctionId=query.auctionId;
 $scope.auctionId=query.auctionId;
 filter.lotId=query.lotNumber;
 $scope.userId=Auth.getCurrentUser()._id;

 console.log("Params",filter);
 function init(){
 	AuctionSvc.liveAuctionRoomData(filter)
 	.then(function(res){
        $scope.reservePrice=res.reservePrice; 
         socket.emit('LivebidUpdateToAllUsers',res);      
 	})
 	.catch(function(err){

 	});
 }
 init();

 var socket=socketSvc.getSocket("http://auctionsoftwaremarketplace.com:3007");
  //socket.emit('LivebidUpdateToAllUsers',{msg:"Welcome to the socket world"});

 socket.on('LivebidUpdateToAllUsers',function(data){
 	console.log("Data",data);
 	$scope.reservePrice=data.reservePrice;
 	$scope.$digest();
 });


function chat(){
$scope.chatStatus=true;
 }
 
 }

})();
