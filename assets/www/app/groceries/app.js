
var grubrollModule = angular.module('GrubrollApp', [
    'ionic',
    'ionic.service.core',
    'ionic.service.analytics',
    'ionic.service.deploy',
    'ngCordova',
    'cgBusy',
    'common',
    'ionic.rating',
    'ionicLazyLoad',
    'ui.utils.masks',
    'ngIOS9UIWebViewPatch'])

.run(['$ionicPlatform','$ionicScrollDelegate','$ionicAnalytics',function($ionicPlatform,$ionicScrollDelegate,$ionicAnalytics) {
  $ionicPlatform.ready(function() {

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
}])
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
.config(['$stateProvider', '$urlRouterProvider', '$ionicConfigProvider','$ionicAppProvider','IonicAppConfig', function($stateProvider, $urlRouterProvider, $ionicConfigProvider, $ionicAppProvider, IonicAppConfig) {

        $ionicAppProvider.identify({
            // The App ID (from apps.ionic.io) for the server
            app_id: IonicAppConfig.ionic_app_id,
            // The public API key all services will use for this app
            api_key: IonicAppConfig.ionic_api_key,
          });
          
        var mq = window.matchMedia('all and (max-width: 800px)');
        if(mq.matches) {
            //$ionicConfigProvider.views.transition('none');
        } else {
            $ionicConfigProvider.views.transition('none');
        }

        mq.addListener(function(changed) {
            if(changed.matches) {
                // the width of browser is more then 700px
            } else {
                // the width of browser is less then 700px
            }
        });

        $stateProvider
    .state('app', {
        url: "/app",
        abstract: true,
        templateUrl: "app/groceries/menu/menu.html",
        controller: 'AppController'
      })
     .state('app.groceryMap', {
            url: "/groceryMap/:cart",
            views: {
            'menuContent': {
            templateUrl: "app/groceries/grocerymap/GroceryMap.html",
            controller: "GroceryMapController"
            }
        }
    })
    .state('app.membership', {
                url: "/membership",
                views: {
                'menuContent': {
                templateUrl: "app/groceries/membership/membership.html",
                controller: "membershipController"
            }
        }
    })
    .state('app.shoppingCart', {
        url: "/shoppingCart",
        views: {
          'menuContent': {
            templateUrl: "app/groceries/shop/shoppingCart/shoppingCart.html",
            controller: "ShoppingCartController"
          }
        }
      })
    .state('app.products', {
        url: "/products/:category",
        views: {
          'menuContent': {
            templateUrl: "app/groceries/shop/shopping/products.html",
            controller: "ProductsController"
          }
        }
      })
      .state('app.recentProducts', {
          url: "/recentProducts/",
          views: {
              'menuContent': {
                  templateUrl: "app/groceries/shop/shopping/products.html",
                  controller: "ProductsController"
              }
          }
      })
        .state('app.recentSpecialRequests', {
            url: "/recentSpecialRequests/",
            views: {
                'menuContent': {
                    templateUrl: "app/groceries/shop/shopping/products.html",
                    controller: "ProductsController"
                }
            }
        })
    .state('app.account', {
          url: "/account",
          views: {
              'menuContent': {
                  templateUrl: "app/groceries/account/account.html",
                  controller: "accountController"
              }
          }
      })
    .state('app.editAccount', {
        url: "/editAccount/:account",
        views: {
            'menuContent': {
                templateUrl: "app/groceries/account/editAccount.html"
            }
        }
    })
    .state('app.addressList', {
          url: "/addressList",
          views: {
            'menuContent': {
                templateUrl: "app/groceries/account/address/addressList.html",
                controller: "AddressListController"
            }
        }
    })
    .state('app.addEditAddress', {
        url: "/addEditAddress/:address",
        views: {
            'menuContent': {
                templateUrl: "app/groceries/account/address/addEditAddress.html",
                controller: "EditAddressController"
            }
        }
    })
      .state('app.cardList', {
          url: "/cardList",
          views: {
              'menuContent': {
                  templateUrl: "app/groceries/account/payment/cardList.html",
                  controller: "CardListController"
              }
          }
      })
      .state('app.addEditCard', {
          url: "/addEditCard/:card",
          views: {
              'menuContent': {
                  templateUrl: "app/groceries/account/payment/cardCreate.html",
                  controller: "CardCreateController"
              }
          }
      })
      .state('app.orders', {
          url: "/orders",
          views: {
              'menuContent': {
                  templateUrl: "app/groceries/account/orders/orders.html"
              }
          }
      })
        .state('app.ordersRate', {
            url: "/ordersRate/:order",
            views: {
                'menuContent': {
                    templateUrl: "app/groceries/account/orders/orders.html"
                }
            }
        })
      .state('app.subcategories', {
          url: "/subcategories/:parentCat",
          views: {
              'menuContent': {
                  templateUrl: "app/groceries/shop/shopping/subCategories.html",
                  controller: 'SubCategoriesController'
              }
          }
      })
      .state('app.categories', {
          url: "/categories",
            views: {
              'menuContent': {
                templateUrl: "app/groceries/shop/shopping/categories.html"
              }
            }
      })
      .state('app.checkout', {
          url: "/checkout/:cart",
          views: {
              'menuContent': {
                  templateUrl: "app/groceries/shop/checkOut/checkOut.html",
                  controller: 'CheckoutController as viewModel'
              }
          }
      })
      .state('app.existingCardDetails', {
          url: "/existingCardDetails:card",
          views: {
              'menuContent': {
                  templateUrl: "app/groceries/account/payment/existingCardDetails.html",
                  controller: 'ExistingCardDetailsController'
              }
          }
      })
        .state('app.help', {
            url: "/help",
            views: {
                'menuContent': {
                    templateUrl: "app/groceries/help/help.html"
                }
            }
        })
        .state('app.faq', {
            url: "/faq",
            views: {
                'menuContent': {
                    templateUrl: "app/groceries/help/faq/faq.html"
                }
            }
        })
            .state('app.contactUs', {
                url: "/contactUs",
                views: {
                    'menuContent': {
                        templateUrl: "app/groceries/help/ContactUs.html"
                    }
                }
            })
        .state('app.faqArticle', {
            url: "/faqArticle:article",
            views: {
                'menuContent': {
                    templateUrl: "app/groceries/help/faq/article.html"
                }
            }
        });
  $urlRouterProvider.otherwise('/app/categories');
}]);
