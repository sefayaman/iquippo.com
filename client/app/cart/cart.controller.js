(function(){

  'use strict';

angular.module('sreizaoApp').controller('ViewCartCtrl',ViewCartCtrl)

function ViewCartCtrl($scope,$rootScope,cartSvc,Auth,Modal,$uibModal) {
    var vm = this;
    vm.productListToCompare = [];
    vm.deleteProductFromCart = deleteProductFromCart;
    vm.clearCart = clearCart;
    vm.updateSelection = updateSelection;
    vm.compare = compare;
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
      var prd = $rootScope.cart.products[index]; 
      $rootScope.cart.products.splice(index,1);
      cartSvc.updateCart($rootScope.cart)
        .success(function(res){
            Modal.alert(informationMessage.deleteCartProductSuccess,true);
            $rootScope.cartCounter = $rootScope.cart.products.length;
            var idx = getIndex(prd);
            if(idx != -1)
              vm.productListToCompare.splice(idx,1);
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
            vm.productListToCompare = [];
        })
        .error(function(res){
             Modal.alert(res,true);
        })
    }
  function compare(){

     if(vm.productListToCompare.length < 2){
          Modal.alert("Please select atleat two products to compare.",true);
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
  }

  function updateSelection(event,prd){
        var checkbox = event.target;
        var action = checkbox.checked?'add':'remove';
        if( action == 'add' && vm.productListToCompare.length >= 4){
          angular.element(checkbox).prop("checked",false);
          Modal.alert("You can compare upto 4 products.",true);
          return;
        }
        var index = getIndex(prd);
        if(action == 'add' && index == -1)
          vm.productListToCompare.push(prd)
        if(action == 'remove' && index != -1)
          vm.productListToCompare.splice(index,1);
  }

  function getIndex(prd){
    var index = -1;
    vm.productListToCompare.forEach(function(item,idx){
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




  
