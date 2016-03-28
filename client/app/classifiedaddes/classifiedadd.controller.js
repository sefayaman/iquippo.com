'use strict';

angular.module('sreizaoApp')
  .controller('ClassifiedAdCtrl', function ($scope, $location, $window, $rootScope, $http, uploadSvc, classifiedSvc,$uibModalInstance,$uibModal,Modal, notificationSvc) {
    $scope.classified = {};
    $scope.classified.image = "";
    if($rootScope.getCurrentUser()._id) {
      $scope.classified.fname = $rootScope.getCurrentUser().fname;
      $scope.classified.mname = $rootScope.getCurrentUser().mname;
      $scope.classified.lname = $rootScope.getCurrentUser().lname;
      $scope.classified.phone = $rootScope.getCurrentUser().phone;
      
      $scope.classified.mobile = $rootScope.getCurrentUser().mobile;
      $scope.classified.email = $rootScope.getCurrentUser().email;
    } else {
      $scope.classified = {}
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

    $scope.reset = function(){
       $scope.checked = "";
      $scope.leftTopImg = "";
      $scope.leftBottomImg = "";
      $scope.bottomCentreImg = "";
      $scope.classified = {};
    }

     $scope.resetImages = function(){
         $scope.leftTopImg = "";
         $scope.leftBottomImg = "";
         $scope.bottomCentreImg = "";
     }

     $scope.previewImg = function(img){ 
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

    $scope.uploadFile = function(files){
      if(!files[0])
        return;
        uploadSvc.upload(files[0],classifiedAdDir).then(function(result){
          $scope.classified.image = result.data.filename;
        })
    };

     $scope.addClassifiedAd = function(classified) {
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
      if($rootScope.getCurrentUser()._id)
          $scope.classified.userid = $rootScope.getCurrentUser()._id;
          $scope.classified.position = $scope.checked;
          uploadSvc.upload($scope[$scope.checked],classifiedAdDir).then(function(result){
          $scope.classified.image = result.data.filename;
          classifiedSvc.addClassifiedAd(classified).then(function(result){
          $rootScope.loading = false;
          if(result.data.errorCode){
            Modal.alert(result.data.message,true);
          }
          else {
            var data = {};
            data['to'] = supportMail;
            data['subject'] = 'Request for Classified Ad';
            classified.serverPath = serverPath;
            notificationSvc.sendNotification('classifiedaddEmailToAdmin', data, classified,'email');
            data['to'] = classified.email;
            data['subject'] = 'Request for Classified Ad: Pending for activation';
            notificationSvc.sendNotification('classifiedaddEmailToCustomer',data,{fname:classified.fname, serverPath:classified.serverPath},'email');
            Modal.alert(informationMessage.classifiedSuccess,true);
            $scope.closeDialog();
          }
          });

      });
  };

  $scope.closeDialog = function () {
     $uibModalInstance.dismiss('cancel');
    };
});



  
