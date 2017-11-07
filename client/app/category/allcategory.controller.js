(function(){

'use strict';
angular.module('sreizaoApp').controller('AllCategoryCtrl',AllCategoryCtrl);

  function AllCategoryCtrl($scope,categorySvc) {
    
    var vm  = this;
    vm.showedItems = 9;
    vm.allCategoryList = [];
    vm.showMore = showMore;

    function init(){
      categorySvc.getAllCategory()
      .then(function(catList){
        vm.allCategoryList = catList;
      })
      .catch(function(err){
        Modal.alert("Error in fetching categories");
      });
    }

    function showMore(){
      vm.showedItems += 3;
    }

    //Entry point
    init();
}

})();
