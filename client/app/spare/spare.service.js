(function(){
 'use strict';
 angular.module("spare").factory("spareSvc",spareSvc);

 function spareSvc($http,$rootScope,$q,Auth,BuyContactSvc,$state,Modal){
      var spareService = {};
      var path = '/api/spare';
      
      var spareCache = {};
      var searchFilter = null;

      //public methods
      spareService.getSpareOnId = getSpareOnId;
      spareService.addSpare = addSpare;
      spareService.updateSpare = updateSpare;
      spareService.deleteSpare = deleteSpare;
      //spareService.getSparesOnManufacturerId = getSparesOnManufacturerId;
      spareService.getSpareOnFilter = getSpareOnFilter;
      spareService.getStatusWiseSpareCount = getStatusWiseSpareCount;
      spareService.getSearchResult = getSearchResult;
      spareService.setSearchResult = setSearchResult;
      spareService.getFilter = getFilter;
      spareService.setFilter = setFilter;
      spareService.buyNow = buyNow;
      
      function getSpareOnId(id,fromServer){

        var deferred = $q.defer();
        if(spareCache[id] && !fromServer){
          deferred.resolve(spareCache[id]);
        }else{

          $http.get(path + "/" + id)
          .then(function(res){
            addToCache(res.data);
            deferred.resolve(res.data);
          })
          .catch(function(res){
            deferred.reject(res);
          })
        }
        return deferred.promise;
      };

      function getSpareOnFilter(filter){
        return $http.post(path + "/searchspare", filter)
          .then(function(res){
            if(filter.pagination)
                updateCache(res.data.spares);
            else
              updateCache(res.data);
            return res.data;
          })
          .catch(function(res){
            throw res;
          })
      };

      function getStatusWiseSpareCount(filter){
        return $http.post(path + "/statuswisecount",filter)
                .then(function(res){
                  var resObj = {};
                  res.data.forEach(function(item){
                      resObj[item._id] = item.count;
                  });
                  return resObj;
                })
                .catch(function(res){
                  throw res;
                })
      }

      function addSpare(spareData){
        return $http.post(path, spareData)
        .then(function(res){
          return res.data;
        })
        .catch(function(res){
          throw res;
        });
      };
      
      function updateSpare(spareData){

        return $http.put(path + "/" + spareData._id, spareData).
                then(function(res){
                   deleteFromCache(spareData);
                   return res.data;
                })
                .catch(function(res){
                    throw res;
                });
      };

      function deleteSpare(spareData){
        return $http.delete(path + "/" + spareData._id)
              .then(function(res){
                  deleteFromCache(spareData);
                  return res.data;
              })
              .catch(function(res){
                throw res;
              });
      };

      function buyNow(spare,paymentMode){
        if(!Auth.isLoggedIn()){
          Modal.alert('You need to login to transact on the site.')
          return;
        }

        var reqObj = {};
        reqObj.requestType = "spareBuy";
        reqObj['fname'] =  Auth.getCurrentUser().fname;
        reqObj['mname'] = Auth.getCurrentUser().mname;
        reqObj['lname'] = Auth.getCurrentUser().lname;
        reqObj['country'] = Auth.getCurrentUser().country;
        reqObj['phone'] = Auth.getCurrentUser().phone;
        reqObj['mobile'] = Auth.getCurrentUser().mobile;
        reqObj['email'] = Auth.getCurrentUser().email;
        reqObj['contact'] = Auth.getCurrentUser().contact;
        reqObj.spares = [];
        var spObj = {};
        var spareObj = {};
        spareObj._id = spare._id;
        spareObj.name = spare.name;
        spareObj.partNo = spare.partNo;
        spareObj.manufacturer = spare.manufacturers.name;
        spareObj.seller = spare.seller;
        spareObj.assetDir = spare.assetDir;
        spareObj.primaryImg = spare.primaryImg;
        if(spare.locations.length > 0)
          spareObj.city = spare.locations[0].city;
        if(spare.locations.length > 1)
          spareObj.city += " ..."
        spareObj.grossPrice = spare.grossPrice;
        spareObj.comment = spare.description;
        reqObj.spares[reqObj.spares.length] = spareObj;

        var paymentTransaction = {};
        paymentTransaction.paymentMode = paymentMode;
        paymentTransaction.payments = [];
        paymentTransaction.totalAmount = 0;
        paymentTransaction.requestType = "Spare Buy";

        var payObj = {};

        payObj.type = "sparebuy";
        payObj.charge = spare.grossPrice;
        paymentTransaction.totalAmount += payObj.charge;
        paymentTransaction.payments[paymentTransaction.payments.length] = payObj;

        paymentTransaction.product = {};
        paymentTransaction.product.type = "spare";
        paymentTransaction.product._id = spare._id;
        paymentTransaction.product.partNo = spare.partNo;
        paymentTransaction.product.assetDir = spare.assetDir;
        paymentTransaction.product.primaryImg = spare.primaryImg;
        if(spare.locations.length > 0)
          paymentTransaction.product.city = spare.locations[0].city;
        if(spare.locations.length > 1)
          paymentTransaction.product.city += " ...";
        paymentTransaction.product.name = spare.name;
        paymentTransaction.product.manufacturer = spare.manufacturers.name;
        if(spare.spareDetails.length > 0)
          paymentTransaction.product.category = spare.spareDetails[0].category.name;
        if(spare.spareDetails.length > 1)
          paymentTransaction.product.category += " ...";

        paymentTransaction.product.status = spare.status;
        paymentTransaction.user = {};

        paymentTransaction.user._id = Auth.getCurrentUser()._id;
        paymentTransaction.user.mobile = Auth.getCurrentUser().mobile;
        paymentTransaction.user.fname = Auth.getCurrentUser().fname;
        paymentTransaction.user.city = Auth.getCurrentUser().city;
        paymentTransaction.user.email = Auth.getCurrentUser().email;

        paymentTransaction.status = transactionStatuses[0].code;
        paymentTransaction.statuses = [];
        var sObj = {};
        sObj.createdAt = new Date();
        sObj.status = transactionStatuses[0].code;
        sObj.userId = Auth.getCurrentUser()._id;
        paymentTransaction.statuses[paymentTransaction.statuses.length] = sObj;
        var serObj = {};
        serObj.buyReq = reqObj;
        serObj.payment = paymentTransaction; 
        return BuyContactSvc.buyNow(serObj)
        .then(function(result){
          if(result.transactionId)
            $state.go("payment",{tid:result.transactionId});
        })
        .catch(function(err){
            //error handling
        })

      }

      function addToCache(spare){
        spareCache[spare._id] = spare;
      }

      function updateCache(dataArr){
        dataArr.forEach(function(item,index){
          spareCache[item._id] = item;
        });
      }

      function deleteFromCache(prd){
          if(spareCache[prd._id])
            delete spareCache[prd._id];
     }

      function getSearchResult(){
        return searchResult;
      }

      function setSearchResult(result){
         searchResult = result;
      }

      function getFilter(){
        return searchFilter;
      }

      function setFilter(filter){
         searchFilter = filter;
      }

     return spareService;
  }

})();