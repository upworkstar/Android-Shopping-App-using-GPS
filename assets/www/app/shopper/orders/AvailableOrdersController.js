/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('GrubrollShopperApp').controller('AvailableOrdersController', [
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
        'NetworkConnectionService',
        '$ionicAnalytics',
        AvailableOrdersController]);

    function AvailableOrdersController($scope,
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
                                       NetworkConnectionService,
                                       $ionicAnalytics) {

        $scope.availableTitle = "Available Orders";
        $scope.currentTitle = "Your Orders";
        $scope.loadingSpinner = false;
        var needsRefresh = true;

        $scope.active = 'claimed';

        $scope.setActive = function(type) {
            $scope.active = type;
        };

        $scope.isActive = function(type) {
            return type === $scope.active;
        };

        $scope.getCountForTab = function(tabName){
            if(tabName == 'claimed'){

            } else if(tabName == 'processed') {

            }
        };

        $scope.claimedFilter = function (item) {
            return item.status === 'claimed';
        };
        $scope.processedFilter = function (item) {
            return item.status === 'processed';
        };

        $scope.claim = function( order ) {
            UIUtil.showYesNoConfirm('Claim Order','Are you sure you want to claim this order? \n\nTime Slot: ' + order.time_window + '.')
                .then(function(confirmed) {
                    if(confirmed) {
                        UIUtil.showLoading('Claiming Order...');
                        OrderService.claimOrder(order).then(function(data){
                                LogService.info({
                                    message: 'Order Claimed by shopper.',
                                    order: data
                                });
                                UIUtil.hideLoading();
                                UIUtil.showLoading('Refreshing Available Orders...');
                                loadOrders();
                            },
                            function(error){
                                UIUtil.hideLoading();
                                UIUtil.showErrorAlert('Error Claiming Order\n\n' + JSON.stringify(error));
                            });
                    }
                });

            $ionicAnalytics.track('Claim Order');
        };

        $scope.showOrderDetail = function(order) {
            $log.info('order detail', order);
            $state.go('app.orderDetail', {order: angular.toJson(order)});
        };

        $scope.$on('user.loggedin', function () {
            loadOrders();
        });

        $scope.$on('$ionicView.afterEnter', function() {
            $ionicScrollDelegate.scrollTop();
            showLoadingSpinner();
            loadOrders();
        });

        $rootScope.$on('refresh_orders_list', function () {
            $log.debug('refresh_orders_list HANDLED');
            needsRefresh = true;
        });

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

                if(!$scope.orders) {
                    $ionicScrollDelegate.scrollTop();
                    showLoadingSpinner();
                }

                loadAvailable();


                needsRefresh = false;
            } catch (exception) {
                refreshComplete();
                UIUtil.hideLoading();
                UIUtil.showErrorAlert('Exception when loading orders');
                LogService.critical(exception);
            }
        };

        function loadAvailable(){
            if(NetworkConnectionService.isOffline()){
                refreshComplete();
                hideLoadingSpinner();
                UIUtil.hideLoading();
                return false;
            }
            OrderService.getAvailableOrders()
                .then(function(data){
                    refreshComplete();
                    hideLoadingSpinner();
                    UIUtil.hideLoading();
                    try {
                        $scope.orders = _.uniq(data, false, function(p){
                            return p ? p.id : p;
                        });
                    } catch (exception) {
                        //at least show orders from the server if something gets messed up with unique check
                        $scope.orders = data;
                        LogService.critical(exception);
                    }
                },
                function(error){
                    $log.error('problem loading available orders', error);
                    refreshComplete();
                    hideLoadingSpinner();
                    UIUtil.hideLoading();
                    LogService.critical(['Error Loading available orders',error]);
                    UIUtil.showAlert('Could Not Load Available Orders','Not able to load available orders. \n\n' + JSON.stringify(error));
                });
        }

        var refreshComplete = function(){
            $scope.$broadcast('scroll.refreshComplete');
        };

        $scope.getCountForScope = function(scopeName){
            if(!$scope.orders) return '';
            var count = 0;
            for(var i = 0; i < $scope.orders.length; i++){
                if($scope.orders[i].shopper_view_scope == scopeName) count ++;
            }
            return count;
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
        }

        $scope.addressClick = function(address){
            var url = getAddressURl(address);
            window.open(url, '_system', 'location=yes'); return false;
        };

        function showLoadingSpinner(){
            $scope.loadingSpinner = true;
        }

        function hideLoadingSpinner() {
            $scope.loadingSpinner = false;
        }

        $scope.addOrderToShoppingList = function(order) {
            order.inShoppingList = true;
            ShoppingListService.addOrderToShoppingList(order);
        };

        $scope.removeOrderFromShoppingList = function(order) {
            order.inShoppingList = false;
            ShoppingListService.removeOrderFromShoppingList(order);
        };

        $scope.shoppingListClick = function() {
            $state.go('app.shoppingList');
        };

        loadOrders();
    };
})();
