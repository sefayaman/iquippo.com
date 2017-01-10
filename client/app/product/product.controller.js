(function(){
'use strict';
angular.module('sreizaoApp').controller('ProductCtrl',ProductCtrl);
angular.module('sreizaoApp').controller('CropImageCtrl', CropImageCtrl);

//Product upload controller
 function ProductCtrl($scope, $http, $rootScope, $stateParams, groupSvc, categorySvc,SubCategorySvc,LocationSvc, uploadSvc, productSvc, brandSvc, modelSvc, Auth,$uibModal, Modal, $state, notificationSvc, AppNotificationSvc, userSvc,$timeout,$sce,vendorSvc,AuctionMasterSvc,AuctionSvc,PaymentMasterSvc,ValuationSvc,ProductTechInfoSvc) {
    
    var vm = this;
   //Start NJ : uploadProductClick object push in GTM dataLayer
   dataLayer.push(gaMasterObject.uploadProductClick);
   //NJ: set upload product Start Time
   $scope.productUploadStartTime = new Date();
   //End

    $scope.container = {};

    var imgDim = {width:700,height:459};

    var prevAssetStatus = assetStatuses[0].code;
    var prevAuctionStatus = auctionStatuses[0].code;
    $rootScope.isSuccess = false;
    $rootScope.isError = false;
    $scope.assetDir = "";

    var product = null;
    $scope.isEdit = false;

    $scope.images = [{isPrimary:true}];
    $scope.primaryIndex = 0;
    $scope.enableButton = false;
    var productHistory = $scope.productHistory = {};
    var ALLOWED_DATA_SIZE = 15*1024*1024;

    $scope.auctSubmitted = false;

    $scope.tabObj = {};
    $scope.tabObj.step1   = true;

  //All method declaration
  $scope.updateAssetStatusTemp = updateAssetStatusTemp;
  $scope.onStateChange = onStateChange;
  $scope.onRoleChange = onRoleChange;
  $scope.onCategoryChange = onCategoryChange;
  $scope.onBrandChange = onBrandChange;
  $scope.onModelChange = onModelChange;
  $scope.onTradeTypeChange = onTradeTypeChange;
  $scope.clickHandler = clickHandler;
  //$scope.addOrUpdateProduct = addOrUpdateProduct;
  $scope.onUserChange = onUserChange;
  $scope.resetClick = resetClick;
  $scope.makePrimary = makePrimary;
  $scope.deleteImg = deleteImg;
  $scope.previewProduct = previewProduct;
  $scope.openCropModal = openCropModal;
  $scope.rotate = rotate;
  $scope.playVideo = playVideo;
  $scope.firstStep = firstStep;
  $scope.secondStep = secondStep;
  $scope.goToUsermanagement = goToUsermanagement; 

  function productInit(){

    product = $scope.product = {};
    $scope.product.images = [];
    $scope.assetStatuses = assetStatuses;
    $scope.product.technicalInfo = {};
    $scope.product.technicalInfo.params = [{}];
    $scope.product.serviceInfo = [{}];
    $scope.product.miscDocuments = [{}];
    $scope.product.videoLinks = [{}];
    $scope.product.country = "";
    $scope.product.status = false;
    $scope.product.auctionListing = false;
    $scope.product.assetStatus = assetStatuses[0].code;
    $scope.product.featured = false;
    $scope.product.rent = {};
    $scope.product.rent.rateHours = {};
    $scope.product.rent.rateDays = {};
    $scope.product.rent.rateMonths = {};
    $scope.product.rent.rateHours.rateType = 'hours';
    $scope.product.rent.negotiable = false;
    product.group = {};
    product.category = {};
    product.brand = {};
    product.model = {};
    product.seller = {};
    product.auction = {};

    $scope.valuationReq = {};
    $scope.valuationReq.valuationAgency = {};
    $scope.auctionReq = {};
  }

  function goToUsermanagement(){
    $state.go('usermanagment');
    $timeout(function() { Modal.openDialog('adduser');}, 20);
  }

  productInit();

  function init(){

    if(Auth.getCurrentUser().profileStatus == 'incomplete'){
      $state.go('myaccount');
      return;
    }
    groupSvc.getAllGroup()
    .then(function(result){
      $scope.allGroup = result;
    });

    categorySvc.getAllCategory()
    .then(function(result){
      $scope.allCategory = result;
    });

    /* SubCategorySvc.getAllSubCategory()
    .then(function(result){
      $scope.allSubCategory = result;
    });*/

     LocationSvc.getAllState()
    .then(function(result){
      $scope.stateList = result;
    });

   

    PaymentMasterSvc.getAll()
    .then(function(result){
      $scope.payments = result;
      vendorSvc.getAllVendors()
      .then(function(){
        var agency = vendorSvc.getVendorsOnCode('Valuation');
        $scope.valAgencies = [];
        agency.forEach(function(item){
          var pyMst = PaymentMasterSvc.getPaymentMasterOnSvcCode("Valuation",item._id);
          if(pyMst && pyMst.fees)
            $scope.valAgencies[$scope.valAgencies.length] = item;
          else if(pyMst && pyMst.fees === 0)
            $scope.valAgencies[$scope.valAgencies.length] = item;
        })
      });

    })

    //LocationSvc.getAllLocation()

    // product edit case
    if($stateParams.id) {
      $scope.isEdit = true;

      productSvc.getProductOnId($stateParams.id,true).then(function(response){
        product = $scope.product = response;

        
        if(response.serviceInfo.length > 0){
          for(var i =0; i < response.serviceInfo.length; i++){
            if(response.serviceInfo[i] && response.serviceInfo[i].servicedate)
              response.serviceInfo[i].servicedate = moment(response.serviceInfo[i].servicedate).toDate();
          }
        } else {
          $scope.product.serviceInfo = [{}];
        }
        
        angular.copy($scope.product.images,$scope.images);
        $scope.images.forEach(function(item,index){
          if(item.isPrimary)
            $scope.primaryIndex = index;
          item.isEdit = true;
          item.name = item.src;
        });

        if(!$scope.product.videoLinks || $scope.product.videoLinks.length == 0)
          $scope.product.videoLinks = [{}];

        if(!$scope.product.miscDocuments || $scope.product.miscDocuments.length == 0)
          $scope.product.miscDocuments = [{}];

        if(!$scope.product.technicalInfo){
            $scope.product.technicalInfo = {};
            $scope.product.technicalInfo.params = [{}];
        }

        if(product.assetStatus)
            prevAssetStatus = product.assetStatus;
        else
          prevAssetStatus = product.assetStatus = "";

        if(product.auctionListing){
          prevAuctionStatus = "request submitted";

          if(product.auction && product.auction._id){
            var serData = {};
            serData._id = product.auction._id;
            AuctionSvc.getOnFilter(serData)
            .then(function(result){
              if(result.length > 0){
                $scope.auctionReq = result[0];
              }
            })
          }

        }
        if(!product.auction)
           product.auction = {};

        //$scope.userType = product.seller.userType;
        $scope.product.country = $scope.product.country;
        // $scope.product.auctionListing = false;
        $scope.assetDir = product.assetDir;
        $scope.container.selectedCategoryId = $scope.product.category._id;
        $scope.container.selectedBrandId = $scope.product.brand._id;
        $scope.container.selectedModelId = $scope.product.model._id;

        //$scope.container.selectedSubCategory = $scope.product.subcategory;


        $scope.getUsersOnUserType = [];
        $scope.onRoleChange($scope.product.seller.userType,true);
        $scope.container.selectedUserId = $scope.product.seller._id;
      
        $scope.onCategoryChange($scope.product.category._id,true);
        $scope.onBrandChange($scope.product.brand._id,true);
        $scope.onStateChange(true);
        $scope.setDate($scope.product.mfgYear,1,1);
        if($scope.product.rent){
          $scope.product.rent.fromDate = moment($scope.product.rent.fromDate).toDate();
          $scope.product.rent.toDate = moment($scope.product.rent.toDate).toDate();
        }
        if($scope.product.currencyType == "INR")
          $scope.product.currencyType = "";
        $scope.productName = $scope.product.name;
        if($scope.product.category.name == 'Other')
            $scope.selectedCategory['otherName'] = $scope.product.category.otherName;

        if($state.current.name == "productedit"){
          $scope.enableButton = !Auth.isAdmin() && product.status;
          $scope.isEdit = true;
        }
        $scope.onTradeTypeChange($scope.product.tradeType);
         prepareImgArr();
      })
    }else{
      prepareImgArr();
    }

    //Live Product name construction tracking
     $scope.$watch('[product.model,product.category,product.brand, product.variant]',function(){
        var name = "";
        if(product.category && product.category.name){
          if(product.category.name == "Other")
            name = product.category.otherName || "";
          else
             name = product.category.name || "";
        }

        if(product.brand && product.brand.name){
          if(product.brand.name == 'Other')
            name += " " +  (product.brand.otherName || "");
          else
            name += " " +  (product.brand.name || "");
        }

        if(product.model && product.model.name){

        if(product.model.name == 'Other')
           name += " " + (product.model.otherName || "");
         else
          name += " " + (product.model.name || "");
        }

        if($scope.product.variant)
          name += " " + ($scope.product.variant || "");

        if(name)
            product.name =  name;
    },true);

    //listen for the file selected event
    $scope.$on("fileSelected", function (event, args) {
      if(args.files.length == 0)
          return;
        $scope.$apply(function () {
          if(args.type == "image") {
            var resizeParam = {};
            resizeParam.resize = true;
            resizeParam.width = imgDim.width;
            resizeParam.height = imgDim.height;
          }
          $rootScope.loading = true;
          uploadSvc.upload(args.files[0],$scope.assetDir, resizeParam).then(function(result){
            $rootScope.loading = false;
            $scope.assetDir = result.data.assetDir;
            if(!$scope.product.assetId)
              $scope.product.assetId = $scope.assetDir;

            if(args.type == "image")
              $scope.images[parseInt(args.index)].src = result.data.filename;
            else if(args.type == "video")
              product.videoName = result.data.filename;
            else if(args.type == "tcDoc")
              product.tcDocumentName = result.data.filename;
            else if(args.type == "mdoc"){
              $scope.product.miscDocuments[args.index].name = result.data.filename;
              $scope.product.miscDocuments[args.index].createdAt = new Date();
              $scope.product.miscDocuments[args.index].userId = Auth.getCurrentUser()._id;
            }else if(args.type == "valStamp")
              product.valuationStamp = result.data.filename;
            else
              product.documentName = result.data.filename;
          })
          .catch(function(err){
             $rootScope.loading = false;
            Modal.alert("Error in file upload.",true);
          });

        });
    });
  }

  init();

  function onStateChange(noReset){

    $scope.locationList = [];
    if(!noReset)
        product.city = "";
    if(!$scope.product.state)
      return;

    LocationSvc.getAllLocation().
    then(function(result){
      $scope.locationList = result.filter(function(item){
        return item.state.name == $scope.product.state;
      });
    });
  }

  function onRoleChange(userType,noChange){
    if(!userType){
      $scope.getUsersOnUserType = "";
      return;
    }
    var dataToSend = {};
    dataToSend["status"] = true;
    dataToSend["userType"] = userType;
    if(!noChange){
      product.seller = {};
      product.seller.userType = userType;
      $scope.container.selectedUserId = "";
    }
    userSvc.getUsers(dataToSend).then(function(result){
      $scope.getUsersOnUserType = result;
    });
  }

   function onCategoryChange(categoryId,noChange){
     if(!noChange)
    {
      product.productName = "";
      product.brand = {};
      product.model = {};
      if(categoryId){
        var ct = categorySvc.getCategoryOnId(categoryId);
        product.group = ct.group;
        product.category._id = ct._id;
        product.category.name = ct.name;
      }    
      else{
        product.group = {};
        product.category = {};
      }

     $scope.container.selectedBrandId = "";
     $scope.container.selectedModelId = "";
    }
     
    $scope.brandList = [];
    $scope.modelList = [];
    //$scope.product.technicalInfo = {};
     if(!categoryId)
      return;
    var otherBrand = null;
    var filter = {};
    filter['categoryId'] = categoryId;
    brandSvc.getBrandOnFilter(filter)
    .then(function(result){
      $scope.brandList = result;

    })
    .catch(function(res){
      console.log("error in fetching brand",res);
    })
  }

  function onBrandChange(brandId,noChange){
    if(!noChange)
    {
      product.name = "";
      product.model = {};
      
      if(brandId){
         var brd = [];
         brd = $scope.brandList.filter(function(item){
          return item._id == brandId;
        });
        if(brd.length == 0)
          return;
        product.brand._id = brd[0]._id;
        product.brand.name = brd[0].name;
      }else{
        product.brand = {};
      }
     $scope.container.selectedModelId = "";
    }
    
    //$scope.product.technicalInfo = {};
    $scope.modelList = [];
    if(!brandId)
       return;
    var otherModel = null;
    var filter = {};
    filter['brandId'] = brandId;
    modelSvc.getModelOnFilter(filter)
    .then(function(result){
      $scope.modelList = result;
    })
    .catch(function(res){
      console.log("error in fetching model",res);
    })

  }

  function onModelChange(modelId){
    if(!modelId){
      product.model = {};
      return;
    }
    $scope.product.technicalInfo = {};
    var md = null;
    for(var i=0; i< $scope.modelList.length;i++){
      if($scope.modelList[i]._id == modelId){
        md = $scope.modelList[i];
        break;
      }
    }
    if(md){
      product.model._id = md._id;
      product.model.name = md.name;
      var techFilter = {
        category : product.category.name,
        brand : product.brand.name,
        model : product.model.name
      };

      ProductTechInfoSvc.fetchInfo(techFilter)
        .then(function(techInfo){
          if(techInfo.length){
            $scope.product.technicalInfo = {
              grossWeight : techInfo[0].information.grossWeight,
              operatingWeight : techInfo[0].information.operatingWeight, 
              bucketCapacity : techInfo[0].information.bucketCapacity,
              enginePower : techInfo[0].information.enginePower, 
              liftingCapacity : techInfo[0].information.liftingCapacity 
            } 
          }
        })
    }else
      product.model = {};
  }

  function onTradeTypeChange(tradeType){
      $scope.assetList = [];
      for(var i=0;i<assetStatuses.length;i++){
        if(tradeType == 'SELL' && assetStatuses[i].code == 'rented')
          continue;
        if(tradeType == 'RENT' && assetStatuses[i].code == 'sold')
          continue;

        $scope.assetList[$scope.assetList.length] = assetStatuses[i];
      }
    }

  function onUserChange(userId){
      if(angular.isUndefined(userId) || !userId){
        //product.seller = {};
        return;
      }
      var seller = null;
      for(var i=0;i< $scope.getUsersOnUserType.length;i++){
          if(userId == $scope.getUsersOnUserType[i]._id){
            seller = $scope.getUsersOnUserType[i];
            break;
          }
      }
      if(!seller)
        return;
      product.seller._id = seller._id;
      product.seller.fname = seller.fname;
      product.seller.mname = seller.mname;
      product.seller.lname = seller.lname;
      product.seller.role = seller.role;
      //product.seller.userType = user.userType;
      product.seller.phone = seller.phone;
      $scope.product.seller.mobile = product.seller.mobile = seller.mobile;
      $scope.product.seller.email = product.seller.email = seller.email;
      product.seller.country = seller.country;
      product.seller.company = seller.company;
  }

  function updateAssetStatusTemp(files){
    if(!files[0])
      return;
    if(files[0].name.indexOf('.xlsx') == -1){
        Modal.alert('Please upload a valid file');
        return;
    }
    uploadSvc.upload(files[0],importDir)
    .then(function(result){
      var fileName = result.data.filename;
      $rootScope.loading = true;
      productSvc.bulkProductStatusUpdate(fileName)
      .then(function(res){
          $rootScope.loading = false;
          var totalRecord = res.successCount + res.errorList.length;
          var message =  res.successCount + " out of "+ totalRecord  + " records are updated successfully.";
          if(res.errorList.length > 0){
             var data = {};
            data['to'] = Auth.getCurrentUser().email;
            data['subject'] = 'Bulk produt status update error details.';
            var serData = {};
            serData.serverPath = serverPath;
            serData.errorList = res.errorList;
            notificationSvc.sendNotification('BulkProductStatusUpdateError', data, serData,'email');
            message += "Error details have been sent on registered email id.";
          }
          Modal.alert(message,true);
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

  function clickHandler(type, val){
    if(type == "hours" && !val)
      delete $scope.product.rent.rateHours;
    else if(type == "days" && !val)
      delete $scope.product.rent.rateDays;
    else if(type == "months" && !val)
      delete $scope.product.rent.rateMonths;
  }

  function firstStep(form,product){

     var ret = false;
     if($scope.container.mfgYear){
      if($scope.container.mfgYear.getFullYear)
        $scope.product.mfgYear = $scope.container.mfgYear.getFullYear();
       }
      else{
          form.mfgyear.$invalid = true;
          ret = true;
      }
      if($scope.product.tradeType != "SELL"){
        if(!$scope.product.rent.negotiable && angular.isUndefined($scope.product.rent.rateHours) && angular.isUndefined($scope.product.rent.rateDays) && angular.isUndefined($scope.product.rent.rateMonths)) {
          ret = true;
          Modal.alert("Please select at-least one check box in 'Check Rental Rate For'.",true);
          return;
        }
      }

      if(form.$invalid ||ret){
        $scope.submitted = true;
        //angular.element("[name='" + $scope.form.$name + "']").find('.ng-invalid:visible:first').focus();
        $timeout(function(){angular.element(".has-error").find('input,select').first().focus();},20);
        return;
      }

      /*if($scope.container.selectedSubCategory){
         product.subcategory = {};
         product.subcategory['_id'] = $scope.container.selectedSubCategory['_id'];
         product.subcategory['name'] = $scope.container.selectedSubCategory['name'];
      }*/
      product.assetDir = $scope.assetDir;
      $scope.product.images = [];
      var primaryFound = false;
      $scope.images.forEach(function(item,index){
          if(item.src){
            var imgObj = {};
            imgObj.src = item.src;
            if(item.isPrimary){
              imgObj.isPrimary = true;
              product.primaryImg = item.src;
              primaryFound = true;
            }else{
               imgObj.isPrimary = false;
            }
            if(item.waterMarked)
                imgObj.waterMarked = true;
             else
              imgObj.waterMarked = false;
            $scope.product.images[$scope.product.images.length] = imgObj;
          }

      });

      if($scope.product.images.length == 0){
        Modal.alert("Please upload atleast one image.",true);
        $rootScope.loading = false;
        return;
      }

      if(!primaryFound){
        $scope.product.primaryImg = $scope.product.images[0].src;
        $scope.product.images[0].isPrimary = true;
      }

      if($rootScope.getCurrentUser()._id && $rootScope.getCurrentUser().role == 'admin' && product.status) {
        product.applyWaterMark = true;
      }else{
        product.applyWaterMark = false;
      }

      if(product.auctionListing){
         goToSecondStep();
         return;
      }else{
        var cb = null;
        if($scope.valuationReq.valuate)
          cb = postValuationRequest;
        
        addOrUpdate(cb);
      }
      
  }
  
  function goToSecondStep(){

    $scope.tabObj.step1 = false;
    $scope.tabObj.step2 = true;
    var filter = {};
    filter['yetToStartDate'] = new Date();
    AuctionMasterSvc.get(filter)
    .then(function(aucts){
      $scope.auctions = aucts;
    });

    $scope.auctionReq.valuationReport = checkValuationReport();

  }

  function checkValuationReport(){
    var fileName = "";
    var lastTime = new Date().getTime();
    for(var i= 0;i < $scope.product.miscDocuments.length;i++){
        if($scope.product.miscDocuments[i].type == 'Valuation'){
          var creationTime = new Date($scope.product.miscDocuments[i].createdAt).getTime();
          if(creationTime <= lastTime){
            fileName = $scope.product.miscDocuments[i].name;
            lastTime = creationTime;
          }
        }
    }
    return fileName;
  }

  function secondStep(form,product){
    if(form.$invalid){
      $scope.auctSubmitted = true;
      return;
    }

    var auctionAvailed = product.auction && product.auction._id?true:false;
    if(product.auctionListing && !$scope.auctionReq.valuationReport && !$scope.valuationReq.valuate && !auctionAvailed)
    {
      Modal.alert("Valuation report is mandatory for aution listing");
      return;
    }
    addOrUpdate(postAuction);  
  }



  function postAuction(productObj){

    var stsObj = {};
    if(!productObj.auction)
        productObj.auction = {};
    if(!productObj.auction._id){
       $scope.auctionReq.user = {};
       $scope.auctionReq.user._id = Auth.getCurrentUser()._id;
       $scope.auctionReq.user.mobile = Auth.getCurrentUser().mobile;
       $scope.auctionReq.user.email = Auth.getCurrentUser().email;
       $scope.auctionReq.seller = {};
       $scope.auctionReq.seller._id = productObj.seller._id;
       $scope.auctionReq.seller.name = productObj.seller.fname;
       
       if(productObj.seller.mname)
          $scope.auctionReq.seller.name += " " + productObj.seller.mname;
       if(productObj.seller.lname)
          $scope.auctionReq.seller.name += " " + productObj.seller.lname;
       
       $scope.auctionReq.seller.email = productObj.seller.email;
       $scope.auctionReq.seller.mobile = productObj.seller.mobile;
       $scope.auctionReq.status = auctionStatuses[0].code;
       $scope.auctionReq.statuses = [];
       stsObj.createdAt = new Date();
       stsObj.status = auctionStatuses[0].code;
       stsObj.userId = Auth.getCurrentUser()._id;
       $scope.auctionReq.statuses[$scope.auctionReq.statuses.length] = stsObj;
    }

    $scope.auctionReq.product = {};
    $scope.auctionReq.product._id = productObj._id;
    $scope.auctionReq.product.assetId = productObj.assetId;
    $scope.auctionReq.product.name = productObj.name;
    $scope.auctionReq.product.productId = productObj.productId;
    $scope.auctionReq.product.category = productObj.category.name;
    $scope.auctionReq.product.brand = productObj.brand.name;
    $scope.auctionReq.product.model = product.model.name;
    $scope.auctionReq.product.mfgYear = productObj.mfgYear;
    $scope.auctionReq.product.serialNo = productObj.serialNo;
    $scope.auctionReq.product.grossPrice = productObj.grossPrice;
    $scope.auctionReq.product.assetDir = productObj.assetDir;
    $scope.auctionReq.product.primaryImg = productObj.primaryImg;

    for(var i=0;i< $scope.auctions.length; i++){
      if($scope.auctions[i]._id == $scope.auctionReq.dbAuctionId){
        $scope.auctionReq.startDate = $scope.auctions[i].startDate;
        $scope.auctionReq.endDate = $scope.auctions[i].endDate;
        $scope.auctionReq.auctionId = $scope.auctions[i].auctionId;
        break;
      }
    }

    if($scope.valuationReq.valuate){
      createValuationRequest(productObj,"Listing in auction");
    }
    $scope.valuationReq.isAuction = true;
    var paymentTransaction = createPaymentObj(productObj,"Auction Listing");

    var serverObj = {};
    serverObj['auction'] = $scope.auctionReq;
    if($scope.valuationReq.valuate)
     serverObj['valuation'] = $scope.valuationReq;
    if(paymentTransaction)
      serverObj['payment'] = paymentTransaction;
    productSvc.createOrUpdateAuction(serverObj)
    .then(function(res){
        //goto payment if payment are necessary
        if(paymentTransaction && res.transactionId)
          $state.go("payment",{tid:res.transactionId});
        else
           $state.go('productlisting');
    })
    .catch(function(err){
        //error handling
    })
  }

  function postValuationRequest(productObj){
	if(!productObj.auction)
        productObj.auction = {};
	
    createValuationRequest(productObj,"Buying or Selling of Asset");
    var paymentTransaction = createPaymentObj(productObj,"Auction Listing");
    ValuationSvc.save({valuation:$scope.valuationReq,payment:paymentTransaction})
    .then(function(result){      
      if(result.transactionId)
        $state.go('payment',{tid:result.transactionId});
    })
    .catch(function(){
      //error handling
    });


  }

  function createValuationRequest(productObj,purpose){

      $scope.valuationReq.user = {};
      $scope.valuationReq.user._id = Auth.getCurrentUser()._id;
      $scope.valuationReq.user.mobile = Auth.getCurrentUser().mobile;
      $scope.valuationReq.user.email = Auth.getCurrentUser().email;
      $scope.valuationReq.seller = {};
      $scope.valuationReq.seller._id = productObj.seller._id;
      $scope.valuationReq.seller.mobile = productObj.seller.mobile;
      $scope.valuationReq.seller.email = productObj.seller.email;
      
      $scope.valuationReq.initiatedBy = "seller";
      $scope.valuationReq.purpose = purpose;
      $scope.valuationReq.product = {};
      $scope.valuationReq.product._id = productObj._id;
      $scope.valuationReq.product.assetId = productObj.assetId;
      $scope.valuationReq.product.assetDir = productObj.assetDir;
      $scope.valuationReq.product.primaryImg = productObj.primaryImg;
      $scope.valuationReq.product.category = productObj.category.name;
      $scope.valuationReq.product.city = productObj.city;
      $scope.valuationReq.product.status = productObj.assetStatus;
      $scope.valuationReq.product.serialNumber = productObj.serialNo;
      $scope.valuationReq.product.name = productObj.name;
      for(var i=0; i < $scope.valAgencies.length;i++){
        if($scope.valuationReq.valuationAgency._id == $scope.valAgencies[i]._id){
          $scope.valuationReq.valuationAgency.name = $scope.valAgencies[i].name;
          $scope.valuationReq.valuationAgency.email = $scope.valAgencies[i].email;
          $scope.valuationReq.valuationAgency.mobile = $scope.valAgencies[i].mobile;
          break;
        }
      }
      $scope.valuationReq.status = valuationStatuses[0].code;
      $scope.valuationReq.statuses = [];
      var stObject = {};
      stObject.createdAt = new Date();
      stObject.status = valuationStatuses[0].code;
      stObject.userId = Auth.getCurrentUser()._id;
      $scope.valuationReq.statuses[$scope.valuationReq.statuses.length] = stObject;
  }

  function createPaymentObj(productObj,requestType){

    var paymentTransaction = {};
    paymentTransaction.payments = [];
    paymentTransaction.totalAmount = 0;
    paymentTransaction.requestType = requestType;;
    var payObj = null;
    var createTraction = false;
    if(!productObj.auction._id && productObj.auctionListing){
      payObj = {};
      var pyMaster = PaymentMasterSvc.getPaymentMasterOnSvcCode("Auction");
      payObj.type = "auctionreq";
      payObj.charge = pyMaster.fees;
      paymentTransaction.totalAmount += payObj.charge;
      paymentTransaction.payments[paymentTransaction.payments.length] = payObj;
      createTraction = true; 
    }
    
    if($scope.valuationReq.valuate){
      payObj = {};
      var pyMaster = PaymentMasterSvc.getPaymentMasterOnSvcCode("Valuation",$scope.valuationReq.valuationAgency._id);
      payObj.type = "valuationreq";
      payObj.charge = pyMaster.fees;
      paymentTransaction.totalAmount += payObj.charge;
      paymentTransaction.payments[paymentTransaction.payments.length] = payObj;
      createTraction = true;        
    }

    if(createTraction){
      
        paymentTransaction.product = {};
        paymentTransaction.product.type = "equipment";
        paymentTransaction.product._id = productObj._id;
        paymentTransaction.product.assetId = productObj.assetId;
        paymentTransaction.product.assetDir = productObj.assetDir;
        paymentTransaction.product.primaryImg = productObj.primaryImg;
        paymentTransaction.product.city = productObj.city;
        paymentTransaction.product.name = productObj.name;
        paymentTransaction.product.status = productObj.assetStatus;
        paymentTransaction.product.category = productObj.category.name;
        paymentTransaction.user = {};
        paymentTransaction.user._id = Auth.getCurrentUser()._id;
        paymentTransaction.user.fname = Auth.getCurrentUser().fname;
        paymentTransaction.user.mobile = Auth.getCurrentUser().mobile;
        paymentTransaction.user.email = Auth.getCurrentUser().email;
        paymentTransaction.user.city = Auth.getCurrentUser().city;

        paymentTransaction.status = transactionStatuses[0].code;
        paymentTransaction.statuses = [];
        var sObj = {};
        sObj.createdAt = new Date();
        sObj.status = transactionStatuses[0].code;
        sObj.userId = Auth.getCurrentUser()._id;
        paymentTransaction.statuses[paymentTransaction.statuses.length] = sObj;
        if(Auth.isAdmin())
          paymentTransaction.paymentMode = "offline";
        else
          paymentTransaction.paymentMode = "online";
    }

    if(createTraction)
      return paymentTransaction;
    else
      return null;
  }

  function addOrUpdate(cb){

      $scope.product.videoLinks = $scope.product.videoLinks.filter(function(item,idx){
          if(item && item.uri)
              return true;
          else
            return false;

      });

       $scope.product.miscDocuments = $scope.product.miscDocuments.filter(function(item,idx){
          if(item && item.name)
              return true;
          else
            return false;

      });

      $scope.product.serviceInfo = $scope.product.serviceInfo.filter(function(item,idx){
          if(item && (item.servicedate || item.operatingHour || item.serviceAt || item.authServiceStation))
              return true;
          else
            return false;

      });

     if(!$scope.isEdit)
          addProduct(cb);
      else
        updateProduct(cb);
  }

  function addProduct(cb){

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
      product.user.country = Auth.getCurrentUser().country;
      product.user.company = Auth.getCurrentUser().company;
      if($.isEmptyObject(product.seller)){
        product.seller = {};
        product.seller = product.user;
      }

      if($scope.product.currencyType == "")
        $scope.product.currencyType = "INR";

      $scope.product.assetStatuses = [];
      var stObj = {};
      stObj.userId = product.user._id;
      stObj.status = assetStatuses[0].code;
      stObj.createdAt = new Date();
      $scope.product.assetStatuses[$scope.product.assetStatuses.length] = stObj;
      $scope.product.assetId = $scope.assetDir;
      
      $rootScope.loading = true;
      productSvc.addProduct(product).then(function(result){

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
          if(Auth.isAdmin()) {
            if(result.status)
                AppNotificationSvc.createAppNotificationFromProduct(result);
            mailToCustomerForApprovedAndFeatured(result, product);
          } else {

              var data = {};
              data['to'] = result.seller.email;
              data['subject'] = 'Product Upload: Request for Listing';
              result.serverPath = serverPath;
              result.listedFor = result.tradeType;
              if(result.listedFor == 'BOTH')
                  result.listedFor = "SELL & RENT"
              notificationSvc.sendNotification('productUploadEmailToCustomer', data, result,'email');

              data['to'] = supportMail;
              data['subject'] = 'Product Upload: Request for activation';
              result.serverPath = serverPath;
              notificationSvc.sendNotification('productUploadEmailToAdmin', data, result,'email');
              
          }
          if(cb)
            cb(result)
          else{ 
            product = $scope.product ={};
            $state.go('productlisting');
          }
         
      });
  }


  function updateProduct(cb){

      if($rootScope.getCurrentUser()._id && $rootScope.getCurrentUser().role != 'admin') {
        product.status = false;
        product.featured = false;
      }
      if($scope.product.currencyType == "")
        $scope.product.currencyType = "INR";
        if(!$scope.product.assetStatuses)
            $scope.product.assetStatuses = [];
        if(prevAssetStatus != $scope.product.assetStatus){
            var stObj = {};
            stObj.userId = $scope.product.user._id;
            stObj.status = $scope.product.assetStatus;
            stObj.createdAt = new Date();
            $scope.product.assetStatuses[$scope.product.assetStatuses.length] = stObj;
            if($scope.product.assetStatus == assetStatuses[2].code){
              $scope.product.isSold = true;
              $scope.product.featured = false;
              //$scope.product.status = false;
            } else if($scope.product.assetStatus == assetStatuses[1].code){
              $scope.product.isSold = true;
              $scope.product.featured = false;
            }
        }

      if(!$scope.product.assetId)
        $scope.product.assetId = $scope.assetDir;
      $rootScope.loading = true;
      productSvc.updateProduct(product).then(function(result){
        $rootScope.loading = false;
         setScroll(0);
        $scope.successMessage = "Product updated successfully";
        $scope.autoSuccessMessage(20);
        AppNotificationSvc.createAppNotificationFromProduct(product);
        mailToCustomerForApprovedAndFeatured(result, product);
		 if(cb)
			cb(product);
		  else
			$state.go('productlisting');
      });
  }

  function addToHistory(product,type){
      if($scope.relistingEnable) {
          $scope.productHistory.type = "Relist";
      } else {
          $scope.productHistory.type = "Edit";
      }
      if(type)
        $scope.productHistory.type = type;
      productHistory.history = {};
      productHistory.user = {};
      productHistory.history = product;
      productHistory.user = $rootScope.getCurrentUser();
      productSvc.addProductInHistory(productHistory).then(function(result){
        $rootScope.loading = false;
      });
  }

  function mailToCustomerForApprovedAndFeatured(result, product) {
    if(result.status)
    {
      var data = {};
      data['to'] = product.seller.email;
      data['subject'] = 'Request for Product Upload : Approved';
      product.serverPath = serverPath;
       result.listedFor = result.tradeType;
        if(result.listedFor == 'BOTH')
            result.listedFor = "SELL & RENT"
      notificationSvc.sendNotification('productUploadEmailToCustomerActive', data, product,'email');
    }
    if(result.featured)
    {
      var data = {};
      data['to'] = product.seller.email;
      data['subject'] = 'Request for Product Upload : Featured';
      product.serverPath = serverPath;
      notificationSvc.sendNotification('productUploadEmailToCustomerFeatured', data, product,'email');
    }
  }

  function resetClick(form){

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
    $scope.images = [{isPrimary:true}];
    prepareImgArr();
    productHistory = $scope.productHistory = {};
    $scope.container.mfgYear = null;
  }

  function makePrimary(val){
    $scope.primaryIndex = val;
     $scope.images.forEach(function(item,index,arr){
      if($scope.primaryIndex == index)
          item.isPrimary = true;
        else
          item.isPrimary = false;
      });
  }

   function deleteImg(idx){
     $scope.images[idx] = {};
    $scope.images.forEach(function(item,index,arr){
      if(item.isPrimary)
          $scope.primaryIndex = index;
      });
    if(typeof $scope.primaryIndex === 'undefined')
        $scope.primaryIndex  =  0;

  }

     // preview uploaded images
    function previewProduct(){
      //Start NJ : uploadProductPreview object push in GTM dataLayer
      dataLayer.push(gaMasterObject.uploadProductPreview);
      //NJ: set upload product Preview time
      var productUploadPreviewTime = new Date();
      var timeDiff = Math.floor(((productUploadPreviewTime - $scope.productUploadStartTime) / 1000) * 1000);
      gaMasterObject.uploadProductPreviewTime.timingValue = timeDiff;
      ga('send', gaMasterObject.uploadProductPreviewTime);
      //End
      var prevScope = $rootScope.$new();
      prevScope.selectedRadio = $scope.primaryIndex;
      prevScope.images = $scope.images;
      prevScope.prefix = $rootScope.uploadImagePrefix;
      prevScope.assetDir = $scope.assetDir;
      prevScope.isEdit = $scope.isEdit;
      var prvProduct = {};
      angular.copy($scope.product,prvProduct);
      var img = $scope.images[$scope.primaryIndex];
      if(img.name)
        prvProduct.primaryImage = img.name;
      else
        prvProduct.primaryImage = img.src;
      prvProduct.src = img.src;
      prvProduct.mfgYear = $scope.container.mfgYear;
      prevScope.product = prvProduct;
      var prvProductModal = $uibModal.open({
          templateUrl: "productPreview.html",
          scope: prevScope,
          windowTopClass:'product-preview',
          size: 'lg'
      });

      prevScope.deleteImg = $scope.deleteImg
      prevScope.makePrimary = $scope.makePrimary;
      prevScope.getDateFormat = function(serviceDate){
        if(!serviceDate)
          return;
        return moment(serviceDate).format('DD/MM/YYYY');
      }

       prevScope.dismiss = function () {
        prvProductModal.dismiss('cancel');
      };

      prevScope.isEngineRepaired = function(value) {
        if(value == 'true')
          return "Yes";
        else
          return "No";
      }
     }

     $scope.timestamp = new Date().getTime();
      function rotate(idx){
        var img = $scope.images[idx];
        var imagePath = $scope.assetDir + "/" + img.src;
        $http.post("/api/common/rotate",{imgPath:imagePath})
        .then(function(res){
          $scope.timestamp = new Date().getTime();
        })
      }

      function openCropModal(idx){

          if($scope.images[idx].waterMarked)
            return;
          var cropScope = $rootScope.$new();
          cropScope.imgSrc = $scope.images[idx].src;
          cropScope.prefix =  $rootScope.uploadImagePrefix + $scope.assetDir+"/";
          cropScope.assetDir = $scope.assetDir;
          var cropImageModal = $uibModal.open({
              templateUrl: "cropImage.html",
              scope: cropScope,
              controller:'CropImageCtrl',
              size: 'lg'
          });

          cropImageModal.result.then(function(res){
            $scope.timestamp = new Date().getTime();
          })

      };

      function playVideo(idx){
          var videoScope = $rootScope.$new();
          videoScope.productName = $scope.product.name;
          var videoId = youtube_parser($scope.product.videoLinks[idx].uri);
          if(!videoId)
            return;
          videoScope.videoid = videoId;
          var playerModal = $uibModal.open({
              templateUrl: "app/product/youtubeplayer.html",
              scope: videoScope,
              size: 'lg'
          });
        videoScope.close = function(){
          playerModal.dismiss('cancel');
        }

      };

      function getImageArr(){
        var imgArr = [];
        $scope.images.forEach(function(item,index,arr){
          if(item.src)
            imgArr[imgArr.length] = item;
        });
        return imgArr;

      }

      function prepareImgArr(){
        var numberOfIteration  = 8 - $scope.images.length;
        for(var i = 0; i < numberOfIteration; i++){
          $scope.images[$scope.images.length] = {};
        }
      }

     // date picker
      $scope.today = function() {
          $scope.container.mfgYear = new Date();
        };
        if(!$scope.isEdit)
          $scope.today();

        $scope.clear = function () {
          $scope.container.mfgYear = null;
        };

        $scope.toggleMin = function() {
          $scope.minDate = $scope.minDate ? null : new Date();
        };
        $scope.toggleMin();
        $scope.maxDate = new Date();
        $scope.minDate = new Date(1900,1,1);


        $scope.open = function($event) {
          $scope.container.opened = true;
        };

        $scope.popups = [{opened:false}]

        $scope.open1 = function() {
          $scope.popup1.opened = true;
        };
        $scope.open2 = function() {
          $scope.popup2.opened = true;
        };
        $scope.open3 = function() {
          $scope.popup3.opened = true;
        };

        $scope.popup1 = {
          opened: false
        };
        $scope.popup2 = {
          opened: false
        };
        $scope.popup3 = {
          opened: false
        };

        $scope.setDate = function(year, month, day) {
            $scope.container.mfgYear = new Date(year, month, day);
        };

        $scope.datepickerOptions = {
          datepickerMode:"'year'",
          minMode:"'year'",
          minDate:"minDate",
          showWeeks:"false"
        };

        $scope.formats = ['yyyy', 'dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
        $scope.format = $scope.formats[0];
        $scope.formats1 = ['dd/MM/yyyy', 'dd.MM.yyyy', 'shortDate'];
        $scope.format1 = $scope.formats1[0];

        $scope.status = {
          opened: false
        };

      $scope.oneAtATime = true;
      $scope.status = {
        FirstOpen: true,
        FirstDisabled: false
      };

      
}

//Crop Image Controller
function CropImageCtrl($scope, Auth, $location, $window,$http,$uibModalInstance) {
     $scope.imageOut='';
      $scope.options={};
      var imgParts =  $scope.imgSrc.split(".");
      var imgExt = imgParts[imgParts.length - 1];
      $scope.options.image= $scope.prefix + $scope.imgSrc + "?timestamp=" + new Date().getTime();
      $scope.options.viewSizeWidth= 500;
      $scope.options.viewSizeHeight= 500;

      $scope.options.viewShowRotateBtn= false;
      $scope.options.rotateRadiansLock= false;

      $scope.options.outputImageWidth= 0 ;
      $scope.options.outputImageHeight= 0;
      $scope.options.outputImageRatioFixed= false;
      $scope.options.outputImageType= imgExt;
      $scope.options.outputImageSelfSizeCrop= true;
      $scope.options.viewShowCropTool= true;
      $scope.options.inModal = true;
      $scope.options.watermarkType='image';
      $scope.options.watermarkImage= null;

       $scope.cropImage= function(){
          $scope.$broadcast('cropImage');
       };

      $scope.saveImage= function(){
            $scope.$broadcast('cropImageSave');
      };

      $scope.saveCrop = function(data){
       var serData = {};
       serData['data'] = data;
       //serData["imgExt"] = imgExt;
       serData['assetdir'] = $scope.assetDir;
       serData['filename'] = $scope.imgSrc;
        $http.post('/api/common/saveasimage',serData)
        .then(function(res){
          $uibModalInstance.close("ok");
        })
        .catch(function(res){
            console.log(res);
        })
      };
      $scope.closeModal = function(){
        $uibModalInstance.close();
      }
       $scope.dismissModal = function(){
        $uibModalInstance.dismiss();
      }

  }



})();
