(function() {
  'use strict';
  angular.module('sreizaoApp').controller('BulkOrderCtrl',BulkOrderCtrl);

  function BulkOrderCtrl($scope,$rootScope,Auth,NewEquipmentSvc,categorySvc,brandSvc,modelSvc, Modal,LocationSvc) {
        var vm = this;
        vm.dataModel = {orders:[{quantity:1}]};
        vm.dataModel.forSelf = true;
        vm.save = save;
        vm.onCategoryChange = onCategoryChange;
        vm.onBrandChange = onBrandChange;
        vm.onCountryChange = onCountryChange;
        vm.onStateChange = onStateChange;
        vm.setUserData = setUserData;
        vm.setQuantity = setQuantity;

        function init(){
            categorySvc.getCategoryOnFilter({isForNew:true})
            .then(function(catList){
                 $scope.categoryList = catList;
             });
            if(vm.dataModel.forSelf && Auth.getCurrentUser()._id){
                setUserData();
            }

        }

        function setQuantity(order,type){
            if( type == 'inc')
                order.quantity += 1;
            if(type == 'dec'){
                if(order.quantity <= 1)
                    return;
                order.quantity -= 1;
            }
        }

        function setUserData(){

            vm.dataModel.name = "";
            vm.dataModel.mobile = "";
            vm.dataModel.email = "";
            vm.dataModel.country = "";
            vm.dataModel.city = "";
            vm.dataModel.state = "";
            vm.dataModel.state = "";
            vm.dataModel.city = "";
            if(!vm.dataModel.forSelf)
                return;
            vm.dataModel.name = Auth.getCurrentUser().fname + " " + Auth.getCurrentUser().lname;
            vm.dataModel.mobile = Auth.getCurrentUser().mobile;
            vm.dataModel.email = Auth.getCurrentUser().email;
            vm.dataModel.country = Auth.getCurrentUser().country;
            vm.dataModel.state = Auth.getCurrentUser().state;
            vm.dataModel.city = Auth.getCurrentUser().city;
            onCountryChange(vm.dataModel.country,true);
            onStateChange(vm.dataModel.state,true);
        }

        function onCountryChange(country,noReset){
            if(!noReset){
                vm.dataModel.state = "";
                vm.dataModel.city = "";
            }
            
            $scope.cityList = [];
            $scope.stateList = [];
            var filter = {};
            filter.country = country;
            if(!country)
                return;
            LocationSvc.getStateHelp(filter).then(function(result) {
                $scope.stateList = result;
            });
            vm.dataModel.countryCode = LocationSvc.getCountryCode(country);
        }

        function onStateChange(state,noReset){
            if(!noReset)
               vm.dataModel.city = "";
            var filter = {};
            $scope.cityList = [];
            filter.stateName = state;
            if(!state)
                return;
            LocationSvc.getLocationOnFilter(filter).then(function(result) {
                $scope.cityList = result;
            });
        }

        function onCategoryChange(order){
            order.brand = "";
            order.model = "";
            order.brandList = [];
            order.modelList = [];
            if(!order.category)
                return;
            var filter = {isForNew:true};
            filter['categoryName'] = order.category;
            brandSvc.getBrandOnFilter(filter)
            .then(function(result) {
                order.brandList = result;
            })
        }

         function onBrandChange(order){
            order.model = "";
            order.modelList = [];
           var filter = {isForNew:true};
           if(!order.brand)
            return;
          filter['brandName'] = order.brand;
          modelSvc.getModelOnFilter(filter)
            .then(function(result) {
              order.modelList = result;
            })
        }

        function save(form){
            if(form.$invalid){
                $scope.submitted = true;
                return;
            }
            
            vm.dataModel.user = {
                name:Auth.getCurrentUser().fname + " " + Auth.getCurrentUser().lname,
                mobile:Auth.getCurrentUser().mobile,
                email:Auth.getCurrentUser().email,
                role:Auth.getCurrentUser().role,
            };
            
            vm.dataModel.orders.forEach(function(item,index){
                delete item.brandList;
                delete item.modelList;
                if(!item.category || !item.brand || !item.model)
                    vm.dataModel.orders.splice(index,1);
            });

            if(!vm.dataModel.orders.length)
                return;
             $rootScope.loading = true;
            NewEquipmentSvc.saveNewBulkOrder(vm.dataModel)
            .then(function(res){
                $scope.submitted = false;
                $rootScope.loading = false;
                vm.dataModel.orders =[{quantity:1}];

                Modal.alert("Your bulk request ID - "+ res.orderId +" is submitted successfully. One of our executives will get in touch with you");
            })
            .catch(function(err){
                $rootScope.loading = false;
                Modal.alert()
            })
        }

        //Entry point
        Auth.isLoggedInAsync(function(isLoggedIn){
            if(isLoggedIn)
                init();
            else
                Auth.goToLogin();
        });

    } 
})();