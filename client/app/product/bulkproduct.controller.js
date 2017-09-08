(function(){
'use strict';
angular.module('sreizaoApp')
.controller('BulkProductCtrl',BulkProductCtrl);

/* Controller function */

function BulkProductCtrl($state,$scope,$rootScope,$window,uploadSvc,productSvc,settingSvc,Modal,Auth,notificationSvc,$uibModal,suggestionSvc,commonSvc){
  var vm = this;
  var imageCounter = 0;
  
  vm.showDataSection = true;
  vm.goToImageUpload = goToImageUpload;
  vm.products = [];
  vm.currentProduct = null;
  vm.deleteImg = deleteImg;
  vm.makePrimary = makePrimary;
  vm.submitProduct = submitProduct;
  vm.backToData = backToData;
  vm.openPreviewImg = openPreviewImg;
  vm.deleteProduct = deleteProduct;
  $scope.assetStatuses = assetStatuses;
  vm.images = [];
  $scope.templateDir = $rootScope.templateDir;
  $scope.updateTemplate = updateTemplate;
  $scope.uploadZip = uploadZip;

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

  function loadIncomingProduct(){
    var obj = {
      userId:Auth.getCurrentUser()._id
    }; 
    productSvc.loadIncomingProduct(obj)
    .then(function(result){
      vm.products = result;
    });
  }


  //starting point
  Auth.isLoggedInAsync(function(loggedIn){
    if(loggedIn){
      loadIncomingProduct();
    }else
    $state.go("main")
  });

  function goToImageUpload(productId){
    productSvc.getIncomingProduct(productId)
    .then(function(prd){
      vm.currentProduct = prd; 
      vm.images = [{isPrimary:true},{},{},{},{},{},{},{}];
      vm.showDataSection = false; 
    })
    .catch(function(res){
      if(res.data.errorCode == 1)
          Modal.alert('This product is deleted or locked by the system');
    })

    
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
      productSvc.parseExcel(fileName)
      .then(function(res){

          loadIncomingProduct();
          $rootScope.loading = false;
          var totalRecord = res.totalCount;
          var message =  res.successCount + " out of "+ totalRecord  + " records are  processed successfully.";
          if(res.errorList.length > 0){
             var data = {};
            data['to'] = Auth.getCurrentUser().email;
            data['subject'] = 'Bulk produt upload error details.';
            var serData = {};
            serData.serverPath = serverPath;
            serData.errorList = res.errorList;
            notificationSvc.sendNotification('BulkProductStatusUpdateError', data, serData,'email');
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

  function uploadZip(files){
    if(files.length == 0)
      return;
    if(files[0].name.indexOf('.zip') == -1){
        Modal.alert('Please upload a zip file');
        return;

      }
     uploadSvc.upload(files[0],tempDir)
    .then(function(result){
       var task = {};
       task['taskType'] = "bulkproduct";
       task.user = {};
       task.user._id = Auth.getCurrentUser()._id;
       task.user.email = Auth.getCurrentUser().email;
       task.taskInfo = {};
       task.taskInfo.filename = result.data.filename;
       commonSvc.createTask(task)
       .then(function(dt){
          Modal.alert("your bulk product request is submitted successfully.");
       });

    })
    .catch(function(res){
      $rootScope.loading = false;
       alert("error in file upload");
    })
  }

  var imgDim = {width:700,height:459};
  function uploadProductImages(files){
    var resizeParam = {};
    resizeParam.resize = true;
    resizeParam.width = imgDim.width;
    resizeParam.height = imgDim.height; 
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
    uploadSvc.saveFiles(files,assetDir,resizeParam)
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
  vm.currentProduct.assetStatuses = [];
  vm.currentProduct.assetStatus = assetStatuses[0].code;
  var stObj = {};
  stObj.userId = vm.currentProduct.user._id;
  stObj.status = assetStatuses[0].code;
  stObj.createdAt = new Date();
  vm.currentProduct.assetStatuses[vm.currentProduct.assetStatuses.length] = stObj;

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
  var idToDelete = delete vm.currentProduct._id;
  productSvc.addProduct(vm.currentProduct).then(function(result){
      $rootScope.loading = false;
      productSvc.deleteIncomingProduct(idToDelete)
      .then(function(result){
        loadIncomingProduct();
      });
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
      vm.currentProduct = null;
  })
  .catch(function(res){
    $rootScope.loading = false;
    if(res.data.errorCode == 1){
       Modal.alert("Asset_Id is already exist.",true);
    }else
      Modal.alert("There are some issue.Please try later.",true);
  });
}

function backToData(){
 vm.showDataSection = true;
  productSvc.unlockIncomingProduct(vm.currentProduct._id)
  .then(function(res){
    vm.currentProduct = null;
  });
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

  function deleteProduct(productId){
    Modal.confirm("Are you sure want to delete?",function(ret){
        if(ret == "yes")
          productSvc.deleteIncomingProduct(productId)
          .then(function(result){
            loadIncomingProduct();
          })
          .catch(function(res){
            if(res.data.errorCode == 1){
              Modal.alert("This product is already uploaded or removed by system.")
            }
          });
      });
  }

}
})();



  
