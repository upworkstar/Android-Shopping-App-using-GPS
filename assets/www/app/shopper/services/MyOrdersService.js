/**
 * Created by JH
 */


(function () {
    'use strict';

    var serviceId = 'MyOrdersService';

    angular.module('GrubrollShopperApp').factory(serviceId, ['$log','$rootScope', 'UIUtil', 'LogService', MyOrdersService]);
    var myOrdersKey = 'myOrders';
    function MyOrdersService($log ,$rootScope, UIUtil, LogService) {

        var service = {
            saveMyOrder: saveMyOrder,
            saveMyOrders: saveMyOrders,
            getMyOrders: getMyOrders,
            getOrder: getOrder,
            updateOneOfMyOrders: updateOneOfMyOrders,
            getOrderActualSubtotal: getOrderActualSubtotal,
            shouldSetOrderStatusToShopping: shouldSetOrderStatusToShopping
        };

        return service;

        function shouldSetOrderStatusToShopping(order) {
            if(order.status == 'shopping') {
                return false;
            } else {
                var oneWasInCart = false;
                for(var i = 0; i < order.order_lines.length; i++) {
                    if(order.order_lines[i].inCart){
                        oneWasInCart = true;
                    }
                }
                if(order.status == 'claimed' && oneWasInCart){
                    return true;
                }
                if (oneWasInCart) {
                    return false;
                } else {
                    return true;
                }
            }

        }

        function getOrder(id){
            try {
                $log.info('MyOrdersService.getOrder');
                var orders = getMyOrders();
                var index = orders.map(function (el) {
                    return el.id;
                }).indexOf(id);
                return orders[index];
            } catch (exception) {
                UIUtil.showErrorAlert('Error getting order by id.');
                LogService.error(exception);
            }
        }

        function updateOneOfMyOrders(order){
            try {
                $log.info('MyOrdersService.updateOneOfMyOrders', order);
                var orders = getMyOrders();
                var index = orders.map(function (el) {
                    return el.id;
                }).indexOf(order.id);
                orders[index] = order;
                saveOrdersLocal(orders);
            } catch (exception) {
                UIUtil.showErrorAlert('Error updating one of your orders.');
                LogService.error(exception);
            }
        }

        function saveMyOrder(order){
            try {
                $log.info('MyOrdersService.saveMyOrder', order);

                var orders = getMyOrders();
                if (orders == null) {
                    orders = [];
                    orders.push(order);
                    saveOrdersLocal(orders);
                    return;
                }
                mergeNewOrderIntoOrders(order, orders);
                saveOrdersLocal(orders);
                return orders;
            } catch (exception) {
                UIUtil.showErrorAlert('Error saving order.');
                LogService.error(exception);
            }
        }

        function getOrderActualSubtotal(order) {
            try {
                var total = 0;
                angular.forEach(order.order_lines, function(order_line){

                    if(order_line.actual_product){
                        console.log(order_line.actual_qty + '*' + order_line.actual_product.price);
                        total += (order_line.actual_qty * order_line.actual_product.price);
                    }
                });
                return total;
            } catch (exception) {
                UIUtil.showErrorAlert('Error getting the subtotal.');
                LogService.error(exception);
            }
        }

        function saveMyOrders(newOrders){
            try {
                $log.info('MyOrdersService.saveMyOrders', newOrders);
                //loop through.. find ones that dont exist and add them to the array...
                //need to take out the ones that are in the local copy but not the new copy...??
                var orders = [];
                orders = getMyOrders();
                if (orders == null) {
                    saveOrdersLocal(newOrders);
                    return;
                }
                angular.forEach(newOrders, function (order, index) {
                    mergeNewOrderIntoOrders(order, orders);
                }, orders);

                angular.forEach(orders, function (order, index) {
                    var i = newOrders.map(function (el) {
                        return el.id;
                    }).indexOf(order.id);
                    if (i < 0) {
                        this.splice(index, 1);
                    }
                }, orders);
                saveOrdersLocal(orders);
                return orders;
            } catch (exception) {
                UIUtil.showErrorAlert('Error updating orders.');
                LogService.error(exception);
            }
        }

        function mergeNewOrderIntoOrders(newOrder, orders){
            try {
                var index = orders.map(function(el) {
                    return el.id;
                }).indexOf(newOrder.id);
                if(index < 0){
                    orders.push(newOrder);
                } else {
                    //copy some info over to the order that is saved locally from the one that has been updated.
                    var oldOrder = angular.copy(orders[index]);
                    orders[index] = newOrder;
                    if(oldOrder.photo_id) {
                        orders[index].photo_id = oldOrder.photo_id;
                    }
                    orders[index].order_lines = mergeOrderLinesPreservingShoppingData(newOrder, oldOrder);
                }
            }catch (exception) {
                UIUtil.showErrorAlert('Error updating an order in the local cache.');
                LogService.error(exception);
            }
        }

        function mergeOrderLinesPreservingShoppingData (newOrder, oldOrder) {
            try {
                if(!oldOrder.order_lines) {
                    return newOrder.order_lines;
                }
                angular.forEach(newOrder.order_lines, function(newOrderLine, index){
                    //find the old order line that matches
                    var indexOfOldOrderLine = oldOrder.order_lines.map(function(el) {
                        return el.id;
                    }).indexOf(newOrderLine.id);
                    if(indexOfOldOrderLine > -1) {
                        var oldOrderLine = oldOrder.order_lines[indexOfOldOrderLine];
                        newOrderLine.actual_product = oldOrderLine.actual_product;
                        newOrderLine.notFound = oldOrderLine.notFound;
                        newOrderLine.actual_qty = oldOrderLine.actual_qty;
                        newOrderLine.inCart = oldOrderLine.inCart;
                        newOrderLine.actual_product_type = oldOrderLine.actual_product_type;
                    }
                });
                return newOrder.order_lines;
            } catch (exception) {
                LogService.error(exception);
                return oldOrder.order_lines;
            }
        }

        function saveOrdersLocal(orders){
            try {
                window.localStorage[myOrdersKey] = angular.toJson(orders);
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
    }
})();
