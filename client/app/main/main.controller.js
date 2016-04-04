'use strict';
angular.module('sreizaoApp')
  .controller('MainCtrl', function($scope, $rootScope, $http, $interval,$timeout, categorySvc, $window, $state, $compile, Modal) {
    $scope.globalCategoryList = [];
    $scope.imageUrl = "";
    $scope.myInterval = 5000;
    $scope.noWrapSlides = false;
    $scope.featuredEnableProduct = [];
    $scope.imgTopLeft = "";
    $scope.imgBottomLeft = "";
    $scope.imgBottomCenter = "";
    var dataToSend = {};
    $scope.slides = [{
      image: 'Banner.jpg'
    }, {
      image: 'Banner1.jpg'
    }, {
      image: 'Banner2.jpg'
    }, {
      image: 'Banner3.jpg'
    }, {
      image: 'Banner4.jpg'
    }];
    
    $rootScope.searchFilter = {};
    $rootScope.equipmentSearchFilter = {};
    $scope.featuredslides = [];
    var dataToSend = {};
    dataToSend["featured"] = true;
    dataToSend["status"] = true;
    $http.post('/api/products/search', dataToSend).success(function(srchres){
        $scope.featuredEnableProduct = srchres;
        $scope.featuredslides = [];
        for(var i=0 ; i < $scope.featuredEnableProduct.length; i++)
        {
          if($scope.featuredEnableProduct[i].images[0].src)
              $scope.featuredslides.push({image:$scope.featuredEnableProduct[i].images[0].src, _id:$scope.featuredEnableProduct[i]._id, name:$scope.featuredEnableProduct[i].name, brand:$scope.featuredEnableProduct[i].brand.name, model:$scope.featuredEnableProduct[i].model.name, mfgYear:$scope.featuredEnableProduct[i].mfgYear,assetDir:$scope.featuredEnableProduct[i].assetDir});
        }
    });

    $scope.setPopover = function(evt){
        var index = $(evt.currentTarget).data('index');
        $scope.popoverData = $scope.featuredslides[index];
    };
    $scope.radioModel = 'Left';
    // $scope.checkModel = {
    //   left: true,
    //   right: false
    // };
    dataToSend["status"] = true; 
    var flag = true;
    $http.post('/api/classifiedad/search', dataToSend).success(function(srchres){
      if(flag == true) {
        for(var i=0 ; i < srchres.length; i++)
        {
          if(srchres[i].position == 'leftTop')
            $scope.imgLeftTop = srchres[i].image;
          if(srchres[i].position == 'leftBottom')
            $scope.imgLeftBottom = srchres[i].image;
          if(srchres[i].position == 'bottomCentre')
            $scope.imgBottomCentre = srchres[i].image;
          flag = false;
        }
      }
    });

$scope.redirectToProduct = function(){
  if($rootScope.getCurrentUser()._id) 
      $state.go('productlisting');
    else
      Modal.alert("Please Login/Register for uploading the products!", true);
};
    $scope.ConfigureList = function() {};
    $scope.beginVertScroll = function() {
      $timeout(
        function() {
          var firstElement = $('ul.verContainer li:first');
          var hgt = firstElement.height() +
            parseInt(firstElement.css("paddingTop"), 10) + parseInt(firstElement.css("paddingBottom"), 10) +
            parseInt(firstElement.css("marginTop"), 10) + parseInt(firstElement.css("marginBottom"), 10);
          var cntnt = firstElement.html();
          if(!cntnt)
            return;
          var HtmlStr = "<li>" + cntnt + "</li>";
          //var contElemFun = $compile(HtmlStr);
          //var prevScope = $rootScope.$new();
          //prevScope.setPopover = $scope.setPopover;
          //prevScope.popoverData = $scope.popoverData;
          $("ul.verContainer").append(HtmlStr);
          cntnt = "";
          firstElement.animate({
            "marginTop": -hgt
          }, 600, function() {
            $scope.itemToremove = $(this);
            $('ul.verContainer li').last().css({
              "background": $(this).css("background"),
              "color": $(this).css("color")
            });
            $(this).remove();
            $scope.beginVertScroll();
          });
          //alert(hgt);
        },
        1000*5
      );
    };

   /* categorySvc.getAllCategory().then(function(response){
    $scope.globalCategoryList = response;
  });*/

    dataToSend["status"] = true;
    $http.post('/api/category/search', dataToSend).success(function(srchres){
         $scope.globalCategoryList = srchres;
   });
  });