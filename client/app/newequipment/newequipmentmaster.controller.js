(function() {
  'use strict';
  angular.module('sreizaoApp').controller('NewEquipmentMasterCtrl', NewEquipmentMasterCtrl);

  //Product upload controller
  function NewEquipmentMasterCtrl($scope, $http, $rootScope, $stateParams, groupSvc, categorySvc, SubCategorySvc, LocationSvc, uploadSvc, productSvc, brandSvc, modelSvc, Auth, $uibModal, Modal, $state, notificationSvc, AppNotificationSvc, userSvc, $timeout, $sce, vendorSvc, AppStateSvc,CertificateMasterSvc) {

    var vm = this;
    //Start NJ : uploadProductClick object push in GTM dataLayer
    dataLayer.push(gaMasterObject.uploadProductClick);
    //NJ: set upload product Start Time
    $scope.productUploadStartTime = new Date();
    //End
    $scope.fireCommand=fireCommand;
    $scope.container = {};
    var filter = {};

    var imgDim = {
      width: 700,
      height: 459
    };

    var prevAssetStatus = assetStatuses[0].code;
    $rootScope.isSuccess = false;
    $rootScope.isError = false;
    $scope.assetDir = "";

    var product = null;
    $scope.isEdit = false;

    $scope.images = [{
      isPrimary: true
    }];
    $scope.imagesEngine = [{
      isPrimary: true
    }];
    $scope.imagesHydraulic = [{
      isPrimary: true
    }];
    $scope.imagesCabin = [{
      isPrimary: true
    }];
    $scope.imagesUnderCarrage = [{
      isPrimary: true
    }];
    $scope.imagesOther = [{
      isPrimary: true
    }];

    var dbImages = [];

    //$scope.primaryIndex = 0;
    $scope.enableButton = false;
    var productHistory = $scope.productHistory = {};
    var ALLOWED_DATA_SIZE = 15 * 1024 * 1024;

    $scope.auctSubmitted = false;

    $scope.tabObj = {};
    $scope.tabObj.step1 = true;

    //All method declaration
    $scope.updateAssetTemp = updateAssetTemp;
    $scope.onStateChange = onStateChange;
    $scope.onCountryChange = onCountryChange;
    $scope.userSearch=userSearch;
    $scope.onCategoryChange = onCategoryChange;
    $scope.onBrandChange = onBrandChange;
    $scope.onModelChange = onModelChange;
    $scope.clickHandler = clickHandler;
    $scope.onUserChange = onUserChange;
    $scope.reset = reset;
    $scope.resetClick = resetClick;
    $scope.makePrimary = makePrimary;
    $scope.deleteImg = deleteImg;
    $scope.previewProduct = previewProduct;
    $scope.rotate = rotate;
    $scope.playVideo = playVideo;
    $scope.firstStep = firstStep;
    $scope.goToUsermanagement = goToUsermanagement;

    function productInit() {

      product = $scope.product = {};
      $scope.product.images = [];
      $scope.assetStatuses = assetStatuses;
      $scope.product.miscDocuments = [{}];
      $scope.product.videoLinks = [{}];
      $scope.product.country = "";
      $scope.product.status = false;
     $scope.product.assetStatus = assetStatuses[0].code;
      $scope.product.featured = false;
      $scope.product.productCondition = "new";
      product.group = {};
      product.category = {};
      product.brand = {};
      product.model = {};
      product.seller = {};
    }

    function goToUsermanagement() {
      $state.go('usermanagment');
      $timeout(function() {
        Modal.openDialog('adduser');
      }, 20);
    }

    productInit();

    function init() {

      if (Auth.getCurrentUser().profileStatus == 'incomplete') {
        $state.go('myaccount');
        return;
      }
      groupSvc.getAllGroup({isForNew:true})
        .then(function(result) {
          $scope.allGroup = result;
        });

      categorySvc.getCategoryOnFilter({isForNew:true})
        .then(function(result) {
          $scope.allCategory = result;
        });

      CertificateMasterSvc.get()
      .then(function(certList){
        $scope.certificationList = certList;
      });

      if (!Auth.isAdmin() && !Auth.isChannelPartner()) {
        product.seller = Auth.getCurrentUser();
      }

      // product edit case
      if ($stateParams.id) {
        $scope.isEdit = true;
        filter = {};
        filter._id = $stateParams.id;
        if(Auth.getCurrentUser()._id && !Auth.isAdmin()) {
          if(Auth.getCurrentUser().role == 'channelpartner')
            filter.role = Auth.getCurrentUser().role;
          filter.userid = Auth.getCurrentUser()._id;
          if(Auth.isEnterprise()){
            delete filter.userid;
            filter.enterpriseId = Auth.getCurrentUser().enterpriseId; 
          }
        }
        productSvc.getProductOnFilter(filter).then(function(response) {
          if(response && response.length < 1) {
            $state.go('main');
            return;
          }

          product = $scope.product = response[0];
          $scope.imagesEngine = [];
          $scope.imagesHydraulic = [];
          $scope.imagesCabin = [];
          $scope.imagesUnderCarrage = [];
          $scope.imagesOther = [];
          $scope.images = [];
          
         /* if (response[0].serviceInfo.length > 0) {
            for (var i = 0; i < response[0].serviceInfo.length; i++) {
              if (response[0].serviceInfo[i] && response[0].serviceInfo[i].servicedate)
                response[0].serviceInfo[i].servicedate = moment(response[0].serviceInfo[i].servicedate).toDate();
            }
          } else {
            $scope.product.serviceInfo = [{}];
          }*/

          $scope.product.images.forEach(function(item, index) {
            if (item.catImgType) {
              switch (item.catImgType) {
                case 'eP':
                  $scope.imagesEngine[$scope.imagesEngine.length] = item;
                  break;
                case 'hP':
                  $scope.imagesHydraulic[$scope.imagesHydraulic.length] = item;
                  break;
                case 'cP':
                  $scope.imagesCabin[$scope.imagesCabin.length] = item;
                  break;
                case 'uC':
                  $scope.imagesUnderCarrage[$scope.imagesUnderCarrage.length] = item;
                  break;
                case 'oP':
                  $scope.imagesOther[$scope.imagesOther.length] = item;
                  break;
              }
            } else
              $scope.images[$scope.images.length] = item;
          });

          if (!$scope.product.videoLinks || $scope.product.videoLinks.length == 0)
            $scope.product.videoLinks = [{}];

          if (!$scope.product.miscDocuments || $scope.product.miscDocuments.length == 0)
            $scope.product.miscDocuments = [{}];

          if (product.assetStatus)
            prevAssetStatus = product.assetStatus;
          else
            prevAssetStatus = product.assetStatus = "";


          $scope.product.country = $scope.product.country;
          if($scope.product.mfgYear)
            $scope.container.mfgYear = Number($scope.product.mfgYear);
          $scope.assetDir = product.assetDir;
          $scope.container.selectedCategoryId = $scope.product.category._id;
          $scope.container.selectedBrandId = $scope.product.brand._id;
          $scope.container.selectedModelId = $scope.product.model._id;

          $scope.container.sellerName = $scope.product.seller.fname + " " + $scope.product.seller.lname;

          $scope.onCategoryChange($scope.product.category._id, true);
          $scope.onBrandChange($scope.product.brand._id, true);
          $scope.onCountryChange(true);
          $scope.onStateChange(true);

          if ($scope.product.currencyType == "INR")
            $scope.product.currencyType = "";
          $scope.productName = $scope.product.name;
          if ($scope.product.category.name == 'Other') {
            $scope.selectedCategory = {};
            $scope.selectedCategory['otherName'] = $scope.product.category.otherName;
          }


          if ($state.current.name == "productedit") {
            $scope.enableButton = !Auth.isAdmin() && product.status;
            $scope.isEdit = true;
          }
          prepareImgArr();
         
        })
      } else {
        prepareImgArr();
      }

      //Live Product name construction tracking
      $scope.$watch('[product.model,product.category,product.brand, product.variant]', function() {
        var name = "";
        if (product.category && product.category.name) {
          if (product.category.name == "Other")
            name = product.category.otherName || "";
          else
            name = product.category.name || "";
        }

        if (product.brand && product.brand.name) {
          if (product.brand.name == 'Other')
            name += " " + (product.brand.otherName || "");
          else
            name += " " + (product.brand.name || "");
        }

        if (product.model && product.model.name) {

          if (product.model.name == 'Other')
            name += " " + (product.model.otherName || "");
          else
            name += " " + (product.model.name || "");
        }

        if ($scope.product.variant)
          name += " " + ($scope.product.variant || "");

        if (name)
          product.name = name;
      }, true);

      //listen for the file selected event
      $scope.$on("fileSelected", function(event, args) {
        if (args.files.length == 0){
          return;
      }

        $scope.$apply(function() {
          if (args.type == "image") {
            var resizeParam = {};
            resizeParam.resize = true;
            resizeParam.width = imgDim.width;
            resizeParam.height = imgDim.height;
            resizeParam.size=args.files[0].size;
          }
          $rootScope.loading = true;
          if(args.files[0].size < 50000){
            $rootScope.loading = false;
            Modal.alert("Error in file upload.the size of the file should be more than 50KB", true);
            return;
          }
          uploadSvc.upload(args.files[0], $scope.assetDir, resizeParam).then(function(result) {
            $rootScope.loading = false;
            $scope.assetDir = result.data.assetDir;
            // if (!$scope.product.assetId)
            //   $scope.product.assetId = $scope.assetDir;
            if (args.id) {
              //console.log(args);
              switch (args.id) {
                case 'eP':
                  if (args.type == "image") {

                    $scope.imagesEngine[parseInt(args.index)].catImgType = args.id;
                    $scope.imagesEngine[parseInt(args.index)].src = result.data.filename;
                  }
                  break;
                case 'hP':
                  if (args.type == "image") {
                    $scope.imagesHydraulic[parseInt(args.index)].catImgType = args.id;
                    $scope.imagesHydraulic[parseInt(args.index)].src = result.data.filename;
                  }
                  break;
                case 'cP':
                  if (args.type == "image") {
                    $scope.imagesCabin[parseInt(args.index)].catImgType = args.id;
                    $scope.imagesCabin[parseInt(args.index)].src = result.data.filename;
                  }
                  break;
                case 'uC':
                  if (args.type == "image") {
                    $scope.imagesUnderCarrage[parseInt(args.index)].catImgType = args.id;
                    $scope.imagesUnderCarrage[parseInt(args.index)].src = result.data.filename;
                  }
                  break;
                case 'oP':
                  if (args.type == "image") {
                    $scope.imagesOther[parseInt(args.index)].catImgType = args.id;
                    $scope.imagesOther[parseInt(args.index)].src = result.data.filename;
                  }
                  break;
              }
            } else {

              if (args.type == "image")
                $scope.images[parseInt(args.index)].src = result.data.filename;
              else if (args.type == "video")
                product.videoName = result.data.filename;
              else if (args.type == "tcDoc")
                product.tcDocumentName = result.data.filename;
              else if (args.type == "mdoc") {
                $scope.product.miscDocuments[args.index].name = result.data.filename;
                $scope.product.miscDocuments[args.index].createdAt = new Date();
                $scope.product.miscDocuments[args.index].userId = Auth.getCurrentUser()._id;
              } else if (args.type == "valStamp")
                product.valuationStamp = result.data.filename;
              else
                product.documentName = result.data.filename;
            }
          }).catch(function(err) {
            $rootScope.loading = false;
            Modal.alert("Error in file upload.", true);
          });
        });
      });
    }

    init();

    function isEmpty(myObject) {
      if (!myObject)
        return true;
      if (angular.equals(myObject, {}))
        return true;
      var keys = Object.keys(myObject);
      if (keys.length > 1) {
        for (var i = 0; i < keys.length; i++) {
          if (myObject[keys[i]] != "")
            return false;
        }
        return true;
      }
      if (keys[0] == 'params') {
        if (myObject.params.length == 0) {
          return true;
        }

        if (myObject.params.length > 1)
          return false;

        if (myObject.params.length == 1 && myObject.params[0])
          return false;
        else
          return true;
      }

    }

    function onStateChange(noReset) {

      $scope.locationList = [];
      if (!noReset)
        product.city = "";
      if (!$scope.product.state)
        return;

      LocationSvc.getAllLocation().
      then(function(result) {
        $scope.locationList = result.filter(function(item) {
          return item.state.name == $scope.product.state;
        });
      });
    }

    function reset(){
      $scope.product.seller.mobile="";
      $scope.container.sellerName="";
      $scope.product.seller.email="";
    }

    function onCountryChange(noReset) {

      $scope.stateList = [];
      if (!noReset)
        product.state = "";
      if (!$scope.product.country)
        return;

      LocationSvc.getAllState().
      then(function(result) {
        $scope.stateList = result.filter(function(item) {
          return item.country == $scope.product.country;
        });
      });
    }

    function userSearch(userSearchText){
      if (!$scope.product.seller.userType) 
        return;
      
      if(userSearchText && userSearchText.length < 4) 
        return;

      $scope.container.sellerName="";
      $scope.product.seller.email="";
      
      var dataToSend = {};
      dataToSend["status"] = true;
      dataToSend["userType"] = $scope.product.seller.userType;
      dataToSend["mobileno"] = $scope.product.seller.mobile;
      return userSvc.getUsers(dataToSend).then(function(result) {
      return result.map(function(item){
        return item.mobile;
      });
      });
     }

   function fireCommand(){
    var filter={};
    if(!$scope.product.seller.mobile){
      $scope.container.sellerName="";
      $scope.product.seller.email="";
      return;
    }
    filter["status"]=true;
    filter["userType"]=$scope.product.seller.userType;
    filter["contact"]=$scope.product.seller.mobile;
    return userSvc.getUsers(filter).then(function(result){
      if(result.length == 1)
        onUserChange(result[0]);
    })

   }
  

    function onCategoryChange(categoryId, noChange) {
      if (!noChange) {
        product.productName = "";
        product.brand = {};
        product.model = {};
        if (categoryId) {
          var ct = categorySvc.getCategoryOnId(categoryId);
          product.group = ct.group;
          product.category._id = ct._id;
          product.category.name = ct.name;
        } else {
          product.group = {};
          product.category = {};
        }

        $scope.container.selectedBrandId = "";
        $scope.container.selectedModelId = "";
      }

      $scope.brandList = [];
      $scope.modelList = [];
      //$scope.product.technicalInfo = {};
      if (!categoryId)
        return;
      var otherBrand = null;
      filter = {};
      filter['categoryId'] = categoryId;
      filter['isForNew'] = true;

      brandSvc.getBrandOnFilter(filter)
        .then(function(result) {
          $scope.brandList = result;

        })
        .catch(function(res) {
          console.log("error in fetching brand", res);
        })
    }

    function onBrandChange(brandId, noChange) {
      if (!noChange) {
        product.name = "";
        product.model = {};

        if (brandId) {
          var brd = [];
          brd = $scope.brandList.filter(function(item) {
            return item._id == brandId;
          });
          if (brd.length == 0)
            return;
          product.brand._id = brd[0]._id;
          product.brand.name = brd[0].name;
        } else {
          product.brand = {};
        }
        $scope.container.selectedModelId = "";
      }

      //$scope.product.technicalInfo = {};
      $scope.modelList = [];
      if (!brandId)
        return;
      var otherModel = null;
      filter = {};
      filter['brandId'] = brandId;
      filter['isForNew'] = true;
      modelSvc.getModelOnFilter(filter)
        .then(function(result) {
          $scope.modelList = result;
        })
        .catch(function(res) {
          console.log("error in fetching model", res);
        })

    }

    function onModelChange(modelId) {
      if (!modelId) {
        product.model = {};
        return;
      }
      $scope.product.technicalInfo = {};
      $scope.product.technicalInfo.params = [{}];
      var md = null;
      for (var i = 0; i < $scope.modelList.length; i++) {
        if ($scope.modelList[i]._id == modelId) {
          md = $scope.modelList[i];
          break;
        }
      }
      
      if (md) {
        product.model._id = md._id;
        product.model.name = md.name;
        var techFilter = {
          category: product.category.name,
          brand: product.brand.name,
          model: product.model.name
        };

      } else
        product.model = {};
    }

    function onUserChange(seller) {
      if (!seller){
        product.seller = {};
        return;
      }

      product.seller._id = seller._id;
      product.seller.fname = seller.fname;
      product.seller.mname = seller.mname;
      product.seller.lname = seller.lname;
      product.seller.role = seller.role;
      //product.seller.userType = user.userType;
      product.seller.phone = seller.phone;
      $scope.product.seller.mobile = product.seller.mobile = seller.mobile;
      product.seller.alternateMobile = seller.alternateMobile;
      $scope.product.seller.email = product.seller.email = seller.email;
      product.seller.country = seller.country;
      product.seller.enterpriseId = seller.enterpriseId || "";
      product.seller.countryCode=LocationSvc.getCountryCode(seller.country);
      product.seller.company = seller.company;
      $scope.container.sellerName = seller.fname + " " + seller.lname;
    }

    function updateAssetTemp(files,args) {
      if (!files[0])
        return;
      if (files[0].name.indexOf('.xlsx') == -1) {
        Modal.alert('Please upload a valid file');
        return;
      }
      uploadSvc.upload(files[0], importDir)
        .then(function(result) {
          var dataToSend = {};
          dataToSend.fileName = result.data.filename;
          dataToSend.user = {
            _id  : Auth.getCurrentUser()._id,
            email : Auth.getCurrentUser().email,
            mobile : Auth.getCurrentUser().mobile,
            role : Auth.getCurrentUser().role
          };

          dataToSend.type = args.name || 'template_update';          
          $rootScope.loading = true;
          productSvc.bulkEditProduct(dataToSend)
            .then(function(res) {
              $rootScope.loading = false;
              var totalRecord = res.totalCount;
              var message = res.successCount + " out of " + totalRecord + " records are updated successfully.";
              if (res.errorList.length > 0) {
                var data = {};
                data['to'] = Auth.getCurrentUser().email;
                data['subject'] = 'Bulk produt  Update error details.';
                var serData = {};
                serData.serverPath = serverPath;
                serData.errorList = res.errorList;
                notificationSvc.sendNotification('BulkProductStatusUpdateError', data, serData, 'email');
                message += "Error details have been sent on registered email id.";
              }
              Modal.alert(message, true);
            })
            .catch(function(res) {
              $rootScope.loading = false;
              Modal.alert("error in parsing data", true);
            })
        })
        .catch(function(res) {
          Modal.alert("error in file upload", true);
        });
    }

    function clickHandler(type, val) {
      if (type == "hours" && !val)
        delete $scope.product.rent.rateHours;
      else if (type == "days" && !val)
        delete $scope.product.rent.rateDays;
      else if (type == "months" && !val)
        delete $scope.product.rent.rateMonths;
    }
 

    function firstStep(form, product) {
      var ret = false;

      if ($scope.container.mfgYear) {
        var currentYear = new Date().getFullYear();
        if($scope.container.mfgYear <= currentYear)
          $scope.product.mfgYear = $scope.container.mfgYear;
        else {
          form.mfgyear.$invalid = true;
          ret = true;
        }
      } else
      $scope.product.mfgYear = "";

      if (form.$invalid || ret) {
        $scope.submitted = true;
        $timeout(function() {
          angular.element(".has-error").find('input,select').first().focus();
        }, 20);
        return;
      }
      if(!$scope.container.sellerName && (Auth.isAdmin() || Auth.isChannelPartner())) {
        Modal.alert("Seller doesn't exist!");
        return;
      }

      var primarySet = "";
      product.assetDir = $scope.assetDir;
      $scope.product.images = [];
      var primaryFound = false;
      $scope.images.forEach(function(item, index) {
        if (item.src) {
          var imgObj = {};
          imgObj.src = item.src;
          if (item.isPrimary) {
            imgObj.isPrimary = true;
            product.primaryImg = item.src;
            primarySet = "set";
            primaryFound = true;
          } else {
            imgObj.isPrimary = false;
          }
          if (item.waterMarked)
            imgObj.waterMarked = true;
          else
            imgObj.waterMarked = false;
          if (item.catImgType)
            imgObj.catImgType = item.catImgType;
          $scope.product.images[$scope.product.images.length] = imgObj;
        }


      });
     

      if ($scope.product.images.length == 0) {
        Modal.alert("Please upload atleast one image in General Appearence section.", true);
        $rootScope.loading = false;
        return;
      }

      if (!primaryFound) {
        $scope.product.primaryImg = $scope.product.images[0].src;
        $scope.product.images[0].isPrimary = true;
      }

      checkPrimaryAndMergeOnSubmit($scope.imagesEngine, $scope.product.images);
      checkPrimaryAndMergeOnSubmit($scope.imagesHydraulic, $scope.product.images);
      checkPrimaryAndMergeOnSubmit($scope.imagesCabin, $scope.product.images);
      checkPrimaryAndMergeOnSubmit($scope.imagesOther, $scope.product.images);
      checkPrimaryAndMergeOnSubmit($scope.imagesUnderCarrage, $scope.product.images);

      if ($rootScope.getCurrentUser()._id && $rootScope.getCurrentUser().role == 'admin' && product.status) {
        product.applyWaterMark = true;
      } else {
        product.applyWaterMark = false;
      }
      addOrUpdate();

    }

    function checkPrimaryAndMergeOnSubmit(sourceArr) {
      if (sourceArr.length == 0)
        return;
      var primaryFound = false;
      var tempArr = [];
      sourceArr.forEach(function(item, index) {
        if (item.src) {
          var imgObj = {};
          imgObj.src = item.src;
          if (item.isPrimary) {
            imgObj.isPrimary = true;
            primaryFound = true;
          } else {
            imgObj.isPrimary = false;
          }
          if (item.waterMarked)
            imgObj.waterMarked = true;
          else
            imgObj.waterMarked = false;
          if (item.catImgType)
            imgObj.catImgType = item.catImgType;
          tempArr[tempArr.length] = imgObj;
        }


      });

      if (!primaryFound && tempArr.length > 0) {
        tempArr[0].isPrimary = true;
      }
      $scope.product.images = $scope.product.images.concat(tempArr);
    }

    function addOrUpdate(cb) {

      $scope.product.videoLinks = $scope.product.videoLinks.filter(function(item, idx) {
        if (item && item.uri)
          return true;
        else
          return false;

      });

      $scope.product.miscDocuments = $scope.product.miscDocuments.filter(function(item, idx) {
        if (item && item.name)
          return true;
        else
          return false;

      });

     /* $scope.product.serviceInfo = $scope.product.serviceInfo.filter(function(item, idx) {
        if (item && (item.servicedate || item.operatingHour || item.serviceAt || item.authServiceStation))
          return true;
        else
          return false;

      });*/

       $scope.certificationList.forEach(function(certObj){
        if(certObj.name === $scope.product.certificationName)
          $scope.product.certificationLogo = certObj.logoImg;
      });


      if (!$scope.isEdit)
        addProduct(cb);
      else
        updateProduct(cb);
    }

    function addProduct(cb) {

      product.user = {};
      product.user._id = Auth.getCurrentUser()._id;
      product.user.fname = Auth.getCurrentUser().fname;
      product.user.mname = Auth.getCurrentUser().mname;
      product.user.lname = Auth.getCurrentUser().lname;
      product.user.role = Auth.getCurrentUser().role;
      product.user.userType = Auth.getCurrentUser().userType;
      product.user.phone = Auth.getCurrentUser().phone;
      product.user.mobile = Auth.getCurrentUser().mobile;
      product.user.email = Auth.getCurrentUser().email;
      product.user.enterpriseId = Auth.getCurrentUser().enterpriseId || "";
      product.user.country = Auth.getCurrentUser().country;
      product.user.countryCode=LocationSvc.getCountryCode(product.user.country);
      product.user.company = Auth.getCurrentUser().company;
      if ($.isEmptyObject(product.seller)) {
        product.seller = {};
        product.seller = product.user;
      }

      if ($scope.product.currencyType == "")
        $scope.product.currencyType = "INR";

      $scope.product.assetStatuses = [];
      var stObj = {};
      stObj.userId = product.user._id;
      stObj.status = assetStatuses[0].code;
      stObj.createdAt = new Date();
      $scope.product.assetStatuses[$scope.product.assetStatuses.length] = stObj;
      //$scope.product.assetId = $scope.assetDir;

      $rootScope.loading = true;
      productSvc.addProduct(product).then(function(result) {
        //Start NJ : uploadProductSubmit object push in GTM dataLayer
        dataLayer.push(gaMasterObject.uploadProductSubmit);
        //NJ : set upload product Start time
        var productUploadSubmitTime = new Date();
        var timeDiff = Math.floor(((productUploadSubmitTime - $scope.productUploadStartTime) / 1000) * 1000);
        gaMasterObject.uploadProductSubmitTime.timingValue = timeDiff;
        ga('send', gaMasterObject.uploadProductSubmitTime);
        //End
        $rootScope.loading = false;
        setScroll(0);
        $scope.successMessage = "Product added successfully.";
        $scope.autoSuccessMessage(20);
        //addToHistory(result,"Create");
        if (Auth.isAdmin()) {
          if (result.status)
            AppNotificationSvc.createAppNotificationFromProduct(result);
          mailToCustomerForApprovedAndFeatured(result, product);
        } else {

          var data = {};
          data['to'] = result.seller.email;
          data['subject'] = 'Product Upload: Request for Listing';
          result.serverPath = serverPath;
          result.listedFor = result.tradeType;
          if (result.listedFor == 'BOTH')
            result.listedFor = "SELL & RENT"
          notificationSvc.sendNotification('productUploadEmailToCustomer', data, result, 'email');

          data['to'] = supportMail;
          data['subject'] = 'Product Upload: Request for activation';
          result.serverPath = serverPath;
          notificationSvc.sendNotification('productUploadEmailToAdmin', data, result, 'email');

        }
        if (cb)
          cb(result)
        else {
          product = $scope.product = {};
          $state.go('newequipmentlisting');
        }

      })
      .catch(function(err){
        $rootScope.loading = false;
      });
    }


    function updateProduct(cb) {

      if ($rootScope.getCurrentUser()._id && $rootScope.getCurrentUser().role != 'admin') {
        product.status = false;
        //product.featured = false;
      }
      if ($scope.product.currencyType == "")
        $scope.product.currencyType = "INR";
      if (!$scope.product.assetStatuses)
        $scope.product.assetStatuses = [];
      if (prevAssetStatus != $scope.product.assetStatus) {
        var stObj = {};
        stObj.userId = $scope.product.user._id;
        stObj.status = $scope.product.assetStatus;
        stObj.createdAt = new Date();
        $scope.product.assetStatuses[$scope.product.assetStatuses.length] = stObj;
        if ($scope.product.assetStatus == assetStatuses[2].code) {
          $scope.product.isSold = true;
          //$scope.product.featured = false;
          //$scope.product.status = false;
        } else if ($scope.product.assetStatus == assetStatuses[1].code) {
          $scope.product.isSold = true;
          //$scope.product.featured = false;
        }
      }

      // if (!$scope.product.assetId)
      //   $scope.product.assetId = $scope.assetDir;
      $rootScope.loading = true;
      productSvc.updateProduct(product).then(function(result) {
        $rootScope.loading = false;
        setScroll(0);
        $scope.successMessage = "Product updated successfully";
        $scope.autoSuccessMessage(20);
        AppNotificationSvc.createAppNotificationFromProduct(product);
        mailToCustomerForApprovedAndFeatured(result, product);
        if (cb)
          cb(product);
        else
          $state.go('newequipmentlisting', AppStateSvc.get('newequipmentlisting'));
      })
      .catch(function(err){
        $rootScope.loading = false;
        if(err && err.data)
          Modal.alert(err.data);
      });
    }

    function addToHistory(product, type) {
      if ($scope.relistingEnable) {
        $scope.productHistory.type = "Relist";
      } else {
        $scope.productHistory.type = "Edit";
      }
      if (type)
        $scope.productHistory.type = type;
      productHistory.history = {};
      productHistory.user = {};
      productHistory.history = product;
      productHistory.user = $rootScope.getCurrentUser();
      productSvc.addProductInHistory(productHistory).then(function(result) {
        $rootScope.loading = false;
      });
    }

    function mailToCustomerForApprovedAndFeatured(result, product) {
      if (result.status) {
        var data = {};
        data['to'] = product.seller.email;
        data['subject'] = 'Request for Product Upload : Approved';
        product.serverPath = serverPath;
        result.listedFor = result.tradeType;
        if (result.listedFor == 'BOTH')
          result.listedFor = "SELL & RENT"
        notificationSvc.sendNotification('productUploadEmailToCustomerActive', data, product, 'email');
      }
      if (result.featured) {
        var data = {};
        data['to'] = product.seller.email;
        data['subject'] = 'Request for Product Upload : Featured';
        product.serverPath = serverPath;
        notificationSvc.sendNotification('productUploadEmailToCustomerFeatured', data, product, 'email');
      }
    }

    function resetClick(form) {

      //Start NJ : uploadProductReset object push in GTM dataLayer
      dataLayer.push(gaMasterObject.uploadProductReset);
      //NJ: set upload product Reset time
      var productUploadResetTime = new Date();
      var timeDiff = Math.floor(((productUploadResetTime - $scope.productUploadStartTime) / 1000) * 1000);
      gaMasterObject.uploadProductResetTime.timingValue = timeDiff;
      ga('send', gaMasterObject.uploadProductResetTime);
      //End

      productInit();
      $scope.container = {};
      $scope.brandList = [];
      $scope.modelList = [];
      $scope.images = [{
        isPrimary: true
      }];
      prepareImgArr();
      productHistory = $scope.productHistory = {};
      $scope.container.mfgYear = "";
    }

    function makePrimary(val, imageArr) {
      imageArr.forEach(function(item, index, arr) {
        if (val == index)
          item.isPrimary = true;
        else
          item.isPrimary = false;
      });
    }

    function deleteImg(idx, imgArr) {
      if (imgArr.length < 1)
        return;
      imgArr.splice(idx, 1);
    }

    // preview uploaded images
    function previewProduct() {
      //Start NJ : uploadProductPreview object push in GTM dataLayer
      dataLayer.push(gaMasterObject.uploadProductPreview);
      //NJ: set upload product Preview time
      var productUploadPreviewTime = new Date();
      var timeDiff = Math.floor(((productUploadPreviewTime - $scope.productUploadStartTime) / 1000) * 1000);
      gaMasterObject.uploadProductPreviewTime.timingValue = timeDiff;
      ga('send', gaMasterObject.uploadProductPreviewTime);
      //End
      var prevScope = $rootScope.$new();
      prevScope.images = $scope.images;
      prevScope.prefix = $rootScope.uploadImagePrefix;
      prevScope.assetDir = $scope.assetDir;
      prevScope.isEdit = $scope.isEdit;
      var prvProduct = {};
      angular.copy($scope.product, prvProduct);

      prvProduct.mfgYear = $scope.container.mfgYear;
      prevScope.product = prvProduct;
      var prvProductModal = $uibModal.open({
        templateUrl: "productPreview.html",
        scope: prevScope,
        windowTopClass: 'product-preview',
        size: 'lg'
      });

      prevScope.deleteImg = $scope.deleteImg;
      prevScope.makePrimary = $scope.makePrimary;
      prevScope.getDateFormat = function(serviceDate) {
        if (!serviceDate)
          return;
        return moment(serviceDate).format('DD/MM/YYYY');
      }

      prevScope.dismiss = function() {
        prvProductModal.dismiss('cancel');
      };

      prevScope.isEngineRepaired = function(value) {
        if (value == 'true')
          return "Yes";
        else
          return "No";
      }
    }
    
    $scope.getImageURL = function(assetDir,key){
        var uploadImagePrefix = $rootScope.uploadImagePrefix;
        //console.log(uploadImagePrefix + assetDir+'/'+key);
        return uploadImagePrefix + assetDir+'/'+key;
    };

    $scope.timestamp = new Date().getTime();

    function rotate(img) {
      if (!img.src)
        return;
      var imagePath = $scope.assetDir + "/" + img.src;
      $http.post("/api/common/rotate", {
          imgPath: imagePath
        })
        .then(function(res) {
          $scope.timestamp = new Date().getTime();
        })
    }

    function playVideo(idx) {
      var videoScope = $rootScope.$new();
      videoScope.productName = $scope.product.name;
      var videoId = youtube_parser($scope.product.videoLinks[idx].uri);
      if (!videoId)
        return;
      videoScope.videoid = videoId;
      var playerModal = $uibModal.open({
        templateUrl: "app/product/youtubeplayer.html",
        scope: videoScope,
        size: 'lg'
      });
      videoScope.close = function() {
        playerModal.dismiss('cancel');
      }

    };

    function getImageArr() {
      var imgArr = [];
      $scope.images.forEach(function(item, index, arr) {
        if (item.src)
          imgArr[imgArr.length] = item;
      });
      return imgArr;

    }

    function prepareImgArr() {
      if ($scope.images.length == 0)
        $scope.images[0] = {
          isPrimary: true
        };

      if ($scope.imagesEngine.length == 0)
        $scope.imagesEngine[0] = {
          isPrimary: true
        };

      if ($scope.imagesHydraulic.length == 0)
        $scope.imagesHydraulic[0] = {
          isPrimary: true
        };

      if ($scope.imagesOther.length == 0)
        $scope.imagesOther[0] = {
          isPrimary: true
        };

      if ($scope.imagesCabin.length == 0)
        $scope.imagesCabin[0] = {
          isPrimary: true
        };

      if ($scope.imagesUnderCarrage.length == 0)
        $scope.imagesUnderCarrage[0] = {
          isPrimary: true
        };

    }
  }

})();