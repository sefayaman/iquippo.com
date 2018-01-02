(function() {
    'use strict';
   angular.module('admin').controller('OfferCtrl',OfferCtrl);

    function OfferCtrl($scope,$state,Modal,Auth,PagerSvc,$filter,categorySvc,SubCategorySvc,LocationSvc,brandSvc,modelSvc,OfferSvc,vendorSvc){
        var vm  = this;
        vm.dataModel = {};
        $scope.pager = PagerSvc.getPager();
        vm.save = save;
        vm.update = update;
        vm.editClicked = editClicked;
        vm.fireCommand = fireCommand;
        vm.exportExcel = OfferSvc.exportExcel;
        vm.financegroupObj = {};
        $scope.onCategoryChange = onCategoryChange;
        $scope.onBrandChange = onBrandChange;
        $scope.changeStatus = changeStatus;
        $scope.onCountryChange = onCountryChange;
        $scope.isEdit = false;
        vm.destroy = destroy;
        function init(){
          loadAllcategory();
          initModel();
           loadAllFinancer();
          get({});
        }

        function loadAllcategory(){
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
                if(val._id === id){
                    return val.name;
                } 
              }
          }

          return null;
        }

        function country(id){
          if(!id)
            return null;
          for(var i =0; i < $scope.stateList.length;i++) {
            if($scope.stateList[i]._id === id){
                return $scope.stateList[i].country;
            } 
          }
          return null;
        }

        function loadAllFinancer(){
          var filter = {};
          filter['service'] = 'Finance';  
          vendorSvc.getFilter(filter)
            .then(function(result) {
              $scope.agency = result;
          })
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

      function onCountryChange(country,noChange){
        if(!noChange){
          vm.dataModel.locationArr = [];
        }
        $scope.stateList = [];
        if(!country)
          return;
        var filter = {};
        filter.country = country;
        LocationSvc.getStateHelp(filter).then(function(result){
            $scope.stateList = result;
        });
      }

      function onCategoryChange(categoryId, noChange) {
        if (!noChange) {
          vm.dataModel.brand = {};
          vm.dataModel.model = {};
        }

        $scope.brandList = [];
        $scope.modelList = [];
        if (!categoryId)
          return;
        
        var filter = {};
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
      }

      $scope.modelList = [];
      if (!brandId)
        return;
      
      var filter = {};
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
        prepareDataForSave();
         OfferSvc.save(vm.dataModel)
          .then(function(){
              initModel();
              Modal.alert('Data saved successfully!');
             fireCommand(true);
            $scope.isEdit = false;
          })
          .catch(function(err){
              if(err.data)
                  Modal.alert(err.data); 
            });
        }

        function editClicked(rowData){

          angular.copy(rowData, vm.dataModel);
          onCategoryChange(vm.dataModel.category.id,true);
          onBrandChange(vm.dataModel.brand.id,true);
          onCountryChange(vm.dataModel.country || 'India',true);
          vm.dataModel.locationArr = [];
          vm.dataModel.location.forEach(function(location){
            vm.dataModel.locationArr.push(location.id);
          });

          if(vm.dataModel.financeInfo && vm.dataModel.financeInfo.length){
            vm.dataModel.financeInfo.forEach(function(item){
              item.dataArr = Object.keys(item.data).map(function(key) { 
                return item.data[key];
              });
            });
          }else
            vm.dataModel.financeInfo = [{dataArr:[{}]}];


           if(vm.dataModel.leaseInfo && vm.dataModel.leaseInfo.length){
            vm.dataModel.leaseInfo.forEach(function(item){
              item.dataArr = Object.keys(item.data).map(function(key) { 
                return item.data[key];
              });
            });
          }else
             vm.dataModel.leaseInfo =  [{dataArr:[{}]}];

          if(!vm.dataModel.caseInfo || !vm.dataModel.caseInfo.length)
            vm.dataModel.caseInfo = [{}];
          $scope.isEdit = true;
        }


        function update(form){
          if(form.$invalid){
            $scope.submitted = true;
            return;
          }
          prepareDataForSave();
           OfferSvc.update(vm.dataModel)
            .then(function(){
              initModel();
              $scope.isEdit = false;
              fireCommand(true);
              Modal.alert('Data updated successfully!');
            })
            .catch(function(err){
              if(err.data)
              Modal.alert(err.data); 
            });

        }

         function fireCommand(reset){
              if (reset)
                  $scope.pager.reset();
              var filter = {};
              if (vm.searchStr)
                  filter.searchStr = vm.searchStr;
              get(filter);
          }

        function get(filter){
            $scope.pager.copy(filter);
            filter.pagination = true;
            OfferSvc.get(filter).then(function(result){
              vm.offerList = result.items;
              $scope.pager.update(result.items,result.totalItems);
            })
            .catch(function(res){
              vm.offerList =  []
            });
        }

        function destroy(id){
          Modal.confirm("Are you sure want to delete?",function(ret){
                if(ret == "yes"){
                  OfferSvc.destroy(id)
                  .then(function(){
                    fireCommand(true);
                    Modal.alert('Data successfully Deleted!');
                  })
                  .catch(function(err){
                      console.log("purpose err",err);
                  });
                }
                  
            });
        }

        function prepareDataForSave(){
          var ct = categorySvc.getCategoryOnId(vm.dataModel.category.id);
          vm.dataModel.category.name = ct.name;
          $scope.brandList.forEach(function(brand){
            if(brand._id === vm.dataModel.brand.id)
              vm.dataModel.brand.name = brand.name;
          });
          $scope.modelList.forEach(function(model){
            if(model._id === vm.dataModel.model.id)
              vm.dataModel.model.name = model.name;
          });
         var locationArr = vm.dataModel.locationArr;
         delete vm.dataModel.locationArr;
          vm.dataModel.location = [];
          if(locationArr && locationArr.length){
            locationArr.forEach(function(id){
              var location = {};
              location.id = id;
              location.name = state(id);
              if(vm.dataModel.country == country(id))
                vm.dataModel.location.push(location);
            });
          }
          var leaseInfo = vm.dataModel.leaseInfo;
          vm.dataModel.leaseInfo = leaseInfo.filter(function(lease){
            if(!lease.id)
              return false;
            var dataArr = lease.dataArr;
            lease.data = {};
            delete lease.dataArr;
            lease.name = getFinanceName(lease.id);
            if(!dataArr || !dataArr.length)
              return true;
            dataArr.forEach(function(dt,idx){
              lease.data[idx] = dt;
            });
            return true;
          });
          var financeInfo = vm.dataModel.financeInfo;
           vm.dataModel.financeInfo = financeInfo.filter(function(finance){
            if(!finance.id)
              return false;
            var dataArr = finance.dataArr;
            finance.data = {};
            delete finance.dataArr;

            finance.name = getFinanceName(finance.id);
            if(!dataArr || !dataArr.length)
              return true;
            dataArr.forEach(function(dt,idx){
              finance.data[idx] = dt;
            });
            return true;
          });
         if(vm.dataModel.location.length === $scope.stateList.length)
            vm.dataModel.forAll = true;
          else
            vm.dataModel.forAll = false;
        }

        function initModel(model){
          vm.dataModel = {};
          vm.dataModel.category = {};
          vm.dataModel.brand = {};
          vm.dataModel.model = {};
          vm.dataModel.leaseInfo =  [{dataArr:[{}]}];
          vm.dataModel.caseInfo = [{}];
          vm.dataModel.financeInfo = [{dataArr:[{}]}];
          vm.dataModel.locationArr = [];
          $scope.stateList = [];
          vm.dataModel.country = 'India';
          onCountryChange(vm.dataModel.country,true);
        }

        Auth.isLoggedInAsync(function(loggedIn){
          if(loggedIn){
              init();
            }else
              $state.go("main");
        });

    }

})();