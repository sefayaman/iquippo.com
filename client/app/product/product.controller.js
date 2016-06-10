(function(){

'use strict';
angular.module('sreizaoApp')
 .controller('ProductCtrl', ['$scope','$http', '$rootScope', '$stateParams', 'groupSvc','categorySvc','SubCategorySvc','LocationSvc','uploadSvc','productSvc', 'brandSvc','modelSvc','Auth','suggestionSvc','$uibModal','Modal', '$state', 'notificationSvc', 'userSvc','$timeout','$sce' , function($scope, $http, $rootScope, $stateParams, groupSvc, categorySvc,SubCategorySvc,LocationSvc, uploadSvc, productSvc, brandSvc, modelSvc, Auth, suggestionSvc, $uibModal, Modal, $state, notificationSvc, userSvc,$timeout,$sce) {
    $scope.categoryList = [];
    var prevAssetStatus = assetStatuses[0].code;
    var product = $scope.product = {};
    $rootScope.isSuccess = false;
    $rootScope.isError = false;
    $scope.product.images = [];
    $scope.assetDir = "";
    $scope.assetStatuses = assetStatuses;
    $scope.product.technicalInfo = {};
    $scope.product.technicalInfo.params = [{}];
    $scope.product.serviceInfo = [{}];
    $scope.product.miscDocuments = [{}];
    $scope.product.videoLinks = [{}];
    $scope.product.country = "";
    $scope.product.status = false;
    $scope.product.assetStatus = assetStatuses[0].code;
    $scope.product.featured = false;
    $scope.product.rent = {};
    $scope.product.rent.rateHours = {};
    $scope.product.rent.rateDays = {};
    $scope.product.rent.rateMonths = {};
    $scope.product.rent.rateHours.rateType = 'hours';
    product.group = {};
    product.category = {};
    product.brand = {};
    product.model = {};
    $scope.isEdit = false;
    $scope.relistingEnable = false;
    var videoObj = $scope.video = {};
    var docObj = $scope.doc = {};
    var tcDocObj = $scope.tcDoc = {};
    $scope.productName;
    $scope.images = [{isPrimary:true}];
    $scope.primaryIndex = 0;
    $scope.enableButton = false;
    var productHistory = $scope.productHistory = {};
    var ALLOWED_DATA_SIZE = 15*1024*1024;

  $scope.userRequiredFlag = true;
  $scope.compRequiredFlag = false;


  // get all user based on role
  function init(){

    groupSvc.getAllGroup()
    .then(function(result){
      $scope.allGroup = result;
    });

    categorySvc.getAllCategory()
    .then(function(result){
      $scope.allCategory = result;
    });

     SubCategorySvc.getAllSubCategory()
    .then(function(result){
      $scope.allSubCategory = result;
    });

     LocationSvc.getAllState()
    .then(function(result){
      $scope.stateList = result;
    });
    if(Auth.getCurrentUser().profileStatus == 'incomplete'){
      $state.go('myaccount');
      return;
    }
    //LocationSvc.getAllLocation()
  }
  init();
  $scope.onStateChange = function(noReset){
    
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

  $scope.onRoleChange = function(userType){
    if(!userType){
      $scope.getUsersOnUserType = "";
      return;
    }
    var dataToSend = {};
    dataToSend["status"] = true;
    if(userType) {
      dataToSend["userType"] = userType;
      if(userType == "legalentity") {
        //$scope.requiredFlag = true;
        $scope.userRequiredFlag = false;
        $scope.compRequiredFlag = true;
      } else {
        //$scope.requiredFlag = false;
        $scope.userRequiredFlag = true;
        $scope.compRequiredFlag = false;
      }
    }

    userSvc.getUsers(dataToSend).then(function(result){
      $scope.getUsersOnUserType = result;
    });
  }

  if($stateParams.id) {
    $scope.isEdit = true;
    productSvc.getProductOnId($stateParams.id).then(function(response){
      if(response.serviceInfo.length > 0){
        for(var i =0; i < response.serviceInfo.length; i++){
          if(response.serviceInfo[i] && response.serviceInfo[i].servicedate)
            response.serviceInfo[i].servicedate = moment(response.serviceInfo[i].servicedate).toDate();
        }
      }
      product = $scope.product = response;
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

      if(product.assetStatus)
          prevAssetStatus = product.assetStatus;
      else
        prevAssetStatus = product.assetStatus = "";
      $scope.userType = product.seller.userType;
      $scope.product.country = $scope.product.country;
      videoObj.name = product.videoName;
      docObj.name = product.documentName;
      tcDocObj.name = product.tcDocumentName;
      $scope.assetDir = product.assetDir;
      $scope.selectedCategory = categorySvc.getCategoryOnId($scope.product.category._id);
      $scope.selectedGroup = groupSvc.getGroupOnId($scope.product.group._id);
      $scope.selectedSubCategory = $scope.product.subcategory;
      brandSvc.getBrandOnFilter({brandId:$scope.product.brand._id})
      .then(function(result){
        if(result.length > 0)
        $scope.selectedBrand = result[0];
      if($scope.product.brand.name == 'Other')
          $scope.selectedBrand['otherName'] = $scope.product.brand.otherName;
        $scope.onBrandChange($scope.selectedBrand,true);
      });

      modelSvc.getModelOnFilter({modelId:$scope.product.model._id})
      .then(function(result){
        if(result.length > 0)
          $scope.selectedModel = result[0];
        if($scope.product.model.name == 'Other')
          $scope.selectedModel['otherName'] = $scope.product.model.otherName;

      })

      $scope.getUsersOnUserType = [];
      $scope.getUsersOnUserType[0] = $scope.product.seller;
      
      if($scope.product.seller.userType == "legalentity") {
        $scope.selectedCompany = $scope.product.seller;
        //$scope.requiredFlag = true;
        $scope.userRequiredFlag = false;
        $scope.compRequiredFlag = true;
      } else {
        $scope.selectedUser = $scope.product.seller;
        //$scope.requiredFlag = false;
        $scope.userRequiredFlag = true;
        $scope.compRequiredFlag = false;
      }
      $scope.onCategoryChange($scope.selectedCategory,true);
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
    
      if($state.current.name == "productrelisting") {
        $scope.relistingEnable = true;
      } else if($state.current.name == "productedit"){
        $scope.enableButton = !Auth.isAdmin() && product.status;
        $scope.relistingEnable = false;
        $scope.isEdit = true;
      }
       prepareImgArr();
    });
  }else{
    prepareImgArr();
  }
  $scope.isCollapsed = true;
  $scope.onCategoryChange = function(category,noChange){
     if(!noChange)
    {
      $scope.productName = "";
      $scope.selectedBrand = {}
      $scope.selectedModel = {}
      if(category)
          $scope.selectedGroup = groupSvc.getGroupOnId(category.group._id);
        else
          $scope.selectedGroup = {};
    }
    $scope.brandList = [];
    $scope.modelList = [];
     if(!category)
      return;
    var otherBrand = null;
    var filter = {};
    filter['categoryId'] = category._id;
    brandSvc.getBrandOnFilter(filter)
    .then(function(result){
      $scope.brandList = result;

    })
    .catch(function(res){
      console.log("error in fetching brand",res);
    })
  }

  $scope.onBrandChange = function(brand,noChange){
    if(!noChange)
    {
      $scope.productName = "";
      $scope.selectedModel = {}
    }
    $scope.modelList = [];
    if(!brand)
       return;
    var otherModel = null;
    var filter = {};
    filter['brandId'] = brand._id;
    modelSvc.getModelOnFilter(filter)
    .then(function(result){
      $scope.modelList = result;
    })
    .catch(function(res){
      console.log("error in fetching model",res);
    })  
   
  }

    $scope.$watch('[selectedModel,selectedCategory,selectedBrand, product.variant]',function(){
      var name = "";
      if($scope.selectedCategory){
        if($scope.selectedCategory.name == "Other")
          name = $scope.selectedCategory.otherName || "";
        else
           name = $scope.selectedCategory.name || "";
      }

      if($scope.selectedBrand){
        if($scope.selectedBrand.name == 'Other')
          name += " " +  ($scope.selectedBrand.otherName || "");
        else
          name += " " +  ($scope.selectedBrand.name || "");
      }
      
      if($scope.selectedModel){

      if($scope.selectedModel.name == 'Other')
         name += " " + ($scope.selectedModel.otherName || "");
       else
        name += " " + ($scope.selectedModel.name || "");
      }

      if($scope.product.variant)
        name += " " + ($scope.product.variant || "");

      if(name)
          $scope.productName =  name;
  },true);

  //listen for the file selected event
  var imgDim = {width:700,height:459};
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
        uploadSvc.upload(args.files[0],$scope.assetDir, resizeParam).then(function(result){
          $scope.assetDir = result.data.assetDir;
          if(!$scope.product.assetId)
            $scope.product.assetId = $scope.assetDir;

          if(args.type == "image")
            $scope.images[parseInt(args.index)].src = result.data.filename;
          else if(args.type == "video")
            videoObj.name = result.data.filename;
          else if(args.type == "tcDoc")
            tcDocObj.name = result.data.filename;
          else if(args.type == "mdoc"){
            $scope.product.miscDocuments[args.index].name = result.data.filename;
          }
          else  
            docObj.name = result.data.filename;
        })
        .catch(function(err){
          Modal.alert("Error in file upload.",true);
        });
          
      });
  });

  
  $scope.clickHandler = function(type, val){
    if(type == "hours" && !val)
      delete $scope.product.rent.rateHours;
    else if(type == "days" && !val)
      delete $scope.product.rent.rateDays;
    else if(type == "months" && !val)
      delete $scope.product.rent.rateMonths;
  }

  var suggestions = [];

  $scope.addOrUpdateProduct = function(product){
     var ret = false;

     if(!$scope.selectedCategory || !$scope.selectedCategory._id){
        $scope.form.category.$invalid = true;
        ret = true;
      }
     
     if(!$scope.selectedBrand || !$scope.selectedBrand._id){
        $scope.form.brand.$invalid = true;
        ret = true;
      }

      if(!$scope.selectedModel || !$scope.selectedModel._id){
        $scope.form.model.$invalid = true;
        ret = true;
      }

      if(Auth.isAdmin() || Auth.isChannelPartner()) {
        if($scope.userRequiredFlag) {
          if(!$scope.selectedUser || !$scope.selectedUser._id){
            $scope.form.userName.$invalid = true;
            ret = true;
          }
      } else if($scope.compRequiredFlag) {
        if(!$scope.selectedCompany || !$scope.selectedCompany._id){
            $scope.form.company.$invalid = true;
            ret = true;
          }
        }
      } else {
        $scope.userRequiredFlag = false;
        $scope.compRequiredFlag = false;
        //ret = false;
      }
      if(!ret){

           if($scope.mfgYear){
            if($scope.mfgYear.getFullYear)
              $scope.product.mfgYear = $scope.mfgYear.getFullYear();
         }
        else{
            $scope.form.mfgyear.$invalid = true;
            ret = true;
        }
      }

      if($scope.product.tradeType != "SELL") {
        if(angular.isUndefined($scope.product.rent.rateHours) && angular.isUndefined($scope.product.rent.rateDays) && angular.isUndefined($scope.product.rent.rateMonths)) {
          ret = true;
          Modal.alert("Please select at-least one check box in 'Check Rental Rate For'.",true);
          return;
        }
      }

      if($scope.form.$invalid ||ret){
        $scope.submitted = true;
        //angular.element("[name='" + $scope.form.$name + "']").find('.ng-invalid:visible:first').focus();
        $timeout(function(){angular.element(".has-error").find('input,select').first().focus();},20);
        return;
      }

      product.group._id = $scope.selectedGroup._id; 
      product.group.name = $scope.selectedGroup.name;
      suggestions[suggestions.length] = {text:product.group.name};

      
      product.category._id = $scope.selectedCategory._id;
      product.category.name = $scope.selectedCategory.name;
      suggestions[suggestions.length] = {text:product.category.name};
      product.name = $scope.productName;
      suggestions[suggestions.length] = {text:product.name};

      
      product.brand._id = $scope.selectedBrand._id;
      product.brand.name = $scope.selectedBrand.name;
      suggestions[suggestions.length] = {text:product.brand.name};

      
      product.model._id = $scope.selectedModel._id;
      product.model.name = $scope.selectedModel.name;
      suggestions[suggestions.length] = {text:product.model.name};

      if($scope.selectedCategory.name == "Other")
         product.category.otherName = $scope.selectedCategory.otherName;

       if($scope.selectedBrand.name == "Other")
         product.brand.otherName = $scope.selectedBrand.otherName;

       if($scope.selectedModel.name == "Other")
          product.model.otherName = $scope.selectedModel.otherName; 

      if($scope.selectedCategory.otherName)
        suggestions[suggestions.length] = {text:$scope.selectedCategory.otherName};

       if($scope.selectedBrand.otherName)
        suggestions[suggestions.length] = {text:$scope.selectedBrand.otherName};
       if($scope.selectedModel.otherName)
        suggestions[suggestions.length] = {text:$scope.selectedModel.otherName}; 
       if($state.current.name == "productrelisting") {
            product.expired = false;
            product.relistingDate = new Date();
          }
      
      if($scope.selectedSubCategory){
         product.subcategory = {};
         product.subcategory['_id'] = $scope.selectedSubCategory['_id'];
         product.subcategory['name'] = $scope.selectedSubCategory['name'];
      }
     

      $rootScope.loading = true;
      if(videoObj.name)
       $scope.product.videoName = videoObj.name;

     if(docObj.name)
       $scope.product.documentName = docObj.name;

     if(tcDocObj.name)
      $scope.product.tcDocumentName = tcDocObj.name;
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

      $scope.product.videoLinks = $scope.product.videoLinks.filter(function(item,idx){
          return item.uri;
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

     /* if(product.priceOnRequest)
        product.grossPrice = '';*/
      if(!$scope.isEdit && !$scope.relistingEnable)
          addProduct();
      else
        updateProduct();
    
  }
  product.seller = {};
  $scope.onUserChange = function(user){
    if(angular.isUndefined(user)){
      product.seller = {};
      return;
    }
    product.seller._id = user._id;
    product.seller.fname = user.fname;
    product.seller.mname = user.mname;
    product.seller.lname = user.lname;
    product.seller.role = user.role;
    product.seller.userType = user.userType;
    product.seller.phone = user.phone;
    $scope.product.seller.mobile = product.seller.mobile = user.mobile;
    $scope.product.seller.email = product.seller.email = user.email;
    product.seller.country = user.country;
    product.seller.company = user.company;
  }

  function addProduct(){
      product.user = {};
      //product.user = Auth.getCurrentUser();
      product.user._id = $rootScope.getCurrentUser()._id;
      product.user.fname = $rootScope.getCurrentUser().fname;
      product.user.mname = $rootScope.getCurrentUser().mname;
      product.user.lname = $rootScope.getCurrentUser().lname;
      product.user.role = $rootScope.getCurrentUser().role;
      product.user.userType = $rootScope.getCurrentUser().userType;
      product.user.phone = $rootScope.getCurrentUser().phone;
      product.user.mobile = $rootScope.getCurrentUser().mobile;
      product.user.email = $rootScope.getCurrentUser().email;
      product.user.country = $rootScope.getCurrentUser().country;
      product.user.company = $rootScope.getCurrentUser().company;
      if((!$scope.selectedUser && !$scope.selectedCompany) 
          || ($.isEmptyObject($scope.selectedUser) && $.isEmptyObject($scope.selectedCompany))) {
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

      /*adding seller info */ 
      productSvc.addProduct(product).then(function(result){
        $rootScope.loading = false;
        setScroll(0);
        $scope.successMessage = "Product added successfully";
        $scope.autoSuccessMessage(20);
        suggestionSvc.buildSuggestion(suggestions);
        if(result.errorCode){
          alert(result.message);
          console.log("error reason",result.message);
        }
        else {
          if(result.productId) {
            productHistory.history = {};
            productHistory.user = {};
    
            productHistory.type = "Create";
            productHistory.history = result;
            productHistory.user = $rootScope.getCurrentUser();
            productSvc.addProductInHistory(productHistory).then(function(result){
            $rootScope.loading = false;
            });
          }
          if(Auth.isAdmin()) {
            mailToCustomerForApprovedAndFeatured(result, product);
            } else {
            var data = {};
            data['to'] = supportMail;
            data['subject'] = 'Product Upload: Request for activation';
            result.serverPath = serverPath;
            notificationSvc.sendNotification('productUploadEmailToAdmin', data, result,'email');
            console.log("Product added",result);
        }
        $state.go('productlisting');
      }
      product = $scope.product ={};
      });
  }
  
  function updateProduct(){
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
              $scope.product.status = false;
            }
        }
      if(!$scope.product.assetId)
        $scope.product.assetId = $scope.assetDir; 
      productSvc.updateProduct(product).then(function(result){
        $rootScope.loading = false;
         setScroll(0);
        $scope.successMessage = "Product updated successfully";
        $scope.autoSuccessMessage(20);
        suggestionSvc.buildSuggestion(suggestions);
        if(result.errorCode){
          alert(result.message);
          console.log("error reason",result.message);
        }
        else {
          mailToCustomerForApprovedAndFeatured(result, product);
          }
           $state.go('productlisting');
      });
      if($scope.relistingEnable) {
          $scope.productHistory.type = "Relist";
      } else {
          $scope.productHistory.type = "Edit";
      }
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

  $scope.resetClick = function(form){
    product = $scope.product = {};
    $scope.brandList = [];
    $scope.modelList = [];
    $scope.product.technicalInfo = {};
    $scope.product.technicalInfo.params = [{}];
    $scope.product.serviceInfo = [{}];
    $scope.product.miscDocuments = [{}];
    $scope.product.videoLinks = [{}];
    $scope.product.group = product.group = {};
    $scope.product.category = product.category = {};
    $scope.product.brand = product.brand = {};
    $scope.product.model = product.model = {};
    $scope.product.seller = product.seller = {};
    videoObj = $scope.video = {};
    docObj = $scope.doc = {};
    tcDocObj = $scope.tcDoc = {};
    $scope.selectedUser = {};
    $scope.selectedCompany = {};
    $scope.selectedCategory = {_id:""};
    $scope.selectedGroup = {};
    $scope.selectedBrand = {};
    $scope.selectedModel = {};
    $scope.selectedSubCategory = {};
    $scope.productName = "";
    $scope.userType = "";
    $scope.selectedGroup.name = "";
    $scope.images = [{isPrimary:true}];
    prepareImgArr();
    productHistory = $scope.productHistory = {};
    $scope.product.seller = product.seller = {};
    $scope.mfgYear = null;

    //rent reset fields

    $scope.product.rent = {};
    $scope.product.rent.rateHours = {};
    $scope.product.rent.rateDays = {};
    $scope.product.rent.rateMonths = {};
    $scope.product.rent.rateHours.rateType = 'hours';
    //$scope.today();
  }

  $scope.makePrimary = function(val){ 
    $scope.primaryIndex = val;
     $scope.images.forEach(function(item,index,arr){
      if($scope.primaryIndex == index)
          item.isPrimary = true;
        else
          item.isPrimary = false;
      });
  }

   $scope.deleteImg = function(idx){
     $scope.images[idx] = {};
    $scope.images.forEach(function(item,index,arr){
      if(item.isPrimary)
          $scope.primaryIndex = index;
      });
    if(typeof $scope.primaryIndex === 'undefined')
        $scope.primaryIndex  =  0;

  }

     // preview uploaded images
  $scope.previewProduct = function(){ 
          var prevScope = $rootScope.$new();     
          prevScope.selectedRadio = $scope.primaryIndex;
          prevScope.images = $scope.images;//getImageArr();
          prevScope.prefix = $rootScope.uploadImagePrefix;
          prevScope.assetDir = $scope.assetDir;
          prevScope.isEdit = $scope.isEdit || $scope.relistingEnable;
          var prvProduct = {};
          angular.copy($scope.product,prvProduct);
          var img = $scope.images[$scope.primaryIndex];
          if(img.name)
            prvProduct.primaryImage = img.name;
          else
            prvProduct.primaryImage = img.src;
          prvProduct.src = img.src;
          prvProduct.videoName = videoObj.name;
          prvProduct.documentName = docObj.name;
          prvProduct.group = $scope.selectedGroup;
          prvProduct.category = $scope.selectedCategory;
          prvProduct.brand = $scope.selectedBrand;
          prvProduct.model = $scope.selectedModel;
          prvProduct.name = $scope.productName;
          prvProduct.mfgYear = $scope.mfgYear;
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

     // date picker
      $scope.today = function() {
          $scope.mfgYear = new Date();
        };
        if(!$scope.isEdit)
          $scope.today();

        $scope.clear = function () {
          $scope.mfgYear = null;
        };

        $scope.toggleMin = function() {
          $scope.minDate = $scope.minDate ? null : new Date();
        };
        $scope.toggleMin();
        $scope.maxDate = new Date();
        $scope.minDate = new Date(1900,1,1);


        $scope.open = function($event) {
          $scope.opened = true;
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
            $scope.mfgYear = new Date(year, month, day);
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


        $scope.timestamp = new Date().getTime();
        $scope.rotate = function(idx){
          var img = $scope.images[idx];
          var imagePath = $scope.assetDir + "/" + img.src;
          $http.post("/api/common/rotate",{imgPath:imagePath})
          .then(function(res){
            $scope.timestamp = new Date().getTime();
          })
        }

      $scope.openCropModal = function(idx){

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

      $scope.playVideo = function(idx){
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

      $scope.oneAtATime = true;
      $scope.status = {
        FirstOpen: true,
        FirstDisabled: false
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
}])
.controller('CropImageCtrl', function ($scope, Auth, $location, $window,$http,$uibModalInstance) {
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
           
  });



})();
