(function() {
    'use strict';

    angular.module('admin').controller('LotCtrl', LotCtrl);

    function LotCtrl($scope,$state,Modal,Auth,PagerSvc,$filter,AuctionSvc,LotSvc){
          var vm  = this;
          vm.dataModel = {};
          vm.duplicate = {};
          vm.auctionListing = [];
          vm.save = save;
          vm.LotData = [];
          vm.filteredList = [];
          vm.editClicked = editClicked;
          $scope.isEdit = false;
          vm.update = update;
          vm.destroy = destroy;
          vm.searchFn = searchFn;
          vm.checkLot = checkLot;
        
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
            vm.dataModel.auctionId = rowData.auctionId;
            vm.dataModel.assetId = rowData.assetId;
            vm.dataModel.lotNumber = rowData.lotNumber;
            vm.dataModel.assetDesc = rowData.assetDesc;
            vm.dataModel.startingPrice = rowData.startingPrice;
            vm.dataModel.reservePrice = rowData.reservePrice;
            vm.dataModel.startDate = rowData.startDate;
             vm.dataModel.endDate = rowData.endDate;
            $scope.isEdit = true;
          }

       function save(form){
              if(form.$invalid){
              $scope.submitted = true;
              return;
              }
              vm.dataModel.createdBy = {};
              vm.dataModel.createdBy = Auth.getCurrentUser().email;
              vm.dataModel.customerId = Auth.getCurrentUser().customerId;
              
               vm.duplicate.auctionId = vm.dataModel.auctionId
               vm.duplicate.assetId = vm.dataModel.assetId;
               vm.duplicate.lotNumber = vm.dataModel.lotNumber;

               LotSvc.getData(vm.duplicate).then(function(result){
                   vm.filteredduplicate = "exist";

                   if(result!=""){
                       Modal.alert('Data already exist with same auction id , asset id and lot number!');
                       return;
                   }else{
                             LotSvc.saveLot(vm.dataModel).then(function(){
                             vm.dataModel = {};
                             getLotData();
                             Modal.alert('Data saved successfully!');
                             })
                             .catch(function(err){
                            if(err.data)
                             Modal.alert(err.data); 
                            });
                    }
                   
               })
               .catch(function(res){
 
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
              //console.log(vm.LotData);
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

          function checkLot(lotNumber){
            console.log("notno======",lotNumber);
            var filter = {};
            filter.lotNumber = lotNumber;
             LotSvc.getData(filter)
              .then(function(result){
                console.log("re=====",result);
                console.log("length==",result.length);
             if(result.length >0){
             vm.dataModel.checkDate = true;
             }else{
                 vm.dataModel.checkDate = false;
             }
              vm.LotData = result;
              vm.filteredList = result;
              //console.log(vm.LotData);
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