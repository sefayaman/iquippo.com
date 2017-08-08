(function() {
  'use strict';
  angular.module('sreizaoApp').controller('FinanceCtrl', FinanceCtrl);

  function FinanceCtrl($scope, $rootScope, $http,$window, $interval, $timeout, $uibModal, Auth,$state, Modal,BannerSvc,CountSvc) {
    var vm = this;
    vm.auctions = [];
    vm.master = false;
    vm.myInterval = 7000;
    vm.noWrapSlides = false;
    vm.slides = [];//HOME_BANNER;

    function getHomeBanner(){
      BannerSvc.getHomeBanner()
      .then(function(slides){
          vm.slides = slides;
          getHighestBids();
      })
      .catch(function(){
        vm.slides = HOME_BANNER;
      })
    }
    getHomeBanner();


  }

})();