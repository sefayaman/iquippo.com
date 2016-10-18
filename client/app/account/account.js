'use strict';

angular.module('sreizaoApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('signup', {
        url: '/signup',
        templateUrl: 'app/account/signup/signup.html',
        controller: 'SignupCtrl'
      })      
      .state('settings', {
        url: '/settings',
        templateUrl: 'app/account/settings/settings.html',
        controller: 'SettingsCtrl',
        authenticate: true
      })
      .state('mailhome', {
        url: '/mailhome',
        templateUrl: 'app/account/mymail/mailhome.html',
        controller: 'mailCtrl'
      })
    .state('mailhome.inbox', {
        url: '/inbox',
        templateUrl: 'app/account/mymail/inbox.html',
        controller: 'inboxCtrl as inboxVM'
    })
    .state('mailhome.sentmails', {
        url: '/sentmails',
        templateUrl: 'app/account/mymail/sentmails.html'
    })
    .state('mailhome.compose', {
        url: '/compose',
        templateUrl: 'app/account/mymail/compose.html'
    })        
    .state('mailhome.show', {
        url: '/show',
        templateUrl: 'app/account/mymail/showmail.html',
        controller: 'showmailCtrl as showmailVM',
        params: { message: null}
    })              
    .state('mailhome.show.reply', {
        url: '/reply',
        templateUrl: 'app/account/mymail/reply.html',
        controller: 'replyCtrl as replyVM',
        params: { message: null},
    })                  
      ;
  });