(function(){

'use strict';
angular.module('sreizaoApp').controller('GroupListingCtrl',GroupListingCtrl);

  function GroupListingCtrl($scope,groupSvc) {
    
    var vm  = this;
    vm.showedItems = 9;
    vm.allCategoryList = [];
   // vm.showMore = showMore;

    function init(){
      groupSvc.getAllGroup({isForUsed:true})
      .then(function(groupList){
        vm.groupList = groupList;
      })
      .catch(function(err){
        Modal.alert("Error in fetching industries");
      });
    }

    /*function showMore(){
      vm.showedItems += 3;
    }*/

    //Entry point
    init();
}

})();
