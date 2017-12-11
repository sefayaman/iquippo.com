'use strict';
angular.module('sreizaoApp')
.directive('financeIntegration', function($document,Auth) {
  return {
      restrict: 'E',
      templateUrl: 'components/financing/rapidform.html',
      link: function(scope, element) {

          scope.submitToRapid = function(form){
              angular.element("#access_token").attr('value',"");
              Auth.getTokenAndUrl()
              .then(function(res){
                angular.element("#createnewloan").attr('action',res.actionUrl);
                if(res.token)
                  angular.element("#access_token").attr('value',res.token);
                $document[0].forms.createnewloan.submit();
              })
              .catch(function(){

              });
            };
      }
  };
});
