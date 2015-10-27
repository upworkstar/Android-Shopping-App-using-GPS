/**
 * Created by JH
 */


(function () {
    'use strict';

    angular.module('GrubrollApp').controller('CheckoutController', [
        '$scope',
        '$rootScope',
        '$ionicModal',
        'ShoppingService',
        'UserOrderService',
        '$log',
        '$stateParams',
        '$state',
        'UIUtil',
        'common',
        '$ionicHistory',
        'LogService',
        '$ionicPopover',
        'AccountService',
        'FriendBuyService',
        'ShareModalProvider',
        'AuthService',
        'DeliveryWindowSelectorProvider',
        CheckoutController]);

    function CheckoutController($scope,
                                $rootScope,
                                $ionicModal,
                                ShoppingService,
                                UserOrderService,
                                $log,
                                $stateParams,
                                $state,
                                UIUtil,
                                common,
                                $ionicHistory,
                                LogService,
                                $ionicPopover,
                                AccountService,
                                FriendBuyService,
                                ShareModalProvider,
                                AuthService,
                                DeliveryWindowSelectorProvider) {

        var viewModel = this;

        var resetAddress = true;
        var resetCard = true;
        var needsRefresh = false;
        viewModel.title = "Checkout";
        var order =  new common.Order();

        viewModel.checkout = {
            selectedAddress: null,
            deliveryWindow: null,
            selectedCard: null
        };

        $scope.guest_account = function(){
            return AccountService.isCustomerGuest();
        };

        var buildUpOrderObject = function() {
            order = new common.Order();
            if(viewModel.checkout.selectedAddress) {
                order.customer_address_id = viewModel.checkout.selectedAddress.id;
            }
            if(viewModel.checkout.deliveryWindow) {
                order.time_slot_id = viewModel.checkout.deliveryWindow.time_slot_id;
            }
            if(viewModel.checkout.selectedCard) {
                order.credit_card_id = viewModel.checkout.selectedCard.id;
            }
            order.notes = viewModel.notes;
            addOrderLinesToOrderObject();
        };

        var addOrderLinesToOrderObject = function() {
            var i;
            order.order_lines = [];
            for(i = 0; i < viewModel.cart.length; i++ ) {
                var cartItem = viewModel.cart[i];
                if(cartItem.product.isCustom) {
                    var orderLine = new common.CustomOrderLine();
                    orderLine.requested_qty = cartItem.qty;
                    orderLine.requested_product_attributes.description = cartItem.product.name;
                    orderLine.notes = cartItem.note;
                    order.order_lines.push(orderLine);
                } else {
                    var orderLine = new common.OrderLine();
                    orderLine.requested_product_id = cartItem.product.id;
                    orderLine.requested_qty = cartItem.qty;
                    orderLine.notes = cartItem.note;
                    order.order_lines.push(orderLine);
                }
            }
        };

        viewModel.showDeliveryWindowSelector = function(){
            var windows = viewModel.newOrder.time_slots;
            var selectedWindow = viewModel.checkout.deliveryWindow;
            DeliveryWindowSelectorProvider.showSelectDeliveryWindowModal($scope, windows, selectedWindow)
                .then(function(newSelectedWindow){
                    viewModel.checkout.deliveryWindow = newSelectedWindow;
                })
        };

        viewModel.checkOrder = function(){
            if(!viewModel.checkout){
                return false;
            }
            if(!viewModel.checkout.selectedAddress){
                UIUtil.showErrorAlert('Please select an address.');
                return false;
            }
            if(!viewModel.checkout.deliveryWindow ){
                UIUtil.showErrorAlert('Please select a delivery window.');
                return false;
            }
            if (!viewModel.checkout.selectedCard){
                UIUtil.showErrorAlert('Please select payment method.');
                return false;
            }
            return true;
        };

        function removeSelectedTimeSlotFromArrayThatIsNotAvailable() {
            try {

                var indexToRemove = viewModel.newOrder.time_slots.indexOf(viewModel.checkout.deliveryWindow);
                if (indexToRemove > -1) {
                    viewModel.newOrder.time_slots[indexToRemove].available = false;
                }
                if(viewModel.checkout.deliveryWindow) {
                    viewModel.checkout.deliveryWindow = null;
                }
            } catch (exception) {
                LogService.error('removeSelectedTimeSlotFromArrayThatIsNotAvailable' + exception)
            }
        }

        function showSubmitOrderErrorMessage(error) {
            try {
                if(!error.errors){
                    UIUtil.showAlert('Problem Submitting Order', 'Not able to submit your order at this time. \n\n' + JSON.stringify(error));
                }
                var title = 'Problem Submitting Order';
                var message = '';
                var i;
                if(error.errors.base){
                    for (i=0; i< error.errors.base.length; i++) {
                        message += '\n';
                        message += error.errors.base[i];
                    }
                }
                if(error.errors.subscription){
                    title = 'Subscription';
                    for (i=0; i< error.errors.subscription.length; i++) {
                        message += '\n';
                        message += error.errors.subscription[i];
                    }
                }
                if(error.errors.time_slot) {
                    for (i=0; i< error.errors.time_slot.length; i++) {
                        if(error.errors.time_slot[i] == "should be available_for_delivery") {
                            message += 'Selected Delivery Window is no longer available. Please select another delivery window';
                            removeSelectedTimeSlotFromArrayThatIsNotAvailable();
                        } else {
                            message += '\n';
                            message += 'Delivery Window ';
                            message += error.errors.base[i];
                        }
                    }
                }

                UIUtil.showAlert(title, message);
            } catch (exception) {
                LogService.error(exception);
                UIUtil.showAlert('Problem Submitting Order', 'Not able to submit your order at this time.');
            }
        }

 
        viewModel.submitOrder = function() {

            if(viewModel.checkOrder()){
                UIUtil.showLoading();
                buildUpOrderObject();
                $log.info("submitOrder" , order);
 
                 var customer_id = AuthService.getCustomerInfo().id;
                 order.user_id = customer_id;
 
                UserOrderService.postNewOrder(order)
                    .then(function(createdOrder){
                        viewModel.createdOrder = createdOrder;
                        viewModel.orderCompleteModal.show();
                        ShoppingService.clearCart();
                        UIUtil.hideLoading();
                    },function(error){
                        LogService.error(['submitOrder error ', error, order]);
                        showSubmitOrderErrorMessage(error);
                        UIUtil.hideLoading();
                    });
            }
 
        };

        viewModel.addressChanged = function() {
            if(!viewModel.checkout.selectedAddress){
                resetAddress = true;
                viewModel.addAddress();
            }
        };

        viewModel.cardChanged = function() {
            if(!viewModel.checkout.selectedCard){
                resetCard = true;
                viewModel.addCard();
            }
        };

        $ionicModal.fromTemplateUrl('app/groceries/shop/checkOut/orderComplete.html', {
            scope: $scope,
            backdropClickToClose: false,
            hardwareBackButtonClose: false
        }).then(function(acdmodal) {
            viewModel.orderCompleteModal = acdmodal;
        });

        viewModel.closeCompleteModal = function(){
            viewModel.orderCompleteModal.hide();
            //navigate back to home screen
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
            // Go back to home
            $state.go('app.categories');

        };

        function selectFirstItemsForOrder() {
            if(viewModel.newOrder) {
                viewModel.checkout.selectedAddress = viewModel.newOrder.available_customer_addresses[0];
                viewModel.checkout.selectedCard = viewModel.newOrder.available_credit_cards[0];
            }
        }

        function loadData() {
            UIUtil.showLoading();
            viewModel.cart = angular.fromJson($stateParams.cart);
            $log.info('cart items passed to checkout:' , viewModel.cart);
            viewModel.subtotal = ShoppingService.getCartTotal();
            addOrderLinesToOrderObject();
 
             var customer_id = AuthService.getCustomerInfo().id;
             order.user_id = customer_id;

            UserOrderService.getNewOrderForCustomer(order)
                .then(function(data){
                    viewModel.newOrder = data;
                    $log.info('new order', data);
                    selectFirstItemsForOrder();
                    UIUtil.hideLoading();
                }, function(error){
                    if(isSubscriptionError(error)) {
                        //continue to checkout screen
                        viewModel.subscriptionErrorDontAllowCheckout = true;
                        viewModel.subscriptionErrorMessage = '';
                        viewModel.newOrder = error;
                        selectFirstItemsForOrder();
                        if(error.errors.subscription){
                            for (var i=0; i< error.errors.subscription.length; i++) {
                                viewModel.subscriptionErrorMessage += ' \n';
                                viewModel.subscriptionErrorMessage += error.errors.subscription[i];
                            }
                        }
                        UIUtil.hideLoading();
                    }
                    if(isLaunchError(error)){
                        viewModel.launchErrorDontAllowCheckout = true;
                        viewModel.launchErrorMessage = '';
                        viewModel.newOrder = error;
                        selectFirstItemsForOrder();
                        if(error.errors.launch){
                            for (var i=0; i< error.errors.launch.length; i++) {
                                viewModel.launchErrorMessage += ' \n';
                                viewModel.launchErrorMessage += error.errors.launch[i];
                            }
                        }
                        UIUtil.hideLoading();
                    }
                    if(!isSubscriptionError(error) && !isLaunchError(error)){
                        var logError = {
                            message:'loadData create new order error',
                            error: error,
                            cart: viewModel.cart
                        };
                        LogService.error(logError);
                        UIUtil.hideLoading();
                        $log.error('error', error);
                        showNewOrderError(error);
                        $ionicHistory.goBack();
                    }
                });
        }

        function isLaunchError(error){
            if(error && error.errors && error.errors.launch) {
                return true;
            }
            return false;
        }
        function isSubscriptionError(error){
            if(error && error.errors && error.errors.subscription) {
                return true;
            }
            return false;
        }

        function showNewOrderError(error) {
            var title = "Checkout";
            var message = "Error getting new order for checkout. \n\n";
            try {
                if(!error.errors){
                    UIUtil.showAlert(title, message + '\n\n' + JSON.stringify(error));
                    return;
                }
                var message = "";

                var i;
                if(error.errors.base){
                    for (i=0; i< error.errors.base.length; i++) {
                        message += '\n';
                        message += error.errors.base[i];
                    }
                }
                if(error.errors.subscription){
                    title = 'Subscription';
                    for (i=0; i< error.errors.subscription.length; i++) {
                        message += '\n';
                        message += error.errors.subscription[i];
                    }
                }

                UIUtil.showAlert(title, message);

            } catch ( exception ) {
                LogService.error(exception);
                UIUtil.showAlert(title, message + '\n\n' +  JSON.stringify(error));
            }
        }

        function callGetNewOrderForNewAddressSelected() {
            UIUtil.showLoading();
            buildUpOrderObject();
            UserOrderService.getNewOrderForCustomer(order)
                .then(function(data){
                    viewModel.checkout.deliveryWindow = null;
                    viewModel.newOrder.total_with_tax = data.total_with_tax;
                    viewModel.newOrder.requested_tax = data.requested_tax;
                    viewModel.newOrder.delivery_fee = data.delivery_fee;
                    viewModel.newOrder.total_with_tax = data.total_with_tax;
                    viewModel.newOrder.available_time_slots = data.available_time_slots;
                    viewModel.newOrder.time_slots = data.time_slots;
                    $log.info('callGetNewOrder new order', data);
                    UIUtil.hideLoading();
                }, function(error){
                    if(isSubscriptionError(error)) {
                        //continue to checkout screen
                        viewModel.subscriptionErrorDontAllowCheckout = true;
                        viewModel.subscriptionErrorMessage = '';
                        if(error.errors.subscription){
                            for (var i=0; i< error.errors.subscription.length; i++) {
                                viewModel.subscriptionErrorMessage += ' \n';
                                viewModel.subscriptionErrorMessage += error.errors.subscription[i];
                            }
                        }

                        viewModel.checkout.deliveryWindow = null;
                        viewModel.newOrder.total_with_tax = error.total_with_tax;
                        viewModel.newOrder.requested_tax = error.requested_tax;
                        viewModel.newOrder.delivery_fee = error.delivery_fee;
                        viewModel.newOrder.total_with_tax = error.total_with_tax;
                        viewModel.newOrder.available_time_slots = error.available_time_slots;
                        viewModel.newOrder.time_slots = error.time_slots;
                        $log.info('callGetNewOrder new order', error);
                        UIUtil.hideLoading();
                    }
                    if(isLaunchError(error)){
                        viewModel.launchErrorDontAllowCheckout = true;
                        viewModel.launchErrorMessage = '';
                        selectFirstItemsForOrder();
                        if(error.errors.launch){
                            for (var i=0; i< error.errors.launch.length; i++) {
                                viewModel.launchErrorMessage += ' \n';
                                viewModel.launchErrorMessage += error.errors.launch[i];
                            }
                        }
                        viewModel.checkout.deliveryWindow = null;
                        viewModel.newOrder.total_with_tax = error.total_with_tax;
                        viewModel.newOrder.requested_tax = error.requested_tax;
                        viewModel.newOrder.delivery_fee = error.delivery_fee;
                        viewModel.newOrder.total_with_tax = error.total_with_tax;
                        viewModel.newOrder.available_time_slots = error.available_time_slots;
                        viewModel.newOrder.time_slots = error.time_slots;
                        $log.info('callGetNewOrder new order', error);
                        UIUtil.hideLoading();
                    }
                    if(!isSubscriptionError(error) && !isLaunchError(error)){
                        var logError = {
                            message:'callGetNewOrderForNewAddressSelected create new order error',
                            error: error,
                            cart: viewModel.cart
                        };
                        LogService.error(logError);
                        UIUtil.hideLoading();
                        $log.error('error', error);
                        showNewOrderError(error);
                        $ionicHistory.goBack();
                    }
                });
        }

        $scope.$watch('viewModel.checkout.selectedAddress',function(newValue, oldValue){
            $log.debug('WATCH: ', newValue);
            if(newValue) {
                $log.debug('WATCH LOAD DATA');
                callGetNewOrderForNewAddressSelected();
            }
        });

        viewModel.addCard = function() {
            $state.go('app.addEditCard', {card: angular.toJson(null)});
        };

        viewModel.addAddress = function() {
            $state.go('app.addEditAddress', {address: angular.toJson(null)});
        };

        $rootScope.$on('refresh.user-data', function(){
            console.log('CheckoutController');
            needsRefresh = true;
        });

        $scope.$on('$ionicView.beforeEnter', function() {
            if(needsRefresh){
                loadData();
                needsRefresh = false;
            }
            //only going to reset the address or card if it needs to be changed back from the "add" option.
            if(viewModel.newOrder) {
                if (resetAddress) {
                    viewModel.checkout.selectedAddress = viewModel.newOrder.available_customer_addresses[0];
                    resetAddress = false;
                }
                if (resetCard) {
                    viewModel.checkout.selectedCard = viewModel.newOrder.available_credit_cards[0];
                    resetCard = false;
                }
            }
        });

        loadData();

        var previousNotesPopover = null;

        function getOldOrderNotess() {
            var orders = AccountService.getOrders();
            var notes = _.uniq( _.map(orders, function(order){ if(order.notes)return order.notes; }));
            return notes;
        }

        viewModel.viewPreviousNotes = function($event){
            $ionicPopover.fromTemplateUrl('templates/previousNotesPopover.html', {
                scope: $scope
            }).then(function(popover) {
                $scope.oldOrderNotess = getOldOrderNotess();
                previousNotesPopover = popover;
                previousNotesPopover.show($event);
            });
        };

        $scope.clickOldOrderNotes = function(notes) {
            if(viewModel.notes && viewModel.notes != '') {
                viewModel.notes += '\n\n' + notes;
            } else {
                viewModel.notes = notes;
            }
            previousNotesPopover.hide();
        };
    }
})();
