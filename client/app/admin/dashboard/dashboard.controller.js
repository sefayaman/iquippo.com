'use strict';

angular.module('sreizaoApp')
  .controller('DashboardCtrl', function ($scope, $location, $window, $rootScope, $http) {
  	$scope.labels = ['2006', '2007', '2008', '2009', '2010', '2011', '2012'];
  	$scope.series = ['Listed', 'Sold'];

  $scope.data = [
	    [65, 59, 80, 81, 56, 55, 40],
	    [28, 48, 40, 19, 86, 27, 90]
	];
	$scope.data2 = [
	    [65, 59, 80, 81, 56, 55, 40]
	];
  
	$scope.label1 = ["Domestic", "International"];
  	$scope.data1 = [300, 500];

  // date calender
   $scope.today = function() {
    $scope.dt = new Date();
  };

  // Disable weekend selection
  $scope.disabled = function(date, mode) {
    return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
  };


  $scope.openfrom = function($event) {
    $scope.status.openedfrom = true;
  };
  $scope.opento = function($event) {
    $scope.status.openedto = true;
  };
  $scope.dateOptions = {
    formatYear: 'yy',
    startingDay: 1
  };

  $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
  $scope.format = $scope.formats[0];

  $scope.status = {
    opened: false
  };

  $scope.linelabel = ["January", "February", "March", "April", "May", "June", "July"];
  $scope.lineseries = ['Supply', 'Demand'];
  $scope.linedata = [
    [65, 59, 80, 81, 56, 55, 40],
    [28, 48, 40, 19, 86, 27, 90]
  ];

  $scope.onClick = function (points, evt) {
    console.log('Points >>', points);
     console.log('event >>', evt);
  };

  $scope.radarlabels = ["Online Sales", "In-Auction Sales", "Mail-Order Sales", "Tele Sales", "Corporate Sales"];
  $scope.radardata = [300, 500, 100, 40, 120];

});




  
