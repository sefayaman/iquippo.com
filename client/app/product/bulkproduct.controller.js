(function(){
'use strict';
angular.module('sreizaoApp')
.controller('BulkProductCtrl',BulkProductCtrl);

/* Controller function */

function BulkProductCtrl($scope,$rootScope,$window,uploadSvc,productSvc,settingSvc,Modal,Auth,notificationSvc,$uibModal,suggestionSvc){
  var vm = this;
  var imageCounter = 0;
  
  vm.showDataSection = true;
  vm.goToImageUpload = goToImageUpload;
  vm.products = [];
  vm.currentProduct = null;
  vm.currentProductIndex = -1;
  vm.deleteImg = deleteImg;
  vm.makePrimary = makePrimary;
  vm.submitProduct = submitProduct;
  vm.backToData = backToData;
  vm.openPreviewImg = openPreviewImg;
  vm.images = [];

  $scope.updateTemplate = updateTemplate;

  //listen for the file selected event
  $scope.$on("fileSelected", function (event, args) {
      if(args.files.length == 0)
        return;
      $scope.$apply(function () { 
        if(args.type == "image")
          uploadProductImages(args.files);
        else
          uploadExcel(args.files[0]);       
      });
  });

  function goToImageUpload(idx){
    vm.currentProduct = vm.products[idx];
    vm.currentProductIndex = idx;
    vm.images = [{isPrimary:true},{},{},{},{},{},{},{}];
    vm.showDataSection = false;
  }
   
  function updateTemplate(files){
    if(!files[0])
      return;
    if(files[0].name.indexOf('.xlsx') == -1){
        Modal.alert('Please upload a valid file');
        return;

      }

      uploadSvc.upload(files[0],templateDir)
      .then(function(res){
        var serData = {};
        serData.key = UPLOAD_TEMPLATE_KEY;
        serData.value = res.data.filename;
        settingSvc.upsert(serData)
        .then(function(stRes){
          getTemplateName();
          Modal.alert("Template updated successfully.",true);
        })
        .catch(function(stRes){
          Modal.alert("There are some issue.Please try later.",true);
        })
      })
      .catch(function(res){
          Modal.alert("There are some issue.Please try later.",true);
      })

  }

  function getTemplateName(){
    settingSvc.get(UPLOAD_TEMPLATE_KEY)
    .then(function(res){
         vm.template = res.value;
         console.log(res);

      })
      .catch(function(stRes){
        
      })
  }
  getTemplateName();

  function uploadExcel(file){
    if(!file)
      return;
     if(file.name.indexOf('.xlsx') == -1){
        Modal.alert('Please upload a valid file');
        return;

      }
    uploadSvc.upload(file,importDir)
    .then(function(result){
      var fileName = result.data.filename;
      $rootScope.loading = true;
      productSvc.loadUploadedBulkProduct(fileName)
      .then(function(res){
          $rootScope.loading = false;
          vm.products = vm.products.concat(res.successList);
          var totalRecord = res.successList.length + res.errorList.length;
          var message =  res.successList.length + " out of "+ totalRecord  + " records are  processed successfully.";
          if(res.errorList.length > 0){
             var data = {};
            data['to'] = Auth.getCurrentUser().email;
            data['subject'] = 'Bulk produt upload error details.';
            var serData = {};
            serData.serverPath = serverPath;
            serData.errorList = res.errorList;
            notificationSvc.sendNotification('BulkProductUploadError', data, serData,'email');
            message += "Error details have been sent on registered email id.";
          }
          $scope.successMessage = message;
          $scope.autoSuccessMessage(20);          
      })
      .catch(function(res){
        $rootScope.loading = false;
        Modal.alert("error in parsing data",true);
      })
    })
    .catch(function(res){
       Modal.alert("error in file upload",true);
    });
  }

  function uploadProductImages(files){
    if(files.length == 0)
      return;
    if(files.length > 8){
      alert("Maximum 8 images are allowed.");
      return;
    }
    var emptCell = getEmptySellCount();
    if(!emptCell){
      alert("8 images are already uploaded.");
      return;
    }
    if(files.length > emptCell){
      alert("Maximum 8 images are allowed.");
      return;
    }
    var assetDir = "";
    if(vm.currentProduct.assetDir)
      assetDir = vm.currentProduct.assetDir;
    uploadSvc.saveFiles(files,assetDir)
    .then(function(result){
       var fileRes = result.data.files;
       vm.currentProduct.assetDir = result.data.assetDir;
       for(var i=0;i < fileRes.length; i++){   
          var emptyIndex = getEmptyImageIndex();
          if(emptyIndex != -1)
            vm.images[emptyIndex].src = fileRes[i].filename;
       }
    })
    .catch(function(res){
      $rootScope.loading = false;
       alert("error in file upload");
    })

  }

  function getEmptyImageIndex(){
      var index = -1;
      for(var i =0; i < vm.images.length;i++){
        if(!vm.images[i].src){
          index = i;
          break;
        }  
      }
      return index;  
  }

  function getEmptySellCount(){
    var emptyCell = 0;
    vm.images.forEach(function(item,idx){
      if(!item.src)
        emptyCell ++;
    });
    return emptyCell;
  }

  function  deleteImg(idx){
      vm.images[idx] = {};
  }

  function makePrimary(idx){
    vm.images.forEach(function(item,idx){
      item.isPrimary = false;
    });
    vm.images[idx].isPrimary = true;
  }

function submitProduct(){
    //Adding user info
  if(!Auth.getCurrentUser()._id)
    return;
  vm.currentProduct.user = {};
  vm.currentProduct.user._id = Auth.getCurrentUser()._id;
  vm.currentProduct.user.fname = Auth.getCurrentUser().fname;
  vm.currentProduct.user.mname = Auth.getCurrentUser().mname;
  vm.currentProduct.user.lname = Auth.getCurrentUser().lname;
  vm.currentProduct.user.role = Auth.getCurrentUser().role;
  vm.currentProduct.user.userType = Auth.getCurrentUser().userType;
  vm.currentProduct.user.phone = Auth.getCurrentUser().phone;
  vm.currentProduct.user.mobile = Auth.getCurrentUser().mobile;
  vm.currentProduct.user.email = Auth.getCurrentUser().email;
  vm.currentProduct.user.country = Auth.getCurrentUser().country;
  vm.currentProduct.user.company = Auth.getCurrentUser().company;
  var suggestions = [];
  suggestions[suggestions.length] = {text:vm.currentProduct.group.name}
  suggestions[suggestions.length] = {text:vm.currentProduct.category.name}
  suggestions[suggestions.length] = {text:vm.currentProduct.model.name}
  suggestions[suggestions.length] = {text:vm.currentProduct.name};
  if(Auth.isAdmin()){
    vm.currentProduct.status = true;
    vm.currentProduct.applyWaterMark = true;
  }else{
    vm.currentProduct.status = false;
    vm.currentProduct.applyWaterMark = false;
  }
  vm.currentProduct.images = [];
  vm.images.forEach(function(item,idx){
    if(item.src){
      vm.currentProduct.images[vm.currentProduct.images.length] = item;
      if(item.isPrimary)
        vm.currentProduct.primaryImg = item.src;
    }  

  });

  if(vm.currentProduct.images.length == 0){
        Modal.alert("Please upload atleast one image.",true);
        $rootScope.loading = false;
        return;
  }

  $rootScope.loading = true;
  productSvc.addProduct(vm.currentProduct).then(function(result){

      $rootScope.loading = false;
      suggestionSvc.buildSuggestion(suggestions);
        if(result && result.productId) {
          var productHistory = {}
          productHistory.history = {};
          productHistory.user = {};

          productHistory.type = "Create";
          productHistory.history = result.data;
          productHistory.user = $rootScope.getCurrentUser();
          productSvc.addProductInHistory(productHistory).then(function(result){
            $rootScope.loading = false;
          });
        }

        if(Auth.isAdmin()) {
          mailToCustomerForApprovedAndFeatured(result, vm.currentProduct);
          } else {
          var data = {};
          data['to'] = supportMail;
          data['subject'] = 'Product Upload: Request for activation';
          result.data.serverPath = serverPath;
          notificationSvc.sendNotification('productUploadEmailToAdmin', data, result.data,'email');
      }
      vm.showDataSection = true;
      vm.products.splice(vm.currentProductIndex,1);
      vm.currentProduct = null;
      vm.currentProductIndex = -1;
  })
  .catch(function(res){
    $rootScope.loading = false;
    Modal.alert("There are some issue.Please try later.",true);
  });
}

function backToData(){
  vm.showDataSection = true;
  vm.currentProduct = null;
  vm.currentProductIndex = -1;
}

function mailToCustomerForApprovedAndFeatured(result, product) {
    if(result && result.status)
    {
      var data = {};
      data['to'] = product.seller.email;
      data['subject'] = 'Request for Product Upload : Approved';
      product.serverPath = serverPath;
      notificationSvc.sendNotification('productUploadEmailToCustomerActive', data, product,'email');
    }
    if(result && result.featured)
    {
      var data = {};
      data['to'] = product.seller.email;
      data['subject'] = 'Request for Product Upload : Featured';
      product.serverPath = serverPath;
      notificationSvc.sendNotification('productUploadEmailToCustomerFeatured', data, product,'email');
    }
  }

  function openPreviewImg(idx){
     if(!vm.images[idx].src)
          return;
        var localScope = $rootScope.$new();
        localScope.src = $rootScope.uploadImagePrefix + vm.currentProduct.assetDir + "/" + vm.images[idx].src;
        var prvModal = $uibModal.open({
            templateUrl: "prvImg.html",
            scope: localScope,
            size: 'lg'
        });
        localScope.close = function(){
          prvModal.close();  
        }
  }

}
})();



  
