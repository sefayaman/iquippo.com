var app = angular.module('myApp', []);
app.controller('myCtrl', function($scope, $http, $state) {
    $http({
        method: 'POST',
        url: '/sitemap',
        data: $state.get(),
    }).then(function successCallback(response) {
        console.log(response.data);
        }, function errorCallback(response) {
        console.log(response);
    });
});