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
    var leftTopDim = {width:165,height:255};
    var leftBottomDim = {width:165,height:255};
    var bottomCentreDim = {width:680,height:100};
    
    //listen for the file selected event
    $scope.$on("fileSelected", function (event, args) {
        if(args.length == 0)
          return;
        $scope.$apply(function () {            
            //add the file object to the scope's files collection
           var resizeParam = {};
           resizeParam.resize = true;
           switch($scope.checked){
            case 'leftTop':
              resizeParam.width = leftTopDim.width;
              resizeParam.height = leftTopDim.height;
            break;
            case 'leftBottom':
             resizeParam.width = leftBottomDim.width;
             resizeParam.height = leftBottomDim.height;
            break;
            case 'bottomCentre':
              resizeParam.width = bottomCentreDim.width;
              resizeParam.height = bottomCentreDim.height;
            break;

           }
           uploadSvc.upload(args.files[0],classifiedAdDir,resizeParam).then(function(result){
             vm.classified.image = result.data.filename;
           });
        });
    });

    function reset(){
      $scope.checked = "";
      vm.classified = {};
    }

     function resetImages(){
         vm.classified.image = "";
     }

     function previewImg(img){ 
          var prevScope = $rootScope.$new();
          
          if(!vm.classified.image){
            Modal.alert("image is not uploaded for  this section");
            return;
          }
          prevScope.img_src =  $scope.uploadImagePrefix + "classifiedad/" + vm.classified.image;
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

      if(!vm.classified.image){
        Modal.alert("Please upload image",true);
        return;
      }
      if($scope.form.$invalid){
        $scope.form.submitted = true;
        return;
      }

      $rootScope.loading = true;
      if(Auth.getCurrentUser()._id)
          vm.classified.userid = Auth.getCurrentUser()._id;
          vm.classified.position = $scope.checked;
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
  };

  function closeDialog() {
     $uibModalInstance.dismiss('cancel');
   };
}

})();



  
