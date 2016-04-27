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
// pop overs

// Force hiding of "original text" popup for menus, etc. (very annoying)
    // jQuery(selector).bind("hover", function (event) {
    //         if (event.type === 'mouseenter'){ google_trans_tt.css('z-index', -1000); };
    //         else                                { google_trans_tt.css('z-index',  1000); };
    //     }
    // );

angular.module('sreizaoApp').
factory("uploadSvc",['$http','$rootScope',function($http,$rootScope){
    var UploadFile = {};
    UploadFile.upload = function(file,assetDir,resizeParam){
      var uploadPath = '/api/uploads';
      if(assetDir)
        uploadPath += "?assetDir=" + assetDir;
      if(resizeParam && resizeParam.resize){
        if(assetDir)
          uploadPath += "&";
        uploadPath += "resize=y&width=" + resizeParam.width + "&height=" + resizeParam.height;
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
        uploadPath += "&resize=y&width=" + resizeParam.width + "&height=" + resizeParam.height;
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