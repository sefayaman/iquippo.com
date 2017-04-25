'use strict';
angular.module('sreizaoApp')
.directive('customDatepicker', function($timeout) {
  return {
      restrict: 'E',
      scope: {
          ngModel: "=",
          myid: "@",
          placeholder: "@",
          formate:"@",
          onChange:"&"
      },
      templateUrl: 'components/datepicker/datepicker.html',
      require: 'ngModel',
      link: function(scope, element) {
        
          scope.onComplete = function(){
            $timeout(function(){
              scope.onChange();
            },0)
          }
          scope.open = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            scope.opened = true;
          };

      }
  };
});
