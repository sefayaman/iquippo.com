(function(){

  'use strict';

angular.module('sreizaoApp').controller('ViewCartCtrl',ViewCartCtrl)

function ViewCartCtrl($scope,$rootScope,cartSvc,Auth,Modal) {
    var vm = this;
    vm.deleteProductFromCart = deleteProductFromCart;
    vm.clearCart = clearCart;

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

    function clear(){
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




  
