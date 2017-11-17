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
      link: function(scope, element,attrs,ngModel) {
        
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
})
.directive('yearOnlyPicker', function($timeout) {
  return {
      restrict: 'E',
      scope: {
          ngModel: "=",
          year:"=",
          myid: "@",
          placeholder: "@",
          format:"@",
          onChange:"&"
      },
      templateUrl: 'components/datepicker/yearonly.html',
      require: 'ngModel',
      link: function(scope, element,attrs,ngModel) {
          scope.onComplete = function(){
            if(scope.ngModel){
               scope.year = scope.ngModel.getFullYear();
            }else
              scope.year = "";
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
