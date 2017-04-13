(function(){
  'use strict';

angular.module('classifiedAd').controller('ClassifiedAdCtrl', ClassifiedAdCtrl);

//Controller function

function ClassifiedAdCtrl($scope,$rootScope, uploadSvc,Auth, classifiedSvc,$uibModalInstance,$uibModal,Modal, notificationSvc, LocationSvc, UtilSvc) {
    //Start NJ : classifiedAdClick object push in GTM dataLayer
    dataLayer.push(gaMasterObject.classifiedAdClick);
    //NJ :set Start Time of classifiedAd Start Time
    $scope.classifiedAdStartTime = new Date();
    //End
    var vm = this;
    $scope.checked = "";
    var leftTopDim = {width:165,height:135};
    var leftCenterDim = {width:165,height:135};
    var leftBottomDim = {width:165,height:135};
    var bottomLeftDim = {width:680,height:100};
    var bottomRightDim = {width:680,height:100};
    vm.classified = {};
    vm.classified.image = "";


    //vm.addClassifiedAd = addClassifiedAd;
    vm.addOrUpdate = addOrUpdate;
    vm.reset = reset;
    vm.resetImages = resetImages;
    vm.previewImg = previewImg;
    vm.closeDialog = closeDialog;
    vm.onCodeChange = onCodeChange;

    function init(){

      if(!$scope.edit){
          if(Auth.getCurrentUser()._id) {
          vm.classified.fname = Auth.getCurrentUser().fname;
          vm.classified.mname = Auth.getCurrentUser().mname;
          vm.classified.lname = Auth.getCurrentUser().lname;
          vm.classified.phone = Auth.getCurrentUser().phone;
          vm.classified.country = Auth.getCurrentUser().country;
          vm.classified.mobile = Auth.getCurrentUser().mobile;
          vm.classified.email = Auth.getCurrentUser().email;
          vm.classified.countryCode = LocationSvc.getCountryCode(Auth.getCurrentUser().country);
        } else {
          vm.classified = {}
        }

      }else{
        vm.classified = $scope.classified;
        $scope.checked = $scope.classified.position;
        vm.classified.countryCode = LocationSvc.getCountryCode(vm.classified.country);
        //vm.classified.image = $scope.classified.image;
      }
    }
    init();

    function onCodeChange(code) {
      vm.classified.country = LocationSvc.getCountryNameByCode(code);
    }

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
             case 'leftCenter':
             resizeParam.width = leftCenterDim.width;
             resizeParam.height = leftCenterDim.height;
            break;
            case 'leftBottom':
             resizeParam.width = leftBottomDim.width;
             resizeParam.height = leftBottomDim.height;
            break;
            case 'bottomLeft':
              resizeParam.width = bottomLeftDim.width;
              resizeParam.height = bottomLeftDim.height;
            case 'bottomRight':
              resizeParam.width = bottomRightDim.width;
              resizeParam.height = bottomRightDim.height;
            break;

           }
           uploadSvc.upload(args.files[0],classifiedAdDir,resizeParam).then(function(result){
             vm.classified.image = result.data.filename;
           });
        });
    });

    function reset(){
      //Start NJ : classifiedAdReset object push in GTM dataLayer
      dataLayer.push(gaMasterObject.classifiedAdReset);
      //NJ:set classifiedAd Reset Time
      var classifiedAdResetTime = new Date();
      var timeDiff = Math.floor(((classifiedAdResetTime - $scope.classifiedAdStartTime)/1000)*1000);
      gaMasterObject.classifiedAdResetTime.timingValue = timeDiff;
      ga('send', gaMasterObject.classifiedAdResetTime);
      //End
      $scope.checked = "";
      vm.classified = {};
    }

     function resetImages(){
       //Start NJ : classifiedAdReset object push in GTM dataLayer
         dataLayer.push(gaMasterObject.classifiedAdReset);
         //NJ:set classifiedAd Reset Time
         var classifiedAdResetTime = new Date();
         var timeDiff = Math.floor(((classifiedAdResetTime - $scope.classifiedAdStartTime)/1000)*1000);
         gaMasterObject.classifiedAdResetTime.timingValue = timeDiff;
         ga('send', gaMasterObject.classifiedAdResetTime);
         //End
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

    function addOrUpdate(){
      var ret = false; 
      if(!vm.classified.image){
        Modal.alert("Please upload image",true);
        return;
      }

      if(!vm.classified.country && vm.classified.countryCode)
          vm.classified.country = LocationSvc.getCountryNameByCode(vm.classified.countryCode);

      if(vm.classified.country && vm.classified.mobile) { 
        var value = UtilSvc.validateMobile(vm.classified.country, vm.classified.mobile);
        if(!value) {
          $scope.form.mobile.$invalid = true;
          ret = true;
        } else {
          $scope.form.mobile.$invalid = false;
          ret = false;
        }
      }
      if($scope.form.$invalid || ret){
        $scope.form.submitted = true;
        return;
      }
      if(!$scope.edit){
        addClassifiedAd();
      }else{
        updateClassifiedAd();
      }

    }
     function addClassifiedAd() {
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
              //Start NJ : classifiedAdSubmit object object push in GTM dataLayer
              dataLayer.push(gaMasterObject.classifiedAdSubmit);
              //NJ:set classifiedAd Reset Time
              var classifiedAdSubmitTime = new Date();
              var timeDiff = Math.floor(((classifiedAdSubmitTime - $scope.classifiedAdStartTime)/1000)*1000);
              gaMasterObject.classifiedAdSubmitTime.timingValue = timeDiff;
              ga('send', gaMasterObject.classifiedAdSubmitTime);
              //End
              //End
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

  function updateClassifiedAd(){
      vm.classified.position = $scope.checked;
      if(Auth.getCurrentUser()._id)
        vm.classified.updatedByUserId = Auth.getCurrentUser()._id;
      $rootScope.loading = true;
      classifiedSvc.updateClassifiedAd(vm.classified).then(function(result){
        $rootScope.loading = false;
       if(result.data.errorCode){
          Modal.alert(result.data.message);
        }
        else {
           $uibModalInstance.close();
           Modal.alert("ClassifiedAd Updated",true);
         }
      });
  }


  function closeDialog() {
     //Start NJ : classifiedAdClose object push in GTM dataLayer
     dataLayer.push(gaMasterObject.classifiedAdClose);
     //NJ:set classifiedAd Close Time
     var classifiedAdCloseTime = new Date();
     var timeDiff = Math.floor(((classifiedAdCloseTime - $scope.classifiedAdStartTime)/1000)*1000);
     gaMasterObject.classifiedAdCloseTime.timingValue = timeDiff;
     ga('send', gaMasterObject.classifiedAdCloseTime);
     //End
     $uibModalInstance.dismiss('cancel');
   };
}

})();
