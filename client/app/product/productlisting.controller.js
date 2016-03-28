'use strict';

angular.module('sreizaoApp')
 .controller('ProductListingCtrl',['$scope','$rootScope', '$http', 'productSvc', 'classifiedSvc','Modal', 'DTOptionsBuilder', '$uibModal', '$state','Auth', 'notificationSvc','uploadSvc','$timeout','$stateParams', function($scope, $rootScope, $http, productSvc, classifiedSvc, Modal, DTOptionsBuilder, $uibModal, $state, Auth, notificationSvc,uploadSvc,$timeout,$stateParams) {
  $scope.globalProductList = [];
  var dataToSend = {};
  //$rootScope.enableButton = false;
  $scope.tableRef = {};
  $scope.dtOptions = DTOptionsBuilder.newOptions().withOption('bFilter', true).withOption('lengthChange', true).withOption('stateSave',true)
  .withOption('stateLoaded',function(){
    if($scope.tableRef.DataTable && $rootScope.currentProductListingPage > 0)
      $timeout(function(){
          $scope.tableRef.DataTable.page($rootScope.currentProductListingPage).draw(false);
          $rootScope.currentProductListingPage = 0;
      },10)
      
  });

  if(Auth.getCurrentUser()._id){
    if(Auth.getCurrentUser().role != 'admin') {
      if(Auth.getCurrentUser().role == 'channelpartner')
        dataToSend["role"] = Auth.getCurrentUser().role;
      dataToSend["userid"] = Auth.getCurrentUser()._id;
     }
     getProducts();
  }else{
      //refresh case
      Auth.isLoggedInAsync(function(loggedIn){
         if(loggedIn){
            if(Auth.getCurrentUser()._id && Auth.getCurrentUser().role != 'admin') {
              if(Auth.getCurrentUser().role == 'channelpartner')
                dataToSend["role"] = Auth.getCurrentUser().role;
              dataToSend["userid"] = Auth.getCurrentUser()._id;
             }
             getProducts();
         }
      });
  }
  
   function getProducts(){
      $http.post('/api/products/search', dataToSend).success(function(srchres){
         $scope.globalProductList = srchres;
   });
   }

  $scope.featuredCommand = function(featured){
    dataToSend["featured"] = featured;
    getProducts();
  }

  $scope.expiredProduct = []; 
  $scope.dayDiff = function(createdDate){
  var date2 = new Date(createdDate);
  var date1 = new Date();
  var timeDiff = Math.abs(date2.getTime() - date1.getTime());   
  var dayDifference = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
  
  if(dayDifference > 1)
    return dayDifference + 'Days';
  else
    return dayDifference + 'Day';
  }

  $scope.getExpireDate = function(createdDate){
    if(!createdDate)
      return;

    var date2 = new Date(createdDate);
    var date1 = new Date();
    date2.setDate(date2.getDate() + 60);   
    var dateFormated = date2.toISOString().substr(0,10);
    return moment(dateFormated).format('DD/MM/YYYY');
  }

  $scope.getStatus = function(status, sold){
    if(sold == true && status == false)
      return "Sold";
    else if(sold == false && status == true)
      return "Active";
    else 
      return "Inactive";
    }
   

  $scope.deleteProduct = function(product){
    product.deleted = true;
    productSvc.updateProduct(product).then(function(result){
        //console.log("Product Deleted",result.data);
        getProducts();
        var data = {};
        data['to'] = supportMail;
        data['subject'] = 'Product Deleted';
        result.data.serverPath = serverPath;
        notificationSvc.sendNotification('productDeletedEmailToAdmin', data, result.data,'email');
        //console.log("Product added",result.data);
      });
  }

  $scope.productRelistingHandler = function(product){
    $rootScope.currentProductListingPage = $scope.tableRef.DataTable.page();
    $state.go('productrelisting', {id:product._id});
  }

  $scope.productEditHandler = function(product){
   $rootScope.currentProductListingPage = $scope.tableRef.DataTable.page();
   $state.go('productedit', {id:product._id});
  }

  $scope.productHistoryHandler = function(product){
    $rootScope.currentProductListingPage = $scope.tableRef.DataTable.page();
     $state.go('producthistory', {id:product._id});
    }

       // preview uploaded images
  $scope.previewSellerDetail = function(selectedProduct){ 
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

     $scope.exportExcel = function(){
      var dataToSend ={};
      if(Auth.getCurrentUser()._id && Auth.getCurrentUser().role != 'admin') 
        dataToSend["userid"] = Auth.getCurrentUser()._id;
   
      $http.post('/api/products/export', dataToSend)
      .then(function(res){
        var data = res.data;
        saveAs(new Blob([s2ab(data)],{type:"application/octet-stream"}), "productlist_"+ new Date().getTime() +".xlsx")
      },
      function(res){
      })
     }

     //bulk product upload

     $scope.importProducts = function(files,_this){
      if(files[0].name.indexOf('.xlsx') == 0){
        Modal.alert('Please upload a valid file');
        $(_this).val('')
        return;

      }
      $rootScope.loading = true;
      var user = {};
      user._id = $rootScope.getCurrentUser()._id;
      user.fname = $rootScope.getCurrentUser().fname;
      user.mname = $rootScope.getCurrentUser().mname;
      user.lname = $rootScope.getCurrentUser().lname;
      user.role = $rootScope.getCurrentUser().role;
      user.userType = $rootScope.getCurrentUser().userType;
      user.phone = $rootScope.getCurrentUser().phone;
      user.mobile = $rootScope.getCurrentUser().mobile;
      user.email = $rootScope.getCurrentUser().email;
      user.country = $rootScope.getCurrentUser().country;
      user.company = $rootScope.getCurrentUser().company;
      uploadSvc.upload(files[0]).then(function(result){

        $http.post('/api/products/import',{fileName : result.data,user: user})
        .then(function(res){
          $rootScope.loading = false;
          Modal.alert('Products uploaded successfully',true);
          getProducts();
        },function(res){
          $rootScope.loading = false;
          Modal.alert(res.data,true);
        })
       })
   }

}]);
