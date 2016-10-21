(function(){
'use strict';

angular.module('account')
.factory('mailService', function($resource) {
    return $resource('/api/messages/:id', { id: '@_id' },
    {
      getusersmails: {
        method: 'GET',
        params: {
          id:'usersmails',
        }
      },
      update: {
        method: 'PUT'
      }
    }
    );

});

})();