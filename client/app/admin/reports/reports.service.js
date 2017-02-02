(function() {
  'use strict';
  angular.module('report').factory("ReportsSvc", ReportsSvc)

  function ReportsSvc($http, $q, $rootScope) {
    var reportService = {};
    var path = '/api';
    reportService.getCallbackOnFilter = getCallbackOnFilter;
    reportService.getQuickQueryOnFilter = getQuickQueryOnFilter;
    //reportService.getAdditionalServicesOnFilter = getAdditionalServicesOnFilter;
    reportService.getShippingQuotesOnFilter = getShippingQuotesOnFilter;
    reportService.getTotatItemsCount = getTotatItemsCount;
    reportService.getValuationQuotesOnFilter = getValuationQuotesOnFilter;
    reportService.getFinancingQuotesOnFilter = getFinancingQuotesOnFilter;
    reportService.getInsuranceQuotesOnFilter = getInsuranceQuotesOnFilter;
    reportService.getBuyOrRentOnFilter = getBuyOrRentOnFilter;
    reportService.getBuyRentNowOnFilter = getBuyRentNowOnFilter;
    reportService.getEasyFinanceOnFilter = getEasyFinanceOnFilter;
    
    reportService.exportData = exportData;
    var userMobileList = "";

    function getCallbackOnFilter(data) {
      return $http.post(path + "/callback/onfilter", data)
        .then(function(res) {
          return res.data
        })
        .catch(function(err) {
          throw err
        })
    }

    function getQuickQueryOnFilter(data) {
      return $http.post(path + "/quote/onfilter", data)
        .then(function(res) {
          return res.data
        })
        .catch(function(err) {
          throw err
        })
    }

   /* function getAdditionalServicesOnFilter(data) {
      return $http.post(path + "/productquote/onfilter", data)
        .then(function(res) {
          return res.data
        })
        .catch(function(err) {
          throw err
        })
    }*/

    function getBuyOrRentOnFilter(data) {
      return $http.post(path + "/buyer/search", data)
        .then(function(res) {
          return res.data
        })
        .catch(function(err) {
          throw err
        })
    }

    function getBuyRentNowOnFilter(data) {
      return $http.post(path + "/negotiate/search", data)
        .then(function(res) {
          return res.data
        })
        .catch(function(err) {
          throw err
        })
    }

    function getEasyFinanceOnFilter(data) {
      return $http.post(path + "/servicerequest/getservices", data)
        .then(function(res) {
          return res.data
        })
        .catch(function(err) {
          throw err
        })
    }

    function getTotatItemsCount(data, searchstr, userMobiles) {
      if(userMobiles)
        userMobileList = "&userMobileNos=" + userMobiles;
      else
        userMobileList = "";
      return $http.get(path + "/reports/fetch.count.json?type=" + data + "&searchStr=" + searchstr + userMobileList)
        .then(function(result) {
          return result
        })
        .catch(function(err) {
          throw err;
        })

    }

    function getShippingQuotesOnFilter(data) {
      if(data.userMobileNos)
        userMobileList =  "&userMobileNos=" + data.userMobileNos;
      else
        userMobileList = "";
      return $http.get(path + "/reports/fetch.json?type=shipping&first_id=" + data.first_id + "&last_id=" + data.last_id + "&offset=" + data.offset + "&limit=" + data.itemsPerPage + "&searchStr=" + data.searchstr + userMobileList)
        .then(function(res) {
          return res.data
        })
        .catch(function(err) {
          throw err
        })
    }

    function getValuationQuotesOnFilter(data) {
      if(data.userMobileNos)
        userMobileList =  "&userMobileNos=" + data.userMobileNos;
      else
        userMobileList = "";
      return $http.get(path + "/reports/fetch.json?type=valuation&first_id=" + data.first_id + "&last_id=" + data.last_id + "&offset=" + data.offset + "&limit=" + data.itemsPerPage + "&searchStr=" + data.searchstr + userMobileList)
        .then(function(res) {
          return res.data
        })
        .catch(function(err) {
          throw err
        })
    }

    function getFinancingQuotesOnFilter(data) {
      if(data.userMobileNos)
        userMobileList =  "&userMobileNos=" + data.userMobileNos;
      else
        userMobileList = "";
      return $http.get(path + "/reports/fetch.json?type=finance&first_id=" + data.first_id + "&last_id=" + data.last_id + "&offset=" + data.offset + "&limit=" + data.itemsPerPage + "&searchStr=" + data.searchstr + userMobileList)
        .then(function(res) {
          return res.data
        })
        .catch(function(err) {
          throw err
        })
    }

    function getInsuranceQuotesOnFilter(data) {
      if(data.userMobileNos)
        userMobileList =  "&userMobileNos=" + data.userMobileNos;
      else
        userMobileList = "";
      return $http.get(path + "/reports/fetch.json?type=insurance&first_id=" + data.first_id + "&last_id=" + data.last_id + "&offset=" + data.offset + "&limit=" + data.itemsPerPage + "&searchStr=" + data.searchstr + userMobileList)
        .then(function(res) {
          return res.data
        })
        .catch(function(err) {
          throw err
        })
    }

    function exportData(data, refName) {
      var url = "";
      if (refName == "callback")
        url = path + "/callback/export";
      else if (refName == "instantQuote")
        url = path + "/quote/export";
      else if (refName == "buyOrRentOrBoth")
        url = path + "/buyer/export";
      else if (refName == "shipping" || refName == "valuation" || refName == "finance" || refName == "insurance") {
        if(data.userMobileNos)
        userMobileList =  "&userMobileNos=" + data.userMobileNos;
      else
        userMobileList = "";
        return path + "/reports/fetch.csv?type=" + refName + "&limit=100" + userMobileList;
      } else if (refName == "buyrentnow" || refName == "forRent") {
        url = path + "/negotiate/export";
      } else if (refName == "easyfinance" || refName == "inspection") {
        url = path + "/servicerequest/export";
      } //else
        //url = path + "/productquote/export";

      return $http.post(url, data)
        .then(function(res) {
          return res.data
        })
        .catch(function(err) {
          throw err
        })
    }

    return reportService;

  }
})();