(function(){

'use strict';
angular.module('account').controller('mailCtrl', mailCtrl);

angular.module('account').controller('inboxCtrl', inboxCtrl);
angular.module('account').controller('showmailCtrl', showmailCtrl);
angular.module('account').controller('replyCtrl', replyCtrl);
angular.module('account').controller('composeCtrl', composeCtrl);
// angular.module('account').controller('sentmailsCtrl', sentmailsCtrl);

// function sentmailsCtrl($scope){

// }
function composeCtrl($scope, $state, mailService, Auth){
    $scope.mail = {};

    $scope.doSend = function(){
        
        if(!$scope.recievers || ($scope.recievers === '')){
            alert('Please enter a reciever');
            return;
        }
        $scope.mail.to = getrecievers($scope.recievers);
        $scope.mail.from = Auth.getCurrentUser().email;
        // var mess = new mailService();
        mailService.save($scope.mail, 
            function(res){
                alert('Mail Sent '+res.mess);
                $state.go('mailhome.inbox');                        
            },
            function(res){            
                alert('Error Sending Mail '+res.data.message);
                $state.go('mailhome.inbox');        
            }
        );

    };
}
function getrecievers(recievers){
    var recarr = [];
    recievers = recievers.trim();
    if(recievers.indexOf(' ') > 0){
        recarr = recievers.split(' ');
    }else if(recievers.indexOf(',') > 0){
        recarr = recievers.split(',');
    }else if(recievers.indexOf(';') > 0){
        recarr = recievers.split(';');
    }else{
        recarr.push(recievers);
    }
    return recarr;
}

function inArr(toArr, currruser ){

    for (var i = toArr.length - 1; i >= 0; i--) {
        if( currruser === toArr[i]) return true;
    };
    return false;
} 

function replyCtrl($scope, $stateParams, mailService, Auth, $state){
    var vm = this;

    vm.parentmess = $stateParams.message;

console.log(vm.parentmess);

    if(vm.parentmess.replies && vm.parentmess.replies.length > 0){
        vm.receivers = vm.parentmess.replies[vm.parentmess.replies.length -1].from;
        var tempreceivs = getrecievers(vm.receivers);
        if( inArr(tempreceivs, Auth.getCurrentUser().email) )
            vm.receivers = vm.parentmess.replies[vm.parentmess.replies.length -1].to;
    }else
        vm.receivers = vm.parentmess.from;

    vm.replymess = '';
    vm.replyserv = mailService.get({ id: $stateParams.message._id }, function() {});


    vm.doSend = function(){
          
          if(!vm.receivers || vm.receivers === ''){
            alert('Please enter a reciever');
            return;
          }
          var receivs = getrecievers(vm.receivers);

          var repobj = {};
          repobj.from = Auth.getCurrentUser().email;
          repobj.reply = vm.replymess;
          repobj.to = receivs;
          vm.replyserv.mail.replies.push(repobj);

console.log('Replay : ', vm.replyserv);          
          vm.replyserv.mail.reply = repobj;
          vm.replyserv.$update({ id: $stateParams.message._id }, 
          function(res) {
                alert('Reply Sent' + res.message);
                $state.go('mailhome.inbox');
          },
          function(res) {
                alert('Error Replying' + res.data.message);
                $state.go('mailhome.inbox');
          }
          );
          
    };
}
function mailCtrl($scope, $state){
    $state.go('mailhome.inbox');
}
function showmailCtrl($state, $stateParams, $rootScope){
    var vm = this;

    if($rootScope.previousState === 'mailhome.sentmails')
        vm.isSentBox = true;

    vm.mess = $stateParams.message;
    // vm.mess.created = moment(vm.mess.createdAt).format('DD/MM/YYYY, h:mm:ss a');
    vm.goReply = function(message){
        $state.go( 'mailhome.show.reply', { message: message} );
    };
}

function inboxCtrl(mailService, $scope, DTColumnBuilder, DTColumnDefBuilder, $http, Auth, $compile, $resource, $q, $state){
    var vm = this;
    // vm.dogs = ['Bernese', 'Husky', 'Goldendoodle'];

// vm.dogs = [{
//     "id": 860,
//     "firstName": "Superman",
//     "lastName": "Yoda"
// }, {
//     "id": 870,
//     "firstName": "Foo",
//     "lastName": "Whateveryournameis"
// }, {
//     "id": 590,
//     "firstName": "Toto",
//     "lastName": "Titi"
// }, {
//     "id": 803,
//     "firstName": "Luke",
//     "lastName": "Kyle"
// }];    
        // vm.messages = [];
        // Auth.isLoggedInAsync(function(loggedIn){
        //    if(loggedIn){
        //         $http.get('/api/messages/'+ Auth.getCurrentUser().email)
        //         .then(function(result){
 
        //           vm.messages = result.data;
        //         });
        //    }
        // });

    vm.message = 'Rtiin';
    vm.someClickHandler = someClickHandler;
    vm.showRow = showRow;
    //pagination variables
    var prevPage = 0;
    vm.itemsPerPage = 50;
    vm.maxSize = 6;
    $scope.page = 1;

    // vm.dtOptions = DTOptionsBuilder.fromSource(vm.dogs)
    // vm.mailTableRef = {};
    // vm.dtOptions = DTOptionsBuilder.newOptions()
    //     .withOption('bFilter', true)
    //     .withOption('lengthChange', true)
    //     .withOption('stateSave',true)
    //     .withPaginationType('full_numbers')
    //     .withOption('rowCallback', rowCallback);
    // vm.dtOptions = DTOptionsBuilder.newOptions()
    // .withPaginationType('full_numbers')
    // .withOption('rowCallback', rowCallback);

    // -------------------------------------
    // $resource('/api/messages/'+ Auth.getCurrentUser().email ).query().$promise
    //     .then(function(messs) {
    //         vm.messages = messs;
    //     });
    // fnThatReturnsAPromise().then(function(res){   
    //       vm.messages = res.data;
    // });2016/10/18 12:46:05 
    // vm.messages = mailService.query({from: Auth.getCurrentUser().email});
    // var temp = mailService.getusersmails().$promise
    //     .then(function(messs) {
    //         vm.messages = messs.messages;
    //     });
    // mailService.getusersmails(
    //     function (messobj){
    //         vm.messages = messobj.messages;
    //     },
    //     function (res){
    //         alert('Error Fetching Mails'+ res.data.message);
    //     }
    // );
    // var isInbox = true;
    var boj = {};
    vm.isSentBox = false;
    boj.id = 'usersmails';
    if($state.current.name === 'mailhome.inbox'){
        boj.fromto = 'to';
        vm.isSentBox = false;

    }else if($state.current.name === 'mailhome.sentmails'){
        boj.fromto = 'from';
        vm.isSentBox = true;
    }
    mailService.get(boj, 
        function (messobj){
            vm.messages = messobj.messages;

            angular.forEach(vm.messages, function(value, key){
                if(!vm.isSentBox){
                    if((value.replies && value.replies.length > 0) && (Auth.getCurrentUser().email !== value.replies[ value.replies.length - 1 ].from) )    
                        vm.messages[key].showfromorto = value.replies[ value.replies.length - 1 ].from;
                    else
                        vm.messages[key].showfromorto = value.from;                        
                }else{
                    if((value.replies && value.replies.length > 0) && (!inArr(value.replies[ value.replies.length - 1 ].to, Auth.getCurrentUser().email) ) )
                        vm.messages[key].showfromorto = value.replies[ value.replies.length - 1 ].to;
                    else
                        vm.messages[key].showfromorto = value.to;
                }

            });
        },
        function (res){
            alert('Error Fetching Mails '+ res.data.message);
        }
    ); 

    
    function pageChanged(){
        var startPos = ($scope.page - 1) * vm.itemsPerPage;
    } 
 
    // User.get({userId:123}, function(user, getResponseHeaders){
    //   user.abc = true;
    //   user.$save(function(user, putResponseHeaders) {
    //     //user => saved user object
    //     //putResponseHeaders => $http header getter
    //   });
    // });
    // -------------------------------------

    // vm.dtColumnDefs = [
    //     DTColumnDefBuilder.newColumnDef(0),
    //     DTColumnDefBuilder.newColumnDef(1),
    //     // DTColumnDefBuilder.newColumnDef(1).notVisible(),
    //     DTColumnDefBuilder.newColumnDef(2).notSortable(),
    //     // DTColumnDefBuilder.newColumnDef(3).notVisible(),
    //     // DTColumnDefBuilder.newColumnDef(4).notVisible(),
    //     // DTColumnDefBuilder.newColumnDef(5).notVisible(),
    //     // DTColumnDefBuilder.newColumnDef(6).notVisible()
    // ];
//         vm.dtColumns = [
// //             DTColumnBuilder.newColumn(null).withTitle(titleHtml).notSortable()
// //                 .renderWith(function(data, type, full, meta) {
// // console.log(full._id, data._id);                                
// //                     vm.selected[full._id] = false;
// //                     return '<input type="checkbox" ng-model="inboxVM.selected[' + data._id + ']" ng-click="inboxVM.toggleOne(inboxVM.selected)">';
// //                 }),
//             DTColumnBuilder.newColumn('_id').withTitle('ID'),
//             DTColumnBuilder.newColumn('from').withTitle('From'),
//             DTColumnBuilder.newColumn('subject').withTitle('Subject')
//         ];

    vm.selected = {};
    vm.selectAll = false;
    vm.toggleAll = toggleAll;
    vm.toggleOne = toggleOne;
    vm.dtInstance = {};

    var titleHtml = '<input type="checkbox" ng-model="inboxVM.selectAll" ng-click="inboxVM.toggleAll(inboxVM.selectAll, inboxVM.selected)">';

    
           // Auth.isLoggedInAsync(function(loggedIn){
           // if(loggedIn){
                // $http.get('/api/messages/'+ Auth.getCurrentUser().email);
                // .then(function(result){
 
                  // return result.data;
                  // vm.dtOptions = DTOptionsBuilder.fromFnPromise(function() {
                  //           return $resource('/api/messages/'+ Auth.getCurrentUser().email ).query().$promise;
                  //   })
                  // vm.dtOptions = DTOptionsBuilder.fromFnPromise(fnThatReturnsAPromise)
                    // vm.dtOptions = DTOptionsBuilder.newOptions()
                    // .withOption('autoWidth', fnThatReturnsAPromise)
                    // .withOption('createdRow', function(row, data, dataIndex) {
                    //     // Recompiling so we can bind Angular directive to the DT
                    //     $compile(angular.element(row).contents())($scope);
                    // })
                    // .withOption('headerCallback', function(header) {
                    //     if (!vm.headerCompiled) {
                    //         // Use this headerCompiled field to only compile header once
                    //         vm.headerCompiled = true;
                    //         $compile(angular.element(header).contents())($scope);
                    //     }
                    // })
                    // .withPaginationType('full_numbers');

//                     vm.dtColumns = [
//                         DTColumnBuilder.newColumn(null).withTitle(titleHtml).notSortable()
//                             .renderWith(function(data, type, full, meta) {
// console.log(full._id, data._id, type, meta);                                
//                                 vm.selected[full.id] = false;
//                                 return '<input type="checkbox" ng-model="inboxVM.selected[' + data.id + ']" ng-click="inboxVM.toggleOne(inboxVM.selected)">';
//                             }),
//                         DTColumnBuilder.newColumn('_id').withTitle('ID'),
//                         DTColumnBuilder.newColumn('from').withTitle('From'),
//                         DTColumnBuilder.newColumn('subject').withTitle('Subject')
//                     ];

                // });
        //    }
        // });
            // return $resource('data1.json').query().$promise;

    function showRow(indx){
        // console.log(vm.messages[indx]);
        $state.go('mailhome.show', {'message': vm.messages[indx] });
    }
    function fnThatReturnsAPromise(){
        var defer = $q.defer();
        $http.get('/api/messages/'+ Auth.getCurrentUser().email)
           .then(function(result){
                defer.resolve(result);
            })
           .catch(function(res){
            defer.reject(res);
          });
        return defer.promise;
    }

    function someClickHandler(info) {
        vm.message = info.id + ' - ' + info.firstName;
console.log(info);

    }
    function rowCallback(nRow, aData, iDisplayIndex, iDisplayIndexFull) {
        // Unbind first in order to avoid any duplicate handler (see https://github.com/l-lin/angular-datatables/issues/87)
       
        $('td', nRow).unbind('click');
        $('td', nRow).bind('click', function() {
            $scope.$apply(function() {
                vm.someClickHandler(aData);
            });
        });
        return nRow;
    }      
    function toggleAll (selectAll, selectedItems) {
console.log('toggleAll', selectAll, selectedItems);        
        for (var id in selectedItems) {
            if (selectedItems.hasOwnProperty(id)) {
                selectedItems[id] = selectAll;
            }
        }
    }
    function toggleOne (selectedItems, $event) {

        // vm.selected.push(selectedItems[0]);
console.log('toggleOne', vm.selected);        
        for (var id in selectedItems) {
            if (selectedItems.hasOwnProperty(id)) {
                if(!selectedItems[id]) {
                    vm.selectAll = false;
                    // $event.preventDefault();
                    $event.stopPropagation();
                    return;
                }
            }
        }
        // $event.preventDefault();
        $event.stopPropagation();
        // vm.selectAll = true;
    }    
}

})();