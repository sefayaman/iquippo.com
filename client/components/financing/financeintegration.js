'use strict';
angular.module('sreizaoApp')
.directive('financeIntegration', function($document,Auth) {
  return {
      restrict: 'E',
      templateUrl: 'components/financing/rapidform.html',
      link: function(scope, element) {

          scope.submitToRapid = function(form){
              angular.element("#sourcing_user_type").attr('value','EC');
              angular.element("#sourcing_user_name").attr('value',"");
              angular.element("#sourcing_user_mobile").attr('value',"");
              angular.element("#location").attr('value',"");
              angular.element("#dealership_name").attr('value',"");
               angular.element("#access_token").attr('value',"");
              if(!Auth.getCurrentUser()._id){
                gotoRapid();
                return;
              }

              if((Auth.isEnterprise() || Auth.isEnterpriseUser()) && Auth.isServiceAvailed("Finance"))
                angular.element("#sourcing_user_type").attr('value','EU');
              if(Auth.isChannelPartner())
                angular.element("#sourcing_user_type").attr('value','CP');
              var userName = Auth.getCurrentUser().fname;
              if(Auth.getCurrentUser().mname)
                userName += " " + Auth.getCurrentUser().mname;
              userName += " " + Auth.getCurrentUser().lname;
              angular.element("#sourcing_user_name").attr('value',userName);
              angular.element("#sourcing_user_mobile").attr('value',Auth.getCurrentUser().mobile);
              angular.element("#location").attr('value',Auth.getCurrentUser().city);
              angular.element("#dealership_name").attr('value',Auth.getCurrentUser().entityName);
              Auth.getNewToken()
              .then(function(res){
                angular.element("#access_token").attr('value',res);
                gotoRapid();
              })
              .catch(function(){

              });
            };

            function gotoRapid(){
              $document[0].forms.createnewloan.submit();
            }
      }
  };
});
