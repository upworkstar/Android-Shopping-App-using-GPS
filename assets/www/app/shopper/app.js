angular.module('GrubrollShopperApp', [
    'ionic',
    'ionic.service.core',
    'ionic.service.analytics',
    'ionic.service.deploy',
    'ngCordova',
    'cgBusy',
    'common',
    'ionicLazyLoad',
    'ngAnimate',
    'ui.utils.masks',
    'ngIOS9UIWebViewPatch'])

    .run(function ($ionicPlatform, $cordovaPush, $rootScope, $http, $ionicScrollDelegate, $ionicAnalytics) {
        $ionicPlatform.ready(function () {

            $ionicAnalytics.register();

            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
                cordova.plugins.Keyboard.disableScroll(true);
            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }
            if (window.cordova && ionic.Platform.isIOS()) {
                window.addEventListener("statusTap", function() {
                    $ionicScrollDelegate.scrollTop(true);
                });
            }

        });
    })
    .factory('$exceptionHandler', ['$injector', function($injector) {
        return function(exception, cause) {
            try {
                var LogService = $injector.get("LogService");
                LogService.error(exception);
            } catch (exception) {
                //rollbar was not defined or something.
            }
        };
    }])
    .config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider, $ionicAppProvider, IonicAppConfig) {

        $ionicAppProvider.identify({
            // The App ID (from apps.ionic.io) for the server
            app_id: IonicAppConfig.ionic_app_id,
            // The public API key all services will use for this app
            api_key: IonicAppConfig.ionic_api_key,
          });

        $stateProvider
            .state('app', {
                url: "/app",
                abstract: true,
                templateUrl: "app/shopper/menu.html",
                controller: 'AppController'
            })
            .state('app.about', {
                url: "/about",
                views: {
                    'menuContent': {
                        templateUrl: "app/shopper/about/about.html"
                    }
                }
            })
            .state('app.orders', {
                url: "/orders",
                views: {
                    'menuContent': {
                        templateUrl: "app/shopper/orders/availableOrders.html",
                        controller: "AvailableOrdersController"
                    }
                }
            })
            .state('app.current', {
                url: "/current",
                views: {
                    'menuContent': {
                        templateUrl: "app/shopper/orders/myOrders.html",
                        controller: "MyOrdersController"
                    }
                }
            })
            .state('app.orderDetail', {
                url: "/orderDetail/:order",
                views: {
                    'menuContent': {
                        templateUrl: "app/shopper/orders/orderDetail/orderDetail.html",
                        controller: "OrderDetailController as viewModel"
                    }
                }
            })
            .state('app.list', {
                url: "/list/:order",
                views: {
                    'menuContent': {
                        templateUrl: "app/shopper/orders/orderProducts/productList.html"
                    }
                }
            })
            .state('app.schedule',{
                url:"/schedule",
                views:  {
                    'menuContent': {
                        templateUrl: "app/shopper/schedule/schedule.html",
                        controller: "ScheduleController as viewModel"
                    }
                }
            })
            .state('app.orderSummary',{
                url:"/orderSummary:orderId",
                views:  {
                    'menuContent': {
                        templateUrl: "app/shopper/orders/summary/orderSummary.html",
                        controller: "OrderSummaryController as viewModel"
                    }
                }
            })
            .state('app.shoppingList',{
                url:"/shoppingList",
                views:  {
                    'menuContent': {
                        templateUrl: "app/shopper/orders/shoppingList/shoppingList.html"
                    }
                }
            })
            .state('app.deliveryHistory',{
                url:"/deliveryHistory",
                views:  {
                    'menuContent': {
                        templateUrl: "app/shopper/deliveryHistory/deliveryHistory.html"
                    }
                }
            })
            .state('app.shopperAccount',{
                url:"/shopperAccount",
                views:  {
                    'menuContent': {
                        templateUrl: "app/shopper/shopperAccount/shopperAccount.html"
                    }
                }
            }
        );

        $urlRouterProvider.otherwise('/app/current');
    });
