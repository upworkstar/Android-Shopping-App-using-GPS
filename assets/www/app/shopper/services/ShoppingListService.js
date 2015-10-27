/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('GrubrollShopperApp').factory('ShoppingListService', ['$http','$q','$log', 'LogService', 'MyOrdersService', 'GrubrollOrder', ShoppingListService]);

    function ShoppingListService($http, $q, $log, LogService, MyOrdersService, GrubrollOrder) {

        var service = {
            addOrderToShoppingList: addOrderToShoppingList,
            removeOrderFromShoppingList: removeOrderFromShoppingList,
            getOrdersInShoppingList: getOrdersInShoppingList,
            isOrderInShoppingList: isOrderInShoppingList,
            getCountInShoppingList: getCountInShoppingList
        };

        var shoppingListKey = 'ordersShoppingListKey';

        var colorArray = [
            '#e74c3c', //red
            '#2ecc71', //green
            '#f1c40f', //yellow
            '#3498db', //blue
            '#f39c12', //orange
            '#9b59b6', //purple
            '#95a5a6' //gray
        ];

        return service;

        function getCountInShoppingList() {
            var orders = getLocalShoppingListOrderIds();
            $log.debug('getCountInShoppingList', orders.length)
            return orders.length;
        }

        function isOrderInShoppingList(order) {
            var orders = getLocalShoppingListOrderIds();
            var indesOfSearch = _.indexOf(orders, order.id);
            if(indesOfSearch > -1) {
                return true;
            } else {
                return false;
            }
        }

        function addOrderToShoppingList(orderToAdd) {
            try {
                var orders = getLocalShoppingListOrderIds();
                if(isOrderInShoppingList(orderToAdd)) {
                    $log.debug('order was already in the shopping list', orderToAdd.id);
                } else {
                    $log.debug('adding order to shopping list', orderToAdd.id);
                    orders.push(orderToAdd.id);
                    saveLocalShoppingListOrders(orders);
                }
                return orders;
            } catch (exception) {
                LogService.error(exception);
                throw exception;
            }
        }

        function removeOrderFromShoppingList(orderToRemove) {
            try {
                var orders = getLocalShoppingListOrderIds();
                var withoutOrder = _.without(orders, orderToRemove.id);
                saveLocalShoppingListOrders(withoutOrder);
                return orders;
            } catch (exception) {
                LogService.error(exception);
                throw exception;
            }
        }

        function removeIdFromShoppingListData(id) {
            try {
                var orders = getLocalShoppingListOrderIds();
                var withoutOrder = _.without(orders, id);
                saveLocalShoppingListOrders(withoutOrder);
                return orders;
            } catch (exception) {
                LogService.error(exception);
                throw exception;
            }
        }

        function getBackgroundColor(index) {
            try {
                if(index <= colorArray.length - 1) {
                    return colorArray[index];
                } else {
                    return colorArray[ _.random(0, colorArray.length - 1)];
                }
            } catch (exception) {
            }
        }

        function getOrdersInShoppingList() {
            try {
                var ids = getLocalShoppingListOrderIds();
                var orders = [];

                for (var i = 0, length = ids.length; i < length; i++) {
                    var getOrderId = ids[i];
                    var order = MyOrdersService.getOrder(getOrderId);
                    if(!order) {
                        try {
                            removeIdFromShoppingListData(getOrderId);
                        } catch (exception) {
                        }
                        continue;
                    }
                    order.backgroundColor = getBackgroundColor(i);
                    orders.push(order);
                }

                return orders;
            } catch (exception) {
                LogService.error(exception);
                throw exception;
            }
        }

        function saveLocalShoppingListOrders(orderIds){
            try {
                window.localStorage[shoppingListKey] = angular.toJson(orderIds);
            } catch (exception) {
                $log.error('error saveLocalShoppingListOrders', exception);
                LogService.error(exception);
            }
        }

        function getLocalShoppingListOrderIds(){
            try {
                var localString = window.localStorage[shoppingListKey];
                if(localString) {
                    return angular.fromJson(localString);
                } else {
                    return [];
                }
            } catch (exception) {
                $log.error('error getLocalShoppingListOrders', exception);
                LogService.error(exception);
            }
        }

    }
})();