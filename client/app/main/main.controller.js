(function(){

'use strict';
angular.module('sreizaoApp').controller('MainCtrl',MainCtrl);
  
  function MainCtrl($scope, $rootScope, $http,$timeout,productSvc, categorySvc,classifiedSvc,$state, Modal) {
    var vm = this;
    vm.allCategoryList = [];
    vm.myInterval = 5000;
    vm.noWrapSlides = false;
    vm.slides = HOME_BANNER;
    vm.featuredslides = [];
    vm.imgLeftTop = "";
    vm.imgLeftBottom = "";
    vm.imgBottomCentre = "";
    vm.radioModel = 'BUY';
    vm.isCollapsed = true;
    
    vm.doSearch = doSearch;
    vm.getCategoryHelp = getCategoryHelp;

    $scope.ConfigureList = function() {};
    $scope.beginVertScroll = beginVertScroll;

    function getFeaturedProduct(){

      productSvc.getFeaturedProduct().
      then(function(result){
         vm.featuredslides = result;
      })
      .catch(function(res){
        //error handling
      })
      
    }

    function getCategories(){

      categorySvc.getCategoryForMain()
      .then(function(result){
          vm.allCategoryList = result;
      })
      .catch(function(res){
        //error handling
      });

    }

    var flag = true;
    function getActiveClassifiedAd(){
      classifiedSvc.getActiveClassifiedAd()
      .then(function(srchres){
        if(flag == true) {
          for(var i=0 ; i < srchres.length; i++)
          {
            if(srchres[i].position == 'leftTop')
              vm.imgLeftTop = srchres[i].image;
            if(srchres[i].position == 'leftBottom')
              vm.imgLeftBottom = srchres[i].image;
            if(srchres[i].position == 'bottomCentre')
              vm.imgBottomCentre = srchres[i].image;
            flag = false;
          }
        }
      });
    }

    getFeaturedProduct();
    getCategories();
    getActiveClassifiedAd();

    function doSearch(){
      if(!vm.categorySearchText && !vm.locationSearchStr){
        Modal.alert("Please enter category and location");
        return;
      }
      if(!validateCategory()){
        Modal.alert("Please enter valid category");
        return;
      }

      vm.categorySearchText = vm.categorySearchText.trim();
      var filter = {};
      filter['category'] = vm.categorySearchText;
      filter['tradeType'] = vm.radioModel;
      filter['location'] = vm.locationSearchText;
      productSvc.setFilter(filter);
      $state.go('viewproduct');
    }

    function validateCategory(){
      var ret = false;
      for(var i =0; i < vm.allCategoryList.length ; i++){
        if(vm.allCategoryList[i].name == vm.categorySearchText){
          ret  = true;
          break;
        }
      }
      return ret;
    }

    function beginVertScroll() {
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
            beginVertScroll();
          });
          //alert(hgt);
        },
        1000*5
      );
    };


    function getCategoryHelp(val) {
      var serData = {};
      serData['searchStr'] = vm.categorySearchText;
      return categorySvc.getCategoryOnFilter(serData)
      .then(function(result){
         return result.map(function(item){
              return item.name;
        });
      })
    };

    /*function getLocationHelp(val) {
      var serData = {};
      serData['txt'] = $scope.searchFilter.searchText;
      return $http.post('/api/common/gethelp',serData)
      .then(function(response){
        return response.data.map(function(item){
          return item.text;
        });
      });
    };*/
  }
})();
