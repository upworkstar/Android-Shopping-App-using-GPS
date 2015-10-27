/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('GrubrollShopperApp').factory('ProductListService', [
        '$http',
        'LogService',
        'AuthService',
        'UIUtil',
        'MyOrdersService',
        ProductListService]);

    function ProductListService(
        $http,
        LogService,
        AuthService,
        UIUtil,
        MyOrdersService) {

        $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();

        var service = {
            markProductAsNotFound: markProductAsNotFound
        };

        return service;

        function markProductAsNotFound (orderLine, orderId) {
            try {
                LogService.info(['setProductNotAvailable', orderLine, orderId]);
                if(orderLine.notFound) {
                    orderLine.notFound = false;
                } else {
                    UIUtil.showWarningAlertMessage("Make sure the customer does not want a substitution.");
                    orderLine.notFound = true;
                    orderLine.actual_qty = 0;
                }
                var gottenOrder = MyOrdersService.getOrder(orderId);
                var foundOrderLine = _.find(gottenOrder.order_lines, function(ol){ return ol.id == orderLine.id; });
                var index = gottenOrder.order_lines.indexOf(foundOrderLine);
                gottenOrder.order_lines[index] = orderLine;
                MyOrdersService.updateOneOfMyOrders(gottenOrder);
            } catch (exception) {
                LogService.error(['Error in setProductNotAvailable', exception, orderLine, orderId])
            }
        }

    }
})();
