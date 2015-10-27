/**
 * Created by JH on 9/25/15.
 */


(function () {
    'use strict';

    angular.module('GrubrollApp').controller('AppController', [
        '$scope',
        '$ionicModal',
        '$log',
        'common',
        'AuthService',
        'ShoppingCartService',
        '$cordovaPush',
        '$ionicPlatform',
        'UIUtil',
        'LogService',
        '$state',
        '$ionicHistory',
        'AccountService',
        '$rootScope',
        '$timeout',
        '$ionicUser',
        'UserOrderService',
        'AppSettingsService',
        '$q',
        'ShareModalProvider',
        'IntroModalProvider',
        AppController]);

    function AppController($scope,
                           $ionicModal,
                           $log,
                           common,
                           AuthService,
                           ShoppingCartService,
                           $cordovaPush,
                           $ionicPlatform,
                           UIUtil,
                           LogService,
                           $state,
                           $ionicHistory,
                           AccountService,
                           $rootScope,
                           $timeout,
                           $ionicUser,
                           UserOrderService,
                           AppSettingsService,
                           $q,
                           ShareModalProvider,
                           IntroModalProvider) {


        var registerModal, introModal, lastOrderRatingModal, orderDetailModal;
        var checkingToOpenLastOrderModal = false;
        AppSettingsService.getAppSettings(true); //gets them from the server and puts in local storage

        if(webVersion) {
            $scope.hideShareButton = true;
        }

        $scope.$on('user.loggedin', function (event, data) {
            $log.info( "user.loggedin event" );
            common.userLoggedIn();
//            showLastOrderModal();
            configurePushNotificationServices();
            configureIonicAnalyticsForUser();
            showIntro();
            ShoppingCartService.loadServerCart();
            AccountService.refreshCustomerInfo();
        });

        $scope.signoutClick = function(){
            $log.info('signoutClick');
            common.logoutCurrentUser();
        };

        function configureIonicAnalyticsForUser() {
            try {
                var userInfo = AuthService.getCustomerInfo();
                if(userInfo) {
                    $ionicUser.identify({
                      user_id: JSON.stringify(userInfo.id),
                      name: userInfo.name,
                      email: userInfo.email
                    });
                }
            } catch (error) {

            }
        }

        $scope.$on('show-register-page', function(event,data){
            common.userLoggedIn();

            $ionicModal.fromTemplateUrl('app/groceries/register/registerNewUser.html',
                {
                    scope: $scope,
                    backdropClickToClose: false,
                    hardwareBackButtonClose: false,
                    focusFirstInput: true
                })
                .then(function(modal) {
                    registerModal = modal;
                    //check login after the modal is loaded.
                    registerModal.show();
                });
        });

        $scope.$on('cancel-register', function(event, data){
            registerModal.hide();
            //common.checkLogin();
            showWelcome();
            common.configureRollBarUserInfo();
        });

        $scope.$on('user.registered', function(event,data){
            common.userLoggedIn();
            registerModal.hide();
            common.configureRollBarUserInfo();
            configurePushNotificationServices();
            configureIonicAnalyticsForUser();
            showIntro();
        });

        function showIntro() {
            if(AuthService.isAuthenticated()){
                IntroModalProvider.showIntroModal($scope);
            }
        }

        function showWelcome() {
            if(!AuthService.isAuthenticated()){
                IntroModalProvider.showWelcomModal($scope);
            }
        }


        function configurePushNotificationServices() {
            if(AuthService.getCustomerInfo() != null) {
                $ionicPlatform.ready(function () {
                    var pushConfig = null;
                    var isIOS = ionic.Platform.isIOS();
                    var isAndroid = ionic.Platform.isAndroid();
                    var deviceType = "";
                    if(isIOS) {
                        pushConfig = {
                            "badge": true,
                            "sound": true,
                            "alert": true
                        };
                    } else if (isAndroid) {
                        pushConfig = {
                            "senderID": "897704621141"
                        };
                    }
                    if (isIOS || isAndroid) {
                        try {
                            $cordovaPush.register(pushConfig).then(function (deviceToken) {
                                $log.debug('device_token', deviceToken);
                                $log.debug('device_type', deviceType);
                                LogService.debug('Success register device ' + deviceToken);
                                if (ionic.Platform.isIOS()) {
                                    AccountService.registerUserForPush(deviceToken)
                                        .success(function(data){
                                            LogService.debug('Success Registering user for push '+ JSON.stringify(data));
                                        })
                                        .error(function(error){
                                            LogService.error('Error Registering user for push '+ JSON.stringify(data))
                                        });
                                }
                            }, function (err) {
                                UIUtil.showErrorAlert("Push Registration Error: " + err);
                                $log.error('error', err);
                                LogService.error("Push Registration Error: " + err);
                            });
                        } catch (exception) {
                            LogService.error(exception);
                        }
                    }
                });
            }
        }

        $rootScope.$on('$cordovaPush:notificationReceived', function(event, notification) {
            if (ionic.Platform.isAndroid()) {
                handleAndroidNotification(notification);
            }
            else if (ionic.Platform.isIOS()) {
                handleIOSNotification(notification);
            }
        });

        function rateOrderPush(notification) {
            try {
                if( !checkingToOpenLastOrderModal && !lastOrderRatingModalIsShown() ){
                    if (notification.order_id && notification.driver_id) {
                        $ionicHistory.nextViewOptions({disableBack: true});
                        $state.go('app.ordersRate', {
                            order: angular.toJson({
                                driver_id: notification.driver_id,
                                order_id:notification.order_id,
                                status: notification.order_status
                            })
                        });
                        return true;
                    } else if (notification.payload.order_id && notification.payload.driver_id) {
                        $ionicHistory.nextViewOptions({disableBack: true});
                        $state.go('app.ordersRate', {
                            order: angular.toJson({
                                driver_id: notification.payload.driver_id,
                                order_id:notification.payload.order_id,
                                status: notification.payload.order_status
                            })
                        });
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return true;
                }
            } catch (exception) {
                LogService.error(exception);
                return false;
            }
        }

        function handleIOSNotification (notification) {
            try {
                LogService.info({info:'handleIOSNotification alert', notification: notification });
                if (notification.alert) {
                    if(rateOrderPush(notification)) {
                        //dont show the push if its a rate push
                        //we will just open the modal if needed
                    } else {
                        var alert = notification.alert;
                        navigator.notification.alert(notification.alert);
                    }
                }
                if (notification.sound) {
                    try {
                        var snd = new Media(event.sound);
                        snd.play();
                    } catch (exception){
                        $log.error('error playing sound', exception);
                    }
                }
                if (notification.badge) {
                    $cordovaPush.setBadgeNumber(notification.badge).then(function(result) {
                        $log.info('Set Badge Success');
                    }, function(err) {
                        $log.info('Set Badge Error');
                    });
                }
            } catch (exception) {
                LogService.error(exception);
            }
        }

        function handleAndroidNotification (notification) {
            LogService.info({info:'handleAndroidNotification alert', notification: notification });
            if (notification.event == "registered") {
                AccountService.registerUserForPush(notification.regid)
                    .success(function(data){
                        LogService.debug('Success Registering user for push '+ JSON.stringify(data));
                    })
                    .error(function(error){
                        LogService.error('Error Registering user for push '+ JSON.stringify(error));
                    });
            } else if (notification.event == "message") {
                var message = notification.message;
                if(rateOrderPush(notification)) {
                    //dont show the push if its a rate push
                    //we will just open the modal if needed
                } else {
                    navigator.notification.alert(notification.message);
                }
            }
        }

        $ionicPlatform.on("resume", function(event) {
//            showLastOrderModal();
            ShoppingCartService.loadServerCart();
            //refresh local users info
            AccountService.refreshCustomerInfo();
        });

        function lastOrderRatingModalIsShown() {
            //safety method to wrap the isShown() method
            if(lastOrderRatingModal) {
                return lastOrderRatingModal.isShown();
            } else {
                return false;
            }
        }

        function orderDetailModalIsShown() {
            //safety method to wrap the isShown() method
            if(orderDetailModal) {
                return orderDetailModal.isShown();
            } else {
                return false;
            }
        }

        function showLastOrderModal() {
            //set a flag saying that this is checking for an order.
            //this will prevent the push notification from also opening a modal if it has been received as well.
            checkingToOpenLastOrderModal = true;
            UserOrderService.getLastOrderForCustomer()
                .then(function(order){
                    if(!order){
                        return;
                    }
                    if(order.status == "delivered" && !order.rating ){
                        showLastOrderRateModal(order);
                    } else if(order.status != "delivered" && order.status != "cancelled"){
                        showOrderDetailForCurrentOpenOrder(order);
                    } else {
                        checkingToOpenLastOrderModal = false;
                    }
                });
        }

        function showOrderDetailForCurrentOpenOrder(order) {
            $scope.orderDetailOrder = order;
            getOrderDetailModal()
                .then(function(modal){
                    orderDetailModal = modal;
                    if(!orderDetailModalIsShown()){
                        orderDetailModal.show();
                    }
                    checkingToOpenLastOrderModal = false;
                });
        }

        function showLastOrderRateModal(order) {
            $scope.rateOrder = order;
            getLastOrderModal()
                .then(function(modal){
                    lastOrderRatingModal = modal;
                    if(!lastOrderRatingModalIsShown()){
                        $scope.$broadcast('last.order.rating.load', $scope.rateOrder);
                        lastOrderRatingModal.show();
                    }
                    checkingToOpenLastOrderModal = false;
                })
        }

        function getOrderDetailModal() {
            var defer = $q.defer();
            if(!orderDetailModal){
                $scope.closeOrderDetailModel = function() {
                    orderDetailModal.hide();
                };
                return $ionicModal.fromTemplateUrl('app/groceries/account/orders/OrderHistoryDetailModal.html', {
                    scope: $scope,
                    backdropClickToClose: false,
                    hardwareBackButtonClose: false
                });
            } else {
                defer.resolve(orderDetailModal);
            }
            return defer.promise;
        }

        function getLastOrderModal() {
            var defer = $q.defer();
            if(!lastOrderRatingModal){
                return $ionicModal.fromTemplateUrl('app/groceries/account/ratings/lastOrderRatingModal.html', {
                    scope: $scope,
                    backdropClickToClose: false,
                    hardwareBackButtonClose: false
                });
            } else {
                defer.resolve(lastOrderRatingModal);
            }
            return defer.promise;
        }

        $rootScope.$on('hide.order.rating', function(event, notification) {
            if(lastOrderRatingModal){
                lastOrderRatingModal.hide();
            }
        });

        function showShareModal() {
            ShareModalProvider.showModal($scope);
        }

        $scope.shareFriendsClick = function() {
            showShareModal();
        };

        function warnForWebApp() {
            try {
                $timeout(function(){
                    if(webVersion){
                        var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
                        var isFirefox = typeof InstallTrigger !== 'undefined';
                        var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
                        var isChrome = !!window.chrome && !isOpera;
                        var isIE = /*@cc_on!@*/false || !!document.documentMode;
                        var warn = false;
                        var browser = '';
                        if(isChrome){
                            browser = 'Chrome';
                            warn = false;
                        } else if (isOpera) {
                            browser = 'Opera';
                            warn = true;
                        } else if (isFirefox) {
                            browser = 'Firefox';
                            warn = true;
                        } else if (isSafari) {
                            browser = 'Safari';
                            warn = true;
                        } else if (isIE) {
                            browser = 'Internet Explorer';
                            warn = true;
                        }
                        if(warn) {
                            UIUtil.showAlert('Browser Not Supported',
                                'Hey, we do not fully support '+browser+'. Our web application runs best on the Google Chrome Web Browser.<br/><br/><a class="button button-calm" target="_blank" href="https://www.google.com/chrome/browser/desktop/index.html">Install Chrome <i class="icon ion-forward"></i></a><br/>')
                        }
                    }
                }, 1000);

            } catch (exception) {
               LogService.error(exception);
            }
        }

        showWelcome();
//        showLastOrderModal();
        common.configureRollBarUserInfo();
        configurePushNotificationServices();
        configureIonicAnalyticsForUser();
        //refresh local users info
        AccountService.refreshCustomerInfo();
        warnForWebApp();
    }
})();
