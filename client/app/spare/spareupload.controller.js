(function(){
'use strict';
angular.module('spare').controller('SpareUploadCtrl',SpareUploadCtrl);

//Spare upload controller
function SpareUploadCtrl($scope, $http, $rootScope,$stateParams, groupSvc, spareSvc, categorySvc,SubCategorySvc,LocationSvc, uploadSvc, brandSvc, modelSvc, Auth, $uibModal, Modal, $state, notificationSvc, AppNotificationSvc, userSvc, $timeout, $sce, ManufacturerSvc) {
    var vm = this;
    $rootScope.isSuccess = false;
    $rootScope.isError = false;
    vm.assetDir = "";
    vm.spare = {};
    vm.container = {};

    vm.isEdit = false;

    vm.images = [{isPrimary:true}];
    vm.primaryIndex = 0;
    vm.enableButton = false;
    var imgDim = {width:700,height:459};

    vm.tabObj = {};
    vm.tabObj.step1 = true;
    vm.tabObj.step2 = false;

    vm.onRoleChange = onRoleChange;
    vm.onUserChange = onUserChange;
    vm.resetClick = resetClick;
    vm.firstStep = firstStep;
  	vm.secondStep = secondStep;
    vm.onLocationChange = onLocationChange;
    vm.paymentSelection = paymentSelection;

    vm.onCategoryChange = onCategoryChange;
    vm.onBrandChange = onBrandChange;
    vm.onModelChange = onModelChange;
    vm.onManufacturerChange = onManufacturerChange;
    vm.makePrimary = makePrimary;
    vm.deleteImg = deleteImg;
    vm.rotate = rotate;
    vm.addMoreMaster = addMoreMaster;
    vm.goToUsermanagement = goToUsermanagement;
    vm.openLocationList = openLocationList;
    //vm.closeDialog = closeDialog;


    // function closeDialog() {
    //   $uibModalInstance.dismiss('cancel');
    //   $rootScope.$broadcast('resetBannerTimer');
    // }

    function openLocationList(){
      Modal.openDialog('locationList');
    }
    
    function addMoreMaster(){
      var tmpObj = {};
      tmpObj.category = {};
      tmpObj.brand = {};
      tmpObj.model = {};
      vm.spare.spareDetails.push(tmpObj)
    }

    function goToUsermanagement(){
      $state.go('usermanagment');
      $timeout(function() { Modal.openDialog('adduser');}, 20);
    }

    function onLocationChange(city){
      if(!city)
        return;

      for(var i = 0;i < vm.spare.locations.length;i++){
        if(vm.spare.locations[i].city == city){
          return;
        }
      }
      var locObj = {};
      var state = LocationSvc.getStateByCity(city);
      if(state)
        var country = LocationSvc.getCountryByState(state);

      locObj.city = city;
      locObj.state = state;
      locObj.country = country;
      vm.spare.locations[vm.spare.locations.length] = locObj;
    }
    
    function clearData(){

      vm.spare = {};
      vm.spare.images = [];
      //vm.spare.spareStatuses = [];
      vm.prevAssetStatus = "inactive";
      vm.spare.madeIn = "India";
      vm.spareStatuses = [];
      vm.spare.paymentOption = [];
      vm.spare.spareDetails = [{category:{},brand:{},model:{}}];
      vm.spare.miscDocuments = [{}];
      vm.spare.locations = [];
      vm.spare.status = $rootScope.spareStatus[1].code;
      vm.spare.seller = {};
    }

    clearData();

    function init(){
      categorySvc.getAllCategory()
      .then(function(result){
        vm.allCategory = result;
      });

       SubCategorySvc.getAllSubCategory()
      .then(function(result){
        vm.allSubCategory = result;
      });

      LocationSvc.getAllLocation()
      .then(function(result){
        vm.locationList = result;
      });

      LocationSvc.getAllState();

      ManufacturerSvc.getAllManufacturer()
      .then(function(result){
        vm.manufacturerList = result;
      });


      // product edit case
      if($stateParams.id) {
        vm.isEdit = true;

      spareSvc.getSpareOnId($stateParams.id, true).then(function(response){
          
          vm.spare = response;
          angular.copy(vm.spare.images, vm.images);
          vm.images.forEach(function(item,index){
            if(item.isPrimary)
              vm.primaryIndex = index;
            item.isEdit = true;
            item.name = item.src;
          });

          if(!vm.spare.locations || vm.spare.locations.length == 0)
            vm.spare.locations = [{}];

          if(!vm.spare.miscDocuments || vm.spare.miscDocuments.length == 0)
            vm.spare.miscDocuments = [{}];

          if(!vm.spare.spareDetails || vm.spare.spareDetails.length == 0)
            vm.spare.spareDetails = [{}];

          if(vm.spare.manufacturers && vm.spare.manufacturers._id)
            vm.container.manufacturerId = vm.spare.manufacturers._id;
          

          if(vm.spare.status)
            vm.prevAssetStatus = vm.spare.status;
          else
            vm.prevAssetStatus = vm.spare.status = "";

          vm.assetDir = vm.spare.assetDir;
          vm.spare.spareDetails.forEach(function(item,idx){
            onCategoryChange(idx,true);
            onBrandChange(idx,true);
            //onModelChange(idx,true);
          })

          vm.getUsersOnUserType = [];
          vm.onRoleChange(vm.spare.seller.userType, true);
          if(vm.spare.seller && vm.spare.seller._id)
            vm.container.selectedUserId = vm.spare.seller._id;
        
          if(vm.spare.currencyType == "INR")
            vm.spare.currencyType = "";
         
          if($state.current.name == "spareedit"){
            vm.enableButton = !Auth.isAdmin() && vm.spare.status;
            vm.isEdit = true;
          }
          prepareImgArr();
        });
      }else{
        prepareImgArr();
      }

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
            uploadSvc.upload(args.files[0], vm.assetDir, resizeParam).then(function(result){
              $rootScope.loading = false;
              vm.assetDir = result.data.assetDir;
              
              if(args.type == "image")
                vm.images[parseInt(args.index)].src = result.data.filename;
              else if(args.type == "mdoc"){
                vm.spare.miscDocuments[args.index].name = result.data.filename;
                vm.spare.miscDocuments[args.index].createdAt = new Date();
                vm.spare.miscDocuments[args.index].userId = Auth.getCurrentUser()._id;
              }
            })
            .catch(function(err){
               $rootScope.loading = false;
              Modal.alert("Error in file upload.",true);
            });

          });
      });
    }

    init();

    function paymentSelection(paymentOpt) {
      var idx = vm.spare.paymentOption.indexOf(paymentOpt);
      // is currently selected
      if (idx > -1)
        vm.spare.paymentOption.splice(idx, 1);
      else
        vm.spare.paymentOption.push(paymentOpt);
    }

    vm.timestamp = new Date().getTime();
    function rotate(idx){
      var img = vm.images[idx];
      var imagePath = vm.assetDir + "/" + img.src;
      $http.post("/api/common/rotate",{imgPath:imagePath})
      .then(function(res){
        vm.timestamp = new Date().getTime();
      })
    }

    function onRoleChange(userType,noChange){
	    if(!userType){
	      vm.getUsersOnUserType = "";
	      return;
	    }
	    var dataToSend = {};
	    dataToSend.status = true;
	    dataToSend.userType = userType;
	    if(!noChange){
	      vm.spare.seller = {};
	      vm.spare.seller.userType = userType;
	      vm.container.selectedUserId = "";
	    }
	    userSvc.getUsers(dataToSend).then(function(result){
	      vm.getUsersOnUserType = result;
	    });
	}

    function onUserChange(userId){
      if(angular.isUndefined(userId) || !userId){
        //vm.spare.seller = {};
        return;
      }
      var seller = null;
      for(var i=0; i< vm.getUsersOnUserType.length;i++){
          if(userId == vm.getUsersOnUserType[i]._id){
            seller = vm.getUsersOnUserType[i];
            break;
          }
      }
      if(!seller)
        return;
      vm.spare.seller._id = seller._id;
      vm.spare.seller.fname = seller.fname;
      vm.spare.seller.mname = seller.mname;
      vm.spare.seller.lname = seller.lname;
      vm.spare.seller.role = seller.role;
      vm.spare.seller.userType = seller.userType;
      vm.spare.seller.phone = seller.phone;
      vm.spare.seller.mobile = seller.mobile;
      vm.spare.seller.email = seller.email;
      vm.spare.seller.country = seller.country;
      vm.spare.seller.company = seller.company;
    }

