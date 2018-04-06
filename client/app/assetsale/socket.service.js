(function () {
    'use strict';

    angular.module('sreizaoApp').factory('socketSvc', socketSvc);

    function socketSvc(socketFactory) {
        return socketFactory();
//        var service = {};
//        service.getSocket = getSocket;
//
//        function getSocket(url) {
//
//            var socket = {};
//            socket.connection = io.connect(url);
//            socket.on = function (eventName, callback) {
//                socket.connection.on(eventName, callback);
//            };
//
//            socket.emit = function (eventName, data) {
//                socket.connection.emit(eventName, data);
//            };
//            return socket;
//        }
//        return service;
    }
})();