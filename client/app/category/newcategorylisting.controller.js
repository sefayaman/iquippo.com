(function(){

'use strict';
angular.module('sreizaoApp').controller('NewCategoryListingCtrl',NewCategoryListingCtrl);

  function NewCategoryListingCtrl($scope,$stateParams,categorySvc) {
    
    var vm  = this;
    vm.showedItems = 9;
    vm.allCategoryList = [];
    vm.showMore = showMore;

    function init(){
      var filter = {isForNew:true};
      filter.productCount = true;
      if($stateParams.group)
        filter.group = $stateParams.group;
      categorySvc.getCategoryOnFilter(filter)
      .then(function(catList){
        vm.allCategoryList = sortArr(catList);
      })
      .catch(function(err){
        Modal.alert("Error in fetching categories");
      });
    }

    function sortArr(arrList){
      var sortedArr = [];
      if(!arrList.length)
        return sortedArr;

      var appCache = {};
      for(var i = 0;i < arrList.length;i++){
        if(arrList[i].imgSrc && !appCache[arrList[i].name]){
          sortedArr.push(arrList[i]);
          appCache[arrList[i].name] = 1;
        }
      }

      arrList.forEach(function(item){
        if(!appCache[item.name]){
          sortedArr.push(item);
          appCache[item.name] = 1;
        }
      });

      return sortedArr;
    }

    function showMore(){
      vm.showedItems += 6;
    }

    //Entry point
    init();
}

})();