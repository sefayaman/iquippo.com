(function() {
    'use strict';
   angular.module('admin').controller('OfferCtrl',OfferCtrl);

    function OfferCtrl($scope,$state,Modal,Auth,PagerSvc,$filter,categorySvc,SubCategorySvc,LocationSvc,brandSvc,modelSvc,OfferSvc,vendorSvc){
        var vm  = this;
        vm.dataModel = {};
        $scope.financerinfo =[{}];
        $scope.container = {};
        vm.save = save;
        vm.update = update;
        vm.editClicked = editClicked;
        vm.financegroupObj = {};
        $scope.onCategoryChange = onCategoryChange;
        $scope.onBrandChange = onBrandChange;
        $scope.onModelChange =onModelChange;
        $scope.Addfinance = Addfinance;
        $scope.changeStatus = changeStatus;
        $scope.getFinanceName = getFinanceName;
        $scope.isEdit = false;
        var filter = {};
        vm.offer = {};
        vm.destroy = destroy;
        vm.purchaseFields = [{}];
        vm.financeFields = [{}];
        vm.financerFields = [{}];
        vm.financerInfoFields = [[{}]];
        vm.leaseFields = [{}];
        vm.leaserFields = [{}];
        vm.leaserInfoFields = [[{}]];
        vm.dataModel.category = {};
        vm.dataModel.brand = {};
        vm.dataModel.model = {};

        $scope.purchase = false; 
        $scope.finance = false;
        $scope.lease = false;
        $scope.stateName = [];

        function init(){
          getCategoryOnFilter();

          LocationSvc.getAllState()
          .then(function(result){
            $scope.stateList = result;
           });
           loadAllFinancer();
          get();
        }

        function getCategoryOnFilter(){
          var filter = {};
          filter.isForNew = true;
          categorySvc.getCategoryOnFilter(filter)
          .then(function(result){
            $scope.allCategory = result;
          })
        }

        function state(id){
          if($scope.stateList){
              for(var val of $scope.stateList) {
                 //$scope.stateName[val._id] = val.name;
                if(val._id === id){
                    return val.name;
                } 
              }
          }
        }
        function loadAllFinancer(){
          var filter = {};
          filter['service'] = 'Finance';  
          vendorSvc.getFilter(filter)
            .then(function(result) {
              $scope.agency = result;
              console.log("$scope.agency",$scope.agency);
          })
        }
        $scope.checkPurchase = function(data){
          if(data ==true){
           $scope.purchase = true;
          }else{
           $scope.purchase = false;
    
          }
        }

        $scope.checkFinance = function(data){
            if(data ==true){
             $scope.finance = true;
            }else{
             $scope.finance = false;
            }
        } 

      $scope.leaseForm = function(data){
          var leaser =JSON.parse(data);
          if(leaser.name !=""){
             $scope.leaseform = true;  
          }else{
              $scope.leaseform = false;
             }
      } 

      function Addfinance(index) {
        if($scope.financerinfo.length <= index+1){
          $scope.financerinfo.splice(index+1,0,{});
        }
      }

      function changeStatus(id,cstatus){
        var data = {};
        data._id = id;
        data.status = cstatus;
        OfferSvc.update(data)
          .then(function(){
              get();
              Modal.alert('Data updated successfully!');
          })
          .catch(function(err){
              if(err.data)
                  Modal.alert(err.data); 
          });
       }

        $scope.checkLease = function(data){
          if(data ==true){
           $scope.lease = true;
          }else{
           $scope.lease = false;
          }
      }

      function onCategoryChange(categoryId, noChange) {
      if (!noChange) {
        vm.dataModel.brand = {};
        vm.dataModel.model = {};
        vm.dataModel.category = {};
        if (categoryId) {
          var ct = categorySvc.getCategoryOnId(categoryId);
          vm.dataModel.category.id = ct._id;
          vm.dataModel.category.name = ct.name;
        } else {
          vm.dataModel.category = {};
        }
        $scope.container.selectedBrandId = "";
        $scope.container.selectedModelId = "";
      }

      $scope.brandList = [];
      $scope.modelList = [];
      if (!categoryId)
        return;
      
      filter = {};
      filter.categoryId = categoryId;
      filter.isForNew = true;
      brandSvc.getBrandOnFilter(filter)
        .then(function(result) {
          $scope.brandList = result;
        })
        .catch(function(res) {
          console.log("error in fetching brand", res);
        })
    }

    function onBrandChange(brandId, noChange) {
      if (!noChange) {
        vm.dataModel.model = {};

        if (brandId) {
          var brd = [];
          brd = $scope.brandList.filter(function(item) {
            return item._id == brandId;
          });
          if (brd.length == 0)
            return;
          vm.dataModel.brand.id = brd[0]._id;
          vm.dataModel.brand.name = brd[0].name;
        } else {
          vm.dataModel.brand = {};
        }
        $scope.container.selectedModelId = "";
      }

      $scope.modelList = [];
      if (!brandId)
        return;
      
      filter = {};
      filter.brandId = brandId;
      filter.isForNew = true;
      modelSvc.getModelOnFilter(filter)
        .then(function(result) {
          $scope.modelList = result;
        })
        .catch(function(res) {
          console.log("error in fetching model", res);
        })

    }
    function onModelChange(modelId, noChange) {
      if (!modelId) {
        vm.dataModel.model = {};
        return;
      }
      var md = null;
      for (var i = 0; i < $scope.modelList.length; i++) {
        if ($scope.modelList[i]._id == modelId) {
          md = $scope.modelList[i];
          break;
        }
      }
      vm.dataModel.model = {};
      if (md) {
        vm.dataModel.model.id = md._id;
        vm.dataModel.model.name = md.name;
      } else
        vm.dataModel.model = {};
    }

      function getFinanceName(id){
        if(id){
            for(var k in  $scope.agency) {
              if($scope.agency[k]._id === id)
              return $scope.agency[k].entityName;
            }
        }
      }
      function save(form){
        if(form.$invalid){
          $scope.submitted = true;
          return;
        }

        vm.financeData = [];
        vm.leaseData = [];
        vm.purchaseData = [];
        vm.fInfo = {};
        vm.lInfo = {};
        vm.pInfo = {};
        vm.fInfo.data = [];
         vm.lInfo.data = [];
         state();
        //vm.dataModel.location = $scope.container.location;
        vm.dataModel.cash_purchase =  $scope.purchase;
        vm.dataModel.finance = $scope.finance;
        vm.dataModel.lease = $scope.lease;
        vm.dataModel.location = [];
        var i = 0
              if($scope.container.locationArr){
                 for(var id of $scope.container.locationArr) {
                  vm.dataModel.location[i] = {};
                  vm.dataModel.location[i]['id'] = id;
                  vm.dataModel.location[i]['name'] = state(id);
                  i++;
                }
              }
              
        for(var k in  vm.purchaseArr) {
          vm.pInfo.price = vm.purchaseArr[k].price;
          vm.pInfo.freeofcost = vm.purchaseArr[k].freeofcost;
          vm.purchaseData[k] = vm.pInfo;
         }
         //vm.dataModel.purchaseData = vm.pInfo;
          vm.dataModel.caseInfo = vm.purchaseData;
          for(var k in  vm.financer) {
           vm.fInfo = {};
           vm.fInfo.data = {};
          vm.fInfo.id = vm.financer[k];
          vm.fInfo.name = getFinanceName(vm.financer[k]);
          vm.fInfo.data = vm.financerinfo[k];
          vm.financeData[k] = vm.fInfo;
         }
         
         vm.dataModel.financeInfo =  vm.financeData;

         for(var k in  vm.leaser) {
           vm.lInfo = {};
           vm.lInfo.data = {};
          vm.lInfo.id = vm.leaser[k];
          vm.lInfo.name = getFinanceName(vm.leaser[k]);
          vm.lInfo.data = vm.leaserinfo[k];
          vm.leaseData[k] = vm.lInfo;
         }
         vm.dataModel.leaseInfo =  vm.leaseData;
         vm.dataModel.createdBy = {};
         vm.dataModel.createdBy._id = Auth.getCurrentUser()._id;
         vm.dataModel.createdBy.name = Auth.getCurrentUser().fname + " " + Auth.getCurrentUser().lname;

        //console.log("final data=============",vm.dataModel);
         OfferSvc.save(vm.dataModel)
          .then(function(){
              vm.dataModel = {};
              Modal.alert('Data saved successfully!');
              get();
          vm.dataModel = {};
          $scope.container ={};
          $scope.financerinfo = {};
          $scope.purchase = {};
          $scope.finance = {};
          $scope.lease = {};
           $scope.purchase = false;
          $scope.finance = false;
          $scope.lease = false;
          $scope.isEdit = false;
          })
          .catch(function(err){
              if(err.data)
                  Modal.alert(err.data); 
            });
        }

        function editClicked(rowData){
          angular.copy(rowData, vm.dataModel);
          vm.financeFields = [{}];
          vm.leaseFields = [{}];
          vm.leaserFields = [{}];
          //vm.leaserInfoFields = [[{}]];
          $scope.financerinfo =[{}];
          vm.dataModel._id = rowData._id;
          $scope.container = {};
          vm.purchaseArr = [];
          vm.purchaseFields = [{}];
          vm.financer = {};
          vm.financerFields = [{}];
          vm.financerInfoFields = [[{}]];
          vm.financerinfo = {};
          vm.leaser = {};
          vm.leaserFields = [{}];
          vm.leaserInfoFields = [[{}]];
          vm.leaserinfo = {};
          $scope.container.locationArr = [];
          $scope.container._id  = rowData._id;
          //$scope.container.location = rowData.location;
          $scope.purchase = rowData.cash_purchase;
          $scope.container.price = rowData.price;
          $scope.finance = rowData.finance;
          //location
          for(var k in  rowData.location) {
           $scope.container.locationArr[k] = rowData.location[k].id;
          }
          //case purchase
          for(var k in  rowData.caseInfo) {
            vm.purchaseArr[k] = rowData.caseInfo[k];
             vm.purchaseFields[k] = {};
          }
          //finance
          for(var k in  rowData.financeInfo) {
            vm.financer[k] = rowData.financeInfo[k].id;
             vm.financerInfoFields[k] = rowData.financeInfo[k].data;
             vm.financerFields[k] = {};
             vm.financerinfo[k] = rowData.financeInfo[k].data;
          }
           //finance
          for(var k in  rowData.leaseInfo) {
            vm.leaser[k] = rowData.leaseInfo[k].id;
             vm.leaserInfoFields[k] = rowData.leaseInfo[k].data;
             vm.leaserFields[k] = {};
             vm.leaserinfo[k] = rowData.leaseInfo[k].data;
          }
          $scope.container.selectedCategoryId = rowData.category.id;
          onCategoryChange(rowData.category.id, true);
          onBrandChange(rowData.brand.id, true);
          $scope.container.selectedBrandId = rowData.brand.id;
          $scope.container.selectedModelId = rowData.model.id;
          /* if($scope.financerinfo.length > 0){
            $scope.openform = true; 
          }*/
          $scope.lease = rowData.lease;
          $scope.isEdit = true;
        }


        function update(form){
          if(form.$invalid){
            $scope.submitted = true;
            return;
          }

          //location
          vm.dataModel.location = [];
          var i = 0
          if($scope.container.locationArr){
            for(var id of $scope.container.locationArr) {
              vm.dataModel.location[i] = {};
              vm.dataModel.location[i]['id'] = id;
              vm.dataModel.location[i]['name'] = state(id);
              i++;
            }
          }
          vm.financeData = [];
          vm.leaseData = [];
          vm.purchaseData = [];
          vm.fInfo = {};
          vm.lInfo = [];
          vm.pInfo = {};
          //vm.fInfo.data = [];
          // vm.lInfo.data = [];
         
         // vm.dataModel.location = $scope.container.location;
          vm.dataModel.cash_purchase =  $scope.purchase;
          vm.dataModel.finance = $scope.finance;
          vm.dataModel.lease = $scope.lease;
          
          for(var k in  vm.purchaseArr) {
            vm.pInfo.price = vm.purchaseArr[k].price;
            vm.pInfo.freeofcost = vm.purchaseArr[k].freeofcost;
            vm.purchaseData[k] = vm.pInfo;
           }
           //vm.dataModel.purchaseData = vm.pInfo;
            vm.dataModel.caseInfo = vm.purchaseData;
            
            for(var k in  vm.financer) {
             vm.fInfo = {};
             vm.fInfo.data = {};
            vm.fInfo.id = vm.financer[k];
            vm.fInfo.name = getFinanceName(vm.financer[k]);
            vm.fInfo.data = vm.financerinfo[k];
            vm.financeData[k] = vm.fInfo;
           }
           vm.dataModel.financeInfo =  vm.financeData;
          for(var k in  vm.leaser) {
                  vm.lInfo = {};
                  vm.lInfo.data = {};
                  vm.lInfo.id = vm.leaser[k];
                  vm.lInfo.name = getFinanceName(vm.leaser[k]);
                  vm.lInfo.data = vm.leaserinfo[k];
                  vm.leaseData[k] = vm.lInfo;
                }
               vm.dataModel.leaseInfo =  vm.leaseData;
           OfferSvc.update(vm.dataModel)
            .then(function(){
            vm.dataModel = {};
            $scope.container ={};
            $scope.financerinfo = {};
            $scope.purchase = {};
            $scope.finance = {};
            $scope.lease = {};
            vm.financeData = [];
            vm.leaseData = [];
            vm.purchaseData = [];
            vm.fInfo = {};
            vm.lInfo = {};
            vm.pInfo = {};
            vm.fInfo.data = [];
            vm.lInfo.data = [];
            $scope.purchase = false;
            $scope.finance = false;
            $scope.lease = false;
            $scope.isEdit = false;
            get();
            Modal.alert('Data updated successfully!');
            })
            .catch(function(err){
            if(err.data)
            Modal.alert(err.data); 
            });

        }


        function get(filter){
            OfferSvc.get(filter).then(function(result){
            if(result.length>0){
                  vm.offer = result;
                }else{
                    $scope.isEdit = false;
                }
            })
            .catch(function(res){
            });
        }
        function destroy(id){
          Modal.confirm("Are you sure want to delete?",function(ret){
                if(ret == "yes"){
                  OfferSvc.destroy(id)
                  .then(function(){
                    get();
                    Modal.alert('Data successfully Deleted!');
                  })
                  .catch(function(err){
                      console.log("purpose err",err);
                  });
                }
                  
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