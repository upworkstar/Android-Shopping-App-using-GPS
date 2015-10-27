/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('GrubrollShopperApp').factory('GrubrollOrder', ['$log','LogService','MyOrdersService', GrubrollOrderModel]);

    function GrubrollOrderModel($log, LogService, MyOrdersService, ShoppingListService) {

        var localVariable = null;

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

        // instantiate our initial object
        var GrubrollOrder = function(jsonData) {
            _.extend(this, jsonData);
        };

        GrubrollOrder.prototype.inShoppingList = function() {
            var self = this;
            var orders = getLocalShoppingListOrderIds();
            var search = _.where(orders, self.id);
            if(search && search.length > 0) {
                return true;
            } else {
                return false;
            }
        };

        return GrubrollOrder;

    }
})();