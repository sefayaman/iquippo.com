(function(){
'use strict';
angular.module('product').controller('ProductListingCtrl',ProductListingCtrl);

function ProductListingCtrl($scope, $location, $rootScope, $http, productSvc, AuctionSvc, classifiedSvc, Modal, DTOptionsBuilder, $uibModal, $state, Auth, notificationSvc,uploadSvc,$timeout,$stateParams) {
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
  vm.sendReqToCreateAsset = sendReqToCreateAsset;
  
  $scope.ReqSubmitStatuses = ReqSubmitStatuses;
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

  function sendReqToCreateAsset(proData) {
    if (proData.auctionListing && proData.auction && proData.auction._id && (proData.tradeType === 'SELL' || proData.tradeType === 'BOTH')) {
      var serData = {};
      serData._id = proData.auction._id;
      AuctionSvc.getOnFilter(serData)
        .then(function(result) {
          if (result.length > 0) {
            reSendAssetInfoToAuction(proData, result[0]);
          } else {
            return;
          }
        });
    }
  }
  
  function reSendAssetInfoToAuction(product, auctionReq) {
    var dataObj = {};
    dataObj.images = [];
    dataObj._id = product._id;
    dataObj.assetId = product.assetId;
    dataObj.assetDesc = product.name;
    dataObj.auction_id = auctionReq.dbAuctionId;
    dataObj.auctionId = auctionReq.auctionId;
    dataObj.lot_id = auctionReq.lot_id;
    dataObj.assetDir = product.assetDir;
    dataObj.operatingHour = product.operatingHour;
    dataObj.mileage = product.mileage;
    dataObj.mfgYear = product.mfgYear;
    dataObj.city = product.city;
    dataObj.primaryImg = $rootScope.uploadImagePrefix + product.assetDir + "/" + product.primaryImg;
    //dataObj.static_increment = $scope.lot.static_increment;
    product.images.forEach(function(x) {
      dataObj.images[dataObj.images.length] = $rootScope.uploadImagePrefix + product.assetDir + "/" + x.src;
    })
    
    dataObj.seller = {};
    dataObj.seller._id = product.seller._id;
    dataObj.seller.fname = product.seller.fname;
    dataObj.seller.lname = product.seller.lname;
    dataObj.seller.role = product.seller.role;
    dataObj.seller.customerId = product.seller.customerId;
    dataObj.seller.mobile = product.seller.mobile;
    dataObj.seller.email = product.seller.email;
    dataObj.assetReqId = auctionReq._id;

    $rootScope.loading = true;
    productSvc.sendReqToCreateAsset(dataObj)
      .then(function(res) {
          if (res.errorCode == 0) {
            fireCommand(true);
          }
          Modal.alert(res.message);
          $rootScope.loading = false;
      })
      .catch(function(err){
        if(err)
          Modal.alert(err.data);
        $rootScope.loading = false;
      });
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
    filter.productCondition = "used";
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
    $state.go("productlisting",statObj,{location:'replace',notify:false});
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
    productSvc.updateProduct(product).then(function(proResult){
        fireCommand(true);
        var result = {};
        angular.copy(proResult.product, result);
        var data = {};
        Modal.alert("Product deleted successfully", true);
        data['to'] = supportMail;
        data['subject'] = 'Product Deleted';
        //result.data.serverPath = serverPath;
        notificationSvc.sendNotification('productDeletedEmailToAdmin', data, result,'email');
      });
  }

  function productEditHandler(product){
   $state.go('productedit', {id:product._id});
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
         if(Auth.isEnterprise()){
          //delete dataToSend.userid;
          dataToSend.enterpriseId = Auth.getCurrentUser().enterpriseId; 
        }
        dataToSend['productCondition'] = "used";
        productSvc.exportProduct(dataToSend)
        .then(function(buffData){
          saveAs(new Blob([s2ab(buffData)],{type:"application/octet-stream"}), "productlist_"+ new Date().getTime() +".csv")
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

})();
