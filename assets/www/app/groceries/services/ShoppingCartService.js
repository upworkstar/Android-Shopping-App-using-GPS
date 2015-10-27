
(function () {
    'use strict';

    var serviceId = 'ShoppingCartService';

    angular.module('GrubrollApp').factory(serviceId, [
        '$http',
        '$rootScope',
        'LogService',
        '$q',
        '$timeout',
        'ApiEndpoint',
        'common',
        'AuthService',
        '$log',
        ShoppingCartService]);

    var keyLocalCartItems = 'localCartItems';

    function ShoppingCartService($http,
                                 $rootScope,
                                 LogService,
                                 $q,
                                 $timeout,
                                 ApiEndpoint,
                                 common,
                                 AuthService,
                                 $log) {


        var service = {
            getCartTotal: getCartTotal,
            loadServerCart: getServerCart,
            getCartItems: getLocalCartItems,
            getCartItemCount: getCartItemCount,
            updateNoteOnItem: updateNoteOnItem,
            addProductToCart: addProductToCart,
            addCustomProductToCart: addCustomProductToCart,
            removeOneProductFromCart: removeOneProductFromCart,
            removeProductsCartItemFromCart: removeProductsCartItemFromCart,
            clearCart:clearCart
        };

        var lastRequest = null;
        var lastGetServerAddRequest = null;
        var lastGetServerSubtractRequest = null;

        var byWeightAmount = .5;
        var byWeightProductType = 'by weight';
        var bogoAmount = 2;

        //setting the auth token header for all requests from here.
        $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();

        //migration from .count to .qty property on the local cart item object
        try {
            var cartItems = getLocalCartItems();
            LogService.info(['LocalCart Migration Starting :: cleanedCartItems ::', cartItems]);
            var cleanedCartItems = [];
            for(var i = 0; i <  cartItems.length; i++) {
                var cartItem = cartItems[i];
                cartItem = new common.GroceryCartItem(cartItem);
                LogService.info(['new item ' + JSON.stringify(cartItem), cartItem]);
                cleanedCartItems.push(cartItem);
            }
            writeLocalCartItemsToLocalStorage(cleanedCartItems, true);
            LogService.info(['LocalCart Migration Finished :: cleanedCartItems ::', cleanedCartItems]);
            getServerCart();
        } catch (ex) {
            //dont do anything just move on.
            LogService.critical(['Error migrating count to qty.', ex]);
        }

        $rootScope.$on('cart.data.changed', function(event, data){
            var cartItems = data ? data : getLocalCartItems();
            createServerCart(cartItems);
        });

        $rootScope.$on('get.cart.data.from.server', function(){
            getServerCart();
        });

        return service;

        function createServerCart(cartItems) {
            try {
                addDefaultHeaders();
                LogService.info(['createServerCart', cartItems]);
                _.each(cartItems, function(element, index, list){
                    if(element.product) {
                        if(element.product.isCustom) {
                            element.product = _.pick(element.product, 'name');
                        } else {
                            element.product = _.pick(element.product, 'id');
                        }
                    }
                });

                if(lastRequest) lastRequest.cancel();
                var canceller = $q.defer();

                var cancel = function(){
                    canceller.resolve('User Canceled Request');
                };

                var promise = $http.post(
                    ApiEndpoint.apiurl + '/api/v1/shopping_cart/create.json',
                    {items:cartItems}
                    , { timeout: canceller.promise })
                    .success(function(data){
                        LogService.info(['createServerCart', data]);
                        saveServerCartToLocal(data);
                    })
                    .error(function(data, status, headers, config){
                        if(status != 0){
                            LogService.critical(['Error createServerCart', data, status, headers, config]);
                        }
                    });

                //so we save only the last request. With the most up to date data...
                lastRequest = {
                    promise: promise,
                    cancel: cancel
                }
            } catch (exception){
                LogService.critical(['saveCartToServer', exception]);
            }
        }

        function getServerCart() {
            try {
                var deferred = $q.defer();
                if(!AuthService.shouldMakeGrubrollApiCall()) {
                    deferred.resolve(null);
                    return;
                }
                addDefaultHeaders();
                LogService.info(['getServerCart local cart', getLocalCartItems()]);
                 var user_id = AuthService.getCustomerInfo().id;

                $http({
                    method: 'POST',
                      data : {user_id : user_id},
                    url: ApiEndpoint.apiurl + '/api/v1/shopping_cart.json'
                })
                    .success(function(data){
                        LogService.info(['getServerCart', data]);
                        if(data.length >= 0) {
                            saveServerCartToLocal(data);
                        }
                        deferred.resolve();
                    })
                    .error(function(data){
                        LogService.critical(['getServerCart', data]);
                        deferred.reject();
                    });

                return deferred.promise;
            } catch (exception){
                LogService.critical(['getServerCart', exception]);
            }
        }

        function emptyServerCart() {
            var deferred = $q.defer();
            addDefaultHeaders();

            var promise = $http({
                method: "DELETE",
                url: ApiEndpoint.apiurl + '/api/v1/shopping_cart/empty.json'
            }).success(function (server_cart) {
                deferred.resolve(server_cart);
            }).error(function (error) {
                deferred.reject(error);
                LogService.error(['Error callServerAddForProduct', error]);
            });

            return deferred.promise;
        }

        function saveServerCartToLocal(serverCart) {
            try {
                var cartItems = mergeCart(serverCart);
                writeLocalCartItemsToLocalStorage(cartItems, true);
            } catch (exception){
                LogService.critical(['saveServerCartToLocal', exception]);
            }
        }

        function mergeCart(data) {
            try {
                _.each(data, function(element, index, list){
                    element = new common.GroceryCartItem(element);
                });
                return data;
            } catch (exception){
                LogService.critical(['mergeCart', exception]);
            }
        }

        function broadcastCartItemsChanged(cartItems){
            $rootScope.$broadcast('cart.data.changed', cartItems);
        }

        function addDefaultHeaders(){
            $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();
        }

        function callServerSaveForCartItemNotes(cartItem){
            var deferred = $q.defer();
            addDefaultHeaders();
            cartItem = angular.copy(cartItem);
            var itemByWeight = cartItem.product.product_type == byWeightProductType;
            var itemBogo = cartItem.product.bogo;

            if(cartItem.product.isCustom) {
                cartItem.product = _.pick(cartItem.product, 'name', 'description');
            } else {
                cartItem.product = _.pick(cartItem.product, 'id');
            }

            cartItem =  _.pick(cartItem, 'note', 'product', 'qty');

            cartItem.qty = 0;
            if(lastGetServerAddRequest) lastGetServerAddRequest.cancel();
            var canceller = $q.defer();

            var cancel = function(){
                canceller.resolve('User Canceled Request');
            };
 
             var user_id = AuthService.getCustomerInfo().id;
             if (!cartItem.user_id){
             cartItem.user_id = user_id;
             }
 
            var promise = $http({
                method: "POST",
                url: ApiEndpoint.apiurl + '/api/v1/shopping_cart/add.json',
                data: cartItem
//                timeout: canceller.promise
            }).success(function (server_cart) {
                saveServerCartToLocal(server_cart);
                deferred.resolve(server_cart);
            }).error(function (data, status, headers, config) {
                deferred.reject(data);
                if(status != 0){
                    LogService.error(['Error callServerAddForProduct', data, status, headers, config]);
                }
            });
            lastGetServerAddRequest = {
                promise: promise,
                cancel: cancel
            };
            return deferred.promise;
        }

        function callServerAddForCartItem(cartItem){
            var deferred = $q.defer();
            addDefaultHeaders();
            cartItem = angular.copy(cartItem);
 
            var itemByWeight = cartItem.product.product_type == byWeightProductType;
            var itemBogo = cartItem.product.bogo;

            if(cartItem.product.isCustom) {
                cartItem.product = _.pick(cartItem.product, 'name', 'description');
            } else {
                cartItem.product = _.pick(cartItem.product, 'id');
            }
            if(itemByWeight){
                //move up by .5 on by weight items
                cartItem =  _.pick(cartItem, 'note', 'product', 'qty');
                cartItem.qty = byWeightAmount;
            } else if(itemBogo){
                //move up by 2
                cartItem =  _.pick(cartItem, 'note', 'product', 'qty');
                cartItem.qty = bogoAmount;
            } else {
                //if not by weight system will default to plus 1
                cartItem =  _.pick(cartItem, 'note', 'product');
            }


            if(lastGetServerAddRequest) lastGetServerAddRequest.cancel();
            var canceller = $q.defer();

            var cancel = function(){
                canceller.resolve('User Canceled Request');
            };
             var user_id = AuthService.getCustomerInfo().id;
             if (!cartItem.user_id){
                cartItem.user_id = user_id;
             }
            var promise = $http({
                method: "POST",
                url: ApiEndpoint.apiurl + '/api/v1/shopping_cart/add.json',
                data: cartItem
//                timeout: canceller.promise
            }).success(function (server_cart) {
                saveServerCartToLocal(server_cart);
                deferred.resolve(server_cart);
            }).error(function (data, status, headers, config) {
                deferred.reject(data);
                if(status != 0){
                    LogService.error(['Error callServerAddForProduct', data, status, headers, config]);
                }
            });
            lastGetServerAddRequest = {
                promise: promise,
                cancel: cancel
            };
            return deferred.promise;
        }

        function callServerSubtractForCartItem(cartItem){
            var deferred = $q.defer();
            addDefaultHeaders();
            cartItem = angular.copy(cartItem);

            var itemByWeight = cartItem.product.product_type == byWeightProductType;
            var itemBogo = cartItem.product.bogo;
            if(cartItem.product.isCustom) {
                cartItem.product = _.pick(cartItem.product, 'name', 'description');
            } else {
                cartItem.product = _.pick(cartItem.product, 'id');
            }

            if(itemByWeight){
                //move down by .5 on by weight items
                cartItem =  _.pick(cartItem, 'note', 'product', 'qty');
                cartItem.qty = byWeightAmount;
            } else if(itemBogo){
                //move down by 2
                cartItem =  _.pick(cartItem, 'note', 'product', 'qty');
                cartItem.qty = bogoAmount;
            } else {
                //if not by weight system will default to minus 1
                cartItem =  _.pick(cartItem, 'note', 'product');
            }

            if(lastGetServerSubtractRequest) lastGetServerSubtractRequest.cancel();
            var canceller = $q.defer();

            var cancel = function(){
                canceller.resolve('User Canceled Request');
            };
 
 
             var user_id = AuthService.getCustomerInfo().id;
             if (!cartItem.user_id){
             cartItem.user_id = user_id;
             }
 
 
            var promise = $http({
                method: "DELETE",
                url: ApiEndpoint.apiurl + '/api/v1/shopping_cart/substract.json',
                data: cartItem,
                headers: {"Content-Type": "application/json;charset=utf-8"}
//                timeout: canceller.promise
            }).success(function (server_cart) {
                saveServerCartToLocal(server_cart);
                deferred.resolve(server_cart);
            }).error(function (data, status, headers, config) {
                deferred.reject(data);
                if(status != 0){
                    LogService.error(['Error callServerSubtractForCartItem', data, status, headers, config]);
                }
            });

            lastGetServerSubtractRequest = {
                promise: promise,
                cancel: cancel
            };

            return deferred.promise;
        }

        function getCartTotal() {
            var total = 0;
            angular.forEach(getLocalCartItems(), function(cartItem,key){
                if(cartItem.product.on_sale){
                    total = total + (cartItem.product.sale_price * cartItem.qty);
                } else {
                    total = total + (cartItem.product.price * cartItem.qty);
                }
            });
            return total;
        }

        function removeProductsCartItemFromCart(product, skipCallToServer) {
            $log.info('removeProductsCartItemFromCart');
            if(!product){
                return;
            }
            removeCartItemForProduct(product, getLocalCartItems(), true);
        }

        function removeCartItemForProduct(product, cartItemsArray, skipCallToServer) {
            var index;
            if(product.isCustom){

                index = cartItemsArray.map(function (el) {
                    return el.product.name;
                }).indexOf(product.name);

            } else {
                index = cartItemsArray.map(function (el) {
                    return el.product.id;
                }).indexOf(product.id);
            }

            if (index > -1) {
                removeCartItemFromCart(cartItemsArray[index], skipCallToServer);
            }
        }

        function removeCartItemFromCart(cartItem, skipCallToServer) {
            $log.info('removeCartItemFromCart');
            var cartItemsArray = getLocalCartItems();
            var index;

            if(cartItem.product.isCustom){
                index = cartItemsArray.map(function(el) {
                    return el.product.name;
                }).indexOf(cartItem.product.name);
            } else {
                index = cartItemsArray.map(function(el) {
                    return el.product.id;
                }).indexOf(cartItem.product.id);
            }
            if(index > -1){
                callServerSubtractForCartItem(cartItemsArray[index], 0);
                cartItemsArray.splice(index,1);
            }
            writeLocalCartItemsToLocalStorage(cartItemsArray, skipCallToServer);
        }

        function addCustomProductToCart(customProductToAdd) {
            addCustomProductToCartItems(customProductToAdd, getLocalCartItems(), true);
        }

        function addCustomProductToCartItems(customProductToAdd, cartItems, skipCallToServer) {
            var i;
            var foundItemInCart = false;
            for (i = 0; i < cartItems.length; i++) {
                var cartItem = cartItems[i];
                if(cartItem.product.name == customProductToAdd.name) {
                    //found the product was already in the cart so just add to the count of that item :)
                    foundItemInCart = true;
                    cartItem.qty += 1;
                    callServerAddForCartItem(cartItem);
                    break;
                }
            }
            if(!foundItemInCart){
                var itemToAdd = new common.GroceryCartItem();
                itemToAdd.product  = customProductToAdd;
                itemToAdd.qty = customProductToAdd.qty;
                callServerAddForCartItem(itemToAdd);
                cartItems.push(itemToAdd);
            }
            writeLocalCartItemsToLocalStorage(cartItems, skipCallToServer);
        }

        function addProductToCart(productToAdd) {
            if (productToAdd.isCustom ) {
                var customProduct = {
                    name:productToAdd.name,
                    isCustom: true,
                    price: 0,
                    qty:1
                };
                addCustomProductToCart(customProduct);

            }  else {
                var localCartItems = getLocalCartItems();
                addProductToCartItems(productToAdd, localCartItems, true);
            }
        }

        function addProductToCartItems(productToAdd, localCartItems ,skipCallToServer){
            //check if this product exists in the cart items
            //if so then add to the count of that item
            //if not add a new cart item
            var i;
            var foundItemInCart = false;
            for (i = 0; i < localCartItems.length; i++) {
                var cartItem = localCartItems[i];
                if(cartItem.product.id == productToAdd.id) {
                    //found the product was already in the cart so just add to the count of that item :)
                    foundItemInCart = true;
                    if (productToAdd.product_type == byWeightProductType){
                        cartItem.qty = parseFloat(cartItem.qty) + byWeightAmount;
                        callServerAddForCartItem(cartItem);
                        break;
                    } else if (productToAdd.bogo){
                        cartItem.qty = parseFloat(cartItem.qty) + bogoAmount;
                        callServerAddForCartItem(cartItem);
                        break;
                    }
                    cartItem.qty++;
                    callServerAddForCartItem(cartItem);
                    break;
                }
            }
            if(!foundItemInCart){
                var itemToAdd = new common.GroceryCartItem();
                itemToAdd.product  = productToAdd;
                if(productToAdd.qty){
                    itemToAdd.qty = productToAdd.qty;
                }
                if (productToAdd.product_type == byWeightProductType){
                    itemToAdd.qty = parseFloat(itemToAdd.qty) + byWeightAmount;
                } else if(productToAdd.bogo){
                    itemToAdd.qty = parseFloat(itemToAdd.qty) + bogoAmount;
                } else {
                    itemToAdd.qty = 1;
                }
                callServerAddForCartItem(itemToAdd);
                localCartItems.push(itemToAdd);
            }
            writeLocalCartItemsToLocalStorage(localCartItems, skipCallToServer);
        }

        function removeOneProductFromCartItems(productToRemove, localCartItems, skipCallToServer){
            var i;
            //im gonna assume that the product is in the cart...
            if(productToRemove.isCustom){
                for (i = 0; i < localCartItems.length; i++) {
                    var cartItem = localCartItems[i];
                    if (cartItem.product.name == productToRemove.name) {
                        //we will not go negative, its like a friendly political campaign
                        if (cartItem.qty > 0) {
                            if (productToRemove.product_type == byWeightProductType){
                                cartItem.qty  = parseFloat(cartItem.qty) - byWeightAmount;
                                if(cartItem.qty == 0){
                                    removeProductsCartItemFromCart(productToRemove);
                                    return;
                                }
                                callServerSubtractForCartItem(cartItem);
                                writeLocalCartItemsToLocalStorage(localCartItems, skipCallToServer);
                                return;
                            } else if (productToRemove.bogo){
                                cartItem.qty  = parseFloat(cartItem.qty) - bogoAmount;
                                if(cartItem.qty == 0){
                                    removeProductsCartItemFromCart(productToRemove);
                                    return;
                                }
                                callServerSubtractForCartItem(cartItem);
                                writeLocalCartItemsToLocalStorage(localCartItems, skipCallToServer);
                                return;
                            }
                            cartItem.qty--;
                            if(cartItem.qty == 0){
                                removeProductsCartItemFromCart(productToRemove);
                                return;
                            }
                            callServerSubtractForCartItem(cartItem);
                        }

                        break;
                    }
                }
            } else {
                for (i = 0; i < localCartItems.length; i++) {
                    var cartItem = localCartItems[i];
                    if (cartItem.product.id == productToRemove.id) {
                        //we will not go negative, its like a friendly political campaign
                        if (cartItem.qty > 0) {
                            if (productToRemove.product_type == byWeightProductType){
                                cartItem.qty  = parseFloat(cartItem.qty) - byWeightAmount;
                                if(cartItem.qty == 0){
                                    removeProductsCartItemFromCart(productToRemove);
                                    return;
                                }
                                callServerSubtractForCartItem(cartItem);
                                writeLocalCartItemsToLocalStorage(localCartItems, skipCallToServer);
                                return;
                            } else if (productToRemove.bogo){
                                cartItem.qty  = parseFloat(cartItem.qty) - bogoAmount;
                                if(cartItem.qty == 0){
                                    removeProductsCartItemFromCart(productToRemove);
                                    return;
                                }
                                callServerSubtractForCartItem(cartItem);
                                writeLocalCartItemsToLocalStorage(localCartItems, skipCallToServer);
                                return;
                            }
                            cartItem.qty--;
                            if(cartItem.qty == 0){
                                removeProductsCartItemFromCart(productToRemove, skipCallToServer);
                                return;
                            }
                            callServerSubtractForCartItem(cartItem);
                        }
                        break;
                    }
                }
            }
            writeLocalCartItemsToLocalStorage(localCartItems, skipCallToServer);
        }

        function removeOneProductFromCart(productToRemove) {
            $log.info('removeOneProductFromCart');
            var localCartItems = getLocalCartItems();
            removeOneProductFromCartItems(productToRemove, localCartItems, true);
        }

        function updateNoteOnItem(itemToUpdateWithNotes) {
            var localCartItems = getLocalCartItems();
            updateNoteOnItemInCartItems(itemToUpdateWithNotes, localCartItems, true);
        }

        function updateNoteOnItemInCartItems(itemToUpdateWithNotes, localCartItems, skipCallToServer){
            var i;
            var cartItem;
            //need to use custom because they are id'd by name not id
            if(itemToUpdateWithNotes.product.isCustom){
                for (i = 0; i < localCartItems.length; i++) {
                    cartItem = localCartItems[i];
                    if (cartItem.product.name == itemToUpdateWithNotes.product.name) {
                        cartItem.note = itemToUpdateWithNotes.note;
                        callServerSaveForCartItemNotes(cartItem);
                        break;
                    }
                }
            } else {
                for (i = 0; i < localCartItems.length; i++) {
                    cartItem = localCartItems[i];
                    if (cartItem.product.id == itemToUpdateWithNotes.product.id) {
                        cartItem.note = itemToUpdateWithNotes.note;
                        callServerSaveForCartItemNotes(cartItem);
                        break;
                    }
                }
            }
            writeLocalCartItemsToLocalStorage(localCartItems, skipCallToServer);
        }

        function clearCart() {
            var cartItems = [];
            emptyServerCart();
            writeLocalCartItemsToLocalStorage(cartItems, true);
        }

        function getCartItemCount () {
            var count = 0;
            angular.forEach(getLocalCartItems(), function(cartItem,key) {
                count += parseFloat(cartItem.qty);
            });
            return count;
        }

        function getLocalCartItems() {
            var localCartItems = null;
            var cartString = window.localStorage[keyLocalCartItems];
            if(cartString) {
                localCartItems = angular.fromJson(cartString);
            } else {
                return [];
            }
            return localCartItems;
        }

        function writeLocalCartItemsToLocalStorage(localCartItems, skipCallToSync) {
            try {
                window.localStorage[keyLocalCartItems] = angular.toJson(localCartItems);
                $rootScope.$broadcast('cart.items.saved.refresh');
            } catch (exception) {
                LogService.critical(exception);
            }

            try {
                if(!skipCallToSync){
                    broadcastCartItemsChanged(localCartItems);
                }
            } catch (exception) {
                LogService.critical(exception);
            }

        }

    }
})();
