(function(){
'use strict';
angular.module('sreizaoApp').controller('EnterprisePaymentReceivedCtrl',EnterprisePaymentReceivedCtrl);
function EnterprisePaymentReceivedCtrl($scope, $rootScope,$uibModal,Modal,Auth, $state,notificationSvc, EnterpriseSvc, userSvc,PagerSvc) {
 	var vm = this;

 	//var selectedItems = [];
 	var statuses = [EnterpriseValuationStatuses[5]];


 	$scope.pager = PagerSvc.getPager();

 	vm.fireCommand = fireCommand;
 	vm.updateSelection = updateSelection;
 	vm.openModal = openModal;
  vm.exportExcel = exportExcel;

 	function init(){

 		getInvoiceData({});
 	}

 	function getInvoiceData(filter){
      $scope.pager.copy(filter);
      filter.status = statuses;
      filter.pagination = true;
      filter.paymentReceived = 'n';
      EnterpriseSvc.getInvoice(filter)
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
       if(vm.fromDate)
          filter['fromDate'] = encodeURIComponent(vm.fromDate);
        if(vm.toDate)
          filter['toDate'] = encodeURIComponent(vm.toDate);
      
      getInvoiceData(filter);
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

     function openModal(_id){

        $scope.paymentDetail = {}; 
        var formModal = null;
        var filter = {};
        filter._id = _id;
        filter.status = statuses;
        filter.paymentReceived = 'n';
        EnterpriseSvc.getInvoice(filter)
        .then(function(result){
          if(result && result.length > 0){
             $scope.remainingAmount = result[0].paymentReceivedDetail.remainingAmount;
             if($scope.remainingAmount <= 0)
                return;
              formModal = $uibModal.open({
                                animation: true,
                                templateUrl: "formModal.html",
                                scope: $scope,
                                size: 'lg'
                            });
          }
        });

        $scope.close = function () {
          formModal.dismiss('cancel');
        };

        $scope.updatePaymentDetail = function(form){
          
          if(form.$invalid){
            $scope.submitted = true;
            return;
          }

          var checkVal = $scope.paymentDetail.chequeValue + $scope.paymentDetail.deductedTds;
          var remainingVal = $scope.remainingAmount - checkVal;
          if(remainingVal < 0){
            Modal.alert("Invalid cheque amount");
            return;
          }
          $scope.paymentDetail.attached = true;
          $scope.paymentDetail.createdAt = new Date();
          $scope.paymentDetail.createdBy = Auth.getCurrentUser()._id;
          var serData = {
            _id:_id,
           chequeDetail : $scope.paymentDetail,
           updateType:'paymentreceived'
          }

          EnterpriseSvc.updateInvoice(serData)
          .then(function(result){
              if($scope.close)
                  $scope.close();
              if(result && result.length > 0){
                 var isCompleted =  result.paymentReceived && result.paymentMade;
                 if(result.paymentReceived)
                    updateValuationRequest(result.invoiceNo,isCompleted);
              }
              fireCommand(true);
              $scope.paymentDetail = {};                
          })
           .catch(function(err){
            Modal.alert("Invalid payment update.Please refresh your page and try again.");
          });
      }

      function updateValuationRequest(invoiceNo,isCompleted){
        EnterpriseSvc.get({invoiceNo:invoiceNo})
        .then(function(valList){
          valList.forEach(function(item){
            item.paymentReceived = true;
            EnterpriseSvc.setStatus(item,EnterpriseValuationStatuses[6],true);
            if(isCompleted)
              EnterpriseSvc.setStatus(item,EnterpriseValuationStatuses[8]);
          });
          EnterpriseSvc.bulkUpdate(valList);
        })
        .catch(function(err){
          console.log('err in valuation request',err);
        });
      }

     }

      function exportExcel(){
          var filter = {};

          if(vm.fromDate)
            filter['fromDate'] = encodeURIComponent(vm.fromDate);
          if(vm.toDate)
            filter['toDate'] = encodeURIComponent(vm.toDate);

          EnterpriseSvc.exportExcel("paymentreceived",filter);
      }


     init();

}

})();
