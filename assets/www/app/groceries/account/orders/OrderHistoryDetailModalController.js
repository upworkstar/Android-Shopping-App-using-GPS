/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('GrubrollApp').controller('OrderHistoryDetailModalController', [
        '$scope',
        '$rootScope',
        'AccountService',
        'UIUtil',
        '$ionicModal',
        '$log',
        '$filter',
        'UserOrderService',
        'TippingModalProvider',
        'TextNotesModalProvider',
        '$ionicActionSheet',
        'ShareModalProvider',
        'ShoppingService',
        'FeatureService',
        OrderHistoryDetailModalController]);

    function OrderHistoryDetailModalController($scope,
                                               $rootScope,
                                               AccountService,
                                               UIUtil,
                                               $ionicModal,
                                               $log,
                                               $filter,
                                               UserOrderService,
                                               TippingModalProvider,
                                               TextNotesModalProvider,
                                               $ionicActionSheet,
                                               ShareModalProvider,
                                               ShoppingService,
                                               FeatureService) {

        var viewModel = this;
        viewModel.order = $scope.orderDetailOrder;
        var ratingModal = null;
        viewModel.noteModal = null;
        viewModel.addCustomProductToOpenOrderModel = null;
        viewModel.addProductToOrderSearchModal = null;
        $scope.addProductToOrder = null;

        function loadView() {
            var id = viewModel.order.id;
            AccountService.getOrder(id)
                .success(function(order){
                    $log.debug('order from serve', order);
                    angular.forEach(order.order_lines, function(order_line){
                        if(order_line.actual_product) {
                            if(order_line.actual_product_type == "CustomProduct") {
                                order_line.actual_product.isCustom = true;
                            }
                        }
                        if(order_line.requested_product_type == "CustomProduct") {
                            order_line.requested_product.isCustom = true;
                        }
                    });
                    viewModel.order = order;
                    UIUtil.hideLoading();
                })
                .error(function(error){
                    UIUtil.hideLoading();
                    UIUtil.showErrorAlert('Could not load Order Data.');
                });
        }

        function updateCurrentOrder(persistToServer) {
            if(persistToServer) {
                UIUtil.showLoading('Saving Order Changes...');
                UserOrderService.updateOrder(viewModel.order)
                    .success(function(updatedOrder){
                        $log.debug('updated', updatedOrder);
                        $rootScope.$broadcast('order.saved.refresh', updatedOrder);
                        loadView();
                        UIUtil.hideLoading();
                        viewModel.hasChanges = false;
                    })
                    .error(function(error){
                        showUpdateOrderErrorMessage(error);
                        UIUtil.hideLoading();
                    });
            } else {
                viewModel.hasChanges = true;
            }
        }

        function showUpdateOrderErrorMessage(error) {
            try {
                if(!error || !error.errors){
                    UIUtil.showErrorAlert('Error updating order info. \n\n' + JSON.stringify(error));
                }
                var message = '';
                var i;

                if(error.errors.base){
                    for (i=0; i< error.errors.base.length; i++) {
                        message += '\n';
                        message += ' ' + error.errors.base[i];
                    }
                }
                UIUtil.showErrorAlert('Error updating order info. \n\n' + message);

            } catch (exception) {
                UIUtil.showErrorAlert('Error updating order info. \n\n' + JSON.stringify(error));
            }
        }

        viewModel.addSpecialRequest = function() {
            if(viewModel.order.editable) {
                $ionicModal.fromTemplateUrl('app/groceries/account/orders/customProduct/addCustomProductToOpenOrder.html', {scope: $scope,focusFirstInput: true})
                    .then(function(modal) {
                        viewModel.addCustomProductToOpenOrderModel = modal;
                        viewModel.addCustomProductToOpenOrderModel.show();
                    });
            }
        };

        $scope.$on('close.addCustomProduct', function(event,data){
            if(viewModel.addCustomProductToOpenOrderModel)viewModel.addCustomProductToOpenOrderModel.hide();
            viewModel.addCustomProductToOpenOrderModel = null;
            if(data) {
                data.requested_qty = data.qty;
                data.isCustom = true;
                data.requested_product = {description: data.name, isCustom: true};
                viewModel.order.order_lines.push(data);
                updateCurrentOrder();
            }
        });

        viewModel.addProductToOrder = function(){
            //popup search modal
            if(viewModel.order.editable) {
                $scope.addProductToOrder = viewModel.order;
                $ionicModal.fromTemplateUrl('app/groceries/account/orders/addProduct/addProductToOrderSearch.html', {id:'addProductToOrderSearch',scope: $scope,focusFirstInput: true})
                    .then(function(modal) {
                        viewModel.addProductToOrderSearchModal = modal;
                        viewModel.addProductToOrderSearchModal.show();
                    });
            }
        };

        $scope.$on('update.OrderHistoryDetailModalController',function(event,order){
            viewModel.order = order;
            updateCurrentOrder();
        });

        $scope.$on('customProduct.addProductToOrderSearch',function(event,data){
            viewModel.addProductToOrderSearchModal.hide();
            viewModel.addSpecialRequest();
        });

        $scope.$on('close.addProductToOrderSearch', function(event,data){
            viewModel.addProductToOrderSearchModal.hide();
        });

        viewModel.shareOrder = function() {
            ShareModalProvider.showModal();
        };

        viewModel.editOrderNotes = function() {
            if(viewModel.order.editable) {
                $ionicModal.fromTemplateUrl('app/groceries/shop/cartProductNotes/cartProductNotes.html', {
                    scope: $scope,
                    focusFirstInput: true,
                    animation: 'scale-in'
                })
                    .then(function(modal) {
                        $scope.$broadcast('data.productNotes', {notes: viewModel.order.notes, title: "Order Notes"});
                        viewModel.noteModal = modal;
                        viewModel.noteModal.show();
                    });
            }
        };

 
         viewModel.editGrubrunnerComment = function() {
             if(!viewModel.order.editable) {
             $ionicModal.fromTemplateUrl('app/groceries/shop/cartProductNotes/cartProductNotes.html', {
                     scope: $scope,
                     focusFirstInput: true,
                     animation: 'scale-in'
                 })
             .then(function(modal) {
                   $scope.$broadcast('data.grubrunnerComment', {comment: viewModel.order.comment, title: "Comment on grubrunner"});
                   viewModel.noteModal = modal;
                   viewModel.noteModal.show();
                   });
             }
         };

        $scope.$on('close.orderNotes',function(event, data){
            viewModel.order.notes = data;
            viewModel.order.notesLoading = true;
            updateCurrentOrder();
            if(viewModel.noteModal)viewModel.noteModal.hide();
        });

        $scope.$on('cancel.orderNotes', function(){
            if(viewModel.noteModal)viewModel.noteModal.hide();
        });
 
        $scope.$on('close.grubrunnerComment',function(event, data){
            viewModel.order.comment = data;
            viewModel.order.notesLoading = true;
            updateCurrentOrder();
            if(viewModel.noteModal)viewModel.noteModal.hide();
        });
 
        $scope.$on('cancel.grubrunnerComment', function(){
            if(viewModel.noteModal)viewModel.noteModal.hide();
        });
 
        viewModel.getDisplayDate = function(dateString) {
            return moment(dateString).format("MMM Do YYYY, h:mm a");
        };

        viewModel.saveChanges = function() {
            updateCurrentOrder(true);
        };

        viewModel.getClassForItem = function (order_line) {
            var classString = "";
            classString += order_line.current_product.isCustom ? '':'item-thumbnail-left';
            if(viewModel.orderLineHasSub (order_line)) {
                classString += " sub-order-line-item"
            }
            if(viewModel.somethingWrongWithOrder){
                classString += " reconciliation-item"
            }
            return classString;
        };

        viewModel.somethingWrongWithOrderClick = function() {
            if(!viewModel.somethingWrongWithOrder) {
                //UIUtil.showAlert('Report Problems',
                //'Click the "Issue" button on items that are problems to report problems to us.')
                viewModel.somethingWrongWithOrder = true;
            } else {
                viewModel.somethingWrongWithOrder = false;
            }
        };

        viewModel.showSomethingWrongButton = function() {
            if(!FeatureService.showTipping()){
                return false;
            } else {
                return viewModel.order.status == "delivered" ;
            }
        };

        function isSameObject(obj1, obj2){
            return JSON.stringify(obj1) == JSON.stringify(obj2);
        }

        function isSameProduct(prod1, prod2){

            if(prod1.description && prod2.description){
                if(prod1.description == prod2.description) return true;
                return false;
            }
            if(prod1.id && prod2.id) {
                if(prod1.id == prod2.id) {
                    return true;
                } else {
                    return false;
                }
            }
            return isSameObject(prod1, prod2);
        }

        viewModel.orderLineHasSub = function(order_line) {
            if(order_line.actual_product) {
                if(isSameProduct(order_line.requested_product, order_line.actual_product)){
                    return false;
                } else {
                    return true;
                }
            }
            return false;
        };


        viewModel.cancelOrderDetail = function() {
            if(viewModel.hasChanges) {
                UIUtil.showYesNoConfirm('Save Order Changes', 'You have made changes to this order. Would you like to save them?')
                    .then(function(confirmed){
                        if(confirmed){
                            updateCurrentOrder(true);
                            $scope.closeOrderDetailModel();
                        } else {
                            $scope.closeOrderDetailModel();
                        }
                    })
            } else {
                $scope.closeOrderDetailModel();
            }
        };

        viewModel.rateOrderClick = function(order) {
            if($scope.orderDetailFromRateOrder ){
                viewModel.cancelOrderDetail();
                return;
            }
            $scope.rateOrder = order;
            $ionicModal.fromTemplateUrl('app/groceries/account/ratings/addRatingModal.html', {scope: $scope})
                .then(function(modal) {
                    ratingModal = modal;
                    ratingModal.show();
                });
        };

        $rootScope.$on('hide.add.rating', function(){
            if(ratingModal) ratingModal.hide();
        });

        $rootScope.$on('rating.saved.refresh', function(event, args){
            if(viewModel.order) {
                viewModel.order.rating = args;
            }
        });

        viewModel.showRating = function(order){
            return (order.status == "delivered" && order.rating);
        };

        viewModel.showReconciliation = function(){
            if(!FeatureService.showCustomerOrderLineFeedback()){
                return false;
            } else {
                return viewModel.order.status == "delivered";
            }
        };

        viewModel.getDisplayProductForOrderLine = function(order_line) {
            order_line.current_product = order_line.actual_product ? order_line.actual_product : order_line.requested_product;
            return order_line.current_product;
        };

        viewModel.getDisplayNameForProduct = function(product) {
            if(!product) return;
            if(product.isCustom) {
                return product.description;
            } else {
                if(product.brand_name) {
                    return product.brand_name + " " + product.name;
                } else {
                    return product.name;
                }
            }
        };

        viewModel.itemGoodClick = function(order_line) {
            order_line.reconciled = 'good';
        };

        viewModel.itemBadClick = function(order_line) {
            var hideSheet = $ionicActionSheet.show({
                buttons: [
                    { text: 'Something Wrong With Item' },
                    { text: 'Item Missing' },
                    { text: 'Wrong Item' }
                ],
                titleText: 'Item Feedback',
                cancelText: 'Cancel',
                destructiveButtonClicked: function(){
                    itemMarkedAsMissing();
                    return true;
                },
                cancel: function() {
                    // add cancel code..
                },
                buttonClicked: function(index) {
                    if(index == 0) {
                        somethingWrongWithItemGetFeedback(order_line, 'Something Wrong');
                    } else if (index == 1) {
                        somethingWrongWithItem(order_line, 'Item Missing');
                    } else if (index = 2) {
                        somethingWrongWithItem(order_line, 'Wrong Item');
                    }
                    return true;
                }
            });
        };

        function somethingWrongWithItem(order_line, text) {
            UIUtil.showLoading('Saving...');
            UserOrderService.saveItemReconcileInfo(order_line, text)
                .then(function(response){
                    loadView();
                    UIUtil.showAlert('Feedback Saved', 'Thank you for giving us your feedback on this item.');
                }, function(error){
                    UIUtil.hideLoading();
                    UIUtil.showAlert('Count Not Save Feedback', 'Sorry, but we were not able to save the feedback at this time.');
                });
        }

        function somethingWrongWithItemGetFeedback(order_line, text){
            TextNotesModalProvider.showModal($scope,text,"Let us know what is wrong with the item","")
                .then(function(reason){
                    UIUtil.showLoading('Saving...');
                    UserOrderService.saveItemReconcileInfo(order_line, text, reason)
                        .then(function(response){
                            loadView();
                            UIUtil.showAlert('Feedback Saved', 'Thank you for giving us your feedback on this item.');
                        }, function(error){
                            UIUtil.hideLoading();
                            UIUtil.showAlert('Count Not Save Feedback', 'Sorry, but we were not able to save the feedback at this time.');
                        });
                });
        }

        function itemMarkedAsMissing(order_line){
            UIUtil.showAlert('Item Missing',
                'Item has been marked as missing. We will be in contact with you for more details.')
        }

        viewModel.addEditNote = function(order_line) {
            $ionicModal.fromTemplateUrl('app/groceries/shop/cartProductNotes/cartProductNotes.html',
                {
                    scope: $scope,
                    focusFirstInput: true,
                    animation: 'scale-in'
                })
                .then(function(modal) {
                    viewModel.notePopoverItem = order_line;
                    $scope.$broadcast('data.productNotes',viewModel.notePopoverItem.notes);
                    viewModel.noteModal = modal;
                    viewModel.noteModal.show();
                });
        };

        $scope.$on('close.productNotes',function(event, data){
            if(viewModel.notePopoverItem){
                viewModel.notePopoverItem.notes = data;
                updateCurrentOrder();
                viewModel.notePopoverItem = null;
                if(viewModel.noteModal)viewModel.noteModal.hide();
            }
        });

        $scope.$on('cancel.productNotes', function(){
            viewModel.notePopoverItem = null;
            if(viewModel.noteModal)viewModel.noteModal.hide();
        });

        viewModel.addOneToOrderLine = function(orderLine){
            if (orderLine.requested_product.product_type == 'by weight'){
                orderLine.requested_qty = (parseFloat(orderLine.requested_qty) + .5 );
            } else {
                orderLine.requested_qty ++ ;
            }
            updateCurrentOrder();
        };

        viewModel.removeOneFromOrderLine = function(orderLine){
            if (orderLine.requested_product.product_type == 'by weight'){
                orderLine.requested_qty = (parseFloat(orderLine.requested_qty) - .5 );
            } else {
                orderLine.requested_qty -- ;
            }
            if(orderLine.requested_qty == 0) {
                viewModel.removeOrderLineCompletely (orderLine);
            }
            updateCurrentOrder();
        };

        viewModel.removeOrderLineCompletely = function(orderLine){
            var index;
            index = viewModel.order.order_lines.indexOf(orderLine);
            if (index > -1) {
                viewModel.order.order_lines.splice(index,1);
            }
            updateCurrentOrder();
        };


        $scope.addProduct = function(productToAdd){
            $log.info('add item', productToAdd);
            ShoppingService.addProductToCart(productToAdd);
            $scope.refreshCartData();
        };

        $scope.removeCartItemForProductFromCartCompletely = function(cartItem) {
            ShoppingService.removeProductsCartItemFromCart(cartItem.product);
            $scope.refreshCartData();
        };

        viewModel.cancelOrderClick = function(order) {
            UIUtil.showYesNoConfirm("Cancel Order", "Are you sure you want to cancel this order?")
                .then(function(confirmed){
                    if(confirmed){
                        UIUtil.showLoading();
                        try {
                            AccountService.cancelOrder(order)
                                .success(function(data, status, headers, config){
                                    UIUtil.hideLoading();
                                    $rootScope.$broadcast('order.saved.refresh');
                                    UIUtil.showAlert('Canceled', 'Order has been canceled.');
                                    viewModel.hasChanges = false;
                                    viewModel.cancelOrderDetail();
                                })
                                .error(function(data, status, headers, config){
                                    UIUtil.hideLoading();
                                    showCancelOrderErrorMessage(data);
                                });
                        } catch (exception) {
                            UIUtil.hideLoading();
                        }
                    }
                });
        };

        function showCancelOrderErrorMessage(error) {
            if(!error.errors){
                UIUtil.showErrorAlert('Not able to cancel order \n\n' + JSON.stringify(error));
            }
            var message = 'Not able to cancel order. \n\n';
            var i;
            if(error.errors.base){
                for (i=0; i< error.errors.base.length; i++) {
                    message += '\n';
                    message += error.errors.base[i];
                }
            }
            UIUtil.showAlert('Cancel Order',message);
        }

        UIUtil.showLoading('Loading Order Info...')
        loadView();

        viewModel.getTipString = function(){
            if(viewModel.order.tip && viewModel.order.tip > 0){
                return $filter('currency')(viewModel.order.tip);
            } else {
                return 'No Tip';
            }
        };

        viewModel.tipClick = function(){
            if(!viewModel.order.tippable) {
                UIUtil.showAlert('Tipping Not Available', 'Sorry, but tipping is not available anymore for this order.');
                return;
            }
            TippingModalProvider.showModal($scope ,viewModel.order)
                .then(function(order){
                    viewModel.order = order;
                })
        };

        viewModel.showTipButton = function(){
            if(!FeatureService.showTipping()){
                return false;
            } else {
                if($scope.orderDetailFromRateOrder) {
                    return false;
                }
                return viewModel.order.status == "delivered" || viewModel.order.status == "processed";
            }
        };

    }
})();