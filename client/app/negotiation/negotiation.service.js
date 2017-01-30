(function(){
 'use strict';
 angular.module("negotiation").factory("NegotiationSvc",NegotiationSvc);

 function NegotiationSvc($http,$rootScope,$q,Auth,notificationSvc){
 
 var negotiateSrv={}; 

 var path = 'api/negotiate/';
  
  negotiateSrv.negotiation=negotiation;

  function negotiation(dataNegotiate,flag){
       return $http.post('api/negotiate/',dataNegotiate)
        .then(function(res){
          dataNegotiate.serverPath=serverPath;
          
          console.log(dataNegotiate);

     if(flag){
      var data = {};
        data['to'] = dataNegotiate.product.seller.email;
        data['subject'] = ' Bid Received for your' +' '+ dataNegotiate.product.brand.name + ' ' + dataNegotiate.product.model.name + ' ' + dataNegotiate.product.category.name + ' ' + '  Asset ID:'+ dataNegotiate.product.assetId;
        notificationSvc.sendNotification('Make-offer-seller-email', data,dataNegotiate,'email');

      var data = {};
        data['to'] = Auth.getCurrentUser().email;
        data['subject'] = ' Bid Received for your' +' '+ dataNegotiate.product.brand.name + ' ' + dataNegotiate.product.model.name + ' ' + dataNegotiate.product.category.name + ' ' + '  Asset ID:'+ dataNegotiate.product.assetId;
        notificationSvc.sendNotification('Make-offer-buyer-email', data,dataNegotiate,'email');
        
      var data = {};  
        data['to'] = supportMail;
        data['subject'] = ' Bid Received for your' +' '+ dataNegotiate.product.brand.name + ' ' + dataNegotiate.product.model.name + ' ' + dataNegotiate.product.category.name + ' ' + '  Asset ID:'+ dataNegotiate.product.assetId;
        notificationSvc.sendNotification('Make-offer-admin-email', data, dataNegotiate,'email');
  }
  else{
    var subject="";
    if((dataNegotiate.product.tradeType == "RENT") || (dataNegotiate.product.tradeType == "BOTH")){
      subject="For Rent";
    }
    else{
      data['subject'] = ' Bid Received for your' +' '+ dataNegotiate.product.brand.name + ' ' + dataNegotiate.product.model.name + ' ' + dataNegotiate.product.category.name + ' ' + '  Asset ID:'+ dataNegotiate.product.assetId;
        }
        var data = {};
        data['to'] = dataNegotiate.product.seller.email;
        data['subject'] = subject;
        notificationSvc.sendNotification('Buy-now-seller-email', data,dataNegotiate,'email');

        var data = {};
        data['to'] = Auth.getCurrentUser().email;
        data['subject'] = subject;
        notificationSvc.sendNotification('Buy-now-buyer-email', data,dataNegotiate,'email');
        
        var data = {};  
        data['to'] = supportMail;
        data['subject'] = subject;
        notificationSvc.sendNotification('Buy-now-admin-email', data, dataNegotiate,'email');
      }
      return res;
    })
   .catch(function(err){
     return err;
        })
      }

return negotiateSrv;
 }

})();

