'use strict';
angular.module('sreizaoApp')
.directive('formSubmitter', function($document) {
  return {
      restrict: 'E',
      scope: true,
      templateUrl: 'components/form/form.html',
      link: function(scope, element,attrs,ngModel) {
        scope.name = attrs.name;
        scope.method = attrs.method;
        scope.action = attrs.action;
        scope.$on('submit', function(value){
          //console.log("filter",scope.filter);
          var form = $document[0].forms[scope.name];
          var formElem = angular.element(form);
          formElem.empty();
          if(scope.filter){
            for(var key in scope.filter){
              var inputStr = "<input type='hidden' name='"+ key +"' value='"+ scope.filter[key]+"'>";
              var inputField = angular.element(inputStr);
              formElem.append(inputField);
            }
          }
          form.submit(); 
        });
      }
  };
})
