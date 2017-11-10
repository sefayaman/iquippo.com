(function(){

'use strict';
angular.module('sreizaoApp').controller('BrandListingCtrl',BrandListingCtrl);

  function BrandListingCtrl($scope,brandSvc) {
    
    var vm  = this;
    //vm.showedItems = 9;
    vm.brandList = [];
    //vm.showMore = showMore;

    function init(){
      brandSvc.getBrandOnFilter({isForUsed:true})
      .then(function(brList){
        vm.brandList = brList;
      })
      .catch(function(err){
        Modal.alert("Error in fetching categories");
      });
    }

    /*function showMore(){
      vm.showedItems += 3;
    }*/

    //Entry point
    init();
}

})();
