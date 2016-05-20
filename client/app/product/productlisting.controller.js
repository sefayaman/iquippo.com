(function(){
'use strict';
angular.module('product').controller('ProductListingCtrl',ProductListingCtrl);

function ProductListingCtrl($scope, $location, $rootScope, $http, productSvc, classifiedSvc, Modal, DTOptionsBuilder, $uibModal, $state, Auth, notificationSvc,uploadSvc,$timeout,$stateParams) {
  var vm  = this;

  vm.featuredCommand = featuredCommand;
  vm.dayDiff = dayDiff;
  //vm.getExpireDate = getExpireDate;
  vm.getStatus = getStatus;
  vm.deleteProduct = deleteProduct;
  vm.productRelistingHandler = productRelistingHandler;
  vm.productEditHandler = productEditHandler;
  vm.productHistoryHandler = productHistoryHandler;
  vm.previewSellerDetail = previewSellerDetail;
  vm.exportExcel = exportExcel;
  vm.updateSelection = updateSelection;
  vm.bulkUpdate = bulkUpdate;
  vm.searchType = "";
  vm.showFilter = showFilter;
  vm.searchFilter = searchFilter;
  var selectedIds = [];

  $scope.globalProductList = [];
  $scope.orgGlobalProductList = [];
  $scope.productSearchFilter = {};
  var dataToSend = {};
  

  $scope.tableRef = {};
  $scope.dtOptions = DTOptionsBuilder.newOptions().withOption('bFilter', true).withOption('lengthChange', true).withOption('stateSave',true)
  .withOption('stateLoaded',function(){
    if($scope.tableRef.DataTable && $rootScope.currentProductListingPage > 0)
      $timeout(function(){
          $scope.tableRef.DataTable.page($rootScope.currentProductListingPage).draw(false);
          $rootScope.currentProductListingPage = 0;
      },10)  
  });

  function loadProducts(){

    if(Auth.getCurrentUser()._id){
      if(Auth.getCurrentUser().role != 'admin') {
        if(Auth.getCurrentUser().role == 'channelpartner')
          dataToSend["role"] = Auth.getCurrentUser().role;
        dataToSend["userid"] = Auth.getCurrentUser()._id;
       }
       var assetVal = $location.search().assetStatus;
       if(assetVal)
        dataToSend["assetStatus"] = assetVal;
       productSvc.getProductOnFilter(dataToSend)
       .then(function(result){
          $scope.globalProductList = $scope.orgGlobalProductList = result;
       })
    }else{
        //refresh case
        Auth.isLoggedInAsync(function(loggedIn){
           if(loggedIn){
              if(Auth.getCurrentUser()._id && Auth.getCurrentUser().role != 'admin') {
                if(Auth.getCurrentUser().role == 'channelpartner')
                  dataToSend["role"] = Auth.getCurrentUser().role;
                dataToSend["userid"] = Auth.getCurrentUser()._id;
               }
                productSvc.getProductOnFilter(dataToSend)
               .then(function(result){
                  $scope.globalProductList = $scope.orgGlobalProductList = result;
               })
           }
        });
    }
  }

  loadProducts();
  
  function featuredCommand(featured){
    dataToSend["featured"] = featured;
    productSvc.getProductOnFilter(dataToSend)
     .then(function(result){
        $scope.globalProductList = $scope.orgGlobalProductList = result;
     })
  }

  function showFilter(type)
  {
    $scope.productSearchFilter  = {};
  }
function searchFilter(type)
{ 
    $scope.globalProductList = {};
    $scope.globalProductList = $scope.orgGlobalProductList;
    $scope.globalProductList  = _.filter($scope.globalProductList,
    function(item){  
      return searchUtil(item, $scope.productSearchFilter.searchTxt, type); 
    });
    if($scope.productSearchFilter.searchTxt == '')
      $scope.globalProductList = $scope.orgGlobalProductList;
}  
 
function searchUtil(item,toSearch, type)
{
  if(type == 'assetId'){
    return ( item.assetId == toSearch) ? true : false ;
  } else if(type == 'tradeType'){
    return ( item.tradeType.toLowerCase().indexOf(toSearch.toLowerCase()) > -1) ? true : false ;
  } else if(type == 'category'){
    var categoryName = item.category.name + "";
    var otherCategoryName = item.category.otherName + "";
    return ( categoryName.toLowerCase().indexOf(toSearch.toLowerCase()) > -1 
            || otherCategoryName.toLowerCase().indexOf(toSearch.toLowerCase()) > -1 ) ? true : false;
  } else if(type == 'brand'){
    var brandName = item.brand.name + "";
    var otherBrandName = item.brand.otherName + "";
    return ( brandName.toLowerCase().indexOf(toSearch.toLowerCase()) > -1 
      || otherBrandName.toLowerCase().indexOf(toSearch.toLowerCase()) > -1 ) ? true : false;
  } else if(type == 'model'){
    var modelName = item.model.name + "";
    var otherModelName = item.model.otherName + "";
    return ( modelName.toLowerCase().indexOf(toSearch.toLowerCase()) > -1 
      || otherModelName.toLowerCase().indexOf(toSearch.toLowerCase()) > -1 ) ? true : false;
  } else if(type == 'location'){
    var country = item.country + "";
    return ( item.country.toLowerCase().indexOf(toSearch.toLowerCase()) > -1 ) ? true : false ;
  } else if(type == 'seller'){
    var sellerName = item.seller.fname + "";
    return ( sellerName.toLowerCase().indexOf(toSearch.toLowerCase()) > -1 ) ? true : false ;
  } else if(type == 'group'){
    var groupName = item.group.name + "";
    return ( groupName.toLowerCase().indexOf(toSearch.toLowerCase()) > -1 ) ? true : false;
  }
}

  $scope.expiredProduct = [];

  function dayDiff(createdDate){
    var date2 = new Date(createdDate);
    var date1 = new Date();
    var timeDiff = Math.abs(date2.getTime() - date1.getTime());   
    var dayDifference = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
    
    if(dayDifference > 1)
      return dayDifference + 'Days';
    else
      return dayDifference + 'Day';
  }

  function getExpireDate(createdDate){
    if(!createdDate)
      return;

    var date2 = new Date(createdDate);
    var date1 = new Date();
    date2.setDate(date2.getDate() + 60);   
    var dateFormated = date2.toISOString().substr(0,10);
    return moment(dateFormated).format('DD/MM/YYYY');
  }

  function getStatus(status, sold){
    if(sold == true && status == false)
      return "Sold";
    else if(sold == false && status == true)
      return "Active";
    else 
      return "Inactive";
    }
   

  function deleteProduct(product){
    product.deleted = true;
    productSvc.updateProduct(product).then(function(result){
        //console.log("Product Deleted",result.data);
        loadProducts();
        var data = {};
        data['to'] = supportMail;
        data['subject'] = 'Product Deleted';
        result.data.serverPath = serverPath;
        notificationSvc.sendNotification('productDeletedEmailToAdmin', data, result.data,'email');
        //console.log("Product added",result.data);
      });
  }

  function productRelistingHandler(product){
    $rootScope.currentProductListingPage = $scope.tableRef.DataTable.page();
    $state.go('productrelisting', {id:product._id});
  }

  function productEditHandler(product){
   $rootScope.currentProductListingPage = $scope.tableRef.DataTable.page();
   $state.go('productedit', {id:product._id});
  }

  function productHistoryHandler(product){
    $rootScope.currentProductListingPage = $scope.tableRef.DataTable.page();
     $state.go('producthistory', {id:product._id});
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
        if(Auth.getCurrentUser()._id && Auth.getCurrentUser().role != 'admin') 
        dataToSend["userid"] = Auth.getCurrentUser()._id;
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
          loadProducts();
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
