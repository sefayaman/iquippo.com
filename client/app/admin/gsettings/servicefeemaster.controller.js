(function() {
    'use strict';

    angular.module('admin').controller('ServiceFeeMasterCtrl', ServiceFeeMasterCtrl);

    function ServiceFeeMasterCtrl($scope,$window,Modal,Auth,PagerSvc,$filter,ServiceFeeSvc,userSvc,vendorSvc){
    	
    	var vm  = this;
        vm.serviceList = [
                            {
                                name:"Valuation"
                            },
                            {
                                name:"Inspection"
                            },
                            {
                                name : "GPS Installation"
                            },
                            {
                                name:"Photographs Only"
                            }
                        ];
        vm.dataModel = {};
        vm.dataModel.agency = {};
        vm.dataList = [];
        vm.filteredList = [];
        $scope.edit = false;
        $scope.pager = PagerSvc.getPager();

        vm.save = save;
        vm.update = update;
        vm.destroy = destroy;
        vm.editClicked = editClicked;
        vm.searchFn = searchFn;
        vm.getPartners = getPartners;

        function init(){
            var filter = {};
            filter.role = "enterprise";
            filter.enterprise = true;
            filter.status = true;
            userSvc.getUsers(filter).then(function(data){
                vm.enterprises = data;
            });
             vendorSvc.getAllVendors();
        }

        function loadViewData(){
            ServiceFeeSvc.get()
            .then(function(result){
                vm.dataList = result;
                vm.filteredList = result;
                $scope.pager.update(null,vm.filteredList.length,1);
            });

        }


        function searchFn(type){
            vm.filteredList = $filter('filter')(vm.dataList,vm.searchStr);
            $scope.pager.update(null,vm.filteredList.length,1);
        }

        function getPartners(code){
            vm.agencies = [];
            if(!code)
                return;
            vm.agencies = vendorSvc.getVendorsOnCode(code);
        }

        function save(form){
            if(form.$invalid){
                $scope.submitted = true;
                return;
            }
            vm.dataModel.createdBy = {};
            vm.dataModel.createdBy._id = Auth.getCurrentUser()._id;
            vm.dataModel.createdBy.name = Auth.getCurrentUser().fname + " " + Auth.getCurrentUser().lname;
            
            vm.agencies.forEach(function(item){
                if(item._id == vm.dataModel.agency._id){
                    vm.dataModel.agency.name = item.name;
                    vm.dataModel.agency.partnerId = item.partnerId;

                }
            });

            vm.enterprises.forEach(function(item){
                if(item.enterpriseId == vm.dataModel.enterpriseId){
                    vm.dataModel.enterpriseName = item.fname  + " " + item.lname;
                }
            });

            ServiceFeeSvc.save(vm.dataModel)
            .then(function(){
                vm.dataModel = {};
                vm.dataModel.agency = {};
                loadViewData();
                Modal.alert('Data saved successfully!');
            })
            .catch(function(err){
               if(err.data)
                    Modal.alert(err.data); 
            })
        }

        function editClicked(rowData){
            $window.scrollTo(0, 0);
            vm.dataModel = angular.copy(rowData);
            if (vm.dataModel.effectiveFromDate)
                vm.dataModel.effectiveFromDate = moment(vm.dataModel.effectiveFromDate).format('MM/DD/YYYY');

            if (vm.dataModel.effectiveToDate)
                vm.dataModel.effectiveToDate = moment(vm.dataModel.effectiveToDate).format('MM/DD/YYYY');
            $scope.edit = true;
            vendorSvc.getAllVendors()
            .then(function(){
                  vm.agencies = vendorSvc.getVendorsOnCode(rowData.serviceType);
            })
        }

          function update(form){
            if(form.$invalid){
                $scope.submitted = true;
                return;
            }

              vm.agencies.forEach(function(item){
                if(item._id == vm.dataModel.agency._id){
                    vm.dataModel.agency.name = item.name;
                    vm.dataModel.agency.partnerId = item.partnerId;

                }
            });

            vm.enterprises.forEach(function(item){
                if(item.enterpriseId == vm.dataModel.enterpriseId){
                    vm.dataModel.enterpriseName = item.fname  + " " + (item.mname || "") + " " + item.lname;
                }
            });

            ServiceFeeSvc.update(vm.dataModel)
            .then(function(){
                $scope.edit = false;
                 vm.dataModel = {};
                vm.dataModel.agency = {};
                loadViewData();
                Modal.alert('Data updated successfully!');
            })
            .catch(function(err){
               if(err.data)
                    Modal.alert(err.data); 
            })
        }

        function destroy(id){
          Modal.confirm("Are you sure want to delete?",function(ret){
            if(ret == "yes")
                confirmDestory(id);
            });
        }

        function confirmDestory(id){
            ServiceFeeSvc.destroy(id)
            .then(function(){
                loadViewData();
            })
             .catch(function(err){
                console.log("purpose err",err);
            })
        }

        loadViewData();
        init();

    }

})();