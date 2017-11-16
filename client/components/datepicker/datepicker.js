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
})
.directive('yearOnlyPicker', function($timeout) {
  return {
      restrict: 'E',
      scope: {
          ngModel: "=",
          myid: "@",
          placeholder: "@",
          formate:"@",
          onChange:"&"
      },
      templateUrl: 'components/datepicker/yearonly.html',
      require: 'ngModel',
      link: function(scope, element) {
        scope.today = function() {
            scope.mfgyr = new Date();
          };
            scope.today();
            scope.datepickers = {
              min: false,
              max: false
            };
            scope.clear = function () {
              scope.mfgyr = null;
            };

            // Disable weekend selection
            scope.disabled = function(date, mode) {
              return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
            };

            scope.toggleMin = function() {
              scope.minDate = scope.minDate ? null : new Date();
            };
            scope.toggleMin();
            scope.maxDate = new Date(2020, 5, 22);

            scope.open = function(event, which) {
              event.preventDefault();
              event.stopPropagation();

              if(scope.datepickers[which]== false && which=='min'){
              scope.datepickers[which]= true;
              scope.datepickers.max=false;
          }
            else if(scope.datepickers[which]==false && which=='max'){
                scope.datepickers[which]= true;
                scope.datepickers.min=false;
              }
              else
                scope.datepickers[which]= false;
            
            }

            scope.close=function(event,which){
              scope.datepickers[which]=false;
            }


            scope.setDate = function(year, month, day,key) {
              scope.mfgyr[key] = new Date(year, month, day);
            };

          scope.datepickerOptions = {
            datepickerMode:"'year'",
            minMode:"'year'",
            minDate:"minDate",
            showWeeks:"false",
          };

          scope.formats = ['yyyy', 'dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
          scope.format = scope.formats[0];

          scope.status = {
            opened: false
          };
          scope.datepickerOptions = {
              datepickerMode:"'year'",
              minMode:"'year'",
              minDate:"minDate",
              showWeeks:"false",
            };
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
