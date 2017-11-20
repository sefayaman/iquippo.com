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
        vm.brandList = sortBrand(brList);
      })
      .catch(function(err){
        //Modal.alert("Error in fetching categories");
      });
    }

    function sortBrand(brandList){
      var sortedBrand = [];
      if(!brandList.length)
        return sortedBrand;

      var brandCache = {};
      for(var i = 0;i < brandList.length;i++){
        if(brandList[i].imgSrc && !brandCache[brandList[i].name]){
          sortedBrand.push(brandList[i]);
          brandCache[brandList[i].name] = 1;
        }
      }

      brandList.forEach(function(item){
        if(!brandCache[item.name]){
          sortedBrand.push(item);
          brandCache[item.name] = 1;
        }
      });

      return sortedBrand;
    }

    function showMore(){
      vm.showedItems += 12;
    }

    //Entry point
    init();
}

})();
