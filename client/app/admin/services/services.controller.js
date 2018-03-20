'use strict';

angular.module('sreizaoApp')
 .controller('ServiceCtrl',['$scope','$rootScope', '$http', 'productSvc', 'classifiedSvc','Modal', '$uibModal', '$state','Auth', 'notificationSvc','uploadSvc', function($scope, $rootScope, $http, productSvc, classifiedSvc, Modal, $uibModal, $state, Auth, notificationSvc,uploadSvc) {
  $scope.globalProductList = [];
  var dataToSend = {};
  // $scope.dtOptions = DTOptionsBuilder.newOptions().withOption('bFilter', true).withOption('lengthChange', true);
  //pagination variables
  var prevPage = 0;
  $scope.itemsPerPage = 50;
  $scope.maxSize = 6;
  $scope.page = 1;
   /*if(Auth.getCurrentUser()._id && Auth.getCurrentUser().role != 'admin') {
      dataToSend["userid"] = Auth.getCurrentUser()._id;
   }*/

   getServices();

   function getServices(){
    if(!$scope.shipping && !$scope.valuation && !$scope.cetifiedByiQuippo) {
      delete $scope.type;
    dataToSend = {};  
    }
    $http.post('/api/services/getservices', dataToSend).success(function(srchres){
         $scope.servicesList = srchres;
   });
   }

  $scope.serviceFilter = function(){
    $scope.type = {};
    if($scope.shipping)
      $scope.type.shipping = "shipping";
    else
      delete $scope.type.shipping;
    
    if($scope.valuation)
      $scope.type.valuation = "valuation";
    else 
      delete $scope.type.valuation;
    if($scope.cetifiedByiQuippo)
      $scope.type.cetifiedByiQuippo = "cetifiedByiQuippo";
    else
      delete $scope.type.cetifiedByiQuippo;

    dataToSend["type"] = $scope.type;
    getServices();
  }

  $scope.exportExcel = function(){
    $http.post('/api/services/export', dataToSend)
    .then(function(res){
      var data = res.data;
      saveAs(new Blob([s2ab(data)],{type:"application/octet-stream"}), "servicelist_"+ new Date().getTime() +".xlsx")
    },
    function(res){
      console.log(res)
    })
   }

   $scope.pageChanged = function(){
    var startPos = ($scope.page - 1) * $scope.itemsPerPage;
   }
}]);
