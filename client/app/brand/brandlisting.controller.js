(function(){

'use strict';
angular.module('sreizaoApp').controller('BrandListingCtrl',BrandListingCtrl);

  function BrandListingCtrl($scope,brandSvc,Modal) {
    
    var vm  = this;
    vm.showedItems = 12;
    vm.brandList = [];
    vm.showMore = showMore;

    function init(){
      brandSvc.getBrandOnFilter({isForUsed:true})
      .then(function(brList){
        vm.brandList = sortBrand(brList);
      })
      .catch(function(err){
      });
    }

    function sortBrand(brandList){
      var sortedBrand = [];
      if(!brandList.length)
        return sortedBrand;

      var brandCache = {};
      //var brLength = brandList.length;
      for(var i = 0;i < brandList.length;i++){
        if(brandList[i].imgSrc && !brandCache[brandList[i]._id]){
          sortedBrand.push(brandList[i]);
          brandCache[brandList[i]._id] = 1;
          //brandList.splice(0,i);
        }
      }

      brandList.forEach(function(item){
        if(!brandCache[item._id])
          sortedBrand.push(item);
        brandCache[item._id] = 1;
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