function onManufacturerChange(manufacturerId){
    if(manufacturerId){
      vm.spare.manufacturers = {};
      var mfgName = ManufacturerSvc.getManufacturerNameOnId(manufacturerId);
      //vm.spare.group = ct.group;
      vm.spare.manufacturers._id = manufacturerId;
      vm.spare.manufacturers.name = mfgName;
    }    
    else{
      //vm.spare.group = {};
      vm.spare.manufacturers = {};
    }
  }

function onCategoryChange(idx,noChange){
     if(!noChange)
    { 
      if(vm.spare.spareDetails[idx].category._id){
        var ct = categorySvc.getCategoryOnId(vm.spare.spareDetails[idx].category._id);
        vm.spare.spareDetails[idx].category.name = ct.name;
      }    
      else{
        var tmpObj = {};
        tmpObj.category = {};
        tmpObj.brand = {};
        tmpObj.model = {};
        vm.spare.spareDetails[idx] = tmpObj;
      }
      vm.spare.spareDetails[idx].brand = {};
      vm.spare.spareDetails[idx].model = {};
    }
     
    vm.spare.spareDetails[idx].brandList = [];
    vm.spare.spareDetails[idx].modelList = [];

     if(!vm.spare.spareDetails[idx].category._id)
      return;
    var filter = {};
    filter['categoryId'] = vm.spare.spareDetails[idx].category._id;
    brandSvc.getBrandOnFilter(filter)
    .then(function(result){
      vm.spare.spareDetails[idx].brandList = result;

    })
    .catch(function(res){
      console.log("error in fetching brand",res);
    })
  }

  function onBrandChange(idx,noChange){
    if(!noChange)
    {
      if(vm.spare.spareDetails[idx].brand._id){
         var brd = [];
         brd = vm.spare.spareDetails[idx].brandList.filter(function(item){
          return item._id == vm.spare.spareDetails[idx].brand._id;
        });
        if(brd.length == 0)
          return;
        vm.spare.spareDetails[idx].brand.name = brd[0].name;
      }else{
        vm.spare.spareDetails[idx].brand = {};
      }
     vm.spare.spareDetails[idx].model = {};
    }
    
    vm.spare.spareDetails[idx].modelList = [];
    if(!vm.spare.spareDetails[idx].brand._id)
       return;
    var filter = {};
    filter['brandId'] = vm.spare.spareDetails[idx].brand._id;
    modelSvc.getModelOnFilter(filter)
    .then(function(result){
      vm.spare.spareDetails[idx].modelList = result;
    })
    .catch(function(res){
      console.log("error in fetching model",res);
    })

  }

  function onModelChange(idx){
    if(!vm.spare.spareDetails[idx].model._id){
      vm.spare.spareDetails[idx].model = {};
      return;
    }
    var md = null;
    for(var i=0; i< vm.spare.spareDetails[idx].modelList.length;i++){
      if(vm.spare.spareDetails[idx].modelList[i]._id == vm.spare.spareDetails[idx].model._id){
        md = vm.spare.spareDetails[idx].modelList[i];
        break;
      }
    }
    if(md){
      vm.spare.spareDetails[idx].model.name = md.name;
    }else
      vm.spare.spareDetails[idx].model = {};
  }

  function makePrimary(val){
    vm.primaryIndex = val;
     vm.images.forEach(function(item,index,arr){
      if(vm.primaryIndex == index)
          item.isPrimary = true;
        else
          item.isPrimary = false;
      });
  }

   function deleteImg(idx){
     vm.images[idx] = {};
    vm.images.forEach(function(item,index,arr){
      if(item.isPrimary)
          vm.primaryIndex = index;
      });
    if(typeof vm.primaryIndex === 'undefined')
        vm.primaryIndex  =  0;

  }

  function resetClick(form){
    clearData();
    vm.container = {};
    vm.brandList = [];
    vm.modelList = [];
    vm.images = [{isPrimary:true}];
    prepareImgArr();
  }

  function prepareImgArr(){
    var numberOfIteration  = 8 - vm.images.length;
    for(var i = 0; i < numberOfIteration; i++){
      vm.images[vm.images.length] = {};
    }
  }
  
	function firstStep(form,spare){
      if(form.$invalid){
        $scope.submitted = true;
        $timeout(function(){angular.element(".has-error").find('input,select').first().focus();},20);
        return;
      }

      vm.tabObj.step1 = false;
      vm.tabObj.step2 = true;
	}

  function secondStep(form,spare){
    if(form.$invalid){
      $scope.step2Submitted = true;
      return;
    }

    if(vm.spare.paymentOption.length == 0)
      vm.spare.paymentOption = $rootScope.paymentOptions[0];

    vm.spare.assetDir = vm.assetDir;
    vm.spare.images = [];
    var primaryFound = false;
    vm.images.forEach(function(item,index){
        if(item.src){
          var imgObj = {};
          imgObj.src = item.src;
          if(item.isPrimary){
            imgObj.isPrimary = true;
            vm.spare.primaryImg = item.src;
            primaryFound = true;
          }else{
             imgObj.isPrimary = false;
          }
          if(item.waterMarked)
              imgObj.waterMarked = true;
           else
            imgObj.waterMarked = false;
           vm.spare.images[ vm.spare.images.length] = imgObj;
        }

    });

    if(vm.spare.images.length == 0){
      Modal.alert("Please upload atleast one image.",true);
      $rootScope.loading = false;
      return;
    }

    if(!primaryFound){
       vm.spare.primaryImg =  vm.spare.images[0].src;
       vm.spare.images[0].isPrimary = true;
    }

    if($rootScope.getCurrentUser()._id && $rootScope.getCurrentUser().role == 'admin' && vm.spare.status == 'active') {
      vm.spare.applyWaterMark = true;
    }else{
      vm.spare.applyWaterMark = false;
    }

     vm.spare.spareDetails.forEach(function(item,index){
       delete item.brandList;
       delete item.modelList;
      });

    addOrUpdate();  
  }

  function addOrUpdate(){
    if(!vm.isEdit)
      addSpare();
    else
      updateSpare();
  }

  function addSpare(){

      vm.spare.user = {};
      vm.spare.user._id = Auth.getCurrentUser()._id;
      vm.spare.user.fname = Auth.getCurrentUser().fname;
      vm.spare.user.mname = Auth.getCurrentUser().mname;
      vm.spare.user.lname = Auth.getCurrentUser().lname;
      vm.spare.user.role = Auth.getCurrentUser().role;
      vm.spare.user.userType = Auth.getCurrentUser().userType;
      vm.spare.user.mobile = Auth.getCurrentUser().mobile;
      vm.spare.user.email = Auth.getCurrentUser().email;
      vm.spare.user.country = Auth.getCurrentUser().country;
      vm.spare.user.company = Auth.getCurrentUser().company;
      if($.isEmptyObject(vm.spare.seller)){
        vm.spare.seller = {};
        vm.spare.seller = vm.spare.user;
      }

      if(vm.spare.currencyType == "")
        vm.spare.currencyType = "INR";

      vm.spare.spareStatuses = [];
      var stObj = {};
      stObj.userId = vm.spare.user._id;
      stObj.status = vm.spare.status;
      stObj.createdAt = new Date();
      vm.spare.spareStatuses[vm.spare.spareStatuses.length] = stObj;
      
      $rootScope.loading = true;
      spareSvc.addSpare(vm.spare).then(function(result){
        $rootScope.loading = false;
          
        if(result.errorCode == 1){
          Modal.alert(result.message, true);
          vm.tabObj.step1 = true;
          vm.tabObj.step2 = false;
          return;
        }
        else {
          if(Auth.isAdmin()) {
            if(result.status)
                //AppNotificationSvc.createAppNotificationFromProduct(result);
              mailToCustomerForApprovedAndFeatured(result, vm.spare);
          } else {
              var data = {};
              data['to'] = result.seller.email;
              data['subject'] = 'Spare Upload: Request for Listing';
              result.serverPath = serverPath;
              notificationSvc.sendNotification('productUploadEmailToCustomer', data, result,'email');

              data['to'] = supportMail;
              data['subject'] = 'Spare Upload: Request for activation';
              result.serverPath = serverPath;
              notificationSvc.sendNotification('productUploadEmailToAdmin', data, result,'email');   
          }
            setScroll(0);
          
            vm.spare = {};
            clearData();
            vm.container = {};
            vm.brandList = [];
            vm.modelList = [];
            vm.images = [{isPrimary:true}];
            $state.go('sparelisting');
        }
      });
  }


  function updateSpare(){

      if($rootScope.getCurrentUser()._id && $rootScope.getCurrentUser().role != 'admin') {
        vm.spare.status = "inactive";
      }
      if(vm.spare.currencyType == "")
        vm.spare.currencyType = "INR";
        if(!vm.spare.assetStatuses)
            vm.spare.assetStatuses = [];
        if(vm.prevAssetStatus != vm.spare.status){
            var stObj = {};
            stObj.userId = vm.spare.user._id;
            stObj.status = vm.spare.status;
            stObj.createdAt = new Date();
            vm.spare.spareStatuses[vm.spare.spareStatuses.length] = stObj;
            if(vm.spare.status == $rootScope.spareStatus[2].code)
              vm.spare.isSold = true;
            else 
              vm.spare.isSold = false;
        }

      $rootScope.loading = true;
      spareSvc.updateSpare(vm.spare).then(function(result){
        $rootScope.loading = false;
        //AppNotificationSvc.createAppNotificationFromProduct(product);
        if(result && result.errorCode != 0){
          Modal.alert(result.message, true);
          vm.tabObj.step1 = true;
          vm.tabObj.step2 = false;
          return;
        }
        else {
          setScroll(0);
          mailToCustomerForApprovedAndFeatured(result, vm.spare);
          }
          $state.go('sparelisting');
      });
  }

  function mailToCustomerForApprovedAndFeatured(result, spare) {
    if(result.status)
    {
      var data = {};
      data['to'] = spare.seller.email;
      data['subject'] = 'Request for Product Upload : Approved';
      spare.serverPath = serverPath;
      result.listedFor = "SELL"
      notificationSvc.sendNotification('productUploadEmailToCustomerActive', data, spare,'email');
    }
  }

}
})();
