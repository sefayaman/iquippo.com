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
          vm.dataModel.bidInfo = [{}];
          vm.checkForLot = checkForLot;
          vm.bidIncrementObj = {};
	  vm.dataModel.staticIncrement = false;        
          function init(){
              getAuctions();
              getLotData();

          }         

          
        $scope.checkBidIncrement = function(checkbox,val){
                if(val == 'static'){
                    if(checkbox == true){
                    vm.dataModel.staticIncrement = true;
                    }else{
                    vm.dataModel.staticIncrement = false;
                    if($scope.isEdit && vm.dataModel.static_increment)
                    deleteDocumentField(vm.dataModel._id,1);
                    }
                }
               if(val == 'bid'){
                   if(checkbox == true){
                    vm.dataModel.rangeIncrement = true;
                    }else{
                    vm.dataModel.rangeIncrement = false;
                    if($scope.isEdit && vm.dataModel.bidInfo[0].bidFrom)
                    deleteDocumentField(vm.dataModel._id,2);
                    }
                }
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
            vm.dataModel.bidIncrement = rowData.bidIncrement;
	    vm.dataModel.static_increment = rowData.static_increment;
            if(vm.dataModel.static_increment){
                vm.dataModel.staticIncrement = true;
            }else{
                vm.dataModel.staticIncrement = false;
            }
            if(vm.dataModel.bidIncrement){
                vm.dataModel.rangeIncrement = true;
            }else{
                vm.dataModel.rangeIncrement = false;
            }            vm.dataModel.bidInfo = [];
            if (vm.dataModel.bidIncrement){
                var range = Object.keys(vm.dataModel.bidIncrement);
               Object.keys(vm.dataModel.bidIncrement).forEach(function(item,index) {
                    var arr = item.split('-');
                    vm.dataModel.bidInfo[index] = {bidFrom:arr[0],bidTo:arr[1],bidIncrement:vm.dataModel.bidIncrement[item]};
                });
            }else{
                vm.dataModel.bidInfo = [{}];
            }
            $scope.isEdit = true;
          }

       function save(form){
              if(form.$invalid){
              $scope.submitted = true;
              return;
              }
              vm.dataModel.createdBy = {};
              vm.dataModel.createdBy = Auth.getCurrentUser().email;
              vm.dataModel.user_Id = Auth.getCurrentUser()._id;

              console.log("Lot data Model",vm.dataModel);
              
               vm.duplicate.auctionId = vm.dataModel.auctionId
               vm.duplicate.assetId = vm.dataModel.assetId;
               vm.duplicate.lot = vm.dataModel.lotNumber;
		/*if(vm.dataModel.rangeIncrement == true){
                    vm.dataModel.bidInfo.forEach(function(item) {
                        var range = item.bidFrom+"-"+item.bidTo;
                        vm.bidIncrementObj[range] = item.bidIncrement;
                        });
                    vm.dataModel.bidIncrement = '';
                    vm.dataModel.bidIncrement = vm.bidIncrementObj;
               }else{
                   delete vm.dataModel.bidIncrement;
               }
               if(vm.dataModel.staticIncrement == true){
                    vm.dataModel.static_increment;
               }else{
                   delete vm.dataModel.static_increment;
               }*/               LotSvc.getData(vm.duplicate).then(function(result){
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
                vm.dataModel.bidInfo.forEach(function(item) {
                 var range = item.bidFrom+"-"+item.bidTo;
                 vm.bidIncrementObj[range] = item.bidIncrement;
                });
                vm.dataModel.bidIncrement = '';
                vm.dataModel.bidIncrement = vm.bidIncrementObj;
                if(vm.dataModel.rangeIncrement == true){
                    vm.dataModel.bidInfo.forEach(function(item) {
                        var range = item.bidFrom+"-"+item.bidTo;
                        vm.bidIncrementObj[range] = item.bidIncrement;
                        });
                    vm.dataModel.bidIncrement = '';
                    vm.dataModel.bidIncrement = vm.bidIncrementObj;
               }else{
                   //delete vm.dataModel.bidIncrement;
                   vm.dataModel.bidIncrement = '';
               }
               if(vm.dataModel.staticIncrement == true){
                    vm.dataModel.static_increment;
               }else{
                   delete vm.dataModel.static_increment;
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
     	function deleteDocumentField(id,flag){
              vm.dataModel.flag = flag;
              Modal.confirm("Are you sure want to delete?",function(ret){
              if(ret == "yes")
             LotSvc.removeLotData(vm.dataModel)
              .then(function(){
              //vm.dataModel = {};
              //$scope.isEdit = false;
             // getLotData();
              Modal.alert('Data updated successfully!');
              if(flag==2){
                  delete vm.dataModel.bidIncrement;
                  delete vm.dataModel.bidInfo;
                  vm.dataModel.bidInfo = [{}];
                }
                if(flag==1){
                  delete vm.dataModel.static_increment;
                }
              })
              .catch(function(err){
              if(err.data)
              Modal.alert(err.data); 
              });
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
            var filter={}
            filter.isDeleted=false;
              LotSvc.getData(filter)
              .then(function(result){
              console.log("result lotData",result);
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
              console.log("auctioss",vm.auctionListing);
              })  
            .catch(function() {});  
            
             }
          }

          
          function checkForLot(lotNumber,auctionId){
            var filter={};
            filter.isDeleted=false;
            filter.lot=lotNumber;
            filter.auctionId=auctionId;
            if(auctionId && lotNumber){
                LotSvc.getData(filter)
                .then(function(res){
                if(res.length >0){
                // $scope.lotCreation=false;
                    $scope.lotDate=true;
                    vm.dataModel.startDate=res[0].startDate;
                    vm.dataModel.endDate=res[0].endDate;
                    //$scope.lot.startingPrice=res[0].startingPrice;
                }
                else{
                    //$scope.lotCreation=true;
                    $scope.lotDate=false;
                    //vm.dataModel.startDate='';
                    //vm.dataModel.endDate='';
                    }
                })
                .catch(function(err){

                });
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
