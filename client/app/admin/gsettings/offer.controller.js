(function() {
    'use strict';
   angular.module('admin').controller('OfferCtrl',OfferCtrl);

    function OfferCtrl($scope,$state,Modal,Auth,PagerSvc,$filter,categorySvc,SubCategorySvc,LocationSvc,brandSvc,modelSvc,OfferSvc){
        var vm  = this;
        vm.dataModel = {};
        $scope.container = {};
        vm.save = save;
        vm.update = update;
        vm.editClicked = editClicked;
        
        //$scope.onTabChange = onTabChange;
        $scope.onCategoryChange = onCategoryChange;
        $scope.onBrandChange = onBrandChange;
        $scope.isEdit = false;
        var filter = {};
        vm.offer = {};

        $scope.purchase = false;
        $scope.finance = false;
        $scope.Inlease = false;

        function init(){

            categorySvc.getAllCategory()
            .then(function(result) {
              $scope.allCategory = result;
            });
                 
            LocationSvc.getAllState()
            .then(function(result){
              $scope.stateList = result;
      
      
            });

            get();

        }
        
        
        $scope.checkPurchase = function(data){
          //console.log("dvvfv",data);
          if(data ==true){
           $scope.purchase = true;
          }else{
           $scope.purchase = false;
    
          }
        }

          $scope.checkFinance = function(data){
            //console.log("dvvfv",data);
            if(data ==true){
             $scope.finance = true;
            }else{
             $scope.finance = false;
      
            }
    
        } 


        $scope.checkLease = function(data){
          if(data ==true){
           $scope.Inlease = true;
          }else{
           $scope.Inlease = false;
    
          }
  
      } 
        


    function onCategoryChange(categoryId) {
        $scope.brandList = [];
        $scope.modelList = [];

        console.log("scacs",categoryId);
        //$scope.product.technicalInfo = {};
        if (!categoryId)
          return;
        var otherBrand = null;
        filter = {};
        filter['categoryId'] = categoryId._id;
        brandSvc.getBrandOnFilter(filter)
          .then(function(result) {
            $scope.brandList = result;
            console.log("brandlist",result);
  
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

          var cat =JSON.parse($scope.container.selectedCategoryId);
          vm.dataModel.category = {};
          vm.dataModel.category.id = cat._id;
          vm.dataModel.category.name = cat.name; 

          var brand =JSON.parse($scope.container.selectedBrandId);
          vm.dataModel.brand = {};
          vm.dataModel.brand.id = brand._id;
          vm.dataModel.brand.name = brand.name; 


          var model =JSON.parse($scope.container.selectedModelId);
          vm.dataModel.model = {};
          vm.dataModel.model.id = model._id;
          vm.dataModel.model.name = model.name; 

          //vm.dataModel.brandId = $scope.container.selectedBrandId;
          //vm.dataModel.modelId = $scope.container.selectedModelId;
          vm.dataModel.location = $scope.container.location;
          vm.dataModel.cash_purchase =  $scope.purchase;
          vm.dataModel.price = $scope.container.price;
          vm.dataModel.freeofcost = $scope.container.freeofcost;
          vm.dataModel.finance = $scope.finance;
          vm.dataModel.tenure = $scope.container.tenure;
          vm.dataModel.rate = $scope.container.rate;
          vm.dataModel.margin = $scope.container.margin;
          vm.dataModel.processingfee = $scope.container.processingfee;
          vm.dataModel.installment = $scope.container.installment;
          vm.dataModel.freecost = $scope.container.freecost;
          vm.dataModel.lease = $scope.Inlease;
          vm.dataModel.leaseprice = $scope.container.leaseprice;

          vm.dataModel.createdBy = {};
          vm.dataModel.createdBy._id = Auth.getCurrentUser()._id;
          vm.dataModel.createdBy.name = Auth.getCurrentUser().fname + " " + Auth.getCurrentUser().lname;

              
           OfferSvc.save(vm.dataModel)
            .then(function(){
                vm.dataModel = {};
                Modal.alert('Data saved successfully!');
                // getAssetCount();
                get();
            })
            .catch(function(err){
                if(err.data)
                    Modal.alert(err.data); 
              });
            
        }

        function editClicked(rowData){
                      $scope.container = {};
                      $scope.container._id  = rowData._id;
                      $scope.container.selectedCategoryId = rowData.category;
                      $scope.container.selectedBrandId = rowData.brand;
                      $scope.container.selectedModelId = rowData.model;
                      $scope.container.location = rowData.location;
                      $scope.purchase = rowData.cash_purchase;
                      $scope.container.price = rowData.price;
                      $scope.container.freeofcost = rowData.freeofcost;
                      $scope.finance = rowData.finance;
                      $scope.container.tenure = rowData.tenure;
                      $scope.container.rate = rowData.rate;
                      $scope.container.margin = rowData.margin;
                      $scope.container.processingfee = rowData.processingfee;
                      $scope.container.installment = rowData.installment;
                      $scope.container.freecost = rowData.freecostt;
                      $scope.Inlease = rowData.lease;
                      $scope.container.leaseprice = rowData.leaseprice;

                      
                      $scope.isEdit = true;
        }


        function update(form){
          if(form.$invalid){
            $scope.submitted = true;
            return;
            }
            OfferSvc.update(vm.dataModel)
            .then(function(){
            vm.dataModel = {};
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
          OfferSvc.get(vm.dataModel).then(function(result){
              if(result.length>0){
                   vm.offer = result;
                      //angular.copy(result[0], vm.dataModel);
                      //$scope.isEdit = true;
                      //vm._id = result[0]._id;
                      //getCategoryOnFilter





                  }else{
                     // vm.dataModel = {};
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