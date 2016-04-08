'use strict';
//  'ngFileUpload'

angular.module('sreizaoApp')
.directive('drctv', ["$interval",function($interval){
  return {
    link: function ($scope, $element, $attribute, $interval) {      
     $scope.ConfigureList();      
      $scope.beginVertScroll();      
    }
  };
  
}])
.directive('ngConfirmClick', [
        function(){
            return {
                link: function (scope, element, attr) {
                    var msg = attr.ngConfirmClick || "Are you sure?";
                    var clickAction = attr.confirmedClick;
                    element.bind('click',function (event) {
                        if ( window.confirm(msg) ) {
                            scope.$eval(clickAction)
                        }
                    });
                }
            };
}])
.directive('imageUpload', function (Modal) {
    return {
        scope: true,        //create a new scope
        link: function (scope, el, attrs) {
            el.bind('change', function (event) {
                var files = event.target.files;
                var fr = new FileReader;
                fr.onload = function(ev) {
                    var img = new Image;
                    img.onload = function() {
                        if(attrs.width && attrs.width != img.width){
                              Modal.alert("Image width should be " + attrs.width + "px");
                              return;
                        }  
                         if(attrs.height && attrs.height != img.height){
                             Modal.alert("Image height should be " + attrs.height + "px");
                              return;
                         }
                        var index = 0;
                        if(attrs.index)
                          index = attrs.index;
                        if(files.length == 0)
                          return;
                        scope.$emit("fileSelected", { files: files,img_src:ev.target.result,index:index,type:"image"});
                    };
                    img.src = fr.result;
                };
                fr.readAsDataURL(files[0]);                                    
            });
        }
    };
})
.directive('fileUpload', function (Modal) {
    return {
        scope: true,        //create a new scope
        link: function (scope, el, attrs) {
            el.bind('change', function (event) {
                var files = event.target.files;
                var emitObj = {};
                emitObj.files = files;
                if(attrs.filetype)
                  if(attrs.filetype)
                     emitObj.type = attrs.filetype;
                 if(files.length == 0)
                   return;
                scope.$emit("fileSelected", emitObj);                                   
            });
        }
    };
});
/* .directive('zoom', function(){
    function link(scope, element, attrs){
      var $ = angular.element;
      var original = $(element[0].querySelector('.original'));
      var originalImg = original.find('img');
      var zoomed = $(element[0].querySelector('.zoomed'));
      var zoomedImg = zoomed.find('img');

      var mark = $('<div></div>')
        .addClass('mark')
        .css('position', 'absolute')
        .css('height', scope.markHeight +'px')
        .css('width', scope.markWidth +'px')

      $(element).append(mark);

      element
        .on('mouseenter', function(evt){
          mark.removeClass('hide');

          var offset = calculateOffset(evt);
          moveMark(offset.X, offset.Y);
        })
        .on('mouseleave', function(evt){
          mark.addClass('hide');
        })
        .on('mousemove', function(evt){
          var offset = calculateOffset(evt);
          moveMark(offset.X, offset.Y);
        });

      scope.$on('mark:moved', function(event, data){
        updateZoomed.apply(this, data);
      });

      function moveMark(offsetX, offsetY){
        var dx = scope.markWidth, 
            dy = scope.markHeight, 
            x = offsetX - dx/2, 
            y = offsetY - dy/2;

        mark
          .css('left', x + 'px')
          .css('top',  y + 'px');

        scope.$broadcast('mark:moved', [
          x, y, dx, dy, originalImg[0].height, originalImg[0].width
        ]);
      }

      function updateZoomed(originalX, originalY, originalDx, originalDy, originalHeight, originalWidth){
        var zoomLvl = scope.zoomLvl;
        scope.$apply(function(){
          zoomed
            .css('height', zoomLvl*originalDy+'px')
            .css('width', zoomLvl*originalDx+'px');
          zoomedImg
            .attr('src', scope.src)
            .css('height', zoomLvl*originalHeight+'px')
            .css('width', zoomLvl*originalWidth+'px')
            .css('left',-zoomLvl*originalX +'px')
            .css('top',-zoomLvl*originalY +'px');
        });
      }

      var rect;
      function calculateOffset(mouseEvent){
        rect = rect || mouseEvent.target.getBoundingClientRect();
        var offsetX = mouseEvent.clientX - rect.left;
        var offsetY = mouseEvent.clientY - rect.top;  

        return { 
          X: offsetX, 
          Y: offsetY
        }
      }

      attrs.$observe('ngSrc', function(data) {
        scope.src = attrs.ngSrc;
      }, true);


      attrs.$observe('zoomLvl', function(data) {
        scope.zoomLvl =  data;;
      }, true);
    }

    return {
      restrict: 'EA',
      scope: {
        markHeight: '@markHeight',
        markWidth: '@markWidth',
        src: '@src', 
        zoomLvl: "@zoomLvl"
      },
      template: [
        '<div class="original">',
          '<img ng-src="{{src}}"/>',
        '</div>',
        '<div class="right-box">',
        '<div class="zoomed">',
          '<img/>',
        '</div>',
        '</div>'
      ].join(''),
      link: link
    };
  });
  */