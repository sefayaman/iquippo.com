(function(){
  'use strict';

angular.module('classifiedAd').controller('ClassifiedAdListingCtrl',ClassifiedAdListingCtrl);

function ClassifiedAdListingCtrl($scope, $rootScope,Auth ,$http, productSvc, classifiedSvc, Modal, DTOptionsBuilder, notificationSvc) {
  
  var vm = this;
  vm.classifiedAdList = [];
  var dataToSend = {};
  vm.classified = {};
  vm.updateClasifiedAd = updateClasifiedAd;

  $scope.dtOptions = DTOptionsBuilder.newOptions().withOption('bFilter', true).withOption('lengthChange', true);

   if(Auth.getCurrentUser()._id && Auth.getCurrentUser().role != 'admin')
      dataToSend["userid"] = Auth.getCurrentUser()._id;
    
    classifiedSvc.getClassifiedAdOnFilter(dataToSend)
    .then(function(result){
      vm.classifiedAdList = result;
    });
   

    function updateClasifiedAd(classified) {

      $rootScope.loading = true;
      if(classified.status){
        dataToSend['position'] = classified.position;
         dataToSend["status"] = true;
        classifiedSvc.getClassifiedAdOnFilter(dataToSend)
        .then(function(srchres){
          if(srchres.length > 0) {
                classified.status = false;
                $rootScope.loading = false;
                Modal.alert(classified.position + " is already occupied.Please empty this position first");
                return;
            }else
              updateClassified(classified);
        });
     }else{
        updateClassified(classified);
     }
      
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

}

})();
