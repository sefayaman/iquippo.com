(function(){
'use strict';
angular.module('sreizaoApp').controller('EnterprisePaymentMadeCtrl',EnterprisePaymentMadeCtrl);
function EnterprisePaymentMadeCtrl($scope, $rootScope,$uibModal,Modal,Auth, $state,notificationSvc, EnterpriseSvc, userSvc,PagerSvc) {
 	var vm = this;
 	var selectedItems = [];
 	var statuses = [EnterpriseValuationStatuses[6],EnterpriseValuationStatuses[7]]
 	$scope.pager = PagerSvc.getPager();

 	$scope.paymentDetai = {};
 	$scope.updatePaymentDetail = updatePaymentDetail;

 	vm.fireCommand = fireCommand;
 	vm.updateSelection = updateSelection;
 	vm.openModal = openModal;

 	function init(){

 		getEnterpriseData({});
 	}

 	function getEnterpriseData(filter){
      $scope.pager.copy(filter);
      filter.status = statuses;
      filter.pagination = true;
      EnterpriseSvc.get(filter)
      .then(function(result){
        vm.dataList = result.items;
        vm.totalItems = result.totalItems;
         $scope.pager.update(result.items,result.totalItems);
      });
    }

    function fireCommand(reset){
      if(reset)
        $scope.pager.reset();
      var filter = {};

      if(vm.searchStr)
        filter['searchStr'] = vm.searchStr;
      
      getEnterpriseData(filter);
    }


    function updateSelection(event,item){
        var checkbox = event.target;
        var index = -1
        selectedItems.forEach(function(obj,idx){
           if(obj._id == item._id)
             index = idx;
        });
        var action = checkbox.checked?'add':'remove';
        if(action == 'add' && index == -1)
          selectedItems.push(item)
        if(action == 'remove' && index != -1)
          selectedItems.splice(index,1);
     }

     function openModal(){

     	if(selectedItems.length == 0){
     		Modal.alert('No recoord selcted');
     		return;
     	}

     	 var formModal = $uibModal.open({
     	  animation: true,
          templateUrl: "formModal.html",
          scope: $scope,
          size: 'lg'
      });

      $scope.close = function () {
        formModal.dismiss('cancel');
      };

     }

    function updatePaymentDetail(){
      	selectedItems.forEach(function(item){
      		item.paymentMadeDetail = $scope.paymentDetai;
      		EnterpriseSvc.setStatus(item,EnterpriseValuationStatuses[7]);
      	});

      	EnterpriseSvc.bulkUpdate(selectedItems)
        .then(function(res){
          	selectedItems = [];
          	$scope.pager.reset();
         	getEnterpriseData({});
         	$scope.close();
        })
      }

     init();

}

})();
