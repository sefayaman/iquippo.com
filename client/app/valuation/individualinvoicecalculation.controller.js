(function(){
'use strict';
angular.module('sreizaoApp').controller('IndividualInvoiceCalculationCtrl',IndividualInvoiceCalculationCtrl);
function IndividualInvoiceCalculationCtrl($scope,$uibModalInstance,Modal,Auth,PaymentSvc, ServiceTaxSvc, ValuationSvc,notificationSvc,LocationSvc,IquippoGSTSvc) {
 	var vm = this;
  $scope.selectedTax = [];
  $scope.currentTax = null;
  $scope.allState = [];

  $scope.generateInvoice = generateInvoice;
  $scope.close = close;

  $scope.invoice = {};
  $scope.getTax = getTax;
  $scope.getCountryWiseState = getCountryWiseState;
  $scope.getStateWiseLocation = getStateWiseLocation;
  $scope.setUserGstin = setUserGstin;
  $scope.setIquippoGstin = setIquippoGstin;
  $scope.removeGSTCalculate = removeGSTCalculate;
  $scope.payTransaction = {};
  $scope.gstPer = 18;
  $scope.gst = 0;

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

      PaymentSvc.getOnFilter({_id:$scope.valuation.transactionId})
      .then(function(result){
        if(result.length == 0){
          Modal.alert("Invalid payment access");
          return;
        }
        $scope.payTransaction = result[0];
        $scope.invoice.invoiceAmount = result[0].totalAmount;
        removeGSTCalculate($scope.invoice.invoiceAmount);
        setModelData();
      })
      .catch(function(err){
      })
 	}

  function removeGSTCalculate(amount) {
    $scope.gst = Number(parseFloat(amount - (amount*(100/(100+$scope.gstPer)))).toFixed(2));
    $scope.invoice.actualInvoiceAmount = Number(parseFloat(amount - Number($scope.gst)).toFixed(2));
  }

  function getTax(taxType){
    if(!taxType)
        return;
    $scope.invoice.gstPer = $scope.gstPer;
    $scope.invoice.gst = $scope.gst || 0;
  }

  function setModelData(){
    $scope.invoice.invoiceInFavour = $scope.user.fname;
    if($scope.user.mname)
      $scope.invoice.invoiceInFavour  += " " + $scope.user.mname;
    $scope.invoice.invoiceInFavour  += " " + $scope.user.lname;
    $scope.invoice.userPanNumber = $scope.user.panNumber;
    $scope.invoice.userAadhaarNumber = $scope.user.aadhaarNumber;
    $scope.invoice.userAddress = $scope.user.address;
    $scope.invoice.userCountry = $scope.user.country;
    $scope.invoice.userState = $scope.user.state;
    $scope.invoice.userCity = $scope.user.city;
    if($scope.iquippoGstList && $scope.iquippoGstList.length){
      $scope.invoice.iquippoGstState = $scope.iquippoGstList[0].state;
      setIquippoGstin($scope.invoice.iquippoGstState);
    }
    setUserGstin($scope.invoice.userState);
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
  if($scope.user && $scope.user.GSTInfo && $scope.user.GSTInfo.length){
    $scope.user.GSTInfo.forEach(function(gstDetail){
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

  function generateInvoice(form){
    /*if((!$scope.selectedTax || $scope.selectedTax.length == 0)){
        Modal.alert("It seems you have not selected any taxes, Please add taxes.");
        return;
    }*/
    if (form && form.$invalid) {
        $scope.submitted = true;
        return;
      }
    calculateValuationInvoice();
  }

  function calculateValuationInvoice() {
    $scope.payTransaction.totalAmount = $scope.invoice.invoiceAmount ;
    PaymentSvc.update($scope.payTransaction);
    updateValuationInvoice();
  }

  function updateValuationInvoice(){
    $scope.invoice.agency = $scope.valuation.valuationAgency;
    $scope.invoice.requestType = $scope.valuation.requestType;
    $scope.invoice.assetCategory = $scope.valuation.product.category;
    
    $scope.invoice.createdBy = {};
    $scope.invoice.createdBy._id = Auth.getCurrentUser()._id;
    $scope.invoice.createdBy.name = Auth.getCurrentUser().fname + " " + Auth.getCurrentUser().lname;
    $scope.invoice.createdBy.customerId = Auth.getCurrentUser().customerId;
    
    $scope.invoice.uniqueControlNo = $scope.valuation.requestId;
    
    $scope.valuation.invoiceData = {};
    $scope.valuation.invoiceData = $scope.invoice;
    $scope.valuation.invoiceDate = $scope.invoice.invoiceDate;
    $scope.invoice.invoiceNo = $scope.valuation.invoiceNo;
    ValuationSvc.update($scope.valuation)
    .then(function(genInvoice){
      ValuationSvc.updateStatus($scope.valuation,IndividualValuationStatuses[4]);
      if($scope.valuation.payOption)
        sendNotification($scope.valuation, IndividualValuationStatuses[4]);
      if($scope.callback)
        $scope.callback(true);
      close();
    })
    .catch(function(err){
      if(err.data)
        Modal.alert(err.data);
    })
  }

  function sendNotification(valData, status) {
    var data = {};
    data['to'] = valData.user.email;
    data['subject'] = 'Please pay for valuation/inspection';
    valData.serverPath = serverPath;
    //valData.payURL = serverPath + "/signin?state=payment&tid=" + valData.transactionId;
    valData.statusName = status;
    notificationSvc.sendNotification('valuationPaymentEmailToCustomer', data, valData,'email');
    data['to'] = valData.user.mobile;
    data['countryCode']=LocationSvc.getCountryCode(valData.user.country);
    notificationSvc.sendNotification('valuationPaymentSmsToCustomer', data, valData,'sms');
  }

  function close(){
    $uibModalInstance.dismiss('cancel');
  }

  init();
     
}

})();
