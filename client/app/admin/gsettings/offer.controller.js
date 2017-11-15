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
        $scope.Addfinance = Addfinance;
        $scope.deleteRow = deleteRow;
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
        

        $scope.purchase = false; 
        $scope.finance = false;
        $scope.lease = false;
        $scope.stateName = [];

        function init(){
            categorySvc.getAllCategory()
            .then(function(result) {
              $scope.allCategory = result;

            });
                 
            LocationSvc.getAllState()
            .then(function(result){
              $scope.stateList = result;
      
             });
             loadAllFinancer();
            get();
            
        }
        function state(){
          if($scope.stateList){
              for(var val of $scope.stateList) {
                  $scope.stateName[val._id] = val.name;
              }
          }
        }
        function loadAllFinancer(){
          var filter = {};
          filter['service'] = 'Finance';  
          vendorSvc.getFilter(filter)
            .then(function(result) {
              $scope.agency = result;
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


        $scope.openForm = function(data){
          
          var financer =JSON.parse(data);
          if(financer.name !=""){
             $scope.openform = true;  
          }else{
              $scope.openform = false;
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

      function deleteRow($event,row){
         var index = $scope.financerinfo.indexOf(row);
         if($event.which == 1)
            $scope.financerinfo.splice(index,1);
         
       }

        $scope.checkLease = function(data){
          if(data ==true){
           $scope.lease = true;
          }else{
           $scope.lease = false;
    
          }
  
      } 
        


    function onCategoryChange(categoryId) {console.log("categoryId",categoryId);
        $scope.brandList = [];
        $scope.modelList = [];

        //$scope.product.technicalInfo = {};
        if (!categoryId)
          return;
        var otherBrand = null;
        filter = {};
        filter['categoryId'] = categoryId._id;
        brandSvc.getBrandOnFilter(filter)
          .then(function(result) {
            $scope.brandList = result;
  
          })
          .catch(function(res) {
            console.log("error in fetching brand", res);
          })
      }
  
      function onBrandChange(brandId) {
       //$scope.product.technicalInfo = {};
        $scope.modelList = [];
        if (!brandId)
          return;
        var otherModel = null;
        filter = {};
        filter['brandId'] = brandId._id;
        modelSvc.getModelOnFilter(filter)
          .then(function(result) {
            $scope.modelList = result;
          })
          .catch(function(res) {
            console.log("error in fetching model", res);
          })
        
      }
  
      function save(form){
         if(form.$invalid){
           
             $scope.submitted = true;
             return;
          }
        
          //category
          vm.dataModel.category = {};
          vm.dataModel.category.id = $scope.container.selectedCategoryId;
          if(vm.dataModel.category.id){
            for(var k in  $scope.allCategory) {
              if($scope.allCategory[k]._id == vm.dataModel.category.id)
             vm.dataModel.category.name = $scope.allCategory[k].name;
            }
          }
        //brand
          vm.dataModel.brand = {};
          vm.dataModel.brand.id = $scope.container.selectedBrandId;
          if(vm.dataModel.brand.id){
            for(var k in  $scope.brandList) {
              if($scope.brandList[k]._id == vm.dataModel.brand.id)
             vm.dataModel.brand.name = $scope.brandList[k].name;
            }
          }
          //model
          vm.dataModel.model = {};
          vm.dataModel.model.id = $scope.container.selectedModelId;
          if(vm.dataModel.model.id){
            for(var k in  $scope.modelList) {
              if($scope.modelList[k]._id == vm.dataModel.model.id)
              vm.dataModel.model.name = $scope.modelList[k].name;
            }
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
                    vm.dataModel.location[i]['name'] = $scope.stateName[id];
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
            vm.fInfo.data = vm.financerinfo[k];
            vm.financeData[k] = vm.fInfo;
           }
           
           vm.dataModel.financeInfo =  vm.financeData;

           for(var k in  vm.leaser) {
             vm.lInfo = {};
             vm.lInfo.data = {};
            vm.lInfo.id = vm.leaser[k];
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
                      $scope.container.selectedCategoryId = rowData.category.id;
                      $scope.container.selectedBrandId = rowData.brand.id;
                      $scope.container.selectedModelId = rowData.model.id;
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
                      
                      onCategoryChange($scope.container.selectedCategoryId);
                      onBrandChange($scope.container.selectedBrandId);
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
           vm.dataModel.category = {};
          vm.dataModel.category.id = $scope.container.selectedCategoryId;
          if(vm.dataModel.category.id){
            for(var k in  $scope.allCategory) {
              if($scope.allCategory[k]._id == vm.dataModel.category.id)
             vm.dataModel.category.name = $scope.allCategory[k].name;
            }
          }
        //brand
          vm.dataModel.brand = {};
          vm.dataModel.brand.id = $scope.container.selectedBrandId;
          if(vm.dataModel.brand.id){
            for(var k in  $scope.brandList) {
              if($scope.brandList[k]._id == vm.dataModel.brand.id)
             vm.dataModel.brand.name = $scope.brandList[k].name;
            }
          }
          //model
          vm.dataModel.model = {};
          vm.dataModel.model.id = $scope.container.selectedModelId;
          if(vm.dataModel.model.id){
            for(var k in  $scope.modelList) {
              if($scope.modelList[k]._id == vm.dataModel.model.id)
              vm.dataModel.model.name = $scope.modelList[k].name;
            }
          }
          //location
          vm.dataModel.location = [];
          var i = 0
          if($scope.container.locationArr){
            for(var id of $scope.container.locationArr) {
              vm.dataModel.location[i] = {};
              vm.dataModel.location[i]['id'] = id;
              vm.dataModel.location[i]['name'] = $scope.stateName[id];
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
            vm.fInfo.data = vm.financerinfo[k];
            vm.financeData[k] = vm.fInfo;
           }
           vm.dataModel.financeInfo =  vm.financeData;
          for(var k in  vm.leaser) {
                  vm.lInfo = {};
                  vm.lInfo.data = {};
                  vm.lInfo.id = vm.leaser[k];
                  console.log("vm.lInfo=",vm.lInfo);
                  //vm.fInfo.name = 'assd';
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


        function get(){
            // vm.auctionListing = result.items;
            OfferSvc.get().then(function(result){
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