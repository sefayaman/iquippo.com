(function() {
  'use strict';
  angular.module('report').factory("ReportsSvc", ReportsSvc)

  function ReportsSvc($http, $q, $rootScope) {
    var reportService = {};
    var path = '/api';
    reportService.getCallbackOnFilter = getCallbackOnFilter;
    reportService.getQuickQueryOnFilter = getQuickQueryOnFilter;
    reportService.getAdditionalServicesOnFilter = getAdditionalServicesOnFilter;
    reportService.getShippingQuotesOnFilter = getShippingQuotesOnFilter;
    reportService.getTotatItemsCount = getTotatItemsCount;
    reportService.getValuationQuotesOnFilter = getValuationQuotesOnFilter;
    reportService.getFinancingQuotesOnFilter = getFinancingQuotesOnFilter;
    reportService.getInsuranceQuotesOnFilter = getInsuranceQuotesOnFilter;
    reportService.getBuyOrRentOnFilter = getBuyOrRentOnFilter;
    
    reportService.exportData = exportData;

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

    function getAdditionalServicesOnFilter(data) {
      return $http.post(path + "/productquote/onfilter", data)
        .then(function(res) {
          return res.data
        })
        .catch(function(err) {
          throw err
        })
    }

    function getBuyOrRentOnFilter(data) {
      return $http.post(path + "/buyer/search", data)
        .then(function(res) {
          return res.data
        })
        .catch(function(err) {
          throw err
        })
    }

    function getTotatItemsCount(data, searchstr) {
      return $http.get(path + "/reports/fetch.count.json?type=" + data + "&searchStr=" + searchstr)
        .then(function(result) {
          return result
        })
        .catch(function(err) {
          throw err;
        })

    }

    function getShippingQuotesOnFilter(data) {
      return $http.get(path + "/reports/fetch.json?type=shipping&first_id=" + data.first_id + "&last_id=" + data.last_id + "&offset=" + data.offset + "&limit=" + data.itemsPerPage + "&searchStr=" + data.searchstr)
        .then(function(res) {
          return res.data
        })
        .catch(function(err) {
          throw err
        })
    }

    function getValuationQuotesOnFilter(data) {
      return $http.get(path + "/reports/fetch.json?type=valuation&first_id=" + data.first_id + "&last_id=" + data.last_id + "&offset=" + data.offset + "&limit=" + data.itemsPerPage + "&searchStr=" + data.searchstr)
        .then(function(res) {
          return res.data
        })
        .catch(function(err) {
          throw err
        })
    }

    function getFinancingQuotesOnFilter(data) {
      return $http.get(path + "/reports/fetch.json?type=finance&first_id=" + data.first_id + "&last_id=" + data.last_id + "&offset=" + data.offset + "&limit=" + data.itemsPerPage + "&searchStr=" + data.searchstr)
        .then(function(res) {
          return res.data
        })
        .catch(function(err) {
          throw err
        })
    }

    function getInsuranceQuotesOnFilter(data) {
      return $http.get(path + "/reports/fetch.json?type=insurance&first_id=" + data.first_id + "&last_id=" + data.last_id + "&offset=" + data.offset + "&limit=" + data.itemsPerPage + "&searchStr=" + data.searchstr)
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
      else if (refName == "quickQuery")
        url = path + "/quote/export";
      else if (refName == "buyOrRentOrBoth")
        url = path + "/buyer/export";
      else if (refName == "shipping" || refName == "valuation" || refName == "finance" || refName == "insurance") {
        return path + "/reports/fetch.csv?type=" + refName + "&limit=100";
      } else
        url = path + "/productquote/export";

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