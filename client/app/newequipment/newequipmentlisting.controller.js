(function(){
'use strict';
angular.module('newequipment').controller('NewEquipmentListingCtrl',NewEquipmentListingCtrl);

function NewEquipmentListingCtrl($scope, $location, $rootScope, $http, productSvc, classifiedSvc, Modal, DTOptionsBuilder, $uibModal, $state, Auth, notificationSvc,uploadSvc,$timeout,$stateParams) {
  var vm  = this;

  //pagination variables
  var prevPage = 0;
  vm.itemsPerPage = 50;
  vm.currentPage = 1;
  vm.totalItems = 0;
  vm.maxSize = 6;
  var first_id = null;
  var last_id = null;
  //vm.onPageChange = onPageChange;

  vm.fireCommand = fireCommand;
  //vm.toggleActive = toggleActive;
  //vm.onColumnSearch = onColumnSearch;
  vm.getStatus = getStatus;
  vm.deleteProduct = deleteProduct;
  vm.productEditHandler = productEditHandler;
  vm.previewSellerDetail = previewSellerDetail;
  vm.exportExcel = exportExcel;
  vm.updateSelection = updateSelection;
  vm.bulkUpdate = bulkUpdate;
  vm.showFilter = showFilter;

  vm.searchType = "";
  var selectedIds = [];
  vm.searchstr = "";
  vm.coulmnSearchStr = "";

  //$scope.productSearchFilter = {};
  
  vm.featured = false;
  vm.active = false;
  var dataToSend = {};
  function init(){
    if(Auth.getCurrentUser().profileStatus == 'incomplete'){
        $state.go('myaccount');
        return;
    }
    if(Auth.getCurrentUser()._id && Auth.getCurrentUser().role != 'admin') {
      if(Auth.getCurrentUser().role == 'channelpartner')
        dataToSend.role = Auth.getCurrentUser().role;
      dataToSend.userid = Auth.getCurrentUser()._id;
      if(Auth.isEnterprise()){
        delete dataToSend.userid;
        dataToSend.enterpriseId = Auth.getCurrentUser().enterpriseId; 
      }
    }
    //pagination flag
    dataToSend.pagination = true;
    dataToSend.itemsPerPage = vm.itemsPerPage;
    var assetVal = $stateParams.assetStatus;
    var tradeType = $stateParams.tradeType;
    if(assetVal)
      dataToSend["assetStatus"] = assetVal;
    if(tradeType)
      dataToSend["tradeValue"] = tradeType;
    restoreState();
    fireCommand(false);

  }

  function loadProducts(filter){
    if(vm.currentPage == prevPage)
      return;
    
    filter.prevPage = prevPage;
    filter.currentPage = vm.currentPage;
    filter.first_id = first_id;
    filter.last_id = last_id;
    selectedIds = [];
    saveState();
    productSvc.getProductOnFilter(filter)
    .then(function(result){
        $scope.products  = result.products;
        vm.totalItems = result.totalItems;
        prevPage = vm.currentPage;
        if($scope.products.length > 0){
          first_id = $scope.products[0]._id;
          last_id = $scope.products[$scope.products.length - 1]._id;
        }
     })
  }
  
  function restoreState(){
    if($stateParams.searchstr)
      vm.searchstr = $stateParams.searchstr;
    if($stateParams.searchType && $stateParams.coulmnSearchStr){
      vm.searchType = $stateParams.searchType;
      vm.coulmnSearchStr = $stateParams.coulmnSearchStr;
    }
    if($stateParams.featured)
      vm.featured = $stateParams.featured == 'true'?true:"";
    if($stateParams.statusText)
        vm.active = $stateParams.statusText;
    if($stateParams.first_id)
      first_id = $stateParams.first_id;
    if($stateParams.last_id)
      last_id = $stateParams.last_id;
    if($stateParams.currentPage){
      var currentPage = parseInt($stateParams.currentPage);
      prevPage = parseInt($stateParams.prevPage);
      vm.totalItems = vm.itemsPerPage * currentPage;
      vm.currentPage = currentPage;
    }
  }

  function saveState(){
    var statObj = {};
    statObj['first_id'] = first_id;
    statObj['last_id'] = last_id;
    statObj['currentPage'] = vm.currentPage;
    statObj['prevPage'] = prevPage;
    if(vm.featured)
      statObj['featured'] = vm.featured;
     else
      statObj['featured'] = "";
    if(vm.active)
      statObj['statusText'] = vm.active;
    else
      statObj['statusText'] = "";
    if(vm.searchstr)
      statObj['searchstr'] = vm.searchstr;
    else
      statObj['searchstr'] = "";
    if(vm.searchType && vm.coulmnSearchStr){
      statObj['searchType'] = vm.searchType;
      statObj['coulmnSearchStr'] = vm.coulmnSearchStr;
    }else{
      statObj['searchType'] = "";
      statObj['coulmnSearchStr'] = "";
    }
    $state.go("newequipmentlisting",statObj,{location:'replace',notify:false});
  }

  function fireCommand(reset,filterObj){
    if(reset)
      resetPagination();
    var filter = {};
    if(!filterObj)
        angular.copy(dataToSend, filter);
    else
      filter = filterObj;
    if(vm.featured)
        filter['featured'] = vm.featured;
    if(vm.active)
      filter['statusText'] = vm.active;
    if(vm.searchstr)
      filter['searchstr'] = vm.searchstr;
    if(vm.searchType){
      var colFilter = getCoulmnSearchFilter();
      for(var key in  colFilter){
        filter[key] = colFilter[key];
      }
    }
    loadProducts(filter);
  }

  function showFilter(type)
  {
    vm.coulmnSearchStr = "";
    fireCommand(true);
  }

  function getCoulmnSearchFilter(){
    var filter = {};
    switch(vm.searchType){
      case "assetId":
         var assetIdArr = vm.coulmnSearchStr.split(",");
        if(assetIdArr && assetIdArr.length > 0){
          if(assetIdArr.length == 1)
            filter['assetId'] = assetIdArr[0];
          else
            filter['assetIds'] = assetIdArr;
        }
        break;
      case "assetStatus":
       filter['assetStatus'] = vm.coulmnSearchStr;
        break;
      case "seller":
        filter['sellerName'] = vm.coulmnSearchStr;
        break;
      case "tradeType":
          filter['tradeValue'] = vm.coulmnSearchStr;
        break;
       case "group":
          filter['groupStr'] = vm.coulmnSearchStr;
          break;
      case "category":
        filter['categoryStr'] = vm.coulmnSearchStr;
        break;
      case "brand":
        filter['brandStr'] = vm.coulmnSearchStr;
        break;
      case "model":
        filter['modelStr'] = vm.coulmnSearchStr;
        break;
      case "location":
        filter['location'] = vm.coulmnSearchStr;
        break;
    }
    return filter;
    //fireCommand(true,filter);
  }

  function resetPagination(){
     prevPage = 0;
     vm.currentPage = 1;
     vm.totalItems = 0;
     first_id = null;
     last_id = null;
  }

  function getStatus(status, sold){
    if(status == true)
      return "Active";
    else 
      return "Inactive";
    }
   

  function deleteProduct(product){
    product.deleted = true;
    productSvc.updateProduct(product).then(function(result){
        //console.log("Product Deleted",result.data);
        //loadProducts();
        fireCommand(true);
        var data = {};
        data['to'] = supportMail;
        data['subject'] = 'Product Deleted';
        result.data.serverPath = serverPath;
        notificationSvc.sendNotification('productDeletedEmailToAdmin', data, result.data,'email');
        //console.log("Product added",result.data);
      });
  }

  function productEditHandler(product){
   $state.go('newequipmentedit', {id:product._id});
  }

  // preview uploaded images
  function previewSellerDetail(selectedProduct){ 
          var prevScope = $rootScope.$new();
          var prvProduct = {};
          angular.copy($scope.product,prvProduct);
          prvProduct.fname = selectedProduct.seller.fname;
          prvProduct.lname = selectedProduct.seller.lname;
          prvProduct.email = selectedProduct.seller.email;
          prvProduct.phone = selectedProduct.seller.phone;
          prvProduct.mobile = selectedProduct.seller.mobile;
          if(selectedProduct.user.role == 'admin')
            prvProduct.createdBy = selectedProduct.user.fname + ' (Admin)';
          else if(selectedProduct.user.role == 'channelpartner') {
            if(selectedProduct.user._id != selectedProduct.seller._id)
              prvProduct.createdBy = selectedProduct.user.fname + ' (Channel Partner)';
            else {
              prvProduct.createdBy = 'Self';
            }
          }
          //else 
          prvProduct.role = selectedProduct.user.role;
          prevScope.product = prvProduct;
          var prvSellerModal = $uibModal.open({
              templateUrl: "sellerDetail.html",
              scope: prevScope,
              size: 'lg'
          });
          prevScope.close = function(){
            prvSellerModal.close();
          }
     }

     function exportExcel(){
        var dataToSend ={};
        dataToSend["userid"] = Auth.getCurrentUser()._id;
        dataToSend["role"] = Auth.getCurrentUser().role;
        
        productSvc.exportProduct(dataToSend)
        .then(function(buffData){
          saveAs(new Blob([s2ab(buffData)],{type:"application/octet-stream"}), "productlist_"+ new Date().getTime() +".xlsx")
        });
     }

     function updateSelection(event,id){
        var checkbox = event.target;
        var action = checkbox.checked?'add':'remove';
        if(action == 'add' && selectedIds.indexOf(id) == -1)
          selectedIds.push(id)
        if(action == 'remove' && selectedIds.indexOf(id) != -1)
          selectedIds.splice(selectedIds.indexOf(id),1);
     }

     function bulkUpdate(action){
        if(selectedIds.length == 0)
          return;
        var serData = {};
        serData.action = action;
        serData.selectedIds = selectedIds;
        $rootScope.loading = true;
        productSvc.bulkProductUpdate(serData)
        .then(function(result){
          fireCommand(true);
          //loadProducts();
          selectedIds = [];
          $rootScope.loading = false;
        })
        .catch(function(res){
          $rootScope.loading = false;
          //error handling
        })
     }

     //entry point
     Auth.isLoggedInAsync(function(loggedIn){
         if(loggedIn)
            init();
          else
            $state.go('main');
      });
}

angular.module('sreizaoApp').controller('NewEquipmentListCtrl', NewEquipmentListCtrl);

  function NewEquipmentListCtrl($scope,$state, $stateParams, $rootScope,$uibModal, Auth, CartSvc, productSvc,categorySvc,SubCategorySvc,LocationSvc,brandSvc,modelSvc, groupSvc ,DTOptionsBuilder,Modal,$timeout,$window) {
    var vm = this;
    $scope.productList = [];
    $scope.equipmentSearchFilter = {};
    $scope.filterType = $state.current.name;
    var productList = [];

    $scope.searching = true;
    $scope.noResult = false;
    $scope.status = {};
    $scope.displayText = $stateParams.group || $stateParams.category || "";

    /* pagination flag */
    vm.itemsPerPage = 12;
    vm.currentPage = 1;
    vm.totalItems = 0;
    vm.maxSize = 6;
    vm.sortByFlag = "";
    vm.productListToCompare = [{},{},{},{}];
    vm.compareCount = 0;

    vm.onGroupChange = onGroupChange;
    vm.onCategoryChange = onCategoryChange;
    vm.fireCommand = fireCommand;
    vm.getAssetIdHelp = getAssetIdHelp;

    vm.sortBy = sortBy;
    vm.addProductToCart = addProductToCart;
    vm.addToCompare = addToCompare;
    vm.compare = compare;
    vm.removeProductFromCompList = removeProductFromCompList;
    vm.onPageChange = onPageChange;

    var allCategory = [];
    var allBrand = [];

    function init(){
    
      for(var key in $stateParams){
        if($stateParams[key])
          $scope.status[key] = true;
      }

      groupSvc.getAllGroup({isForNew:true})
      .then(function(result){
        $scope.allGroup = result;
      });

      categorySvc.getCategoryOnFilter({isForNew:true})
      .then(function(result){
        $scope.categoryList = result;
        allCategory = result;
        if($stateParams.group)
            onGroupChange($stateParams.group,true);
      });

      brandSvc.getBrandOnFilter({isForNew:true})
      .then(function(result){
        allBrand = result;
        $scope.brandList = result;
        if($stateParams.category)
            onCategoryChange($stateParams.category,true); 
      });
      restoreState();
      fireCommand(true,true);
    
    }
    
    function onGroupChange(group,noAction){
    if(!noAction){
      $scope.equipmentSearchFilter.category = "";
      $scope.equipmentSearchFilter.brand = "";
      $scope.brandList = [];
    }

    $scope.categoryList = allCategory.filter(function(item){
      return item.group.name === group && item.isForNew;
    });

    if(!noAction)
      fireCommand();
  }

  function onCategoryChange(category,noAction){
    if(!noAction){
      $scope.equipmentSearchFilter.brand = "";
    }
    $scope.brandList = allBrand.filter(function(item){
      return item.category.name === category && item.isForNew;
    });
    if(!noAction)
      fireCommand();
  }

  function onBrandChange(brand,noAction){
    
    if(!brand) {
      fireCommand();
      return;
    }
   var filter = {};
   filter['brandName'] = brand;
    if(!noAction)
      fireCommand();
  }

  function fireCommand(noReset,initLoad){

      if(!noReset)
        vm.currentPage = 1;
      if(!initLoad){
        $scope.displayText = "";
        saveState(false);
      }

      var filter = {};
      angular.copy($scope.equipmentSearchFilter,filter);
      filter['status'] = true;
      filter['sort'] = {featured:-1};
      $scope.searching = true;

     productSvc.getProductOnFilter(filter)
      .then(function(result){
          $scope.searching = false;
          if(result.length > 0){
            vm.totalItems = result.length;
            $scope.noResult = false;
          }else{
            $scope.noResult = true;
          }
          $scope.productList = result;
          productList = result;
      })
      .catch(function(){
        //error handling
      });
  };


    function getAssetIdHelp(val) {
      var serData = {};
      serData['searchStr'] = $scope.equipmentSearchFilter.assetId;
     return LocationSvc.getAssetIdHelp(serData)
      .then(function(result){
         return result.map(function(item){
              
              return item.name;
        });
      });
    };

  function sortBy(){

    switch(vm.sortByFlag){
      case "lh":
         var list = _.orderBy(productList,['grossPrice'],['asc']);
         $scope.productList = _.sortBy(list, function(n) {
              return n.tradeType == 'RENT' || n.priceOnRequest;
        });
      break;
      case 'hl':
         var list  = _.orderBy(productList,['grossPrice'],['desc']);
         $scope.productList = _.sortBy(list, function(n) {
              return n.tradeType == 'RENT' || n.priceOnRequest;
        });
      break;
      case 'por':
       $scope.productList = _.sortBy(productList, function(n) {
              return !n.priceOnRequest;
        });
      break;
      case 'exos':
        $scope.productList = _.filter(productList, function(obj) {
              return obj.assetStatus == 'listed';
        });
      break;
      default:
        $scope.productList = productList;
    }
    if($scope.productList.length > 0){
       vm.currentPage = 1;
      vm.totalItems = $scope.productList.length;
      $scope.noResult = false;
    }else{
       $scope.noResult = true;
    }
    
  }

  function addProductToCart(product){
    var prdObj = {};
    prdObj.type = "equipment";
    prdObj._id = product._id;
    prdObj.assetDir = product.assetDir;
    prdObj.name = product.name;
    prdObj.primaryImg = product.primaryImg
    prdObj.condition = product.productCondition;
    filter = {};
    filter._id = prdObj._id;
    filter.status = true;
    productSvc.getProductOnFilter(filter)
      .then(function(result){
          if(result && result.length < 1) {
            $state.go('main');
            return;
          }
          CartSvc.addProductToCart(prdObj);
      })
      .catch(function(){
        //error handling
      });
    //CartSvc.addProductToCart(prdObj);
  }

  function compare(){

     if(vm.productListToCompare.length < 2){
          Modal.alert("Please select at least two products to compare.",true);
          return;
      }
       var prevScope = $rootScope.$new();
       prevScope.productList = vm.productListToCompare;
       prevScope.uploadImagePrefix = $rootScope.uploadImagePrefix;
       var prvProductModal = $uibModal.open({
            templateUrl: "app/product/productcompare.html",
            scope: prevScope,
            windowTopClass:'product-preview',
            size: 'lg'
        });
         prevScope.dismiss = function () {
          prvProductModal.dismiss('cancel');
        };
        prevScope.removeProductFromCompList = removeProductFromCompList;
  }

  function addToCompare(prd){
    if(vm.compareCount == 4){
       Modal.alert("You have already 4 product into compare list.",true);
      return;
    }
    var idx = getIndex(prd);
    if(idx != -1){
       Modal.alert("Product is already added to compare list.",true);
      return;
    }
    var freeIndex = getIndexFree();
    vm.productListToCompare[freeIndex] = prd;
    updateCompareCount();
  }

  function getIndex(prd){
    var index = -1;
    vm.productListToCompare.forEach(function(item,idx){
      if(item._id == prd._id)
        index = idx;
    });
    return index;
  }

  function getIndexFree(){
    var index = -1;
    for(var i =0;i < vm.productListToCompare.length;i++){
      if(!vm.productListToCompare[i]._id){
        index = i;
        break;
      }
    }
    return index;
  }

  function removeProductFromCompList(index){
     var removedProduct = vm.productListToCompare[index];
     vm.productListToCompare[index] = {};
      updateCompareCount();
  }


  function updateCompareCount(){
    vm.compareCount = 0;
    vm.productListToCompare.forEach(function(item,index){
      if(item._id)
         vm.compareCount ++;
    });
  }

  function onPageChange(){
    $window.scrollTo(0, 0);
    saveState(true);
  }

  function saveState(retainState){
    $scope.equipmentSearchFilter.currentPage = vm.currentPage + "";
    if(retainState)
      $state.go($state.current.name,$scope.equipmentSearchFilter,{location:'replace',notify:false});
    else
      $state.go("newviewproduct",$scope.equipmentSearchFilter,{location:'replace',notify:false});
  }

  function restoreState(){
      $scope.equipmentSearchFilter = $stateParams;
      vm.currentPage  = parseInt($stateParams.currentPage) || 1;
      $scope.equipmentSearchFilter.currentPage = vm.currentPage + "";
  }
  
   init();
    
  }
  
})();
