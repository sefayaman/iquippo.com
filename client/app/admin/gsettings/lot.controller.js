(function() {
    'use strict';

    angular.module('admin').controller('LotCtrl', LotCtrl);

    function LotCtrl($scope,$state,Modal,Auth,PagerSvc,$filter,AuctionSvc,LotSvc){
          var vm  = this;
          vm.dataModel = {};
          vm.auctionListing = [];
          vm.save = save;
          vm.LotData = [];
          vm.filteredList = [];
          vm.editClicked = editClicked;
          $scope.isEdit = false;
          vm.update = update;
          vm.destroy = destroy;
          vm.searchFn = searchFn;
        
          function init(){
              getAuctions();
              getLotData();

          }         

          
          
          function searchFn(type){
             vm.filteredList = $filter('filter')(vm.LotData,vm.searchStr);
          }

        

          function editClicked(rowData){

            getAuctions();
            vm.dataModel = {};
            vm.dataModel._id  = rowData._id;
            vm.dataModel.auctId = rowData.auctId;
            vm.dataModel.assetId = rowData.assetId;
            vm.dataModel.lotId = rowData.lotId;
            vm.dataModel.assetDesc = rowData.assetDesc;
            vm.dataModel.startPrice = rowData.startPrice;
            vm.dataModel.ReservePrice = rowData.ReservePrice;
            vm.dataModel.lastMintBid = rowData.lastMintBid;
             vm.dataModel.extendedTo = rowData.extendedTo;
            $scope.isEdit = true;
          }

       function save(form){
              if(form.$invalid){
              $scope.submitted = true;
              return;
              }
              vm.dataModel.createdBy = {};
              vm.dataModel.createdBy = Auth.getCurrentUser().email;

              LotSvc.saveLot(vm.dataModel)
              .then(function(){
                vm.dataModel = {};
                getLotData();
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
              LotSvc.update(vm.dataModel)
              .then(function(){
              vm.dataModel = {};
              $scope.isEdit = false;
              getLotData();
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
              LotSvc.destroy(id)
              .then(function(){
              getLotData();
              Modal.alert('Data deleted successfully!');
              })
              .catch(function(err){
              console.log("purpose err",err);
              });
              });
          } 


          function getLotData(){

              LotSvc.getData()
              .then(function(result){

              vm.LotData = result;
              vm.filteredList = result;
              console.log(vm.LotData);
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