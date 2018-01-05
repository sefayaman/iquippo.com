'use strict';
angular.module('sreizaoApp')
.directive('exportForm', function($document) {
  return {
      restrict: 'E',
      scope: true,
      templateUrl: 'components/form/exportform.html',
      link: function(scope, element,attrs,ngModel) {
        scope.name = attrs.name;
        if(!scope.name)
          return;
        if(attrs.method)
          scope.method = attrs.method;
        if(attrs.action)
          scope.action = attrs.action;
        scope.$on('submit', function(value,exportObj){
          var form = $document[0].forms[scope.name];
          var formElem = angular.element(form);
          if(exportObj.action)
            formElem.attr('action',exportObj.action);
          if(exportObj.method)
            formElem.attr('method',exportObj.method);
          formElem.empty();
          if(exportObj.filter){
            for(var key in exportObj.filter){
              var inputStr = "<input type='hidden' name='"+ key +"' value='"+ exportObj.filter[key]+"'>";
              var inputField = angular.element(inputStr);
              formElem.append(inputField);
            }
          }
          form.submit(); 
        });
      }
  };
})
