(function(){
	'use strict';

angular.module('sreizaoApp').controller('LiveAuctionCtrl', LiveAuctionCtrl);

function LiveAuctionCtrl($scope, $http,socketSvc) {
 $scope.chatStatus=false;
 $scope.chat=chat;

 var socket=socketSvc.getSocket("http://localhost:8100");
 socket.emit('hello',{msg:"Welcome to the socket world"});

 socket.on('hello',function(data){
 	console.log("data is",data);
 	alert("data " + data);
 	$scope.$digest();
 });


function chat(){
$scope.chatStatus=true;
 }
 
 }

})();