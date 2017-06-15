(function(){
'use strict';

  angular.module('sreizaoApp').controller('AssetBidPopUpCtrl', AssetBidPopUpCtrl);

 function AssetBidPopUpCtrl($scope,VatTaxSvc){
  var vm=this;
  var query=$scope.params;
  var date=new Date();  

  //functions on scope
  vm.bidAmount=query.bidAmount;
  vm.calculateBid=calculateBid;
 

  function init(){
  	var filter={};
  	filter.taxType="VAT";
  	filter.status=true;
  	var date=new Date();
  	filter.date=date;
  	if(query.group)
  		filter.groupId=query.group;
  	if(query.category)
  		filter.categoryId=query.category;
  	if(query.state)
  		filter.state=query.state;
  	 VatTaxSvc.search(filter)
  	 .then(function(result){
  	 	console.log("vatTax",result);
  	 })
  }

  init();

  function calculateBid(){
   fetchBidsOnProductId(Bids)
  }

 }
}
)();
