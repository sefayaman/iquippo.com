(function(){
'use strict';
angular.module('product').controller('ProductListingCtrl',ProductListingCtrl);

function ProductListingCtrl($scope, $location, $rootScope, $http, productSvc, classifiedSvc, Modal, DTOptionsBuilder, $uibModal, $state, Auth, notificationSvc,uploadSvc,$timeout,$stateParams) {
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
  vm.searchStr = "";
  vm.coulmnSearchStr = "";

  //$scope.productSearchFilter = {};
  
  vm.featured = false;
  vm.active = false;

  var dataToSend = {};

  function init(){
      Auth.isLoggedInAsync(function(loggedIn){
         if(loggedIn){
            if(Auth.getCurrentUser().profileStatus == 'incomplete'){
                $state.go('myaccount');
                return;
            }

            if(Auth.getCurrentUser()._id && Auth.getCurrentUser().role != 'admin') {
              if(Auth.getCurrentUser().role == 'channelpartner')
                dataToSend["role"] = Auth.getCurrentUser().role;
              dataToSend["userid"] = Auth.getCurrentUser()._id;
            }
            //pagination flag
            dataToSend.pagination = true;
            dataToSend.itemsPerPage = vm.itemsPerPage;
            var assetVal = $location.search().assetStatus;
            var tradeType = $location.search().tradeType;
            if(assetVal)
            dataToSend["assetStatus"] = assetVal;
            if(tradeType)
            dataToSend["tradeValue"] = tradeType;
            loadProducts(dataToSend);

         }else{
             $state.go('main');
         }
      });

  }

  function loadProducts(filter){

    filter.prevPage = prevPage;
    filter.currentPage = vm.currentPage;
    filter.first_id = first_id;
    filter.last_id = last_id;
    selectedIds = [];
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

  init();
  
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
    if(vm.searchStr)
      filter['searchstr'] = vm.searchStr;
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
        if(Auth.getCurrentUser()._id && Auth.getCurrentUser().role != 'admin'){
           dataToSend["userid"] = Auth.getCurrentUser()._id;
           dataToSend["role"] = Auth.getCurrentUser().role;
         } 
       
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

}

})();
