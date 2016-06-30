(function(){

  'use strict';

angular.module('sreizaoApp').controller('ViewCartCtrl',ViewCartCtrl)

function ViewCartCtrl($scope,$rootScope,cartSvc,Auth,Modal,$uibModal,notificationSvc,$http,$state,productSvc) {

    var vm = this;
    vm.selectedProducts = [];
    vm.deleteProductFromCart = deleteProductFromCart;
    vm.clearCart = clearCart;
    vm.updateSelection = updateSelection;
    vm.compare = compare;
    vm.sendBuyRequest = sendBuyRequest;

    cartSvc.getCartData(Auth.getCurrentUser()._id);

    function deleteProductFromCart(index){

      Modal.confirm(informationMessage.deleteCartProductConfirm,function(isGo){
          if(isGo == 'no')
            return;
          deleteFn(index);
      });
    };

    function clearCart(){
       Modal.confirm(informationMessage.clearCartConfirm,function(isGo){
          if(isGo == 'no')
            return;
          clear();
      });
    };

    function deleteFn(index){
      /*
      Date: 10/06/2016
      Devleoper Name : Nishant
      Purpose:remove add to cart event in  GTM
      */
      var prd = $rootScope.cart.products[index];
      var data = prd;
      gaMasterObject.removeToCart.eventLabel = data.name;
      dataLayer.push(gaMasterObject.removeToCart);

      $rootScope.cart.products.splice(index,1);
      cartSvc.updateCart($rootScope.cart)
        .success(function(res){
            Modal.alert(informationMessage.deleteCartProductSuccess,true);
            $rootScope.cartCounter = $rootScope.cart.products.length;
            var idx = getIndex(prd);
            if(idx != -1)
              vm.selectedProducts.splice(idx,1);
        })
        .error(function(res){
             Modal.alert(res,true);
        })
    }

    function clear(){
      //NJ start: remove to cart Product
      for (var i = 0; i < $rootScope.cart.products.length; i++) {
        gaMasterObject.removeToCart.eventLabel = $rootScope.cart.products[i].name;
        dataLayer.push(gaMasterObject.removeToCart);
      }
      //End
      $rootScope.cart.products = []
      cartSvc.updateCart($rootScope.cart)
        .success(function(res){
            Modal.alert(informationMessage.clearCartSuccess,true);
            $rootScope.cartCounter = $rootScope.cart.products.length;
            vm.selectedProducts = [];
        })
        .error(function(res){
             Modal.alert(res,true);
        })
    }

    function sendBuyRequest(buycontact) {

      if(Auth.getCurrentUser().profileStatus == 'incomplete')
      {
        $state.go('myaccount');
        return;
      }
      if(vm.selectedProducts.length == 0){
         Modal.alert("Please select product.",true);
        return;
      }
      var products = [];
      var dataToSend = {};
      dataToSend.product =  [];
      var ids = [];
      vm.selectedProducts.forEach(function(item,index){
        var obj = {};
        obj._id = item._id;
        obj.name = item.name;
        obj.productId = item.productId;
        obj.seller = item.seller;
        dataToSend.product[dataToSend.product.length] = obj;
        ids[ids.length] = item._id;
      });

      dataToSend['fname'] =  Auth.getCurrentUser().fname;
      dataToSend['mname'] = Auth.getCurrentUser().mname;
      dataToSend['lname'] = Auth.getCurrentUser().lname;
      dataToSend['country'] = Auth.getCurrentUser().country;
      dataToSend['phone'] = Auth.getCurrentUser().phone;
      dataToSend['mobile'] = Auth.getCurrentUser().mobile;
      dataToSend['email'] = Auth.getCurrentUser().email;
      dataToSend['contact'] = Auth.getCurrentUser().contact;

      $scope.productSendMessage =   vm.selectedProducts;

      $http.post('/api/buyer', dataToSend)
      .success(function(result) {
        var count = 0;
        for (var i = 0; i < result.product.length; i++) {
            count++;
            /*
            Date: 10/06/2016
            Developer Name : Nishant
            Purpose:insert sendMessage event in GTM
            */
            var data = $scope.productSendMessage[count-1];
            var pSMListArray = [];
            var pSMObject={};
            gaMasterObject.sendMessage.name = data.name;
            gaMasterObject.sendMessage.id = data.productId;
            gaMasterObject.sendMessage.price = data.grossPrice;
            gaMasterObject.sendMessage.brand = data.brand.name;
            gaMasterObject.sendMessage.category = data.category.name;
            gaMasterObject.sendMessage.metric1 = 1;
            var list = data.category.name;
            $.extend( true,pSMObject,gaMasterObject.sendMessage );
            pSMListArray.push(pSMObject);
            dataLayer.push({
            'event': 'sendMessage',
            'ecommerce': {
              'click': {
                'actionField': {'list': list},      // Optional list property.
                'products': pSMListArray
               }
             }
          });
        }

        $scope.buycontact = {};
        var data = {};
        data['to'] = supportMail;
        data['subject'] = 'Request for buy a product';
        var emailDynamicData = {};
        emailDynamicData['serverPath'] = serverPath;
        emailDynamicData['fname'] = dataToSend.fname;
        emailDynamicData['lname'] = dataToSend.lname;
        emailDynamicData['country'] = dataToSend.country;
        emailDynamicData['email'] = dataToSend.email;
        emailDynamicData['mobile'] = dataToSend.mobile;
        emailDynamicData['message'] = dataToSend.message;
        emailDynamicData['contact'] = dataToSend.contact;
        emailDynamicData['product'] = dataToSend.product;
        notificationSvc.sendNotification('productEnquiriesEmailToAdmin', data, emailDynamicData,'email');

        if(result.contact == "email") {
          data['to'] = emailDynamicData.email;
          data['subject'] = 'No reply: Product Enquiry request received';
          notificationSvc.sendNotification('productEnquiriesEmailToCustomer', data, emailDynamicData,'email');
        }
        productSvc.updateInquiryCounter(ids);
        Modal.alert(informationMessage.buyRequestSuccess,true);
      }).error(function(res){
          Modal.alert(res);
      });
  }

  function compare(){
    if(vm.selectedProducts.length > 4){
         Modal.alert("You can compare upto 4 products.",true);
          return;
    }
    if(vm.selectedProducts.length < 2){
          Modal.alert("Please select at least two products to compare.",true);
          return;
    }
    //Start NJ: addToCartCompare object push in GTM dataLayer
    dataLayer.push(gaMasterObject.addToCartCompare);
    //End
      var prevScope = $rootScope.$new();
      prevScope.productList = [];
      for(var i=0;i < 4;i++){
        if(vm.selectedProducts[i])
          prevScope.productList[i] = vm.selectedProducts[i];
        else
            prevScope.productList[i] = [];
      }

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
        prevScope.removeProductFromCompList = function(index){
          var removedProduct = vm.selectedProducts.splice(index,1);
          angular.element("#product_" + removedProduct[0]._id).prop("checked",false);
          prevScope.productList[index] = {};
        }
  }



  function updateSelection(event,prd){
        var checkbox = event.target;
        var action = checkbox.checked?'add':'remove';
        var index = getIndex(prd);
        if(action == 'add' && index == -1)
          vm.selectedProducts.push(prd)
        if(action == 'remove' && index != -1)
          vm.selectedProducts.splice(index,1);
  }

  function getIndex(prd){
    var index = -1;
    vm.selectedProducts.forEach(function(item,idx){
      if(item._id == prd._id)
        index = idx;
    });
    return index;
  }

}

angular.module('sreizaoApp').factory("cartSvc",['$http','$rootScope',function($http,$rootScope){
      var cartService = {};
      var path = '/api/cart';
      cartService.getCartData = function(id){
        $http.get(path + "/" + id)
        .success(function(res){
            $rootScope.cart = res;
            if($rootScope.cart && $rootScope.cart.products)
              $rootScope.cartCounter = $rootScope.cart.products.length;
            else
              $rootScope.cartCounter = 0;
        })
        .error(function(res){

        });
      };
      cartService.createCart = function(cart){
          return $http.post(path,cart);
      }
      cartService.updateCart = function(cart){
          return $http.put(path + "/" + $rootScope.cart._id,$rootScope.cart);
      }

      return cartService;
  }])

})();
