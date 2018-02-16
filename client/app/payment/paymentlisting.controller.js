(function () {

	'use strict';
	angular.module('sreizaoApp').controller('PaymentListingCtrl', PaymentListingCtrl);

	function PaymentListingCtrl($scope, Modal, Auth, PaymentSvc) {
		var vm = this;
		vm.trasactions = [];
		var filter = {};
		$scope.transactionStatuses = transactionStatuses;

		vm.updateSelection = updateSelection;
		vm.exportExcel = exportExcel;
		var selectedIds = [];

		function init() {
			Auth.isLoggedInAsync(function (loggedIn) {
				if (loggedIn) {
					if (!Auth.isAdmin()) {
						filter['userId'] = Auth.getCurrentUser()._id;
					}
					filter.auction = "Auction Request";
					getTrasactions(filter);
				}
			})
		}

		init();

		function getTrasactions(filterObj) {
			PaymentSvc.getOnFilter(filterObj)
				.then(function (result) {
					vm.transactions = result;
				})
				.catch(function (err) {
					//error handling
				});
		}

		function exportExcel() {
			var dataToSend = {};
			if (Auth.getCurrentUser()._id && Auth.getCurrentUser().role != 'admin')
				dataToSend["userid"] = Auth.getCurrentUser()._id;
			if (!vm.master && selectedIds.length == 0) {
				Modal.alert("Please select valuation request to export.");
				return;
			}
			if (!vm.master)
				dataToSend['ids'] = selectedIds;
			PaymentSvc.export(dataToSend)
				.then(function (buffData) {
					saveAs(new Blob([s2ab(buffData)], { type: "application/octet-stream" }), "payment_" + new Date().getTime() + ".csv")
				});
		}

		function updateSelection(event, id) {
			if (vm.master) {
				vm.master = false;
				selectedIds = [];
			}
			var checkbox = event.target;
			var action = checkbox.checked ? 'add' : 'remove';
			if (action == 'add' && selectedIds.indexOf(id) == -1)
				selectedIds.push(id)
			if (action == 'remove' && selectedIds.indexOf(id) != -1)
				selectedIds.splice(selectedIds.indexOf(id), 1);
		}
	}

})();
