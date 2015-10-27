
(function () {
    'use strict';

    var serviceId = 'UserOrderService';

    angular.module('GrubrollApp').factory(serviceId, [
        '$http',
        '$q',
        '$log',
        'ApiEndpoint',
        'AuthService',
        'AccountService',
        'common',
        'LogService',
        'UIUtil',
        UserOrderService]);

    function UserOrderService($http,
                              $q,
                              $log,
                              ApiEndpoint,
                              AuthService,
                              AccountService,
                              common,
                              LogService,
                              UIUtil) {


        var service = {
            getNewOrderForCustomer: getNewOrderForCustomer,
            postNewOrder: postNewOrder,
            updateOrder:updateOrder,
            getLastOrderForCustomer: getLastOrderForCustomer,
            tipOrder:tipOrder,
            saveItemReconcileInfo: saveItemReconcileInfo
        };

        return service;

        function addDefaultHeaders(){
            $http.defaults.headers.common['X-Grubroll-API-Token'] = AuthService.getAuthToken();
        }

        function saveItemReconcileInfo(order_line, reason, comments) {
            var defer = $q.defer();
            addDefaultHeaders();
            var data = {
                order_line_id: order_line.id,
                reason: reason,
                comments: comments
            };
            $http({
                url: ApiEndpoint.apiurl + '/api/v1/customer_order_line_feedback.json' ,
                method: "post",
                data: data
            })
                .success(function(data){
                    LogService.info('success saveItemReconcileInfo',data);
                    defer.resolve(data);
                })
                .error(function(error){
                    LogService.error('error saveItemReconcileInfo',error);
                    defer.reject(order_line);
                });

            return defer.promise;
        }

        function getLastOrderForCustomer() {
            var defer = $q.defer();
            addDefaultHeaders();
            if(!AuthService.shouldMakeGrubrollApiCall()) {
                defer.resolve(null);
                return defer.promise;
            }
            $http({
                url: ApiEndpoint.apiurl + '/api/v1/orders/last.json' ,
                method: "GET"
            })
                .success(function(data){
                    $log.info('success getLastOrderForCustomer',data);
                    defer.resolve(data);
                })
                .error(function(error){
                    defer.reject(error);
                });

            return defer.promise;
        }

        function getNewOrderForCustomer(order){
            var defer = $q.defer();
            var orderReq = order;
            $log.info('orderReq getNewOrderForCustomer',orderReq);
 
             var customer_id = AuthService.getCustomerInfo().id;
             orderReq.user_id = customer_id;
            addDefaultHeaders();
            $http({
                url: ApiEndpoint.apiurl + AuthService.getCustomerInfo().new_order_url,
                method: "POST",
                data: orderReq
            })
                .success(function(data){
                    $log.info('success getNewOrderForCustomer');
                    defer.resolve(data);
                })
                .error(function(error){
                    defer.reject(error);
                });

            return defer.promise;
        }

        function postNewOrder(order) {
            var defer = $q.defer();
            $log.info('postNewOrder',order);
 
             var customer_id = AuthService.getCustomerInfo().id;
             order.user_id = customer_id;
 
            addDefaultHeaders();
            $http({
                url: ApiEndpoint.apiurl + '/api/v1/orders.json',
                method: "POST",
                data: order
            })
                .success(function(data){
                    $log.info('success postNewOrder',data);
                    AccountService.refreshCustomerInfo();
                    defer.resolve(data);
                })
                .error(function(error){
                    defer.reject(error);
                });

            return defer.promise;
        }

        function tipOrder (order){
            LogService.info(['start tipOrder',order]);
            var defer = $q.defer();
            addDefaultHeaders();
            $http({
                url: ApiEndpoint.apiurl + '/api/v1/orders/'+order.id+'/tip.json',
                method: "PUT",
                data: {tip: order.tip}
            })
                .success(function(data){
                    LogService.info(['success tipOrder',data]);
                    AccountService.refreshCustomerInfo();
                    defer.resolve(data);
                })
                .error(function(error){
                    LogService.error(['error tipOrder',error]);
                    UIUtil.showAlert('Not Able To Save Tip', 'There was an issue saving the tip you added. \n\n' + getTipErrorString(error));
                    defer.reject(error);
                });

            return defer.promise;
        }

        function getTipErrorString(error){
            if(error.errors){
                return JSON.stringify(error.errors);
            } else {
                return 'Please contact us if you continue to have this issue.';
            }
        }

        function updateOrder (orderToUpdate) {
            var i;
            var order = angular.copy(orderToUpdate);
            for(i = 0; i < order.order_lines.length; i++ ) {
                var order_line = order.order_lines[i];
                if(order_line.requested_product.isCustom) {
                    var orderLine = new common.CustomOrderLine();
                    orderLine.requested_qty = order_line.requested_qty;
                    orderLine.requested_product_attributes.description = order_line.requested_product.description;
                    orderLine.notes = order_line.notes;
                    order.order_lines[i] = orderLine;
                } else {
                    var orderLine = new common.OrderLine();
                    orderLine.requested_product_id = order_line.requested_product.id;
                    orderLine.requested_qty = order_line.requested_qty;
                    orderLine.notes = order_line.notes;
                    order.order_lines[i] = orderLine;
                }
            }
            LogService.info([orderToUpdate.id + ' :: User Editing Order', order]);
            addDefaultHeaders();
            return $http({
                url: ApiEndpoint.apiurl + '/api/v1/orders/update/'+order.id+'.json',
                method: "PATCH",
                data: order
            })
        }


    }
})();
