(function() {
    'use strict';

    angular.module('admin').controller('EmdCtrl', EmdCtrl);

    function EmdCtrl($scope,$state,Modal,Auth,PagerSvc,$filter,LotSvc,AuctionSvc,EmdSvc){
          var vm  = this;
          vm.dataModel = {};
          vm.auctionListing = [];
          vm.save = save;
          $scope.onSelectAuction = onSelectAuction; 
          vm.EmdData = [];
          vm.filteredList = [];
          vm.editClicked = editClicked;
          $scope.isEdit = false;
          vm.update = update;
          vm.destroy = destroy;
          vm.searchFn = searchFn;
          vm.lotList=[];
        
          function init(){
              getAuctions();
              getEmdData();
              //getLotData();

          }         

          function getLotData(filter){
            console.log("filter",filter);
            LotSvc.getData(filter)
            .then(function(res){
            vm.lotList=res;
            });
          }

          
          
          function searchFn(type){
             vm.filteredList = $filter('filter')(vm.EmdData,vm.searchStr);
          }

          function onSelectAuction(data) {
            var filter={};
            filter._id  = data;
            AuctionSvc.getAuctionDateData(filter).then(function(res) {
            vm.auctionname = res.items[0].name;
            getLotData({auctionId:res.items[0].auctionId});
            }).catch(function(err){

            });

          }

          function editClicked(rowData){

            getAuctions();
            vm.dataModel = {};
            vm.dataModel._id  = rowData._id;
            vm.dataModel.auctId = rowData.auctId;
            vm.dataModel.auctName = rowData.auctName;
            vm.dataModel.lotId = rowData.lotId;
            vm.dataModel.amount = rowData.amount;
            $scope.isEdit = true;
          }

          function save(form){
              if(form.$invalid){
              $scope.submitted = true;
              return;
              }
              vm.dataModel.auctName =  vm.auctionname;
              vm.dataModel.createdBy = {};
              vm.dataModel.createdBy._id = Auth.getCurrentUser()._id;
              vm.dataModel.createdBy.name = Auth.getCurrentUser().fname + " " + Auth.getCurrentUser().lname;
              console.log("vm.dataModel",vm.dataModel);
              EmdSvc.saveEmd(vm.dataModel)
              .then(function(){
                vm.dataModel = {};
                getEmdData();
                Modal.alert('Data saved successfully!');
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
              EmdSvc.update(vm.dataModel)
              .then(function(){
              vm.dataModel = {};
              $scope.isEdit = false;
              getEmdData();
              Modal.alert('Data updated successfully!');
              })
              .catch(function(err){
              if(err.data)
              Modal.alert(err.data); 
              });
          }


          function destroy(id){
              Modal.confirm("Are you sure want to delete?",function(ret){
              if(ret == "yes")
              EmdSvc.destroy(id)
              .then(function(){
              getEmdData();
              Modal.alert('Data deleted successfully!');
              })
              .catch(function(err){
              console.log("purpose err",err);
              });
              });
          }
          function getEmdData(){
              EmdSvc.getData()
              .then(function(result){

              vm.EmdData = result;
              vm.filteredList = result;
              console.log(vm.EmdData);
              })
              .catch(function(res){
              });
          }

          function getAuctions() {
              var filter = {};
              filter.auctionType = "upcoming";
              AuctionSvc.getAuctionDateData(filter).then(function(result) {
              getAuctionWiseProductData(result); 

              }).catch(function(err) {

              });
          }


          function getAuctionWiseProductData(result) {  
              var filter = {};      
              var auctionIds = []; 
              if(result && result.items) {     
                result.items.forEach(function(item) { 
                auctionIds[auctionIds.length] = item._id;
              });
              filter.auctionIds = auctionIds; 
    
              AuctionSvc.getAuctionWiseProductData(filter).then(function(data) { 
              $scope.getConcatData = data; 
              vm.auctionListing = result.items;
              })  
            .catch(function() {});  
            
             }
           }

          Auth.isLoggedInAsync(function(loggedIn){
              if(loggedIn){
              init();
              }else
              $state.go("main");
          });
       

    }

})();