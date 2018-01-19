(function(){
'use strict';
angular.module('sreizaoApp').controller('EnterpriseInvoiceCtrl',EnterpriseInvoiceCtrl);
function EnterpriseInvoiceCtrl($scope, $rootScope,$timeout,$uibModal,Modal,Auth, $state,ServiceTaxSvc,ServiceFeeSvc,notificationSvc, EnterpriseSvc, userSvc,PagerSvc,vendorSvc,UtilSvc,$window) {
 	var vm = this;

  var INVOICE_TEMPLATE = "EValuation_Invoice"
  var selectedItems = [];
  var selectedFee = null;
  vm.serviceList = [{name:"Valuation"},{name:"Inspection"}];
  var statuses = [EnterpriseValuationStatuses[6]]
 	
  //$scope.taxList = TaxList;
  $scope.EnterpriseValuationStatuses = EnterpriseValuationStatuses;
  $scope.selectedTax = [];
  $scope.currentTax = null;

  $scope.selPageSize = "100";
  $scope.pager = PagerSvc.getPager(null,null,100);
  $scope.changePageSize = changePageSize;
  //$scope.getServiceFee  = getServiceFee;
  $scope.generateInvoice = generateInvoice;
  $scope.addTaxToken = addTaxToken;
  $scope.deleteTaxToken = deleteTaxToken;
  $scope.getTax = getTax;

  vm.type = "generated";
  vm.invoice = {};

 	vm.onTypeChange = onTypeChange;
  vm.fireCommand = fireCommand;
 	vm.updateSelection = updateSelection;
 	vm.openInvoiceModal = openInvoiceModal;
  vm.exportExcel = exportExcel;
  vm.getPartners = getPartners;
  vm.print = printInvoice;
  vm.downloadInvoice = downloadInvoice;
  vm.selectAll = selectAll;
  vm.showDetail = showDetail;

  function openWindow(url) {
    $window.open(url);
  }

  function downloadInvoice(invoiceNo){
    openWindow(EnterpriseSvc.generateinvoice(invoiceNo));    
  }

 	function init(){
    vm.type = Auth.isAdmin()?'tobegenerate':"generated";
 		ServiceFeeSvc.get()
 		.then(function(res){
 			$scope.serviceFees = res;
 		})

    if(Auth.isAdmin()){
      var userFilter = {};
      userFilter.role = "enterprise";
      userFilter.enterprise = true;
      userFilter.status = true;
      userSvc.getUsers(userFilter).then(function(data){
        vm.enterprises = data;
      })
      vendorSvc.getAllVendors();
      /*.then(function(){
         vm.agencies = vendorSvc.getVendorsOnCode("Valuation");
      });*/
    }
    if(Auth.isAdmin())
      getEnterpriseData({});
    else
      getInvoiceData({});
 	}

  function changePageSize(pageSize){
    $scope.pager.reset();
    $scope.pager = PagerSvc.getPager(null,null,parseInt(pageSize) || 100);
    fireCommand();
  }

  function onTypeChange(){
    vm.enterpriseId = "";
    vm.reqType = "";;
    vm.agencyId = "";
    selectedItems = [];
    vm.selectAllInv = "";
    vm.selectAllReq = "";

    $scope.pager.reset();
    if(vm.type == 'generated')
      getInvoiceData({});
    else
      getEnterpriseData({});

  }

  function getPartners(code){
          vm.agencies = [];
          if(!code)
              return;
          vm.agencies = vendorSvc.getVendorsOnCode(code);
    }

  function getInvoiceData(filter){
      $scope.pager.copy(filter);
      //filter.status = [EnterpriseValuationStatuses[5]];
      filter.pagination = true;
      if(Auth.isEnterprise() || Auth.isEnterpriseUser())
        filter['enterpriseId'] = Auth.getCurrentUser().enterpriseId;
      if(Auth.isValuationPartner())
        filter['agencyId'] = Auth.getCurrentUser().partnerInfo._id;

      EnterpriseSvc.getInvoice(filter)
      .then(function(result){
        vm.dataList = result.items;
        vm.totalItems = result.totalItems;
        $scope.pager.update(result.items,result.totalItems);
      });
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
      
      selectedItems = [];
      vm.selectAllInv = "";
      vm.selectAllReq = "";

      if(vm.searchStr)
        filter['searchStr'] = vm.searchStr;
      if(vm.fromDate)
        filter['fromDate'] = encodeURIComponent(vm.fromDate);

      if(vm.toDate)
        filter['toDate'] = encodeURIComponent(vm.toDate);
      
       if(vm.type == 'generated')
        getInvoiceData(filter);
      else{
        if(vm.enterpriseId)
          filter['enterpriseId'] = vm.enterpriseId;
        if(vm.reqType)
          filter['requestType'] = vm.reqType;
        if(vm.agencyId)
          filter['agencyId'] = vm.agencyId;
        getEnterpriseData(filter);

      }
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

     function selectAll(event){

        var checkbox = event.target;
        var action = checkbox.checked?'add':'remove';
        if(action == 'add'){
          selectedItems = [];
           vm.dataList.forEach(function(item){
              selectedItems[selectedItems.length] = item;
           });
        }
        if(action == 'remove'){
          selectedItems = [];
        }
     }

     function openInvoiceModal(){
      
      $scope.currentTax = "";
      $scope.selectedTax = [];

      if(!vm.enterpriseId|| !vm.agencyId || !vm.reqType){
        Modal.alert('Please filter record based on enterprise,service type and agency.');
        return;
      }

     	if(selectedItems.length == 0){
     		Modal.alert('No record selected');
     		return;
     	}

      var serData = {
        agencyId:vm.agencyId,
        enterpriseId:vm.enterpriseId,
        requestType:vm.reqType,
        current:"y"
      }

      ServiceFeeSvc.get(serData)
      .then(function(result){
        if(result.length == 0){
          Modal.alert('Service fee not found.Please check service fee master data');
          return;
        }
        $scope.invoice = {};
        $scope.invoice.requestCount = selectedItems.length;
        $scope.invoice.serviceFee = result[0].amount;
        $scope.invoice.chargeBasis = result[0].chargeBasis;
        openModal();
      })
      .catch(function(err){
        Modal.alert("Unknown error occured during fetching service fee.Please try again.");
      })

       ServiceTaxSvc.get({current:'y'})
      .then(function(res){
        $scope.serviceTaxes = res;
      });


     }

     function openModal(){
       var invoiceModal = $uibModal.open({
        animation: true,
          templateUrl: "invoiceForm.html",
          scope: $scope,
          size: 'lg'
      });

        $scope.close = function () {
          invoiceModal.dismiss('cancel');
        };
     }

      function generateInvoice(){

        if(!$scope.selectedTax || $scope.selectedTax.length == 0){
            Modal.confirm("It seems you have not selected any taxes, Please add taxes.",function(ret){
              if(ret == 'Yes')
                calculateInvoice();                 
            })
         }else
            calculateInvoice();
      }

      function updateInvoice(){

        $scope.invoice.enterprise = selectedItems[0].enterprise;
        $scope.invoice.agency = selectedItems[0].agency;
        $scope.invoice.requestType = selectedItems[0].requestType;
        
        $scope.invoice.createdBy = {};
        $scope.invoice.createdBy._id = Auth.getCurrentUser()._id;
        $scope.invoice.createdBy.name = Auth.getCurrentUser().fname + " " + Auth.getCurrentUser().lname;
        
        var checkdetailObj = {
          bankName:"",
          branchName:"",
          chequeNo:"",
          chequeDate:"",
          chequeValue:"",
          deductedTds:"",
          attached:false
        };

        $scope.invoice.paymentReceivedDetail = {remainingAmount:$scope.invoice.totalAmount,paymentDetails:[checkdetailObj]};
        $scope.invoice.paymentMadeDetail = {remainingAmount:$scope.invoice.totalAmount,paymentDetails:[checkdetailObj]};

        EnterpriseSvc.setStatus($scope.invoice,EnterpriseValuationStatuses[7]);
        $scope.invoice.uniqueControlNos = [];
        selectedItems.forEach(function(item){
          $scope.invoice.uniqueControlNos.push(item.uniqueControlNo);
        });
        
        $scope.invoice.selectedTaxes = $scope.selectedTax;

        EnterpriseSvc.generateInvoice($scope.invoice)
        .then(function(genInvoice){
           selectedItems.forEach(function(item){
              EnterpriseSvc.setStatus(item,EnterpriseValuationStatuses[7]);
              item.invoiceNo =  genInvoice.invoiceNo;
              item.generateInvoiceDate = true;
              item.invoiceDate =  new Date();
          });
          updateValuationRequest();
        })
        .catch(function(err){
          if(err.data)
            Modal.alert(err.data);
        })
      }

      function updateValuationRequest(){
         EnterpriseSvc.bulkUpdate(selectedItems)
          .then(function(res){
            selectedItems = [];
            vm.selectAllInv = "";
            vm.selectAllReq = "";
            fireCommand(true);
            if($scope.close)
              $scope.close();
          });
      }

      function calculateInvoice(){
        
        switch($scope.invoice.chargeBasis){
          case "flat":
            $scope.invoice.invoiceAmount = $scope.invoice.requestCount*$scope.invoice.serviceFee;
          break;
          case 'percent':
            $scope.invoice.invoiceAmount = $scope.invoice.requestCount*$scope.invoice.serviceFee;
          break;
        }
        var totalTax = 0;
        $scope.selectedTax.forEach(function(item){
          var calAmt = ($scope.invoice.invoiceAmount *item.rate)/100;
          item.calculatedTax = calAmt || 0;
          totalTax = totalTax + (calAmt || 0);
        });
        
        $scope.invoice.totalAmount = ($scope.invoice.invoiceAmount || 0) + (totalTax || 0);
        updateInvoice();
      }

      function getTax(_id){
        $scope.currentTax = null;
         if(!_id)
            return;
        for(var i = 0; i < $scope.serviceTaxes.length; i++){
          if($scope.serviceTaxes[i]._id == _id){
             $scope.currentTax = $scope.serviceTaxes[i];
             break;
          }
        }
      }

      function addTaxToken(srvcTax){
        if(!srvcTax){
          Modal.alert("No master data present for your selection");
          return;
        }
        var filteredArr = [];
        filteredArr = $scope.selectedTax.filter(function(item){
            return item._id == srvcTax._id;
        })
        if(filteredArr.length > 0){
          Modal.alert(srvcTax.type + " is already selected");
          return;
        }

        var taxObj = {
          _id:srvcTax['_id'],
          type : srvcTax['type'],
          rate : srvcTax['taxRate']
        }

        $scope.selectedTax.push(taxObj);
      }

       function deleteTaxToken(idx){
        $scope.selectedTax.splice(idx,1);
      }

      function printInvoice(){
        UtilSvc.compileTemplate(INVOICE_TEMPLATE,{})
        .then(function(htmlStr){
          var newWin = window.open('','Print-Window');
          newWin.document.open();
          newWin.document.write('<html><body onload="window.print()">'+htmlStr+'</body></html>');
          newWin.document.close();
          $timeout(function(){
            newWin.close();
          },10);
        });
      }

      function showDetail(invoiceObj){
         
         var scope = $rootScope.$new();
         scope.invoice = invoiceObj;
         scope.isAdmin = $scope.isAdmin;
         var detailModal = $uibModal.open({
            animation: true,
            templateUrl: "invDetail.html",
            scope: scope,
            size: 'lg'
        });

        scope.close = function () {
          detailModal.dismiss('cancel');
        };
      }

    function exportExcel(){
      var filter = {};
       if(Auth.isEnterprise() || Auth.isEnterpriseUser())
          filter['enterpriseId'] = Auth.getCurrentUser().enterpriseId;
      if(Auth.isValuationPartner())
          filter['agencyId'] = Auth.getCurrentUser().partnerInfo._id;
      if(selectedItems && selectedItems.length > 0){
        var ids = [];
        selectedItems.forEach(function(item){
          ids[ids.length] = item;
        })
        filter['ids'] = ids;
      }

      if(vm.fromDate)
        filter['fromDate'] = encodeURIComponent(vm.fromDate);
      if(vm.toDate)
        filter['toDate'] = encodeURIComponent(vm.toDate);
      filter.type = "invoice";
      filter.role = Auth.getCurrentUser().role;
      var exportObj = {filter:filter};
      exportObj.method = "GET";
      exportObj.action = "api/enterprise/export";
      $scope.$broadcast("submit",exportObj);

      //EnterpriseSvc.exportExcel("invoice",filter);
    }
      //starting point
      Auth.isLoggedInAsync(function(loggedIn){
        if(loggedIn){
            init();
          }else
            $state.go("main")
        })
     
}

})();
