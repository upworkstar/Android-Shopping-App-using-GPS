/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('GrubrollShopperApp').controller('AppController', [
        '$scope',
        '$rootScope',
        '$cordovaPush',
        '$ionicPlatform',
        '$log',
        'common',
        'AuthService',
        'OrderService',
        'UIUtil',
        'LogService',
        '$state',
        '$ionicHistory',
        'ShopperService',
        '$ionicModal',
        '$ionicAnalytics',
        '$ionicUser',
        'FeatureService',
        'VersionProvider',
        'AccountSetupProvider',
        AppController]);

    function AppController($scope,
                           $rootScope,
                           $cordovaPush,
                           $ionicPlatform,
                           $log,
                           common,
                           AuthService,
                           OrderService,
                           UIUtil,
                           LogService,
                           $state,
                           $ionicHistory,
                           ShopperService,
                           $ionicModal,
                           $ionicAnalytics,
                           $ionicUser,
                           FeatureService,
                           VersionProvider,
                           AccountSetupProvider) {

        common.checkLogin();

        var zoneAnnouncementModal = null;
        $scope.showAvailableOrders = true;
        $scope.$on('user.loggedin', function (event, data) {
            common.userLoggedIn();
            common.configureRollBarUserInfo();
            configurePushNotificationServices();
            configureIonicAnalyticsForUser();
            FeatureService.refreshFeatures();
            loadFeatures();
            checkAppVersion();
            AccountSetupProvider.checkSetup();
        });

        var newVersionModal = null;
        $ionicModal.fromTemplateUrl('app/shopper/announcements/newAppVersionMustUpdate.html', {
            scope: $scope
        }).then(function(modal) {
            newVersionModal = modal;
        });

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
                LogService.critical(error);
            }
        }

        $scope.shouldShowAvailableOrders = function(){
            return $scope.showAvailableOrders;
        };

        function loadFeatures () {
            FeatureService.showAvailableOrders()
                .then(function(showAvailableOrders){
                    $scope.showAvailableOrders = showAvailableOrders;
                });
        }

        function checkAppVersion() {
            try {
                VersionProvider.checkShopperAppVersionForUpdates()
                    .then(function(valid){
                        if(!valid){
                            if(document.location.hostname != "localhost"){
                                newVersionModal.show();
                            }
                        }
                    });
            } catch (exception) {
                LogService.error(['checkAppVersion', exception]);
            }
        }

        $ionicPlatform.on("resume", function(event) {
            FeatureService.refreshFeatures();
            if(newVersionModal)newVersionModal.hide();
            checkAppVersion();
        });

        $scope.signoutClick = function() {
            $ionicAnalytics.track('Sign Out');
            common.logoutCurrentUser();
        };

        function saveOrdersLocal(orders){
            try {
                if(JSON.stringify(getMyOrders()) != JSON.stringify(orders)) {
                    $rootScope.$broadcast('refresh_orders_list');
                }
            } catch (exception) {
                UIUtil.showErrorAlert('Could not save the orders to the local cache.');
                LogService.error(exception);
            }
        }

        function getMyOrders(){
            try {
                var localString = window.localStorage[myOrdersKey];
                if(localString) {
                    var orders = angular.fromJson(localString);
                    return orders;
                } else {
                    return null;
                }
            } catch (exception) {
                UIUtil.showErrorAlert('Could not get the orders from the local cache.');
                LogService.error(exception);
            }
        }

        function showAnnouncementModal () {
            try {
                var shown = window.localStorage['shown.zoneAnnouncementModal'];
                if(shown){
                    shown = angular.fromJson(shown);
                } else {
                    shown = false;
                }
                if(!shown) {
                    $ionicModal.fromTemplateUrl('app/shopper/announcements/zoneAnnouncementModal.html', {
                        scope: $scope
                    }).then(function(modal) {
                        zoneAnnouncementModal = modal;
                        zoneAnnouncementModal.show();
                        window.localStorage['shown.zoneAnnouncementModal'] = angular.toJson(true);
                    });
                }

            } catch (exception) {
                LogService.error(exception);
            }
        }

        $scope.closeZoneAnnouncementModal = function() {
            if(zoneAnnouncementModal){
                zoneAnnouncementModal.hide();
            }
        };

        $scope.goToAvailabilityScreenForZones = function() {
            $scope.closeZoneAnnouncementModal();
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
            $state.go('app.schedule');

        };

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
                            "senderID": "792302353498"
                        };
                    }
                    if (isIOS || isAndroid) {
                        try {
                            $cordovaPush.register(pushConfig).then(function (deviceToken) {
                                $log.debug('device_token', deviceToken);
                                $log.debug('device_type', deviceType);
                                if (ionic.Platform.isIOS()) {
                                    ShopperService.registerShopperForPush(deviceToken);
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
            console.log(JSON.stringify([notification]));
            if (ionic.Platform.isAndroid()) {
                handleAndroidNotification(notification);
            }
            else if (ionic.Platform.isIOS()) {
                handleIOSNotification(notification);
            }
        });

        function navigateToAvailableOrdersPage(){
            //if the state is on the myorders
            if($state.includes("app.current")){
                $ionicHistory.nextViewOptions({
                    disableBack: true
                });
                $state.go('app.orders');
            }
        }

        function handleIOSNotification (notification) {
            try {
                LogService.info({info:'handleIOSNotification alert', notification: notification });
                if (notification.alert) {
                    var alert = notification.alert;
                    //this is the text for a new order.
                    if(alert.indexOf("A Grubroll grocery order") > -1) {
                        navigateToAvailableOrdersPage();
                    }
                    navigator.notification.alert(notification.alert);
                }
                if (notification.sound) {
                    try {
                        var snd = new Media(event.sound);
                        snd.play();
                    } catch (exception){
                        LogService.error('error playing sound', exception);
                    }
                }
                if (notification.badge) {
                    $cordovaPush.setBadgeNumber(notification.badge).then(function(result) {
                        LogService.info('Set Badge Success');
                    }, function(err) {
                        LogService.info('Set Badge Error');
                    });
                }
            } catch (exception) {
                LogService.error(exception);
            }
        }

        function handleAndroidNotification (notification) {
            LogService.info({info:'handleAndroidNotification alert', notification: notification });
            if (notification.event == "registered") {
                ShopperService.registerShopperForPush(notification.regid);
            }
            else if (notification.event == "message") {
                var message = notification.message;
                //this is the text for a new order.
                if(message.indexOf("A Grubroll grocery order") > -1) {
                    navigateToAvailableOrdersPage();
                }
                navigator.notification.alert(notification.message);
            }
        }

        common.configureRollBarUserInfo();
        configurePushNotificationServices();
        configureIonicAnalyticsForUser();
        FeatureService.refreshFeatures();
        loadFeatures();
        checkAppVersion();
        AccountSetupProvider.checkSetup();

    }
})();
