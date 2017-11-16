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
.directive('stringToNumber', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ngModel) {
      ngModel.$parsers.push(function(value) {
        return '' + value;
      });
      ngModel.$formatters.push(function(value) {
        return parseFloat(value, 10);
      });
    }
  };
})
.directive('validPasswordC', function() {
  return {
    require: 'ngModel',
    scope: {

      reference: '=validPasswordC'

    },
    link: function(scope, elm, attrs, ctrl) {
      ctrl.$parsers.unshift(function(viewValue, $scope) {

        var noMatch = viewValue != scope.reference
        ctrl.$setValidity('noMatch', !noMatch);
        return (noMatch)?noMatch:!noMatch;
      });

      scope.$watch("reference", function(value) {;
        ctrl.$setValidity('noMatch', value === ctrl.$viewValue);

      });
    }
  }
})
.directive('format', ['$filter', function ($filter) {
    return {
        require: '?ngModel',
        link: function (scope, elem, attrs, ctrl) {
            if (!ctrl) return;

            ctrl.$formatters.unshift(function (a) {
                return $filter(attrs.format)(ctrl.$modelValue)
            });

            elem.bind('blur', function(event) {
                var plainNumber = elem.val().replace(/[^\d|\-+|\.+]/g, '');
                elem.val($filter(attrs.format)(plainNumber));
            });
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
.directive('youTube', function($sce) {
  return {
    restrict: 'EA',
    scope: { videoid:'=' },
    replace: true,
    template: '<iframe width="420" height="315" src="{{url}}" frameborder="0" allowfullscreen></iframe>',
    link: function (scope) {
      scope.$watch('videoid', function (newVal) {
           if (newVal) {
               scope.url = $sce.trustAsResourceUrl("https://www.youtube.com/embed/" + newVal+"?autoplay=1");
           }
        });
       //scope.url = $sce.trustAsResourceUrl("http://www.youtube.com/embed/" + scope.videoId);
    }
  };
})
.directive('imageUpload', function (Modal) {
    return {
        scope: true,        //create a new scope
        link: function (scope, el, attrs) {
            el.bind('change', function (event) {
                var files = event.target.files;
                console.log(attrs);
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
                        var index = 0,id="";
                        if(event.currentTarget.id)
                          id=event.currentTarget.id;
                        if(attrs.index)
                          index = attrs.index;
                        if(files.length == 0)
                          return;
                        scope.$emit("fileSelected", { files: files,img_src:ev.target.result,index:index,type:"image",id:id});
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
                 if(event.currentTarget && event.currentTarget.id)
                  emitObj.id = event.currentTarget.id;

                  if(attrs.index)
                      emitObj.index = attrs.index;
                scope.$emit("fileSelected", emitObj);                                   
            });
        }
    };
})
.directive('file', function() {
    return {
        require:"ngModel",
        restrict: 'A',
        scope:{},
        link: function($scope, el, attrs, ngModel){
            el.bind('change', function(event){
                var files = event.target.files;
                var file = files[0];
                ngModel.$setViewValue(files);
            });
        }
    };
})
.directive('withFloatingLabel', function () {
  return {
    restrict: 'A',
    scope:{},
    link: function ($scope, $element, attrs) {
      var template = '<div class="floating-label">' + attrs.placeholder +'</div>';
      
      //append floating label template
      $element.after(template);
      
      //remove placeholder  
      $element.removeAttr('placeholder');
      
      //hide label tag assotiated with given input
      document.querySelector('label[for="' +  attrs.id +  '"]').style.display = 'none';
     
      $scope.$watch(function () {
        if($element.val().toString().length < 1) {
          $element.addClass('empty');
        } else {
          $element.removeClass('empty');
        }
      });
    }
  };
})
.directive('onFileSelectTech', function ($parse) {
    return {
         restrict: 'A',
         scope:{
          params:"="
         },
        link: function (scope, el, attrs) {
            var onChangeHandler = scope.$parent.$eval(attrs.onFileSelectTech);
            el.bind('change', function (event) {
                var files = event.target.files;
                if(!files || !files.length || !onChangeHandler)
                  return;
                if(!scope.params)
                  scope.params = [];
                scope.params[0] = files;
               scope.params[1] = event.currentTarget.id;
                onChangeHandler.apply(scope.$parent,scope.params);                              
            });
        }
    };
    })
.filter('titleCase', function() {
  return function(input) {
    input = input || '';
    return input.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  };
});
