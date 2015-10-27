/**
 * Created by JH
 */



(function () {
    'use strict';

    var serviceId = 'ShoppingService';

    angular.module('GrubrollApp').factory(serviceId, [
        '$http',
        '$q',
        '$log',
        'ApiEndpoint',
        'common',
        'LogService',
        'AuthService',
        'ShoppingCartService',
        ShoppingService]);

    var keyLocalCartItems = 'localCartItems';
    var keyLocalCategories = 'localCategories';
    var keyLocalSubCategories = 'localSubCategories';
    var keyLocalProducts = 'localProducts';

    function ShoppingService($http,
                             $q,
                             $log,
                             ApiEndpoint,
                             common,
                             LogService,
                             AuthService,
                             ShoppingCartService) {


        var service = {
            getCartItems: ShoppingCartService.getCartItems,
            getCartItemCount: ShoppingCartService.getCartItemCount,
            getProducts: getProducts,
            getCategories: getCategories,
            getCachedCategories: getCachedCategories,
            getSubCategories: getSubCategories,
            clearCart: ShoppingCartService.clearCart,
            updateNoteOnItem: ShoppingCartService.updateNoteOnItem,
            addProductToCart: ShoppingCartService.addProductToCart,
            addCustomProductToCart: ShoppingCartService.addCustomProductToCart,
            removeOneProductFromCart: ShoppingCartService.removeOneProductFromCart,
            getCartTotal: ShoppingCartService.getCartTotal,
            removeProductsCartItemFromCart: ShoppingCartService.removeProductsCartItemFromCart,
            getRecentlyPurchasedProducts: getRecentlyPurchasedProducts,
            getRecentlyPurchasedSpecialRequests:getRecentlyPurchasedSpecialRequests
        };

        //setting the auth token header for all requests from here.
        $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();

        return service;

        function addDefaultHeaders(){
            $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();
        }

        /* Products */
        function getProducts(subCategory,fromServer, page) {
            return getProductsFromServer(subCategory, page);
        }

        function getProductsFromServer(subCategory, page) {
            var defer = $q.defer();
            if(!AuthService.shouldMakeGrubrollApiCall()) {
                defer.resolve(null);
                return;
            }
            var req = {
                method: 'GET',
                url: ApiEndpoint.apiurl + subCategory.products.url,
                params: {
                    page: page
                }
            };
            addDefaultHeaders();
            $http(req)
                .success(function(data){
                    //success
                    defer.resolve(data);
                })
                .error(function(error){
                    LogService.error(error);
                    //error
                    defer.reject(error);
                });
            return defer.promise;
        }

        /* CATEGORIES */
        function getCachedCategories() {
            var cats = getCategoriesFromCache();
            return cats;
        }

        function getCategories(fromServer) {
            var defer = $q.defer();
            if(!AuthService.shouldMakeGrubrollApiCall()) {
                defer.resolve(null);
                return defer.promise;
            }

            if(fromServer != 0){
                return getCategoriesFromServer(fromServer);
            } else {
                var cats = getCategoriesFromCache();
                if(cats.length > 0){
                    defer.resolve(cats);
                } else {
                    return getCategoriesFromServer(fromServer);
                }
            }
            return defer.promise;
        }

        function getRecentlyPurchasedProducts() {
            var defer = $q.defer();
            var req = {
                method: 'GET',
                url: ApiEndpoint.apiurl + "/api/v1/customers/recent/products.json"
            };
            addDefaultHeaders();
            $http(req)
                .success(function(data){
                    $log.debug('getRecentlyPurchasedProducts from server success', data);
                    defer.resolve(data);
                })
                .error(function(error){
                    LogService.error('error', error);
                    defer.reject(error);
                });
            return defer.promise;
        }

        function getRecentlyPurchasedSpecialRequests() {
            var defer = $q.defer();
            var req = {
                method: 'GET',
                url: ApiEndpoint.apiurl + "/api/v1/customers/custom_products.json"
            };
            addDefaultHeaders();
            $http(req)
                .success(function(data){
                    $log.debug('custom_products from server success', data);
                    defer.resolve(data);
                })
                .error(function(error){
                    LogService.error('error', error);
                    defer.reject(error);
                });
            return defer.promise;
        }

        function getCategoriesFromServer(store_id) {
            var defer = $q.defer();
            if(!AuthService.shouldMakeGrubrollApiCall()) {
                defer.resolve(null);
                return;
            }
            var categories = null;
            var req = {
                method: 'GET',
                url: ApiEndpoint.apiurl + "/api/v1/" + store_id + "/categories.json"
            };
            addDefaultHeaders();
            $http(req)
                .success(function(data){
                    $log.info('getCategories from server success', data);
                    saveCategoriesToCache(data);
                    defer.resolve(data);
                })
                .error(function(error){
                    LogService.error('error', error);
                    //error
                    defer.reject(error);
                });
            return defer.promise;
        }

        function saveCategoriesToCache(categories) {
            window.localStorage[keyLocalCategories] = angular.toJson(categories);
        }

        function getCategoriesFromCache() {
            var local = null;
            var localString = window.localStorage[keyLocalCategories];
            if(localString) {
                local = angular.fromJson(localString);
            } else {
                return [];
            }
            return local;
        }

        /* SUB-CATEGORIES */
        function getSubCategories(parentCat, fromServer) {
            return getSubCategoriesFromServer(parentCat);
        }

        function getSubCategoriesFromServer(parentCat) {
            var defer = $q.defer();
            var req = {
                method: 'GET',
                url: ApiEndpoint.apiurl + parentCat.url
            };
            addDefaultHeaders();
            $http(req)
                .success(function(data){
                    $log.info('getSubCategories success', data);
                    defer.resolve(data);
                })
                .error(function(error){
                    LogService.error('error', error);
                    defer.reject(error);
                });
            return defer.promise;
        }

    }
})();
