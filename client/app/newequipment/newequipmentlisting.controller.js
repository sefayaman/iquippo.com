(function(){
'use strict';
angular.module('sreizaoApp').controller('NewEquipmentListCtrl', NewEquipmentListCtrl);

function NewEquipmentListCtrl($scope,$state, $stateParams, $rootScope,$uibModal, Auth, CartSvc, productSvc,categorySvc,SubCategorySvc,LocationSvc,brandSvc,modelSvc ,DTOptionsBuilder,Modal,$timeout,$window) {
  var vm = this;
  

  function init(){
      console.log('---------:',$state.current.name);
  }
   init();
}
})();
