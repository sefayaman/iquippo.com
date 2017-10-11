'use strict';
//  'ngFileUpload'

angular.module('sreizaoApp')
.directive('liveAuctionIntegration', function($document,Auth) {
  return {
      restrict: 'EA',
      templateUrl: 'auction/liveauction.html',
      link: function(scope, element) {

 var bb=""
 var url="http://auctionsoftwaremarketplace.com:3007/chat";
 console.log("scopdeData",scope.auctionId);
//alert("user_id",angular.element(document.querySelector("#au_user_id")));
  //console.log("user_id",angular.element("#au_user_id").val());
  $.ajax({
           type: 'post',
            url: url,
            async : false,
             data : {'userid':scope.userId,'auctionid':scope.auctionId},
            success: function(data) {
              console.log(data);
               bb='<iframe src='+data.url+' width="100%" height="459px" style="border:none;"> ></iframe>';
              $("#sidebar_secondary").html(bb);
            $('#sidebar_secondary').addClass('popup-box-on');
            },
            error: function (http, message, exc) {   
                alert("Something went wrong.");
            }
        });

    $("#removeClass").click(function () {
$('#sidebar_secondary').removeClass('popup-box-on');
  });
      }
    }
});