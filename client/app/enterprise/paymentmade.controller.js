(function(){
'use strict';
angular.module('sreizaoApp').controller('EnterprisePaymentMadeCtrl',EnterprisePaymentMadeCtrl);
function EnterprisePaymentMadeCtrl($scope, $rootScope,$uibModal,Modal,Auth, $state,notificationSvc, EnterpriseSvc, userSvc,PagerSvc) {
 	var vm = this;
  
  //var selectedItems = [];
  var statuses = [EnterpriseValuationStatuses[5]];
  
   var checkdetailObj = {
          bankName:"",
          branchName:"",
          chequeNo:"",
          chequeDate:"",
          chequeValue:"",
          deductedTds:"",
          attached:false
        };

  $scope.pager = PagerSvc.getPager();

  vm.fireCommand = fireCommand;
  vm.updateSelection = updateSelection;
  vm.openModal = openModal;

  function init(){

    getInvoiceData({});
  }

  function getInvoiceData(filter){
      $scope.pager.copy(filter);
      filter.status = statuses;
      filter.pagination = true;
      filter.paymentMade = 'n';
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

     function openModal(evtVal,idx){

        $scope.paymentDetail = evtVal.paymentMadeDetail.paymentDetails[idx]; 
         var formModal = $uibModal.open({
          animation: true,
            templateUrl: "formModal.html",
            scope: $scope,
            size: 'lg'
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
          var remainingVal = evtVal.paymentMadeDetail.remainingAmount - checkVal;
          if(remainingVal < 0){
            Modal.alert("Invalid cheque amount");
            return;
          }
          $scope.paymentDetail.attached = true;
          $scope.paymentDetail.createdAt = new Date();
          if(remainingVal > 0){
             evtVal.paymentMadeDetail.remainingAmount = remainingVal;
             evtVal.paymentMadeDetail.paymentDetails[evtVal.paymentMadeDetail.paymentDetails.length] = checkdetailObj;
          }

          if(remainingVal == 0){
            evtVal.paymentMadeDetail.remainingAmount = 0;
            evtVal.paymentMade = true;
             EnterpriseSvc.setStatus(evtVal,EnterpriseValuationStatuses[7],true);
          }
          EnterpriseSvc.updateInvoice(evtVal)
          .then(function(result){
              $scope.close();
              var isCompleted =  evtVal.paymentReceived && evtVal.paymentMade;
              getInvoiceData({});
              if(remainingVal == 0)
                updateValuationRequest($scope.paymentDetail.invoiceNo,isCompleted);
              $scope.paymentDetail = {};                
          });
      }

      function updateValuationRequest(invoiceNo,isCompleted){
        EnterpriseSvc.get({invoiceNo:invoiceNo})
        .then(function(valList){
          valList.forEach(function(item){
            item.paymentMade = true;
            EnterpriseSvc.setStatus(item,EnterpriseValuationStatuses[7],true);
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


     init();
}

})();
