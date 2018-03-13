(function(){
'use strict';
angular.module('sreizaoApp').controller('ValuationListingCtrl',ValuationListingCtrl);
function ValuationListingCtrl($scope,$window,$stateParams,$state,$uibModal,Modal,Auth,PagerSvc,userSvc, ValuationSvc,AuctionSvc,UtilSvc,$rootScope,uploadSvc) {
	var vm = this;
	vm.valuations = [];
	var reqSent = [];
	var reqReceived = [];
	var filter = {};
	var initFilter = {};
	$scope.valuationStatuses = valuationStatuses;
	$scope.IndividualValuationStatuses = IndividualValuationStatuses;
	$scope.valType = "sent";
	vm.master = false;
	vm.searchStr = "";
	$scope.pager = PagerSvc.getPager();

	vm.fireCommand = fireCommand;
	vm.openInvoiceModal = openInvoiceModal;
	vm.cancelledHandler = cancelledHandler;
	//vm.onValuationReqTypeChange = onValuationReqTypeChange;
	//vm.updateSelection = updateSelection;
	vm.exportExcel = exportExcel;
	vm.updateStatus = updateStatus;
	//$scope.uploadReport = uploadReport;
	vm.downloadInvoice = downloadInvoice;
	vm.openPaymentModel = openPaymentModel;
	vm.validateAction = ValuationSvc.validateAction;
	var selectedIds = [];
	vm.submitToAgency = submitToAgency;
	vm.openPaymentOptionModel = openPaymentOptionModel;
	vm.openCommentModal = openCommentModal;

	$scope.$on('refreshValuationList',function(){
		fireCommand(true);
	});

	//var mode = "user";

	function init(){
		Auth.isLoggedInAsync(function(loggedIn){
			if(loggedIn){
				filter ={};
		    initFilter.pagination = true;
		    if(!Auth.isAdmin() && !Auth.isValuationPartner()){
		      initFilter['userId'] = Auth.getCurrentUser()._id;
		    }

		    if(Auth.isValuationPartner())
		    	initFilter['partnerId'] = Auth.getCurrentUser().partnerInfo._id;
			
		    angular.copy(initFilter, filter);
		 	getValuations(filter);	
				
			}
		});
	}

	init();

	function downloadInvoice(ivNo){
		openWindow(ValuationSvc.generateInvoice(ivNo));    
	}

	function openWindow(url) {
		$window.open(url);
	}

	function openInvoiceModal(valuation){
		var filter = {};
        filter._id = valuation.user._id;
        filter.status = true;
        userSvc.getUsers(filter).then(function(userData){
	        var invoiceScope = $rootScope.$new();
			invoiceScope.valuation = valuation;
			invoiceScope.user = userData[0];
			invoiceScope.reqType = valuation.requestType;
			invoiceScope.individualValuation = true;
			invoiceScope.callback = fireCommand;
			Modal.openDialog('individualValuationInvoiceCalcuation',invoiceScope);
        })
        .catch(function(err){
          Modal.alert("Error in geting user");
        });
	}

	function openPaymentModel(valuation, openDialog){
		var OfflinePaymentScope = $rootScope.$new();
		OfflinePaymentScope.offlinePayment = valuation.transactionIdRef;
		OfflinePaymentScope.valuation = valuation;
		OfflinePaymentScope.viewMode = openDialog;
		OfflinePaymentScope.iValuationFlag = true;
		OfflinePaymentScope.callback = fireCommand;
		Modal.openDialog('OfflinePaymentPopup',OfflinePaymentScope);
	}

	function openPaymentOptionModel(valuation) {
		var paymentScope = $rootScope.$new();
        paymentScope.tid = valuation.transactionId;
        paymentScope.valuation = valuation;
        paymentScope.offlineOption = true;
        Modal.openDialog('paymentOption',paymentScope);
	}

	function openCommentModal(indValuation, modalType){
        var scope = $rootScope.$new();
        scope.valuationData = indValuation;
        scope.dataModel = {};
        switch (modalType) {
	        case 'onHold':
	            var commentModal = $uibModal.open({
					animation: true,
					templateUrl: "usercomment.html",
					scope: scope,
					size: 'lg'
				});
	            break;
	        case 'info':
	            var infoModal = $uibModal.open({
					animation: true,
					templateUrl: "requestStatus.html",
					scope: scope,
					size: 'lg'
				});
	            break;
        }

        scope.close = function () {
        	if(modalType === 'onHold')
          		commentModal.dismiss('cancel');
          	else
          		infoModal.dismiss('cancel');
        };

        scope.submit = function(form){
          if(form.$invalid){
            scope.submitted = true;
            return;
          }
          indValuation.userComment = scope.dataModel.userComment;
          scope.close();
          $rootScope.loading = true;
          ValuationSvc.resumeRequest(indValuation)
          .then(function(res){
            $rootScope.loading = false;
            fireCommand(true);
          })
          .catch(function(err){
            $rootScope.loading = false;
            if(err.data)
              Modal.alert(err.data);
          });
        }
    }

	function fireCommand(rstPagination){
	 	if (rstPagination)
        	$scope.pager.reset();
	    filter = {};
	    angular.copy(initFilter, filter);
	    if (vm.searchStr)
	        filter.searchStr = vm.searchStr;
	    if(vm.statusType){
	        filter.statusType = vm.statusType;
	    }
	    getValuations(filter);
	 }

	 function getValuations(filter,valType){
	 	$scope.pager.copy(filter);
		ValuationSvc.getOnFilter(filter)
	 	.then(function(result){
	 		vm.valuations = result.items;
	        vm.totalItems = result.totalItems;
	        $scope.pager.update(result.items, result.totalItems);
	 	})
	 	.catch(function(err){
	 	});
	 }

	function exportExcel(){
		var dataToSend ={};
		if(Auth.getCurrentUser()._id && !Auth.isAdmin() && !Auth.isValuationPartner())
			dataToSend["userid"] = Auth.getCurrentUser()._id;
		if(Auth.isValuationPartner())
			dataToSend['partnerId'] = Auth.getCurrentUser().partnerInfo._id;
		// if(!vm.master && selectedIds.length == 0){
		// 	Modal.alert("Please select valuation request to export.");
		// 	return;
		// }
		// if(!vm.master)
		// 	dataToSend['ids'] = selectedIds;
		ValuationSvc.export(dataToSend)
		.then(function(buffData){
		  saveAs(new Blob([s2ab(buffData)],{type:"application/octet-stream"}), "valuations_"+ new Date().getTime() +".xlsx")
		});
	}

  /*function updateSelection(event,id){
  		if(vm.master)
  			vm.master = false;
        var checkbox = event.target;
        var action = checkbox.checked?'add':'remove';
        if(action == 'add' && selectedIds.indexOf(id) == -1)
          selectedIds.push(id)
        if(action == 'remove' && selectedIds.indexOf(id) != -1)
          selectedIds.splice(selectedIds.indexOf(id),1);
    }*/

    function cancelledHandler(valuationReq,toStatus) {
		Modal.confirm("Do you really want to Cancel this Valuation/Inspection Request?",function(ret){
	    if(ret == "yes")
	        proceedToCancel(valuationReq,toStatus);
	    });
    }

    function proceedToCancel(valReq,toStatus){
      $rootScope.loading = true;
      ValuationSvc.cancelIndValuation(valReq)
      .then(function(res){
        $rootScope.loading = false;
        fireCommand(true);
        Modal.alert("Request cancelled succesfully", true);
      })
      .catch(function(err){
        $rootScope.loading = false;
        Modal.alert("There are some issue in request cancellation.Please try again or contact support team.");
      });
    }

    function updateStatus(valuationReq,toStatus,intermediateStatus){
    	if(!toStatus)
    		return;
    	// if(toStatus == 'request_completed' && !valuationReq.report){
    	// 	Modal.alert("Please upload report.");
    	// 	return;
    	// }
    	ValuationSvc.updateStatus(valuationReq,toStatus,intermediateStatus)
    	.then(function(){
    		// if(valuationReq.isAuction)
    		// 	updateAuction(valuationReq,toStatus);

    		ValuationSvc.sendNotification(valuationReq,toStatus,'customer');
    		// if(intermediateStatus)
    		// 	ValuationSvc.sendNotification(valuationReq,toStatus,'valagency');
    	})
    }

    function updateAuction(valuationReq,toStatus){
    	AuctionSvc.getOnFilter({valuationId:valuationReq._id})
		.then(function(result){
			if(result.length > 0){
				var auctReq = result[0];
				auctReq.valuation.status = toStatus;
				AuctionSvc.update(auctReq);
			}
		});
    }

    /*function uploadReport(files,_this){
    	if(!files[0])
	 		return;
	 	var index = parseInt($(_this).data('index'));
	 	var valReq = vm.valuations[index];
	 	if(!valReq)
	 		return;
	 	$rootScope.loading = true;
	 	uploadSvc.upload(files[0],valReq.product.assetDir)
	 	.then(function(result){
	 		valReq.report = result.data.filename;
	 		$rootScope.loading = false;
	    })
	    .catch(function(err){
	    	$rootScope.loading = false;
	    })
	}*/

	function submitToAgency(valuation,type){
        //api integration
        ValuationSvc.submitToAgency(valuation,type)
        .then(function(resList){
          fireCommand(true);    
        })
        .catch(function(err){
          if(err)
            Modal.alert("Error occured in integration");
        }) 
    }
}
})();
