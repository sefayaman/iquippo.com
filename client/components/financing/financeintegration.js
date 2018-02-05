'use strict';
angular.module('sreizaoApp')
.directive('financeIntegration', function($document,Auth,$uibModal) {
  return {
      restrict: 'E',
      templateUrl: 'components/financing/rapidform.html',
      link: function(scope, element) {
          scope.submitToRapid = function(form){
              angular.element("#access_token").attr('value',"");
              Auth.getTokenAndUrl()
              .then(function(res){
                if(!res.openOptionPopup)
                  return proceed(res.token,res.actionUrl);
                openOptionModal(res);
              })
              .catch(function(){

              });
            };

            function openOptionModal(res){
              scope.optionModel = {urlkey:"mlp"};
              var optionModal = $uibModal.open({
                templateUrl: "financeoption.html",
                scope: scope,
                size: 'lg'
              });
              scope.close = function() {
                optionModal.dismiss('cancel');
              };
              scope.proceed = function(){
                scope.close();
                proceed(res.token,res[scope.optionModel.urlkey]);
              }
            }

            function proceed(token,url){
              angular.element("#createnewloan").attr('action',url);
              if(token)
                angular.element("#access_token").attr('value',token);
              $document[0].forms.createnewloan.submit();
            }
      }
  };
});
