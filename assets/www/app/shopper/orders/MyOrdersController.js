/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('GrubrollShopperApp').controller('MyOrdersController', [
        '$scope',
        '$rootScope',
        '$state',
        '$log',
        '$ionicPopover',
        '$ionicScrollDelegate',
        'AuthService',
        'OrderService',
        'UIUtil',
        'LogService',
        '$q',
        'ShoppingListService',
        '$ionicAnalytics',
        'FeatureService',
        'NetworkConnectionService',
        'common',
        MyOrdersController]);

    function MyOrdersController($scope,
                                $rootScope,
                                $state,
                                $log,
                                $ionicPopover,
                                $ionicScrollDelegate,
                                AuthService,
                                OrderService,
                                UIUtil,
                                LogService,
                                $q,
                                ShoppingListService,
                                $ionicAnalytics,
                                FeatureService,
                                NetworkConnectionService,
                                common) {

        $scope.availableTitle = "Available Orders";
        $scope.currentTitle = "Your Orders";
        $scope.loadingSpinner = false;
        var needsRefresh = true;

        $scope.active = 'claimed';
        $scope.claimedText = "Claimed";
        FeatureService.showAvailableOrders()
            .then(function(showAvailableOrders){
                if(!showAvailableOrders){
                    $scope.claimedText = "Assigned";
                }
            });

        $scope.setActive = function(type) {
            $scope.active = type;
        };

        $scope.showShoppingListButton = function(order) {
            return order.status != 'processed';
        };

        $scope.getOrderStatusBadgeClass = function(order) {
            if(order.status == 'processed'){
                return 'badge-calm';
            } else if(order.status == 'shopping'){
                return 'badge-positive';
            } else if(order.status == 'claimed'){
                return 'badge-stable';
            }
        };

        $scope.isActive = function(type) {
            return type === $scope.active;
        };

        $scope.claimedFilter = function (item) {
            return item.status === 'claimed' || item.status === 'shopping';
        };

        $scope.getCustomerNameString = function (name){
            return common.getNameWithLastRemoved(name);
        };

        $scope.processedFilter = function (item) {
            return item.status === 'processed';
        };

        $scope.claim = function( order ) {
            console.log('claiming order',order );
            UIUtil.showYesNoConfirm('Claim Order','Are you sure you want to claim this order? \n\nTime Slot: ' + order.time_window + '.')
                .then(function(confirmed) {
                    if(confirmed) {
                        UIUtil.showLoading('Claiming Order...');
                        OrderService.claimOrder(order).then(function(data){
                                $log.info('order successfully claimed', data);
                                UIUtil.hideLoading();
                                UIUtil.showLoading('Refreshing Available Orders...')
                                loadOrders();
                            },
                            function(error){
                                UIUtil.hideLoading();
                                UIUtil.showErrorAlert('Error Claiming Order\n\n' + JSON.stringify(error));
                                var errorObj = {
                                    order: order,
                                    description: 'Error Claiming an order. OrderService.claimOrder.',
                                    actualError: error
                                };
                                LogService.critical(errorObj);
                            });
                    }
                });
        };

        $scope.showOrderDetail = function(order) {
            $log.info('order detail', order);
            $state.go('app.orderDetail', {order: angular.toJson(order)});
        };

        $scope.$on('user.loggedin', function () {
            loadOrders();
        });

        $scope.$on('$ionicView.beforeEnter', function() {
            $ionicScrollDelegate.scrollTop();
            if(needsRefresh){
                showLoadingSpinner();
                loadOrders();
            }
        });

        $scope.$on('$ionicView.afterEnter', function() {
            angular.forEach($scope.currentOrders, function(order) {
                order.inShoppingList = ShoppingListService.isOrderInShoppingList(order);
            });
        });

        $rootScope.$on('refresh_orders_list', function () {
            $log.debug('refresh_orders_list HANDLED');
            needsRefresh = true;
        });

        $scope.shoppingListCount = function() {
            return ShoppingListService.getOrdersInShoppingList().length;
        };

        $scope.markOrderAsDelivered = function(order){
            UIUtil.showConfirm('Mark Order as Delivered','You are sure that you delivered this order?')
                .then(function(doIt){
                    if(doIt) {
                        UIUtil.showLoading('Marking order as delivered...');
                        OrderService.orderDelivered(order)
                            .then(function(data){
                                $log.info('OrderService.orderDelivered Success', data);
                                LogService.info('Marked Order As Delivered. Order ID:'+ order.id);
                                showLoadingSpinner();
                                loadOrders();
                            }, function(error){
                                UIUtil.showAlert('Error', 'Order was not marked as delivered.\n\n' + JSON.stringify(error));
                                showLoadingSpinner();
                                loadOrders();
                                var errorObj = {
                                    order: order,
                                    description: 'Error Marking an order as delivered.',
                                    actualError: error
                                };
                                LogService.error(errorObj);
                            });
                    }
                });
        };

        $scope.$on('refresh_orders_list', function () {
            $log.debug('refresh_orders_list HANDLED');
            needsRefresh = true;
        });

        $scope.doRefresh = function() {
            loadOrders();
        };

        $scope.refreshButtonClick = function() {
            showLoadingSpinner();
            loadOrders();
        };

        var loadOrders = function() {
            try {
                if(AuthService.getCustomerInfo() == null) {
                    return;
                }

                if(!$scope.currentOrders) {
                    $ionicScrollDelegate.scrollTop();
                    showLoadingSpinner();
                }

                if(NetworkConnectionService.isOffline()){
                    UIUtil.hideLoading();
                    hideLoadingSpinner();
                    refreshComplete();
                    return;
                }

                $q.all([
                    loadMyOrders()
                ]).then(function(data) {
                    refreshComplete();
                    UIUtil.hideLoading();
                    hideLoadingSpinner();
                });

                needsRefresh = false;


            } catch (exception) {
                refreshComplete();
                UIUtil.hideLoading();
                UIUtil.showErrorAlert('Exception when loading orders');
                LogService.critical(exception);

            }
        };

        function loadMyOrders() {
            return OrderService.getAllMyOrders()
                .then(function (allOrders) {
                    $scope.currentOrders = allOrders;
                    angular.forEach($scope.currentOrders, function(order) {
                        order.inShoppingList = ShoppingListService.isOrderInShoppingList(order);
                    });
                },
                function (error) {
                    LogService.error(error);
                    hideLoadingSpinner();
                    LogService.critical(['error loading available orders', error]);
                    UIUtil.showAlert('Could Not Load Orders','Not able to load your orders. \n\n' + JSON.stringify(error));
                    refreshComplete();
                });
        }

        var refreshComplete = function(){
            $scope.$broadcast('scroll.refreshComplete');
        };

        $scope.orderPopover = null;
        $scope.openPopover = function(order, $event) {
            $ionicPopover.fromTemplateUrl('templates/orderPopover.html', {
                scope: $scope
            }).then(function(popover) {
                $scope.popoverOrder = order;
                $scope.orderPopover = popover;
                $scope.orderPopover.show($event);
            });
        };

        $scope.closePopover = function() {
            $scope.orderPopover.hide();
        };
        // Execute action on hide popover
        $scope.$on('popover.hidden', function() {
            $scope.popoverOrder = null;
        });

        function getAddressURl (address) {
            var addressString = address.street1 +
                (address.street2 ?  ' ' + address.street2 : '') +
                ' ' + address.city +
                ' ' + address.state +
                ' ' + address.zip_code;
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
        }

        $scope.addressClick = function(address){
            var url = getAddressURl(address);
            window.open(url, '_system', 'location=yes'); return false;
        };

        function showLoadingSpinner(){
            $scope.loadingSpinner = true;
        }

        function hideLoadingSpinner() {
            UIUtil.hideLoading();
            $scope.loadingSpinner = false;
        }

        $scope.addOrderToShoppingList = function(order) {
            order.inShoppingList = true;
            ShoppingListService.addOrderToShoppingList(order);
            $ionicAnalytics.track('Add Order To Shopping List');
        };

        $scope.removeOrderFromShoppingList = function(order) {
            order.inShoppingList = false;
            ShoppingListService.removeOrderFromShoppingList(order);
            $ionicAnalytics.track('Remove Order From Shopping List');
        };

        $scope.shoppingListClick = function() {
            $state.go('app.shoppingList');
        };

        loadOrders();
    };
})();
