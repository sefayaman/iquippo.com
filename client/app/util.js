$(window).bind('scroll', function() {
    var adInfo =200; // custom nav height   
    var Calctr =200; // custom nav height   
   ($(window).scrollTop() > adInfo) ? $('.seller-info').addClass('seller-info-fixed') : $('.seller-info').removeClass('seller-info-fixed');   
   ($(window).scrollTop() > Calctr) ? $('.calctr-info').addClass('calctr-info-fixed') : $('.calctr-info').removeClass('calctr-info-fixed');
});

    // On click out hide the UL
    $(document).on('click',function(){
        $('.select ul').fadeOut();
        
    });

$(document).ready(function () {

    $('.btn-vertical-slider').on('click', function () {
        setInterval(function(){ slide(dir); }, 5000);
        if ($(this).attr('data-slide') == 'next') {
            $('#myCarousel').carousel('next');
        }
        if ($(this).attr('data-slide') == 'prev') {
            $('#myCarousel').carousel('prev')
        }

    });
});
 
function setScroll(val){

    $(window).scrollTop(val);
}

function hover(_this){
    var index = $(_this).data('index');
    $('.popover').hide();
    $('#popover_' + index).show();

}

function leave(){
    $('.popover').hide();
}

function youtube_parser(url){
  if(!url)
    return "";
  var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
  var match = url.match(regExp);
  if (match&&match[7].length==11){
      var b=match[7];
      return b;
  }else{
      return "";
  }
}

angular.module('sreizaoApp').
factory("uploadSvc",['$http','$rootScope',function($http,$rootScope){
    var UploadFile = {};
    UploadFile.upload = function(file,assetDir,resizeParam,childDir){
      var uploadPath = '/api/uploads';
      if(assetDir)
        uploadPath += "?assetDir=" + assetDir;
      if(assetDir && childDir)
        uploadPath += "&childDir=y";
      if(resizeParam && resizeParam.resize){
        if(assetDir)
          uploadPath += "&";
        else
          uploadPath += "?";
        uploadPath += "resize=y&width=" + resizeParam.width + "&height=" + resizeParam.height +"&size=" + resizeParam.size;
      }
      var fd = new FormData();
      fd.append("file", file);
      //$rootScope.loading = true;
      return $http.post(uploadPath, fd,{
          withCredentials: true,
          headers: {'Content-Type': undefined },
          transformRequest: angular.identity
      })
      .then(function(res){
        //$rootScope.loading = false;
        return res;
      })
      .catch(function(ex){
        $rootScope.loading = false;
        throw ex;
      });
    };
    
     //the save with files as array method
    UploadFile.saveFiles = function(fileObj,assetDir,resizeParam) {
       var uploadPath = "/api/multiplefile/upload";
      if(assetDir)
        uploadPath += "?assetDir=" + assetDir;
      if(resizeParam && resizeParam.resize){
        if(assetDir)
          uploadPath += "&";
        else
          uploadPath += "?";
        uploadPath += "resize=y&width=" + resizeParam.width + "&height=" + resizeParam.height;
      }
       //$rootScope.loading = true;
       return $http({
            method: 'POST',
            url: uploadPath,
            headers: { 'Content-Type': undefined },
            transformRequest: function (data) {
                var formData = new FormData();
                for(var prop in fileObj){
                    formData.append(prop + "", data.fileObj[prop]);
                }
                 if(assetDir)
                    formData.append("assetDir",assetDir);
                return formData;
            },
            data: {fileObj: fileObj}
        })
       .then(function(res){
        //$rootScope.loading = false;
        return res;
      })
      .catch(function(ex){
        $rootScope.loading = false;
        throw ex;
      });
    };
    return UploadFile;
}])
.factory("UtilSvc",function($http, $rootScope, categorySvc, LocationSvc){
  var utilSvc = {};

  utilSvc.getStatusOnCode = getStatusOnCode;
  utilSvc.validateCategory = validateCategory;
  utilSvc.getCategoryHelp = getCategoryHelp;
  utilSvc.getLocationHelp = getLocationHelp;
  utilSvc.getLocations = getLocations;
  utilSvc.buildQueryParam = buildQueryParam;
  utilSvc.validateMobile = validateMobile;
  
  function getStatusOnCode(list,code){
      var statusObj = {};
      for(var i = 0; i < list.length;i++){
        if(list[i].code == code){
          statusObj = list[i];
          break 
        }
      }
      return statusObj;
  }

  function validateCategory(allCategoryList, categorySearchText){
      var ret = false;
      for(var i =0; i < allCategoryList.length ; i++){
        if(allCategoryList[i].name == categorySearchText){
          ret  = true;
          break;
        }
      }
      return ret;
    }

    function getCategoryHelp(categorySearchText) {
      var serData = {};
      serData['searchStr'] = categorySearchText;
      return categorySvc.getCategoryOnFilter(serData)
      .then(function(result){
         return result.map(function(item){
              return item.name;
        });
      })
    };

    function getLocationHelp(locationSearchText) {
      var serData = {};
      serData['searchStr'] = locationSearchText;
     return LocationSvc.getLocationHelp(serData)
      .then(function(result){
         return result.map(function(item){
             return item.name;
        });
      });
    };

    function getLocations(locations){
      if(!locations)
        return;
     var locationArr = [];
      if(locations.length > 0){
            angular.forEach(locations, function(location, key){
            locationArr.push(location.city);
         });
          }
      return locationArr.join(", ");
    }

    function buildQueryParam(filterObj){
      var queryStr = "";
      if(!filterObj)
        return queryStr;
      for( var prop in filterObj){
        queryStr += prop + "=" + filterObj[prop];
        queryStr += "&";
      }
      queryStr = queryStr.substr(0,queryStr.length - 1);
      return queryStr;
    }

    function validateMobile(country, mobileNo) {
      var validFlag = true;
      if(!mobileNo)
        return false;
      if(country == "India")
        validFlag = /^\d{10}$/.test(mobileNo)   
      if(country != "India")
        validFlag = /^\d+$/.test(mobileNo) 

      return validFlag;
    }

  return utilSvc;
});