(function(){
'use strict';
angular.module('admin').controller('PriceTrendSurveyListingCtrl',PriceTrendSurveyListingCtrl);

function PriceTrendSurveyListingCtrl($scope,Modal,Auth,PriceTrendSvc) {
    var vm = this;
    vm.surveys = [];

    //pagination variables
    var prevPage = 0;
    vm.itemsPerPage = 50;
    vm.currentPage = 1;
    vm.totalItems = 0;
    vm.maxSize = 6;
    var first_id = null;
    var last_id = null;
    vm.searchStr = "";

    vm.getPriceTrendComments = getPriceTrendComments;


    function getPriceTrendComments(resetPage){
        if(resetPage)
            resetPagination();
        var filter = {};
        filter.pagination = true;
        filter.prevPage = prevPage;
        filter.currentPage = vm.currentPage;
        filter.first_id = first_id;
        filter.last_id = last_id;
        filter.itemsPerPage = vm.itemsPerPage;
        if(vm.searchStr)
            filter['searchStr'] = vm.searchStr;
        PriceTrendSvc.getSurveyOnFilter(filter)
        .then(function(result){
            vm.surveys = result.items;
            vm.totalItems = result.totalItems;
            prevPage = vm.currentPage;
            if(result.items.length > 0){
               first_id = result.items[0]._id;
               last_id = result.items[result.items.length - 1]._id;
            }
        })

    }

    getPriceTrendComments(true);
    function resetPagination(){
         prevPage = 0;
         vm.currentPage = 1;
         vm.totalItems = 0;
         first_id = null;
         last_id = null;
    }

}

})();
