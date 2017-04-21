(function(){
'use strict';
angular.module('sreizaoApp').controller('EnterpriseDashboradCtrl',EnterpriseDashboradCtrl);
function EnterpriseDashboradCtrl($scope, $rootScope) {
 	var vm = this;
 	 $scope.$parent.tabValue = 'dashboard';
 	 $scope.options = {
	    chart: {
	        type: 'discreteBarChart',
	        height: 450,
	        margin : {
	            top: 20,
	            right: 20,
	            bottom: 100,
	            left: 55
	        },
	        x: function(d){ return d.label; },
	        y: function(d){ return d.value; },
	        showValues: true,
	        valueFormat: function(d){
	            return d3.format(',.4f')(d);
	        },
	        transitionDuration: 500,
	        xAxis: {
	            // axisLabel: 'X Axis',
	            rotateLabels: 20,
	            width:20
	        },
	        yAxis: {
	            axisLabel: 'Number of Counts',
	            axisLabelDistance: -10
	        },
	        width:500,
	        forceY:60	        
	    }
	};
	$scope.data = [{
	    key: "Cumulative Return",
	    values: [
	        { "label" : "Inspection Request" , "value" : 42 },
	        { "label" : "Invoice" , "value" : 25 },
	        { "label" : "Invoice Paid" , "value" : 17 }
	    ]
	}];
}

})();
