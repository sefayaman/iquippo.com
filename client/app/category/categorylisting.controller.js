(function(){

'use strict';
angular.module('sreizaoApp').controller('CategoryListingCtrl',CategoryListingCtrl);

  function CategoryListingCtrl($scope,$stateParams,categorySvc) {
    
    var vm  = this;
    vm.showedItems = 9;
    vm.allCategoryList = [];
    vm.showMore = showMore;
    $scope.group = $stateParams.group || "";

    function init(){
      var filter = {isForUsed:true};
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
