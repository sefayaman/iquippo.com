(function(){

'use strict';
angular.module('sreizaoApp').controller('NewBrandListingCtrl',NewBrandListingCtrl);

  function NewBrandListingCtrl($scope,brandSvc) {
    
    var vm  = this;
    vm.showedItems = 12;
    vm.brandList = [];
    vm.showMore = showMore;

    function init(){
      brandSvc.getBrandOnFilter({isForNew:true})
      .then(function(brList){
        vm.brandList = brList;
      })
      .catch(function(err){
        Modal.alert("Error in fetching categories");
      });
    }

    function showMore(){
      vm.showedItems += 12;
    }

    //Entry point
    init();
}

})();
