/**
 * Created by JH
 */

(function () {
    'use strict';
    angular.module('GrubrollShopperApp').controller('OrderDetailController', [
        '$scope',
        '$state',
        '$stateParams',
        '$log',
        'UIUtil',
        '$ionicHistory',
        'OrderService',
        'MyOrdersService',
        '$cordovaSms',
        'LogService',
        'ShoppingListService',
        'common',
        '$ionicAnalytics',
        OrderDetailController]);

    function OrderDetailController($scope,
        $state,
        $stateParams,
        $log,
        UIUtil,
        $ionicHistory,
        OrderService,
        MyOrdersService,
        $cordovaSms,
        LogService ,
        ShoppingListService,
        common,
        $ionicAnalytics) {
            
        var viewModel = this;
        viewModel.title = "";
        viewModel.processModal = null;



        $scope.$on('$ionicView.beforeEnter', function() {
            $ionicAnalytics.track('Order Detail beforeEnter');
            loadData();
        });

        var loadData = function() {
            var order = angular.fromJson( $stateParams.order );
            $log.debug('OrderDetailController loadData: ', order);
            viewModel.order = MyOrdersService.getOrder(order.id);
            viewModel.order.inShoppingList = ShoppingListService.isOrderInShoppingList(order);
        };

        viewModel.shoppingListClick = function (order) {
            if(!order.inShoppingList) {
                order.inShoppingList = true;
                ShoppingListService.addOrderToShoppingList(order);
            } else {
                order.inShoppingList = false;
                ShoppingListService.removeOrderFromShoppingList(order);
            }
        };

        viewModel.shopOrder = function(order) {
            $log.info('shopping order', order);
            $state.go('app.list', {order: angular.toJson(order)});
        };

        viewModel.processOrderClick = function(){
            $log.info('going to summary screen');
            $state.go('app.orderSummary', {orderId: angular.toJson(viewModel.order.id)});
        };

        viewModel.orderDeliveredClick = function(){
            UIUtil.showLoading('Marking order as delivered...');
            OrderService.orderDelivered(viewModel.order)
                .then(function(data){
                    viewModel.order = data;
                    $log.info('OrderService.orderDelivered Success', data);
                    UIUtil.hideLoading();
                    LogService.info('Marked Order As Delivered. Order ID:'+ viewModel.order.id);
                    NavigateForOrderDelivered();
                }, function(error){
                    $log.error('OrderService.orderDelivered Error', error);
                    UIUtil.showAlert('Error', 'Order was not processed.\n\n' + JSON.stringify(error));
                    UIUtil.hideLoading();
                    var errorObj = {
                        order: viewModel.order,
                        description: 'Error Marking an order as delivered. OrderService.orderDelivered.',
                        actualError: error
                    };
                    LogService.critical(errorObj);
                });
        };

        viewModel.getCustomerNameString = function (name){
            return common.getNameWithLastRemoved(name);
        };

        function NavigateForOrderDelivered(){
            //navigate back to my orders page and re set the nav
            $ionicHistory.goBack();
        }

        viewModel.getAddressURl = function(address) {
            var addressString = address.street1 +
                (address.street2 ?  ' ' + address.street2 : '') +
                ' ' + address.city +
                ' ' + address.state +
                ' ' + (address.zip_code ? address.zip_code : address.zip);
            var isIOS = ionic.Platform.isIOS();
            addressString = encodeURIComponent(addressString);
            var url;
            if(isIOS) {
                //check if google or apple maps, could be a nice feature but not necessary
                url = "http://maps.apple.com/?q=" + addressString;
            } else {
                //its going to be google otherwise
                url = "http://maps.google.com/?q=" + addressString;
            }

            $log.debug('url for location', url);
            return url;
        };

        viewModel.addressClick = function(address){
            var url = viewModel.getAddressURl(address);
            window.open(url, '_system', 'location=yes'); return false;
        };

        viewModel.phoneClick = function(phoneNum, name) {
            $ionicAnalytics.track('Text Customer');
            OrderService.sendTextToCustomer(phoneNum, name, viewModel.order.id);
        };

        loadData();
    }
})();
