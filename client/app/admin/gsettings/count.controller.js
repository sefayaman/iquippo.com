(function() {
    'use strict';

    angular.module('admin').controller('CountCtrl', CountCtrl);

    function CountCtrl($scope,$state,Modal,Auth,PagerSvc,$filter,CountSvc,ManpowerSvc,productSvc,spareSvc){
        var vm  = this;
        vm.dataModel = {};
        vm.productCountObj = {};
        vm.spareCountObj = {};
        vm.manPowerCountObj = {};
        vm.save = save;
        vm.update = update;
        vm.tabValue = 'assetlisted';
        
        $scope.onTabChange = onTabChange;
        $scope.isEdit = false;

        function init(){
              getStatusWiseProductCount();
              getAssetCount();    
        } 
        
       function onTabChange(tabs) {
			switch (tabs) {
				case 'assetlisted':
					getStatusWiseProductCount();
                    getAssetCount(); 
					break;
				case 'assetsold':
					getStatusWiseProductCount();
                    getAssetCount(); 
                    break;
                    
               case 'sparelist':
					getStatusWiseSpareCount();
                    getAssetCount(); 
                    break;
               case 'manpower':
					getStatusWiseManPowerCount();
                    getAssetCount(); 
					break;
			}
		}


         function getStatusWiseProductCount(){
             productSvc.statusWiseCount()
              .then(function(result){
                    
               vm.productCountObj = result;
                 })
                .catch(function(res){
                });

          }
         function getStatusWiseSpareCount(){
             spareSvc.getStatusWiseSpareCount()
              .then(function(result){
               vm.spareCountObj = result;
            })
            .catch(function(res){
          });

          }
          function getStatusWiseManPowerCount(){
            ManpowerSvc.getStatusWiseCount()
             .then(function(result){
               vm.manPowerCountObj = result;
         
            })
          .catch(function(res){

          });

          }
           function save(form){
                if(form.$invalid){
                        $scope.submitted = true;
                        return;
                    }

                    vm.dataModel.key = vm.tabValue;

                    vm.dataModel.createdBy = {};
                    vm.dataModel.createdBy._id = Auth.getCurrentUser()._id;
                    vm.dataModel.createdBy.name = Auth.getCurrentUser().fname + " " + Auth.getCurrentUser().lname;

                    
                    CountSvc.saveassetlisted(vm.dataModel)
                    .then(function(){
                        vm.dataModel = {};
                        Modal.alert('Data saved successfully!');
                        getAssetCount();
                    })
                    .catch(function(err){
                    if(err.data)
                            Modal.alert(err.data); 
                    });
                
                }

         function update(form){
            if(form.$invalid){
                $scope.submitted = true;
                return;
            }
            CountSvc.updateassetlisted(vm.dataModel)
            .then(function(){
                 vm.dataModel = {};
                Modal.alert('Data updated successfully!');
                $scope.isEdit = false;
                getAssetCount();
            })
            .catch(function(err){
                if(err.data)
                    Modal.alert(err.data); 
            });
        }

        function getAssetCount(){
                vm.dataModel.counttype = vm.tabValue;
            
            CountSvc.getData(vm.dataModel)
            .then(function(result){
                if(result.length>0){
                        angular.copy(result[0], vm.dataModel);
                        $scope.isEdit = true;
                        vm._id = result[0]._id;
                    }else{
                    vm.dataModel = {};
                    $scope.isEdit = false;
                    }
                
        })
        .catch(function(res){
        });

        }

        Auth.isLoggedInAsync(function(loggedIn){
          if(loggedIn){
              init();
            }else
              $state.go("main");
        });

    }

})();