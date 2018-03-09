(function(){
  'use strict';

  angular.module('sreizaoApp')
  .factory('authInterceptor', function ($rootScope, $q, $cookieStore, $location) {
    return {
      // Add authorization token to headers
      request: function (config) {
        config.headers = config.headers || {};
        if ($cookieStore.get('token')) {
          config.headers.Authorization = 'Bearer ' + $cookieStore.get('token');
        }
        return config;
      },

      // Intercept 401s and redirect you to login
      responseError: function(response) {
        if(response.status === 401) {
          //$location.path('/login');
          // remove any stale tokens
          $cookieStore.remove('token');
          return $q.reject(response);
        }
        else {
          return $q.reject(response);
        }
      }
    };
  })
   .factory('AppStateSvc', function () {
    var appStateCache = {};
    var svc = {};
    svc.get = get;
    svc.set = set;

    function get(key){
      return appStateCache[key];
    }

    function set(key,stateParams){
      if(!stateParams)
        return;
     appStateCache[key] =  stateParams;
    }
    return svc;
  })
  .factory("userSvc",['$http',function($http){
      var userService = {};
      var path = '/api/users';
      userService.getUsers = function(data){
        return $http.post(path + "/getuser", data)
              .then(function(res){
                return res.data;
              })
              .catch(function(err){
                throw err;
              });
      };
      userService.getUserExportFileName = function(){
        return $http.post(path + "/userlistxlsx")
              .then(function(res){
                return res.data;
              })
              .catch(function(err){
                throw err;
              });
      };
      userService.deleteUser = function(userid){
        return $http.delete(path + "/" + userid)
                .then(function(res){
                    return res.data;
                })
                .catch(function(err){
                  throw err
                });

      };

      userService.parseExcel=function(excelData,user){   
          return $http.post(path + "/v1/import",{excelData:excelData,user:user})
                .then(function(res){
                  return res.data;
                })
                .catch(function(res){
                  throw res;
                });
      };

      userService.updateUser = function(user){
        return $http.put(path + "/update/" + user._id, user)
        .then(function(res){
          return res.data;
        })
        .catch(function(err){
          throw err;
        });
      };

      userService.getProductsCountOnUserIds = function(filter) {
        return $http.post(path + "/getproductscountonuserids", filter)
              .then(function(res){
                return res.data;
              })
              .catch(function(err){
                throw err;
              });
            };

      return userService;
  }])
  .factory("subscribeSvc",['$http',function($http){
    var subscribeService = {};
    var path = '/api/common';
    subscribeService.getAllSubscribeUsers = function(data){
      return $http.get(path + "/subscribe")
            .then(function(res){
              return res.data;
            })
            .catch(function(err){
              throw err;
            });
    };

    subscribeService.createSubscribeUsers = function(subscribe){
    return $http.post(path + "/subscribe",subscribe)
    .then(function(res){
      return res.data;
    })
    .catch(function(ex){
      throw ex;
    })
  };

      return subscribeService;
  }])
  .factory("countrySvc",['$http',function($http){
      var countryService = {};
      var path = '/api/common/countries';
      countryService.getAllCountries = function(){
        return $http.get(path)
      };
      return countryService;
  }])
  .factory("notificationSvc",['$http',function($http){
      var notificationSvc = {};
      var path = '/api/notification';
      notificationSvc.sendNotification = function(templateName,data,dynamicData,notificationType){
        var dataTosend = {};
        dataTosend['notificationType'] = notificationType;
        if(!data.to)
          return;
        dataTosend['to'] = data.to;
        if(data.cc)
          dataTosend['cc'] = data.cc;
        if(data.subject)
          dataTosend['subject'] = data.subject;
        var tempData = {};
        tempData['templateName'] = templateName;
        tempData['data'] = dynamicData;
        $http.post('/api/common/notificationTemplate',tempData)
        .success(function(res){
            dataTosend['content'] = res;
            dataTosend['countryCode']=data.countryCode;
            $http.post(path,dataTosend).then(function(res){
              console.log('email has been posted');
            });
        })
        .error(function(res){
            console.log('unable to send notification type',res)
        });
      };
      return notificationSvc;
  }])
.factory("AppNotificationSvc",['$http','$q','$rootScope',function($http,$q,$rootScope){
    var appNotificationSvc = {};
    var path = '/api/appnotification';
    appNotificationSvc.getAllNotificationOnUserId = getAllNotificationOnUserId;
    appNotificationSvc.createAppNotificationFromProduct = createAppNotificationFromProduct;

  function getAllNotificationOnUserId(filter){
    var deferred = $q.defer();
    $http.post(path + "/search",filter)
      .then(function(res){
        deferred.resolve(res.data);
      })
      .catch(function(res){
        deferred.reject(res);
      })
  }

  function createAppNotificationFromProduct(productData){
    var dataToSend = {};
    var notificationFlag = false;
    dataToSend.user = {};
    dataToSend.user._id = productData.seller._id;
    dataToSend.user.fname = productData.seller.fname;
    dataToSend.productId = productData._id;
    dataToSend.message = productData.name;
    if(productData.assetStatus == 'sold') {
      dataToSend.notificationFor = "Sold";
      notificationFlag = true;
    }
    else if(productData.assetStatus == 'rented') {
      dataToSend.notificationFor = "Rented";
      notificationFlag = true;
    }
    else if(productData.status && productData.assetStatus == 'listed'){
      dataToSend.notificationFor = "Approved";
      notificationFlag = true;
    }
    dataToSend.imgsrc = productData.assetDir + "/"+ productData.primaryImg;
    if(notificationFlag)
      pushNotification(dataToSend);
  }

  function pushNotification(data){
    return $http.post(path + "/create", data)
    .then(function(res){
      return res.data;
    })
    .catch(function(err){
      throw err
    })
  }
  
    return appNotificationSvc;
}])
  .factory("commonSvc",['$http','$httpParamSerializer',function($http,$httpParamSerializer){
    var commonSvc = {};
    var path = '/api/common';
    commonSvc.sendOtp = function(data){
      return $http.post(path + "/sendOtp",data)
        .then(function(res){
            return res.data;
        })
        .catch(function(err){
            throw err;
        });
    };
    commonSvc.createTask = function(data){
      return $http.post("api/createtask",data)
        .then(function(res){
            return res.data;
        })
        .catch(function(err){
            throw err;
        });
    };
    commonSvc.saveBookADemo = function(data){
      return $http.post(path + "/bookademo",data)
        .then(function(res){
            return res.data;
        })
        .catch(function(err){
            throw err;
        });
    };
    commonSvc.getBookADemo = function(filter){
      var serPath = path + "/bookademo";
      var queryParam = "";
      if(filter)
       queryParam = $httpParamSerializer(filter);
      if(queryParam)
        serPath += "?" + queryParam;
      return $http.get(serPath)
        .then(function(res){
            return res.data;
        })
        .catch(function(err){
            throw err;
        });
    };
    return commonSvc;
}])
.factory("InvitationSvc",['$http','$q','$rootScope',function($http,$q,$rootScope){
    var invitationSvc = {};
    var path = '/api/invitation';

  //Services for coupon
  invitationSvc.getCouponOnId = function(id){
    var deferred = $q.defer();
      $http.get(path + "/generatecoupon/" + id)
      .then(function(res){
        deferred.resolve(res.data);
      })
      .catch(function(res){
        deferred.reject(res);
      })
    return deferred.promise;
  };

  invitationSvc.checkCodeValidity = function(data){
    return $http.post(path + "/checkvalidity", data)
          .then(function(res){
            return res.data;
          })
          .catch(function(err){
            throw err;
          });
  };

  invitationSvc.createCoupon = function(couponData){
    var dataTosend = {};
    dataTosend.user = {};
    dataTosend.refBy = {};
    dataTosend.refBy.refId = couponData.refBy.refId;
    dataTosend.refBy.code = couponData.refBy.code;
    dataTosend.user._id = couponData.user._id;
    dataTosend.user.fname = couponData.user.fname;
    dataTosend.user.lname = couponData.user.lname;
    dataTosend.user.email = couponData.user.email;
    dataTosend.user.mobile = couponData.user.mobile;
    if(couponData.user.imgsrc)
      dataTosend.user.imgsrc = couponData.user.imgsrc;
    dataTosend.sDate = $rootScope.invitationData.valueObj.sDate;//new Date("2016-12-31");
    dataTosend.eDate = $rootScope.invitationData.valueObj.eDate;
    dataTosend.refAmount = $rootScope.invitationData.valueObj.refAmount; //100;
    dataTosend.joinAmount = $rootScope.invitationData.valueObj.joinAmount;

    return $http.post(path + "/generatecoupon", dataTosend)
    .then(function(res){
      updateWallet(res.data);
      return res.data;
    })
    .catch(function(err){
      throw err
    })
  }

function updateWallet(couponData){
  var walletData = {};
  walletData.user = couponData.user;
  walletData.refBy = couponData.refBy;
  walletData.creditAmount = Number(couponData.joinAmount);
  invitationSvc.createWalletTransaction(walletData)
  .then(function(res){
    console.log("Wallet Created");
  });

  invitationSvc.getTransactionOnId(couponData.refBy.refId)
  .then(function(res){
    var updateData = {};
    updateData = res;
    updateData.creditAmount = Number(res.creditAmount) + Number(couponData.refAmount);
    invitationSvc.updateWalletTransaction(updateData)
    .then(function(res){
      console.log("Wallet Created");
    });
  });

}

  /*invitationSvc.createCoupon = function(data){
    return $http.post(path + "/generatecoupon",data)
    .then(function(res){
      return res.data;
    })
    .catch(function(err){
      throw err
    })
  };*/

  invitationSvc.updateCoupon = function(data){
    return $http.put(path + "/generatecoupon/" + data._id, data)
    .then(function(res){
      return res.data;
    })
    .catch(function(err){
      throw err;
    });
  };

  //Services for coupon
  invitationSvc.getTransactionOnId = function(id){
    var deferred = $q.defer();
      $http.get(path + "/wallettransaction/" + id)
      .then(function(res){
        deferred.resolve(res.data);
      })
      .catch(function(res){
        deferred.reject(res);
      })
    return deferred.promise;
  };

  invitationSvc.createWalletTransaction = function(data){
    return $http.post(path + "/wallettransaction",data)
    .then(function(res){
      return res.data;
    })
    .catch(function(err){
      throw err
    })
  };

  invitationSvc.updateWalletTransaction = function(data){
    return $http.put(path + "/wallettransaction/" + data._id, data)
    .then(function(res){
      return res.data;
    })
    .catch(function(err){
      throw err;
    });
  };

    return invitationSvc;
}])
 .factory("suggestionSvc",['$http',function($http){
    var suggestionService = {};
    var path = '/api/common/buildsuggestion';
    suggestionService.buildSuggestion = function(suggestions){
      return $http.post(path,suggestions)
      .then(function(res){
        return res.data;
      })
      .catch(function(ex){
        throw ex;
      })
    };
    return suggestionService;
}])
.factory("settingSvc",['$http',function($http){
    var settingSvc = {};
    var path = '/api/common';
     settingSvc.upsert = function(data){
      return $http.post(path + "/upsertsetting",data)
      .then(function(res){
        return res.data;
      })
      .catch(function(ex){
        throw ex;
      })
    };
    settingSvc.get = function(key){
       return $http.post(path + "/getsettingonkey",{key:key})
      .then(function(res){
        return res.data;
      })
      .catch(function(ex){
        throw ex;
      })
    }

    settingSvc.getDevEnvironment = function(key){
      var data ={};
       return $http.post("/api/getdevenvironment", data)
      .then(function(res){
        return res.data;
      })
      .catch(function(ex){
        throw ex;
      })
    }

    return settingSvc;
}])
.factory("BuyContactSvc",BuyContactSvc);
  function BuyContactSvc($http,$q,notificationSvc,productSvc,Modal){
    var path = '/api/buyer';

    var buycontactSvc = {};
    buycontactSvc.submitRequest = submitRequest;
    buycontactSvc.buyNow = buyNow;
    buycontactSvc.getOnFilter = getOnFilter;

    function submitRequest(dataToSend){
      return $http.post(path,dataToSend)
        .then(function(res) {
          var data = {};
          data['to'] = supportMail;
          if(dataToSend.tradeType == "SELL")
            data['subject'] = "Request for BUY a product"
          else if(dataToSend.tradeType == "RENT")
            data['subject'] = "Request for RENT a product"
          else
            data['subject'] = "Request for BUY/RENT a product"
          var emailDynamicData = {};
          emailDynamicData['serverPath'] = serverPath;
          emailDynamicData['fname'] = dataToSend.fname;
          emailDynamicData['lname'] = dataToSend.lname; 
          emailDynamicData['country'] = dataToSend.country; 
          emailDynamicData['email'] = dataToSend.email;
          emailDynamicData['mobile'] = dataToSend.mobile;
          emailDynamicData['message'] = dataToSend.message;
          if(dataToSend.contact)
              emailDynamicData['contact'] = dataToSend.contact;

          if(dataToSend.product && dataToSend.product.length > 0)
            emailDynamicData['product'] = dataToSend.product;
           if( dataToSend.spares && dataToSend.spares.length > 0)
              emailDynamicData['spares'] = dataToSend.spares;

          if(dataToSend.interestedIn == "finance") {
            dataToSend.finance = true;
            emailDynamicData['interestedIn'] = "Finance Asset";
            emailDynamicData['financeInfo'] = dataToSend.financeInfo;
          }
          else {
            if(dataToSend.tradeType == "SELL")
              emailDynamicData['interestedIn'] = "Buy Asset"
            else if(dataToSend.tradeType == "RENT")
              emailDynamicData['interestedIn'] = "Rent Asset"
            else
              emailDynamicData['interestedIn'] = "Buy/Rent Asset"
          }

          notificationSvc.sendNotification('productEnquiriesEmailToAdmin', data, emailDynamicData,'email');

          if(dataToSend.contact == "email") {
            data['to'] = emailDynamicData.email;
            data['subject'] = 'No reply: Product Enquiry request received';
            notificationSvc.sendNotification('productEnquiriesEmailToCustomer', data, emailDynamicData,'email');
          }
          var ids = [];
          if(dataToSend.product && dataToSend.product.length > 0){
            dataToSend.product.forEach(function(prd){
              ids[ids.length] = prd._id;
            });
          }
          
          if(ids.length > 0)
            productSvc.updateInquiryCounter(ids);
          Modal.alert(informationMessage.buyRequestSuccess,true);
          return res.data;
        }).catch(function(res){
            Modal.alert(res);
            throw res;
        });
    }

    function buyNow(serData){
      return $http.post(path + "/buynow",serData)
      .then(function(res){
        return res.data;
      })
      .catch(function(err){
        throw err;
      })
    }

    function getOnFilter(filter){
      return $http.post(path + "/onfilter",filter)
      .then(function(res){
        return res.data;
      })
      .catch(function(err){
        throw err;
      })
    }
  
    return buycontactSvc;

  };
angular.module('sreizaoApp').factory('MarketingSvc',ReMarketingConversionSvc);
function ReMarketingConversionSvc(){
  var svc = {};
  
  //google constant
  var googleConversionConfig = {
    google_conversion_id : 869774544,
    google_conversion_language:"en",
    google_conversion_format:"3",
    google_conversion_color : "ffffff",
    google_conversion_label:"Ya-TCLWsqG0Q0OnengM",
    google_remarketing_only : false
  }


  svc.googleConversion = googleConversion;
  svc.googleRemarketing = googleRemarketing;
  svc.facebookConversion = facebookConversion;

  function googleConversion(remarketing,customParams){
    if(!window.google_trackConversion)
      return;
    window.google_trackConversion(googleConversionConfig);
  }

  function googleRemarketing(customParams){
    if(!window.google_trackConversion)
      return;
    
    var googleRemarketingConfig = {
      google_conversion_id : 869774544,
      google_remarketing_only: true
    }

    if(customParams)
      googleRemarketingConfig['google_custom_params'] = customParams;
      window.google_trackConversion(googleRemarketingConfig);
  }

  function facebookConversion(){
    if(!fbq)
      return;
    fbq('track', 'lead');
  }
  return svc;
}

})();