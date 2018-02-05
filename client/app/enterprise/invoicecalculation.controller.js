(function(){
'use strict';
angular.module('sreizaoApp').controller('InvoiceCalculationCtrl',InvoiceCalculationCtrl);
function InvoiceCalculationCtrl($scope, $rootScope,$uibModalInstance,Modal,Auth, $state,ServiceTaxSvc,ServiceFeeSvc,notificationSvc, EnterpriseSvc, userSvc,PagerSvc,vendorSvc,UtilSvc,$window,LocationSvc,IquippoGSTSvc) {
 	var vm = this;
  var selectedFee = null;

  $scope.selectedTax = [];
  $scope.currentTax = null;
  $scope.allState = [];

  $scope.generateInvoice = generateInvoice;
  $scope.addTaxToken = addTaxToken;
  $scope.deleteTaxToken = deleteTaxToken;
  $scope.getTax = getTax;
  $scope.close = close;

  $scope.invoice = {};

  $scope.getCountryWiseState = getCountryWiseState;
  $scope.getStateWiseLocation = getStateWiseLocation;
  $scope.setUserGstin = setUserGstin;
  $scope.setIquippoGstin = setIquippoGstin;

 	function init(){
     LocationSvc.getAllState()
      .then(function(result) {
          $scope.allState = result;
      });

      IquippoGSTSvc.get()
      .then(function(result){
        $scope.iquippoGstList = result;
      });

      ServiceTaxSvc.get({current:'y'})
      .then(function(res){
        $scope.serviceTaxes = res;
      });

       var serData = {
        agencyId:$scope.agencyId,
        enterpriseId:$scope.enterpriseId,
        requestType:$scope.reqType,
        current:"y"
      }
      $rootScope.loading = true;
      ServiceFeeSvc.get(serData)
      .then(function(result){
        $rootScope.loading = false;
        if(result.length == 0){
          close();
          Modal.alert('Service fee not found.Please check service fee master data');
          return;
        }
        $scope.invoice.requestCount =$scope.selectedItems.length;
        $scope.invoice.serviceFee = result[0].amount || 0;
        $scope.invoice.invoiceAmount = ($scope.invoice.requestCount || 0)*$scope.invoice.serviceFee;
        $scope.invoice.chargeBasis = result[0].chargeBasis;
        setModelData();
      })
      .catch(function(err){
        $rootScope.loading = false;
        close();
        Modal.alert("Unknown error occured during fetching service fee.Please try again.");
      })
 	}

  function setModelData(){
      $scope.enterprises.forEach(function(ent){
        if(ent.enterpriseId === $scope.enterpriseId && ent.enterprise)
            $scope.enterprise = ent;
      });

      $scope.invoice.invoiceInFavour = $scope.enterprise.fname + " " + $scope.enterprise.mname;
      $scope.invoice.userPanNumber = $scope.enterprise.panNumber;
      $scope.invoice.userAadhaarNumber = $scope.enterprise.aadhaarNumber;
      $scope.invoice.userCountry = $scope.enterprise.country;
      $scope.invoice.userState = $scope.enterprise.state;
      $scope.invoice.userCity = $scope.enterprise.city;
      if($scope.iquippoGstList && $scope.iquippoGstList.length){
        $scope.invoice.iquippoGstState = $scope.iquippoGstList[0].state;
        setIquippoGstin($scope.invoice.iquippoGstState);
      }
      setUserGstin($scope.enterprise.state);
      getCountryWiseState($scope.invoice.userCountry,true);
      getStateWiseLocation($scope.invoice.userState,true);
  }


     function getCountryWiseState(country,noChange) {
        if(!noChange){
          $scope.invoice.userState = ""
          $scope.invoice.userCity = "";
        }
        $scope.cityList = [];
        var filter = {};
        filter.country = country;
        LocationSvc.getStateHelp(filter).then(function(result) {
          $scope.stateList = result;
        });
      }

      function getStateWiseLocation(state,noChange) {
        if(!noChange){
          $scope.invoice.userCity = "";
        }
        var filter = {};
        filter.stateName = state;
        setUserGstin(state);
        LocationSvc.getLocationOnFilter(filter).then(function(result) {
          $scope.cityList = result;
        });
    }

    function setUserGstin(state){
      $scope.invoice.userGstin = "";
      if($scope.enterprise && $scope.enterprise.GSTInfo && $scope.enterprise.GSTInfo.length){
        $scope.enterprise.GSTInfo.forEach(function(gstDetail){
          if(gstDetail.state === state)
            $scope.invoice.userGstin = gstDetail.registrationNo;
        });
      }
    };

    function setIquippoGstin(state){
      $scope.invoice.iquippoGstin = "";
      if($scope.iquippoGstList && $scope.iquippoGstList.length){
        $scope.iquippoGstList.forEach(function(gstDetail){
          if(gstDetail.state === state)
            $scope.invoice.iquippoGstin = gstDetail.gstin;
        });
      }
    };

      function generateInvoice(){

        if(!$scope.selectedTax || $scope.selectedTax.length == 0){
            Modal.alert("It seems you have not selected any taxes, Please add taxes.");
            return;
         }
        calculateInvoice();
      }

      function updateInvoice(){

        $scope.invoice.enterprise = $scope.selectedItems[0].enterprise;
        $scope.invoice.agency = $scope.selectedItems[0].agency;
        $scope.invoice.requestType = $scope.selectedItems[0].requestType;
        if($scope.invoice.requestCount === 1)
          $scope.invoice.assetCategory = $scope.selectedItems[0].assetCategory;
        
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
        $scope.selectedItems.forEach(function(item){
          $scope.invoice.uniqueControlNos.push(item.uniqueControlNo);
        });
        
        $scope.invoice.selectedTaxes = $scope.selectedTax;
        EnterpriseSvc.generateInvoice($scope.invoice)
        .then(function(genInvoice){
           $scope.selectedItems.forEach(function(item){
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
         EnterpriseSvc.bulkUpdate($scope.selectedItems)
          .then(function(res){
            $scope.selectedItems = [];
            vm.selectAllInv = "";
            vm.selectAllReq = "";
            if($scope.callback)
              $scope.callback(true);
            if($scope.close)
              $scope.close();
            Modal.alert("Invoice Generated! Please refer to Invoice Generated tab.");
          });
      }

      function calculateInvoice(){
        
        /*switch($scope.invoice.chargeBasis){
          case "flat":
            $scope.invoice.invoiceAmount = $scope.invoice.requestCount*$scope.invoice.serviceFee;
          break;
          case 'percent':
            $scope.invoice.invoiceAmount = $scope.invoice.requestCount*$scope.invoice.serviceFee;
          break;
        }*/
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

      function close(){
        $uibModalInstance.dismiss('cancel');
      }

      init();
     
}

})();
