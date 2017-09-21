(function(){
	'use strict';

angular.module('sreizaoApp').controller('LiveAuctionCtrl', LiveAuctionCtrl);
function LiveAuctionCtrl($scope, $http,socketSvc) {
 $scope.chatStatus=false;
 $scope.chat=chat;
 
 function chat(){
$scope.chatStatus=true;
 }
 
 }

})();