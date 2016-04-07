(function(){
  'use strict';

angular.module('classifiedAd').controller('ClassifiedAdCtrl', ClassifiedAdCtrl);

//Controller function

function ClassifiedAdCtrl($scope,$rootScope, uploadSvc,Auth, classifiedSvc,$uibModalInstance,$uibModal,Modal, notificationSvc) {
    
    var vm = this;
    vm.classified = {};
    vm.classified.image = "";

    vm.addClassifiedAd = addClassifiedAd;
    vm.reset = reset;
    vm.resetImages = resetImages;
    vm.previewImg = previewImg;
    vm.closeDialog = closeDialog;

    if(Auth.getCurrentUser()._id) {
      vm.classified.fname = Auth.getCurrentUser().fname;
      vm.classified.mname = Auth.getCurrentUser().mname;
      vm.classified.lname = Auth.getCurrentUser().lname;
      vm.classified.phone = Auth.getCurrentUser().phone;
      
      vm.classified.mobile = Auth.getCurrentUser().mobile;
      vm.classified.email = Auth.getCurrentUser().email;

    } else {
      vm.classified = {}
    }

    $scope.checked = "";
    $scope.leftTopImg = "";
    $scope.leftBottomImg = "";
    $scope.bottomCentreImg = "";

    
    //listen for the file selected event
    $scope.$on("fileSelected", function (event, args) {
        if(args.length == 0)
          return;
        $scope.$apply(function () {            
            //add the file object to the scope's files collection
            $scope.leftTopImg = "";
            $scope.leftBottomImg = "";
            $scope.bottomCentreImg = "";

            $scope[$scope.checked] = args.files[0];
            $scope[$scope.checked + "Img"] =  args.img_src;
        });
    });

    function reset(){
       $scope.checked = "";
      $scope.leftTopImg = "";
      $scope.leftBottomImg = "";
      $scope.bottomCentreImg = "";
      vm.classified = {};
    }

     function resetImages(){
         $scope.leftTopImg = "";
         $scope.leftBottomImg = "";
         $scope.bottomCentreImg = "";
     }

     function previewImg(img){ 
          var prevScope = $rootScope.$new();
          prevScope.img_src = $scope[img];
          if(!prevScope.img_src){
            Modal.alert("image is not uploaded for  this section");
            return;
          }
          var prvModal = $uibModal.open({
              templateUrl: "classifiedAdPreview.html",
              scope: prevScope,
              size: 'lg'
          });
          prevScope.closePrev = function(){
            prvModal.close();
          }

     }

     function addClassifiedAd() {
      
      var ret = false; 
      if(!$scope[$scope.checked]){
        Modal.alert("Please upload image",true);
        return;
      }
      if($scope.form.$invalid || ret){
        $scope.form.submitted = true;
        return;
      }

      $rootScope.loading = true;
      if(Auth.getCurrentUser()._id)
          vm.classified.userid = Auth.getCurrentUser()._id;
          vm.classified.position = $scope.checked;
          uploadSvc.upload($scope[$scope.checked],classifiedAdDir).then(function(result){
          vm.classified.image = result.data.filename;
          classifiedSvc.addClassifiedAd(vm.classified).then(function(result){
          $rootScope.loading = false;
          if(result.data.errorCode){
            Modal.alert(result.data.message,true);
          }
          else {
            var data = {};
            data['to'] = supportMail;
            data['subject'] = 'Request for Classified Ad';
            vm.classified.serverPath = serverPath;
            notificationSvc.sendNotification('classifiedaddEmailToAdmin', data, vm.classified,'email');
            data['to'] = vm.classified.email;
            data['subject'] = 'Request for Classified Ad: Pending for activation';
            notificationSvc.sendNotification('classifiedaddEmailToCustomer',data,{fname:vm.classified.fname, serverPath:vm.classified.serverPath},'email');
            Modal.alert(informationMessage.classifiedSuccess,true);
            closeDialog();
          }
          });

      });
  };

  function closeDialog() {
     $uibModalInstance.dismiss('cancel');
   };
}

})();



  
