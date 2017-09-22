(function(){
	'use strict';

angular.module('sreizaoApp').controller('LiveAuctionCtrl', LiveAuctionCtrl);

function LiveAuctionCtrl($scope, $http,socketSvc,AuctionSvc,$location) {
 $scope.chatStatus=false;
 $scope.chat=chat;
 var query=$location.search();
 var filter={};
  $scope.currentPrice=0;
 $scope.reservePrice=0; 

 filter.auctionId="Au2002";
 filter.lotId="126";
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
