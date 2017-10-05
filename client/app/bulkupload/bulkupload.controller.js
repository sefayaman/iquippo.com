(function() {
  'use strict';
  angular.module('sreizaoApp')
    .controller('BulkUploadCtrl', BulkUploadCtrl);

  /* Controller function */

  function BulkUploadCtrl($scope, $rootScope, bulkuploadSvc, uploadSvc, $location, settingSvc, Modal, Auth, notificationSvc, $uibModal, suggestionSvc, commonSvc) {
    var vm = this;
    vm.template = '';
    vm.showDataSection = true;
    vm.products = [];
    vm.spareUploads = [];
    vm.currentProduct = null;
    //vm.deleteImg = deleteImg;
    //vm.makePrimary = makePrimary;
    //vm.openPreviewImg = openPreviewImg;
    //$scope.assetStatuses = assetStatuses;
    vm.deleteProduct = deleteProduct;
    $scope.successMessage = "";
    $scope.type = "";
    vm.images = [];
    vm.uploadTemplate = "Bulk_upload_auction.xlsx";
    $scope.uploadImagePrefix = $rootScope.templateDir;

    $scope.uploadZip = uploadZip;

    var query = $location.search();
    var type = query.type || 'auction';
    $scope.type = type;

    switch (type) {
      case 'auction':
        vm.uploadTemplate = 'Bulk_upload_auction.xlsx';
        break;
      case 'spareUpload':
        vm.uploadTemplate = 'Spares_Bulk_Upload_Template.xlsx';
        break;
      default:
        Modal.alert('Invalod Choice');
        break;
    }
    //listen for the file selected event
    $scope.$on("fileSelected", function(event, args) {
      if (args.files.length === 0)
        return;
      $scope.$apply(function() {
        // if (args.type === "image")
        //   uploadProductImages(args.files);
        // else
          uploadExcel(args.files[0]);
      });
    });

    function loadIncomingProduct() {
      vm.products = [];
      bulkuploadSvc.loadIncomingProduct()
        .then(function(result) {
          vm.spareUploads = result.data.spareUploads;
          vm.products =  result.data.productUploads;
        });
    }

    loadIncomingProduct();

    function updateTemplate(files) {
      if (!files[0])
        return;
      if (files[0].name.indexOf('.xlsx') === -1) {
        Modal.alert('Please upload a valid file');
        return;

      }
      uploadSvc.upload(files[0], templateDir)
        .then(function(res) {
          var serData = {};
          serData.key = UPLOAD_TEMPLATE_KEY;
          serData.value = res.data.filename;
          settingSvc.upsert(serData)
            .then(function(stRes) {
              getTemplateName();
              Modal.alert("Template updated successfully.", true);
            })
            .catch(function(stRes) {
              Modal.alert("There are some issue.Please try later.", true);
            });
        })
        .catch(function(res) {
          Modal.alert("There are some issue.Please try later.", true);
        });

    }

    function getTemplateName() {
      settingSvc.get(UPLOAD_TEMPLATE_KEY)
        .then(function(res) {
          vm.template = res.value;

        })
        .catch(function(stRes) {

        });
    }
    getTemplateName();

    function uploadExcel(file) {
      if (!file)
        return;
      if (file.name.indexOf('.xlsx') === -1) {
        Modal.alert('Please upload a valid file');
        return;

      }
      uploadSvc.upload(file, importDir)
        .then(function(result) {
          var fileName = result.data.filename;
          $rootScope.loading = true;
          var url = '';
          switch (type) {
            case 'auction':
              url = '/api/auction/upload/excel';
              vm.uploadType = 'bulkauction';
              vm.template = 'Bulk_upload_auction.xlsx';
              break;
            case 'spareUpload':
              url = '/api/spare/upload/excel';
              vm.uploadType = 'spareUpload';
              vm.template = 'Spares_Bulk_Upload_Template.xlsx';
              break;
            default:
              Modal.alert('Invalod Choice');
              break;

          }

          bulkuploadSvc.parseExcel(fileName, url)
            .then(function(res) {
              var template = 'BulkUploadError';
              loadIncomingProduct();
              $rootScope.loading = false;
              var totalRecord = res.successObj + res.errObj.length + res.duplicateRecords.length;
              var message = res.successObj + " out of " + totalRecord + " records are  processed successfully.";
              if (res.errObj.length > 0 || res.duplicateRecords.length) {
                var data = {};
                var subject = 'Bulk produt upload error details.';
                if(type === 'spareUpload'){
                  template = 'BulkSpareUploadError';
                  subject = 'Bulk Spare upload error details';
                }
                data['to'] = Auth.getCurrentUser().email;
                data['subject'] = subject ;
                var serData = {};
                serData.serverPath = serverPath;
                serData.errorList = res.errObj;
                if (res.duplicateRecords.length)
                  serData.errorList = serData.errorList.concat(res.duplicateRecords);
                
                notificationSvc.sendNotification(template, data, serData, 'email');
                message += "Error details have been sent on registered email id.";
              }
              $scope.successMessage = message;
              $scope.autoSuccessMessage(20);
            })
            .catch(function(res) {
              $rootScope.loading = false;
              Modal.alert("error in parsing data", true);
            });
        })
        .catch(function(res) {
          Modal.alert("error in file upload", true);
        });
    }

    function uploadZip(files) {
      if (files.length === 0)
        return;
      if (files[0].name.indexOf('.zip') === -1) {
        Modal.alert('Please upload a zip file');
        return;

      }
      uploadSvc.upload(files[0], tempDir)
        .then(function(result) {
          var task = {};
          switch (type) {
            case 'auction':
              task.taskType = 'bulkauction';
              break;
            case 'spareUpload':
              task.taskType = 'bulkSpare';
              break;
            default:
              Modal.alert('Invalod Choice');
              break;

          }
          task.user = {};
          task.user._id = Auth.getCurrentUser()._id;
          task.user.email = Auth.getCurrentUser().email;
          task.taskInfo = {};
          task.taskInfo.filename = result.data.filename;
          commonSvc.createTask(task)
            .then(function(dt) {
              var msg = "your bulk product request is submitted successfully.";
              if(type === 'spareUpload')
                msg = "Your Bulk Spare Upload Request Submitted Successfully";
              
              Modal.alert(msg);
            });
        })
        .catch(function(res) {
          $rootScope.loading = false;
          alert("error in file upload");
        })
    }

    // var imgDim = {
    //   width: 700,
    //   height: 459
    // };

    // function uploadProductImages(files) {
    //   var resizeParam = {};
    //   resizeParam.resize = true;
    //   resizeParam.width = imgDim.width;
    //   resizeParam.height = imgDim.height;
    //   if (files.length == 0)
    //     return;
    //   if (files.length > 8) {
    //     alert("Maximum 8 images are allowed.");
    //     return;
    //   }
    //   var emptCell = getEmptySellCount();
    //   if (!emptCell) {
    //     alert("8 images are already uploaded.");
    //     return;
    //   }
    //   if (files.length > emptCell) {
    //     alert("Maximum 8 images are allowed.");
    //     return;
    //   }
    //   var assetDir = "";
    //   if (vm.currentProduct.assetDir)
    //     assetDir = vm.currentProduct.assetDir;
    //   uploadSvc.saveFiles(files, assetDir, resizeParam)
    //     .then(function(result) {
    //       var fileRes = result.data.files;
    //       vm.currentProduct.assetDir = result.data.assetDir;
    //       for (var i = 0; i < fileRes.length; i++) {
    //         var emptyIndex = getEmptyImageIndex();
    //         if (emptyIndex != -1)
    //           vm.images[emptyIndex].src = fileRes[i].filename;
    //       }
    //     })
    //     .catch(function(res) {
    //       $rootScope.loading = false;
    //       alert("error in file upload");
    //     })

    // }

    // function getEmptyImageIndex() {
    //   var index = -1;
    //   for (var i = 0; i < vm.images.length; i++) {
    //     if (!vm.images[i].src) {
    //       index = i;
    //       break;
    //     }
    //   }
    //   return index;
    // }

    // function getEmptySellCount() {
    //   var emptyCell = 0;
    //   vm.images.forEach(function(item, idx) {
    //     if (!item.src)
    //       emptyCell++;
    //   });
    //   return emptyCell;
    // }

    // function deleteImg(idx) {
    //   vm.images[idx] = {};
    // }

    // function makePrimary(idx) {
    //   vm.images.forEach(function(item, idx) {
    //     item.isPrimary = false;
    //   });
    //   vm.images[idx].isPrimary = true;
    // }


    function mailToCustomerForApprovedAndFeatured(result, product) {
      var data = {};
      if (result && result.status) {
        data.to = product.seller.email;
        data.subject = 'Request for Product Upload : Approved';
        product.serverPath = serverPath;
        notificationSvc.sendNotification('productUploadEmailToCustomerActive', data, product, 'email');
      }
      if (result && result.featured) {
        data.to = product.seller.email;
        data.subject = 'Request for Product Upload : Featured';
        product.serverPath = serverPath;
        notificationSvc.sendNotification('productUploadEmailToCustomerFeatured', data, product, 'email');
      }
    }

    function openPreviewImg(idx) {
      if (!vm.images[idx].src)
        return;
      var localScope = $rootScope.$new();
      localScope.src = $rootScope.uploadImagePrefix + vm.currentProduct.assetDir + "/" + vm.images[idx].src;
      var prvModal = $uibModal.open({
        templateUrl: "prvImg.html",
        scope: localScope,
        size: 'lg'
      });
      localScope.close = function() {
        prvModal.close();
      };
    }

    function deleteProduct(productId) {
      Modal.confirm("Are you sure want to delete?", function(ret) {
        if (ret === "yes")
          bulkuploadSvc.deleteIncomingProduct(productId)
          .then(function(result) {
            loadIncomingProduct();
          })
          .catch(function(res) {
            if (res.data.errorCode === 1) {
              Modal.alert("This product is already uploaded or removed by system.");
            }
          });
      });
    }
  }
})();