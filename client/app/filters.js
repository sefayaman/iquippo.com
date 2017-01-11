'use strict';

angular.module('sreizaoApp')
.filter('startFrom', function() {
    return function(input, start) {
        start = +start;
        if(!input)
        	return; 
        return input.slice(start);
    };
});