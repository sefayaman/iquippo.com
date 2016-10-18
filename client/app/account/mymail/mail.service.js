(function(){
'use strict';

angular.module('account')
.factory('mailService', function($resource) {
	return {

        signin: function() {
            return $resource('/api/login', {
                save: {method: 'POST'}
            });
        },
        signup: function() {
            return $resource('/api/add_user', {
                save: {method: 'POST'}
            });
        },
        buy_pet: function() {
            return $resource('/api/buy_pet', {
                save: {method: 'POST'}
            });
        }
    };
});

})();