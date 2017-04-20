(function(){

  'use strict';
  angular.module('sreizaoApp').factory("CartSvc",CartSvc);
  function CartSvc($http,$rootScope,Auth,Modal,$q){

      var cartService = {};
      var cart = null;
      var path = '/api/cart';
      cartService.loadCart = loadCart;
      cartService.getCart = getCart;
      cartService.updateCart = updateCart;
      cartService.addProductToCart = addProductToCart;
       cartService.clearCache = clearCache;
       cartService.checkCart = checkCart;
      
      function loadCart(){

        if(Auth.getCurrentUser()._id){
          getFromServer(Auth.getCurrentUser()._id);   
        }else{
           Auth.isLoggedInAsync(function(loggedIn){
             if(loggedIn){
                getFromServer(Auth.getCurrentUser()._id);
             }
           });
        }
      }

      function getCart(){
        var deferred = $q.defer();
        if(Auth.getCurrentUser()._id && cart){
          //deferred.resolve(cart);
          getFromServer(Auth.getCurrentUser()._id, deferred);
        //}else if(Auth.getCurrentUser()._id){
          //getFromServer(Auth.getCurrentUser()._id,deferred);
        } else {
           Auth.isLoggedInAsync(function(loggedIn){
             if(loggedIn){
                getFromServer(Auth.getCurrentUser()._id,deferred);
             }else{
              deferred.reject({});
             }
           });
        }

        return deferred.promise;
      }

     function addProductToCart(product){

        if(!Auth.getCurrentUser()._id){
          Modal.alert(informationMessage.cartLoginError,true);
          return;
        }
        if(!cart){
          cart = {};
          cart.user = {};
          cart.user['_id'] = Auth.getCurrentUser()._id;
          cart.user['name'] = Auth.getCurrentUser().fname;
          cart.products = [];
          cart.products[cart.products.length] = product;
          
          createCart()
          .then(function(res){
              Modal.alert(informationMessage.cartAddedSuccess,true);
          })
          .catch(function(err){
              Modal.alert(informationMessage.cartAddedError,true);
          });

        }else{
          var prd = []
          prd = cart.products.filter(function(d){
              return d._id === product._id && d.type == product.type;
          });
          if(prd.length > 0){
            Modal.alert(informationMessage.productAlreadyInCart,true);
            return;
          }

           cart.products[cart.products.length] = product;
           updateCart(cart)
           .then(function(res){
              Modal.alert(informationMessage.cartAddedSuccess,true);
            })
            .catch(function(err){
                Modal.alert(informationMessage.cartAddedError,true);
            });
        }
      }

      function getFromServer(id,promise){

          $http.get(path + "/" + id)
          .then(function(res){
              cart = res.data;
              if(cart && cart.products)
                $rootScope.cartCounter = cart.products.length;
              else
                $rootScope.cartCounter = 0;
              if(promise)
                  promise.resolve(cart);
          })
          .catch(function(res){
            if(promise)
              promise.reject(res);
          });
      };


      function createCart(){
         return $http.post(path,cart)
                .then(function(res){
                    cart = res.data;
                    $rootScope.cartCounter = cart.products.length;
                    return cart;
                })
                .catch(function(res){
                     throw res;
                });
      }

      function updateCart(cartDt){

        return $http.put(path + "/" + cartDt._id,cartDt)
                .then(function(res){
                      cart = cartDt;
                      $rootScope.cartCounter = cart.products.length;
                      return cart;
                  })
                  .catch(function(res){
                       throw res;
                  });
      }

      function clearCache(){
        cart = null;
        $rootScope.cartCounter = 0;
      }

      function checkCart(prdId){
        var ret = false;
        if(!cart)
          return ret;
        for(var i = 0;i < cart.products.length;i++){
          if(cart.products[i]._id == prdId){
            ret = true;
            break;
          }
        }

        return ret;
      }
      return cartService;
  }

})();




  
