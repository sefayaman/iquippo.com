'use strict';

angular.module('sreizaoApp')
.controller('ViewCartCtrl', function ($scope,$rootScope,cartSvc, $http,Auth,Modal) {
    cartSvc.getCartData(Auth.getCurrentUser()._id);

    $scope.deleteProductFromCart = function(index){
      Modal.confirm(informationMessage.deleteCartProductConfirm,function(isGo){
          if(isGo == 'no')
            return;
          deleteProductFromCart(index);
      });
    };

    $scope.clearCart = function(){
       Modal.confirm(informationMessage.clearCartConfirm,function(isGo){
          if(isGo == 'no')
            return;
          clearCart();
      });
    }; 

    function deleteProductFromCart(index){
         $rootScope.cart.products.splice(index,1);
      cartSvc.updateCart($rootScope.cart)
        .success(function(res){
            Modal.alert(informationMessage.deleteCartProductSuccess,true);
            $rootScope.cartCounter = $rootScope.cart.products.length;
        })
        .error(function(res){
             Modal.alert(res,true);
        })
    }

    function clearCart(){
        $rootScope.cart.products = []
      cartSvc.updateCart($rootScope.cart)
        .success(function(res){
            Modal.alert(informationMessage.clearCartSuccess,true);
            $rootScope.cartCounter = $rootScope.cart.products.length;
        })
        .error(function(res){
             Modal.alert(res,true);
        })
    }
})
.factory("cartSvc",['$http','$rootScope',function($http,$rootScope){
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



  
