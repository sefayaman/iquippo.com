(function(){

  'use strict';

angular.module('sreizaoApp').controller('ViewCartCtrl',ViewCartCtrl)

function ViewCartCtrl($scope,$rootScope,CartSvc,Auth,Modal,$uibModal,notificationSvc,$http,$state,productSvc,BuyContactSvc,spareSvc) {

    var vm = this;
    vm.selectedProducts = [];
    vm.deleteProductFromCart = deleteProductFromCart;
    vm.clearCart = clearCart;
    vm.updateSelection = updateSelection;
    vm.compare = compare;
    vm.sendBuyRequest = sendBuyRequest;

    function init(){
     CartSvc.getCart(Auth.getCurrentUser()._id)
          .then(function(result){
            vm.cart = result;
       });
    }

    init();

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
      var prd = vm.cart.products[index];
      var data = prd;
      gaMasterObject.removeToCart.eventLabel = data.name;
      dataLayer.push(gaMasterObject.removeToCart);

      vm.cart.products.splice(index,1);
      CartSvc.updateCart(vm.cart)
        .success(function(res){
            Modal.alert(informationMessage.deleteCartProductSuccess,true);
            $rootScope.cartCounter = vm.cart.products.length;
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
      for (var i = 0; i < vm.cart.products.length; i++) {
        gaMasterObject.removeToCart.eventLabel = vm.cart.products[i].name;
        dataLayer.push(gaMasterObject.removeToCart);
      }
      //End
      vm.cart.products = []
      cartSvc.updateCart(vm.cart)
        .success(function(res){
            Modal.alert(informationMessage.clearCartSuccess,true);
            $rootScope.cartCounter = vm.cart.products.length;
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
      dataToSend.spares = [];
      vm.selectedProducts.forEach(function(item,index){
        var obj = {};
        obj._id = item._id;
        obj.name = item.name;
        obj.assetDir = item.assetDir;
        obj.image = item.primaryImg;
        obj.grossPrice = item.grossPrice;
        obj.seller = item.seller;

        if(item.type == "equipment"){
            obj.productId = item.productId;
            obj.category = item.category.name;
            obj.brand = item.brand.name;
            obj.model = item.model.name;
            obj.subCategory = item.subcategory.name;
            obj.city = item.city;
            obj.comment = item.comment;
            dataToSend.product[dataToSend.product.length] = obj;
        }
        else{
          obj.partNo = item.partNo;
          obj.manufacturer = item.manufacturers.name;
          obj.city = item.locations[0].city;
          obj.comment = item.description;
          dataToSend.spares[dataToSend.spares.length] = obj;
        }
      });

      dataToSend['fname'] =  Auth.getCurrentUser().fname;
      dataToSend['mname'] = Auth.getCurrentUser().mname;
      dataToSend['lname'] = Auth.getCurrentUser().lname;
      dataToSend['country'] = Auth.getCurrentUser().country;
      dataToSend['phone'] = Auth.getCurrentUser().phone;
      dataToSend['mobile'] = Auth.getCurrentUser().mobile;
      dataToSend['email'] = Auth.getCurrentUser().email;
      dataToSend['contact'] = Auth.getCurrentUser().contact;

      BuyContactSvc.submitRequest(dataToSend)
      .then(function(result){
         //var count = 0;
        for (var i = 0; i < result.product.length; i++) {
            //count++;
            /*
            Date: 10/06/2016
            Developer Name : Nishant
            Purpose:insert sendMessage event in GTM
            */
              var data = result.product[i];
              var pSMListArray = [];
              var pSMObject={};
              gaMasterObject.sendMessage.name = data.name;
              gaMasterObject.sendMessage.id = data.productId;
              gaMasterObject.sendMessage.price = data.grossPrice;
              gaMasterObject.sendMessage.brand = data.brand;
              gaMasterObject.sendMessage.category = data.category;
              gaMasterObject.sendMessage.metric1 = 1;
              var list = data.category;
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
      });
  }

  function compare(){

    var productsToCompare = vm.selectedProducts.filter(function(item){
        return item.type == 'equipment';
    });

    if(productsToCompare.length > 4){
         Modal.alert("You can compare upto 4 products.",true);
         return;
    }
    if(productsToCompare.length < 2){
          Modal.alert("Please select at least two products to compare.",true);
          return;
    }
    //Start NJ: addToCartCompare object push in GTM dataLayer
    dataLayer.push(gaMasterObject.addToCartCompare);
    //End
      var prevScope = $rootScope.$new();
      prevScope.productList = [];
      for(var i=0;i < 4;i++){
        if(productsToCompare[i])
          prevScope.productList[i] = productsToCompare[i];
        else
            prevScope.productList[i] = {};
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
          //var removedProduct = vm.selectedProducts.splice(index,1);
          //angular.element("#product_" + removedProduct[0]._id).prop("checked",false);
          prevScope.productList[index] = {};
        }
  }


  function updateSelection(event,prd){

        var checkbox = event.target;
        var action = checkbox.checked?'add':'remove';
        var index = getIndex(prd);
        if(action == 'add' && index == -1){
          $rootScope.loading = true;
          if(prd.type == "equipment"){

            productSvc.getProductOnId(prd._id)
            .then(function(result){
              result.type = "equipment";
              vm.selectedProducts.push(result);
              $rootScope.loading = false;
            })
            .catch(function(err){
              $rootScope.loading = false;
            })

          }else{
            spareSvc.getSpareOnId(prd._id)
            .then(function(result){
              result.type = "spare";
              vm.selectedProducts.push(result);
              $rootScope.loading = false;
            })
            .catch(function(err){
              $rootScope.loading = false;
            })
          }
          //vm.selectedProducts.push(prd)
        }
        if(action == 'remove' && index != -1)
          vm.selectedProducts.splice(index,1);
  }

  function getIndex(prd){
    var index = -1;
    vm.selectedProducts.forEach(function(item,idx){
      if(item._id == prd._id && prd.type == item.type)
        index = idx;
    });
    return index;
  }

}

})();
