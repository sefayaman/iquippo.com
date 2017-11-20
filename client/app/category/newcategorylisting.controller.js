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
      if($stateParams.group)
        filter.group = $stateParams.group;
      categorySvc.getCategoryOnFilter(filter)
      .then(function(catList){
        vm.allCategoryList = catList;
      })
      .catch(function(err){
        Modal.alert("Error in fetching categories");
      });
    }

    function showMore(){
      vm.showedItems += 6;
    }

    //Entry point
    init();
}

})();