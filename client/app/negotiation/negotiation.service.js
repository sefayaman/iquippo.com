(function() {
  'use strict';
  angular.module("negotiation").factory("NegotiationSvc", NegotiationSvc);

  function NegotiationSvc($http, $rootScope, $q, Auth, notificationSvc) {

    var negotiateSrv = {};

    var path = 'api/negotiate/';

    negotiateSrv.negotiation = negotiation;

    function mailtemplates(reciever, subject, mailTemplate, dataToSend) {
      var data = {};
      data['to'] = reciever;
      data['subject'] = subject;
      notificationSvc.sendNotification(mailTemplate, data, dataToSend,
        'email');
    }

    function negotiation(dataNegotiate, flag) {
      return $http.post('api/negotiate/', dataNegotiate)
        .then(function(res) {
          dataNegotiate.serverPath = serverPath;
          var subject = "";
          if (flag == "true") {
            subject = 'Offer Received for AssetId -' + ' ' + '"' + dataNegotiate.product.assetId + '"' + ':' + dataNegotiate.product.category.name + ' ' + dataNegotiate.product.brand.name + ' ' + dataNegotiate.product.model.name;
            //mailtemplates(dataNegotiate.product.seller.email, subject, 'Make-offer-seller-email', dataNegotiate);
            mailtemplates(Auth.getCurrentUser().email, subject, 'Make-offer-buyer-email', dataNegotiate);
            //mailtemplates(supportMail, subject, 'Make-offer-admin-email', dataNegotiate);
          } else if (flag == "false") {
            subject = 'Buy Now Request Received for AssetId -' + ' ' + '"' + dataNegotiate.product.assetId + '"' + ':' + dataNegotiate.product.category.name + ' ' + dataNegotiate.product.brand.name + ' ' + dataNegotiate.product.model.name;
            //mailtemplates(dataNegotiate.product.seller.email, subject, 'Buy-now-seller-email', dataNegotiate);
            mailtemplates(Auth.getCurrentUser().email, subject, 'Buy-now-buyer-email', dataNegotiate);
            //mailtemplates(supportMail, subject, 'Buy-now-admin-email', dataNegotiate);
          } else {
            subject = "";
            if ((dataNegotiate.product.tradeType == "RENT") || (dataNegotiate.product.tradeType == "BOTH")) {
              subject = "For Rent";
            }
            mailtemplates(dataNegotiate.product.seller.email, subject, 'for-rent-seller-email', dataNegotiate);
            mailtemplates(Auth.getCurrentUser().email, subject, 'for-rent-buyer-email', dataNegotiate);
            mailtemplates(supportMail, subject, 'for-rent-admin-email', dataNegotiate);
          }
          return res;
        })
        .catch(function(err) {
          return err;
        })
    }

    return negotiateSrv;
  }

})();