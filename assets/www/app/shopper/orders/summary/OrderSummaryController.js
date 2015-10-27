/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('GrubrollShopperApp').controller('OrderSummaryController', ['$scope', '$log', 'OrderService','MyOrdersService','UIUtil','LogService','$stateParams','$ionicHistory', '$ionicPopup', 'ShoppingListService', '$cordovaCamera', '$cordovaImagePicker', '$ionicActionSheet', '$filter', OrderSummaryController]);

    function OrderSummaryController($scope, $log, OrderService, MyOrdersService, UIUtil, LogService, $stateParams, $ionicHistory, $ionicPopup, ShoppingListService, $cordovaCamera, $cordovaImagePicker , $ionicActionSheet, $filter) {

        var viewModel = this;

        viewModel.title = "Order Summary";
        viewModel.allGood = true;
        viewModel.uploadingImage = false;

        var loadData = function(){
            try {
                $log.info('OrderSummaryController loadData: ', $stateParams.orderId);
                var orderId = angular.fromJson($stateParams.orderId);
                viewModel.order = MyOrdersService.getOrder(orderId);
                viewModel.getItemsNotFullyFulfilled();
            } catch (exception) {
                UIUtil.showErrorAlert('Order Summary loadData');
                LogService.critical({error: exception, order: viewModel.order});
            }
        };

        function checkAllRequiredValues(){
            try {
                var allClean = true;
                var i;
                for (i = 0; i < viewModel.order.order_lines.length; i++) {
                    var order_line = viewModel.order.order_lines[i];
                    if (viewModel.isCustomOrderLineNeedingPrice(order_line)) {
                        allClean = false;
                        break;
                    } else if (viewModel.isByWeightOrderLineNeedsWeight(order_line)) {
                        allClean = false;
                        break;
                    }
                }
                return allClean;
            } catch (exception) {
                UIUtil.showErrorAlert('checkAllRequiredValues');
                LogService.critical({error: exception, order: viewModel.order});
            }
        }

        viewModel.processOrder = function(processOrder){
            if(viewModel.uploadingImage) {
                UIUtil.showAlert('Image Upload', 'Please wait to process the order until the receipt image is done saving.');
                return false;
            }

            if(processOrder.cost == 0.00) {
                UIUtil.showAlert('Cost','The cost you entered is ' + processOrder.cost + ', it needs to be a dollar amount.');
                return false;
            }

            UIUtil.showLoading('Processing Order<br/>This can take a sec...');

            try {

                if(!viewModel.order.photo_id) {
                    UIUtil.hideLoading();
                    UIUtil.showErrorAlert("You must take a picture of the receipt before you can process the order.");
                    return false;
                }
                //check if everything has values that are needed...
                if(!checkAllRequiredValues()) {
                    UIUtil.hideLoading();
                    UIUtil.showErrorAlert('Make sure all items have weight and price filled in.')
                    return false;
                }
            } catch (exception) {
                UIUtil.showErrorAlert('Exception occurred while trying to process the order.');
                LogService.critical({error: exception, order: viewModel.order});
            }
            LogService.info({
                message: 'Process order call start.',
                order_id: viewModel.order.id
            });
            OrderService.processOrder(viewModel.order, processOrder.cost, viewModel.actual_subtotal)
                .then(function(data){
                    viewModel.order = data;
                    LogService.info({
                        message: 'Process order call success.',
                        order_id: viewModel.order.id
                    });
                    ShoppingListService.removeOrderFromShoppingList(viewModel.order);
                    $ionicHistory.goBack();
                    UIUtil.hideLoading();
                    UIUtil.showAlert('Success','The order was processed successfully.');
                }, function(error){
                    $log.error('OrderService.processOrder Error', error);
                    var logObject = {
                        order: viewModel.order,
                        description: 'OrderService.processOrder. Error Returned from Process Order api call.',
                        actualError: error
                    };
                    LogService.critical(logObject);
                    UIUtil.showErrorAlert('There was error when making the ' +
                        'process order request. \n\n' + JSON.stringify(error))
                        .then(function(){
                            //update local orders to make sure that this one's status did not change to processed...
                            OrderService.getAllMyOrders()
                                .then(function(){
                                    viewModel.order = MyOrdersService.getOrder(viewModel.order.id);
                                    if(viewModel.order.status == 'processed') {
                                        UIUtil.showAlert('Order Status Changed','Order Status has changed to processed.');
                                        ShoppingListService.removeOrderFromShoppingList(viewModel.order);
                                        $ionicHistory.goBack();
                                    }
                                });
                            UIUtil.hideLoading();
                        });
                });
        };

        viewModel.getItemsNotFullyFulfilled = function(){
            try {
                viewModel.incompleteOrderLines = [];
                $log.debug('order::::', viewModel.order);
                angular.forEach(viewModel.order.order_lines, function (order_line, index) {
                    if (!order_line.actual_qty || parseFloat(order_line.requested_qty) > parseFloat(order_line.actual_qty)) {
                        if(!order_line.notFound) {
                            viewModel.incompleteOrderLines.push(order_line);
                        }
                    }
                }, viewModel.incompleteOrderLines);

                viewModel.allGood = (viewModel.incompleteOrderLines.length == 0);
            } catch (exception) {
                UIUtil.showErrorAlert('getItemsNotFullyFulfilled');
                LogService.critical({error: exception, order: viewModel.order});
            }
        };

        viewModel.isByWeightOrderLineNeedsWeight = function(order_line) {
            try{
                if(isByWeight(order_line) && order_line.inCart) {
                    if(!order_line.actual_qty || order_line.actual_qty == "") {
                        return true;
                    }
                }
            } catch (exception) {
                UIUtil.showErrorAlert('isByWeightOrderLineNeedsWeight');
                LogService.critical({error: exception, order: viewModel.order});
            }
        };

        function isByWeight(order_line) {
            try {
                if(order_line.actual_product) {
                    return order_line.actual_product.product_type === 'by weight';
                }
                return order_line.requested_product.product_type == 'by weight';
            }  catch (exception) {
                UIUtil.showErrorAlert('isByWeight');
                LogService.critical({error: exception, order: viewModel.order});
            }
        }

        viewModel.isCustomOrderLineNeedingPrice = function(order_line) {
            try{
                if(order_line.inCart && order_line.actual_product != null) {
                    if(order_line.requested_product_type == "CustomProduct" &&
                        !order_line.actual_product.price ||
                        order_line.actual_product.price == '0.0' ||
                        order_line.actual_product.price == '') {
                        return true;
                    }
                }
            }  catch (exception) {
                UIUtil.showErrorAlert('isCustomOrderLineNeedingPrice');
                LogService.critical({error: exception, order: viewModel.order});
            }
        };

        viewModel.sholdShowPricePrompt = function() {
            try {
                var shouldShow = false;

                var i;
                for (i = 0; i < viewModel.order.order_lines.length; i++) {
                    var order_line = viewModel.order.order_lines[i];
                    if (viewModel.isCustomOrderLineNeedingPrice(order_line)) {
                        shouldShow = true;
                        break;
                    }
                }
                return shouldShow;
            } catch (exception) {
                UIUtil.showErrorAlert('sholdShowPricePrompt');
                LogService.critical({error: exception, order: viewModel.order});
            }
        };

        viewModel.shouldShowWeightPrompt = function() {
            try {
                var shouldShow = false;
                var i;
                for (i = 0; i < viewModel.order.order_lines.length; i++) {
                    var order_line = viewModel.order.order_lines[i];
                    if(viewModel.isByWeightOrderLineNeedsWeight(order_line)) {
                        shouldShow = true;
                        break;
                    }
                }
                return shouldShow;
            } catch (exception) {
                UIUtil.showErrorAlert('shouldShowWeightPrompt');
                LogService.critical({error: exception, order: viewModel.order});
            }
        };

        $scope.$on('$ionicView.beforeEnter', function() {
            loadView();
        });

        function loadView() {
            loadData();
            var total = MyOrdersService.getOrderActualSubtotal(viewModel.order);
            viewModel.actual_subtotal = total;
        }

        function checkPercentageOfActualSubtotalToRequestedSubtotal() {
            var percent = (viewModel.actual_subtotal / parseFloat(viewModel.order.requested_subtotal)) * 100;
            if(percent > 200) {
                if(viewModel.userAcknowledgeLargeChargeAmount) {
                    return true;
                }
                UIUtil.showWarningAlertMessage('You are about to charge the customer ' + $filter('currency')(viewModel.actual_subtotal) +
                    '.  That is ' + $filter('number')(percent) + '% greater than the original subtotal of this order. Please double check what you entered for ' +
                    'the cost on special requests and the weight on items that are sold by weight.' );
                viewModel.warnedForLargeAmount = true;
                return false;
            }
            return true;
        }

        viewModel.somethingChanged = function() {
            MyOrdersService.updateOneOfMyOrders(viewModel.order);
            loadView();
        };

        function showTaxExemptReminder() {
            var myPopup = $ionicPopup.show({
                title: '<i  class="icon ion-alert-circled tax-pop-icon"></i><br/><b>Make sure to ask for tax exempt status at checkout.</b>',
                scope: $scope,
                buttons: [
                    {
                        text: 'Ok, Got It',
                        type: 'button-positive',
                        onTap: function(e) {}
                    }
                ]
            });
        }

        $scope.$on('$ionicView.afterEnter', function() {
            showTaxExemptReminder();
        });

        $scope.$on('$ionicView.beforeLeave', function() {
            if(viewModel.uploadingImage) {

            }
        });

        viewModel.getReceiptPicture = function() {
            try {
                $ionicActionSheet.show({
                    buttons: [
                        { text: 'Take Photo...' },
                        { text: 'Choose Photo from Library...' }
                    ],
                    titleText: 'Photo Options',
                    cancelText: 'Cancel',
                    cancel: function() {
                        // add cancel code..
                    },
                    buttonClicked: function(index) {
                        if(index == 0){
                            takeReceiptPicture();
                        } else {
                            chooseReceiptPicture();
                        }
                        return true;
                    }
                });
            } catch (exception) {
                LogService.critical(['getReceiptPicture error', exception]);
            }
        };

        function saveImageToServer(imageURI) {
            try {
                var confirmPopup = $ionicPopup.confirm({
                    title: "Save this image as the receipt for this order? </br> </br> " +
                    "This will replace any other receipt images saved for this order.",
                    template: "<img ng-src="+imageURI+ " style='max-width: 100%'>",
                    cancelText: "No",
                    okText: "Yes"
                });
                confirmPopup.then(function(theUserSaidYes) {
                    if(theUserSaidYes) {
                        $log.info('image of receipt', imageURI);
                        viewModel.uploadingImage = true;
                        OrderService.saveOrderRecipt(imageURI , viewModel.order.id)
                            .then(function(photoId) {
                                viewModel.order.photo_id = photoId;
                                viewModel.uploadingImage = false;
                                MyOrdersService.updateOneOfMyOrders(viewModel.order);
                                UIUtil.showAlert('Success', 'Receipt Image Saved Successfully.');
                            }, function(error){
                                LogService.error(['OrderService.saveOrderRecipt', error]);
                                viewModel.uploadingImage = false;
                                MyOrdersService.updateOneOfMyOrders(viewModel.order);
                                UIUtil.showErrorAlert('Not Able to Save the Image to the order. ' +
                                    'But, a copy of the image should be in your camera roll so you did not loose it.' +
                                    '\n\n' +
                                    JSON.stringify(error));
                            });
                    }
                });
            } catch(exception) {
                viewModel.uploadingImage = false;
                MyOrdersService.updateOneOfMyOrders(viewModel.order);
                LogService.critical(['saveImageToServer exception', exception]);
                UIUtil.hideLoading();
            }

        }

        function chooseReceiptPicture() {
            try {
                var options = {maximumImagesCount: 1};
                $cordovaImagePicker.getPictures(options)
                    .then(function (results) {
                        if(results.length > 0) {
                            saveImageToServer(results[0]);
                        }
                    }, function(error) {
                        LogService.error(['$cordovaImagePicker.getPictures', error]);
                    });
            } catch (exception) {
                LogService.critical(['chooseReceiptPicture exception', exception]);
            }
        }

        function takeReceiptPicture() {
            try {
                document.addEventListener("deviceready", function () {
                    var options = null ;
                    if(ionic.Platform.isIOS()) {
                        options = {
                            quality: 50,
                            targetWidth: 1280,
                            targetHeight: 1440,
                            destinationType: Camera.DestinationType.FILE_URI,
                            sourceType: Camera.PictureSourceType.CAMERA,
                            encodingType: Camera.EncodingType.PNG,
                            popoverOptions: CameraPopoverOptions,
                            saveToPhotoAlbum: true //this only works on iOS
                        };
                    } else {
                        options = {
                            quality: 50,
                            targetWidth: 1280,
                            targetHeight: 1500,
                            destinationType: Camera.DestinationType.FILE_URI,
                            sourceType: Camera.PictureSourceType.CAMERA,
                            encodingType: Camera.EncodingType.PNG,
                            popoverOptions: CameraPopoverOptions
                        };
                    }
                    $cordovaCamera.getPicture(options).then(function(imageURI) {
                        saveImageToServer(imageURI)
                    }, function(error) {
                        LogService.error(['$cordovaCamera.getPicture', error]);
                    });

                }, false);
            } catch (exception) {
                LogService.critical(['takeReceiptPicture exception', exception]);
            }
        }

    }
})();
