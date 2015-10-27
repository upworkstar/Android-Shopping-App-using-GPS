/**
 * Created by JH
 */

(function () {
    'use strict';

    var commonModule = angular.module('common', [
        'ionic',
        'ngCordova',
        'ionic.service.core',
        'ionic.service.analytics',
        'ionic.service.deploy',
        'ngIOS9UIWebViewPatch'
        ]);

    commonModule.factory('$exceptionHandler', ['$injector', function($injector) {
        return function(exception, cause) {
            try {
                var LogService = $injector.get("LogService");
                LogService.error(exception);
            } catch (exception) {
                //rollbar was not defined or something.
            }
        };
    }]);

    commonModule.factory('common',
        ['$q', '$rootScope', '$timeout','$ionicModal','$log','AuthService', 'GroceryCartItem','Order','OrderLine','CustomOrderLine', 'LogService', common]);

    function common($q, $rootScope, $timeout, $ionicModal, $log, AuthService, GroceryCartItem, Order, OrderLine, CustomOrderLine, LogService) {

        var service = {
            // common angular dependencies
            $broadcast: $broadcast,
            $q: $q,
            $timeout: $timeout,
            // generic
            getFraction: getlowestfraction,
            isNumber: isNumber,
            textContains: textContains,
            checkLogin: checkLogin,
            logoutCurrentUser: logoutCurrentUser,
            userLoggedIn: userLoggedIn,

            getNameWithLastRemoved: getNameWithLastRemoved,

            GroceryCartItem: GroceryCartItem,
            Order: Order,
            OrderLine: OrderLine,
            CustomOrderLine: CustomOrderLine,

            configureRollBarUserInfo: configureRollBarUserInfo
        };

        return service;

        var loginModal;

        function getlowestfraction(x0) {
            var eps = 1.0E-15;
            var h, h1, h2, k, k1, k2, a, x;

            x = x0;
            a = Math.floor(x);
            h1 = 1;
            k1 = 0;
            h = a;
            k = 1;

            while (x-a > eps*k*k) {
                x = 1/(x-a);
                a = Math.floor(x);
                h2 = h1; h1 = h;
                k2 = k1; k1 = k;
                h = h2 + a*h1;
                k = k2 + a*k1;
            }

            return h + "/" + k;
        }

        function getNameWithLastRemoved (name){
            name = $.trim(name);
            var names = name.split(' ');
            var namesLength = names.length;
            if(namesLength > 1) {
                names[namesLength - 1] = names[namesLength - 1].charAt(0) + '.';
            }
            var adjustedName = names.join(' ');
            return adjustedName;
        }

        function configureRollBarUserInfo() {
            try {
                var custInfo = AuthService.getCustomerInfo();
                LogService.configUserLogInfo(custInfo);
            } catch (exception) {
                $log.error('Error configureRollBarUserInfo', exception);
            }
        }

        function checkIfAuthenticated() {
            return AuthService.isAuthenticated();
        }

        function checkLoginAuth() {
            var authed = checkIfAuthenticated();
            $log.info("is auth: " , authed);
            if(authed){
                //good to go
            } else {
                loginModal.show();
            }
        }

        function logoutCurrentUser() {
            var deferred = $q.defer();
            AuthService.logoutCurrentUser()
                .then(function(loggedOut) {
                    if(loggedOut){
                        deferred.resolve();
                        checkLogin();
                    }else {
                        deferred.reject();
                    }
                });
            return deferred.promise;
        }

        function userLoggedIn() {
            if(loginModal) loginModal.hide();
        }

        function checkLogin() {
            $ionicModal.fromTemplateUrl('app/common/login/login.html',
                {
                    scope: $rootScope,
                    backdropClickToClose: false,
                    hardwareBackButtonClose: false,
                    focusFirstInput: true
                })
                .then(function(modal) {
                    loginModal = modal;

                    //check login after the modal is loaded.
                    checkLoginAuth();
                });
        }


        function $broadcast() {
            return $rootScope.$broadcast.apply($rootScope, arguments);
        }

        function activateController(promises, controllerId) {
            return $q.all(promises).then(function (eventArgs) {
                var data = { controllerId: controllerId };
                $broadcast(commonConfig.config.controllerActivateSuccessEvent, data);
            });
        }

        function isNumber(val) {
            // negative or positive
            return /^[-]?\d+$/.test(val);
        }

        function textContains(text, searchText) {
            return text && -1 !== text.toLowerCase().indexOf(searchText.toLowerCase());
        }
    }
})();
