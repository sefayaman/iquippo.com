'use strict';

angular.module('sreizaoApp')
 .controller('ClassifiedAdListingCtrl',['$scope','$rootScope', '$http', 'productSvc', 'classifiedSvc','Modal', 'DTOptionsBuilder', 'notificationSvc', function($scope, $rootScope, $http, productSvc, classifiedSvc, Modal, DTOptionsBuilder, notificationSvc) {
  $scope.classifiedAdList = [];
  var dataToSend = {};
  $scope.classified = {};
$scope.dtOptions = DTOptionsBuilder.newOptions().withOption('bFilter', true).withOption('lengthChange', true);

   if($rootScope.getCurrentUser()._id && $rootScope.getCurrentUser().role != 'admin')
      dataToSend["userid"] = $rootScope.getCurrentUser()._id;
   $http.post('/api/classifiedad/search', dataToSend).success(function(srchres){
         $scope.classifiedAdList = srchres;
   });

  $scope.getStatus = function(status){
    if(status == true)
      return "Active";
    else
      return "Inactive";
    }
    $scope.clasifiedAdActive =[];

    $scope.updateClasifiedAd = function(classified) {
      $rootScope.loading = true;
      if(classified.status){
        dataToSend['position'] = classified.position;
         dataToSend["status"] = true;
        $http.post('/api/classifiedad/search', dataToSend).success(function(srchres){
            if(srchres.length > 0) {
                classified.status = false;
                $rootScope.loading = false;
                Modal.alert(classified.position + " is already occupied.Please empty this position first");
                return;
            }else
              updateClassified(classified);
          });
      }else
        updateClassified(classified);
     
      
  };

  function updateClassified(classified){
      classifiedSvc.updateClassifiedAd(classified).then(function(result){
        $rootScope.loading = false;
       if(result.data.errorCode){
          Modal.alert(result.data.message);
        }
        else {
          if(!result.data.status)
            return;
          var data = {};
          data['to'] = classified.email;
          data['subject'] = 'Request for Classified Ad: Approved';
          notificationSvc.sendNotification('classifiedaddEmailToCustomerActive',data,{fname:classified.fname, serverPath:serverPath},'email');
           Modal.alert("ClassifiedAd Updated",true);
         }
      });
  }

}]);
