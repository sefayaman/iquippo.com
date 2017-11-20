'use strict';

angular.module('sreizaoApp')
.filter('startFrom', function() {
    return function(input, start) {
        start = +start;
        if(!input)
        	return; 
        return input.slice(start);
    };
})
.filter('unique', function() {

  return function (arr, field) {
  	if(!arr || !arr.length || !field)
  		return arr;

  	var cache = {};
  	var unqueArr = [];
  	for(var i = 0; i< arr.length; i++){
  		var keyVal = _.get(arr[i],field,"");
  		if(!cache[keyVal] && keyVal){
  			unqueArr.push(arr[i]);
  			cache[keyVal] = 1;
  		}
  	}
  	return unqueArr;
  };
});