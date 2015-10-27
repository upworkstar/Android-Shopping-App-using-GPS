/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('GrubrollShopperApp').controller('ProductListController', [
        '$scope',
        '$stateParams',
        '$log',
        'common',
        '$ionicModal',
        '$ionicActionSheet',
        '$ionicScrollDelegate',
        'UIUtil',
        '$cordovaKeyboard',
        '$timeout',
        'MyOrdersService',
        'ProductService' ,
        '$ionicSlideBoxDelegate',
        'LogService',
        'OrderService',
        '$ionicPopup',
        '$q',
        '$ionicAnalytics',
        'ProductListService',
        ProductListController]);

    function ProductListController(
        $scope,
        $stateParams,
        $log,
        common,
        $ionicModal,
        $ionicActionSheet,
        $ionicScrollDelegate,
        UIUtil,
        $cordovaKeyboard,
        $timeout,
        MyOrdersService,
        ProductService,
        $ionicSlideBoxDelegate,
        LogService,
        OrderService,
        $ionicPopup,
        $q,
        $ionicAnalytics,
        ProductListService) {

        var viewModel = this;

        var orderItemModal;
        var subItemModal;
        var subCustomProductModal;
        $scope.data = {popupPrice: null};
        viewModel.numberInputType = ionic.Platform.isAndroid() ? 'tel' :'number';
        viewModel.detailItem = null;
        viewModel.search = {};
        viewModel.searchResults = [];
        viewModel.viewOptions = {style: 'categories'};
        viewModel.customProductsCategory = {name: 'specialRequests', order_lines: []};
        viewModel.orderLinesInOrder = [];

        $scope.$on('$ionicView.beforeEnter', function() {
            $ionicAnalytics.track('Order Detail beforeEnter');
            loadData();
        });

        viewModel.closeOrderItemDetail = function(){
            if(shouldCloseOrderItemModal()){
                orderItemModal.hide();
                MyOrdersService.updateOneOfMyOrders(viewModel.order);
            } else {
                UIUtil.showAlert('Amount','Please enter the amount purchased.');
            }
        };

        function shouldCloseOrderItemModal() {
            return true;
        }

        viewModel.showItemDetail = function(order_line, category){
            $log.info('showItemDetail', order_line);
            viewModel.detailItem = order_line;
            viewModel.detailItem.categoryName = angular.copy(category.name);
            var index = getIndexOfOrderLineInOrderLines(viewModel.detailItem);
            $scope.detailItemIndex = getIndexString(index);
            if(!orderItemModal) {
                $ionicModal.fromTemplateUrl('app/shopper/orders/orderProducts/orderItemDetailModal.html', {
                    scope: $scope,
                    animation: 'scale-in'
                })
                    .then(function(modal) {
                        orderItemModal = modal;
                        orderItemModal.show();
                    });
            } else {
                orderItemModal.show();
            }
        };

        function isSameObject(obj1, obj2){
            return JSON.stringify(obj1) == JSON.stringify(obj2);
        }

        function isSameProduct(prod1, prod2){
            if(prod1.id && prod2.id) {
                if(prod1.id == prod2.id) {
                    return true;
                } else {
                    return false;
                }
            }
            if(prod1.description && prod2.description){
                if(prod1.description == prod2.description) return true;
                return false;
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

        viewModel.addToCart = function(order_line) {
            if(MyOrdersService.shouldSetOrderStatusToShopping(viewModel.order)){
                OrderService.setOrderShoppingStatus(viewModel.order.id);
            }
            order_line.actual_product = order_line.requested_product;
            order_line.actual_product_type = order_line.requested_product_type;
            order_line.inCart = true;
            viewModel.addActualQuantity(order_line);
            MyOrdersService.updateOneOfMyOrders(viewModel.order);
        };

        viewModel.removeFromCart = function(order_line) {
            order_line.actual_product = null;
            order_line.actual_qty = 0;
            order_line.inCart = false;
            MyOrdersService.updateOneOfMyOrders(viewModel.order);
        };

        viewModel.addItem = function(order_line){
            $log.info('add item click', order_line);
            if(order_line.requested_qty > 1 && !order_line.inCart ){
                //show the detail so they can do what they do
                viewModel.showItemDetail(order_line);
            } else {
                ///mark it as in the cart
                order_line.inCart = !order_line.inCart;
                if(order_line.inCart){
                    viewModel.addActualQuantity(order_line);
                } else {
                    viewModel.subtractActualQuantity(order_line);
                }
            }
            MyOrdersService.updateOneOfMyOrders(viewModel.order);
        };

        viewModel.getFraction = function(number) {
            return common.getFraction(number);
        };

        viewModel.addItemFromDetailScreen = function(order_line){
            order_line.inCart = !order_line.inCart;
            if(order_line.inCart){
                viewModel.addActualQuantity(order_line);
            } else {
                viewModel.subtractActualQuantity(order_line);
            }
            MyOrdersService.updateOneOfMyOrders(viewModel.order);
        };

        viewModel.subtractActualQuantity = function(order_line){
            if(order_line.actual_qty > 0){
                order_line.actual_qty --;
                MyOrdersService.updateOneOfMyOrders(viewModel.order);
            }
        };

        viewModel.addActualQuantity = function(order_line){
            try {
                if(viewModel.isByWeightOrderLine(order_line)) {
                    UIUtil.promptForProductWeightInput($scope)
                        .then(function(result){
                            if(result == '' || isNaN(result)){
                                UIUtil.showAlert('Error','Not a Valid Weight.');
                            } else {
                                result = parseFloat(result);
                            }
                            if(result > 9.0) {
                                LogService.info(['Showed weight warning', result]);
                                UIUtil.showWarningAlertMessage('Large Weight Warning <br/><br/> You entered <b>' +result+ '</b> as the weight of this product. ' +
                                    'Please double check to make sure this is the correct weight of the product.');
                            }
                            order_line.actual_qty = parseFloat(result);
                            MyOrdersService.updateOneOfMyOrders(viewModel.order);
                        });
                    return;
                }
                if(order_line.requested_qty != order_line.actual_qty) {
                    if(order_line.actual_product_type == "CustomProduct") {
                        if(!order_line.actual_qty || order_line.actual_qty == 0) {
                            promptForCurrencyInput('Cost', 'What is the cost of this product?', 'Save Cost', 'ex. $7.99')
                                .then(function(result){
                                    if(result == '' || isNaN(result)){
                                        UIUtil.showAlert('Error','Not a Valid Price.');
                                    } else {
                                        result = parseFloat(result);
                                    }
                                    if(result > 40.0) {
                                        LogService.info(['Showed price warning', result]);
                                        UIUtil.showWarningAlertMessage('Large Price Warning <br/><br/> You entered <b>' +result+ '$</b> as the price of this product. ' +
                                            'Please double check to make sure this is the correct price of the product.');
                                    }
                                    order_line.actual_product.price = parseFloat(result);
                                    MyOrdersService.updateOneOfMyOrders(viewModel.order);
                                });
                        }
                    }
                    order_line.actual_qty ++;
                    MyOrdersService.updateOneOfMyOrders(viewModel.order);
                }

            } catch (exception){
                LogService.error(['addActualQuantity',exception,order_line ]);
                return false;
            }
        };

        viewModel.getPrice = function(product) {
            return product.price;
        };

        function promptForCurrencyInput(title, message, buttonText){
            var deferred = $q.defer();
            var myPopup = $ionicPopup.show({
                template: '<input type="tel" ui-money-mask placeholder="$0.00"  ng-model="data.popupPrice">',
                title: title,
                subTitle: message,
                scope: $scope,
                buttons: [
                    { text: 'Cancel' },
                    {
                        text: '<b>'+buttonText+'</b>',
                        type: 'button-positive',
                        onTap: function(e) {
                            if (!$scope.data.popupPrice) {
                                //don't allow the user to close unless he enters wifi password
                                e.preventDefault();
                            } else {
                                deferred.resolve(angular.copy($scope.data.popupPrice));
                            }
                        }
                    }
                ]
            });

            return deferred.promise;
        }

        viewModel.isByWeightOrderLine = function(order_line) {
            try {
                if(order_line.actual_product) {
                    return order_line.actual_product.product_type === 'by weight';
                }
                return order_line.requested_product.product_type == 'by weight';
            } catch (exception){
                LogService.error(['isByWeightOrderLine',exception,order_line ]);
                return false;
            }
        };

        var loadData = function() {
            var order = angular.fromJson( $stateParams.order );
            viewModel.order = MyOrdersService.getOrder(order.id);
            angular.forEach(viewModel.order.order_lines, function(item, index){
                if(!item.actual_qty){
                    item.actual_qty = 0;
                }
                if(!item.actual_product) {
                    item.actual_product = null;
                }
            });
            setGroupsAsShown();
        };

        $scope.$watch('viewModel.order', function(current, original) {
            $log.info('viewModel.order was %s', original);
            $log.info('viewModel.order is now %s', current);
            MyOrdersService.updateOneOfMyOrders(viewModel.order);
        });

        viewModel.subCustomClick = function(sub_order_line){
            $log.debug('subCustomClick',sub_order_line);
            $ionicModal.fromTemplateUrl('app/shopper/orders/orderProducts/subCustomProductModal.html', {scope: $scope,focusFirstInput: true})
                .then(function(modal) {
                    subCustomProductModal = modal;
                    subCustomProductModal.show();
                });
        };

        viewModel.cancelSubCustomProd = function(){
            console.log('cancelSubCustomProd');
            subCustomProductModal.hide();
        };

        viewModel.saveSubCustomProd = function(formData){
            $log.debug('saveSubCustomProd',formData);
            if(!formData.name || !formData.cost) {
                UIUtil.showAlert('Error','Please fill out description and cost.');
                return;
            }
            UIUtil.showLoading();
            viewModel.detailItem.actual_product = {
                name : formData.name,
                price: formData.cost
            };
            viewModel.detailItem.actual_product_type = "CustomProduct";
            viewModel.detailItem.actual_qty = formData.count;
            viewModel.detailItem.inCart = true;
            MyOrdersService.updateOneOfMyOrders(viewModel.order);
            UIUtil.hideLoading();
            subCustomProductModal.hide();
        };

        viewModel.numbers = getNumbersArray();
        function getNumbersArray(){
            var list = [];
            for (var i = 0; i <= 99; i++) {
                list.push(i);
            }
            return list;
        }

        viewModel.subClick = function(sub_order_line){
            UIUtil.showWarningAlertMessage('You must get approval from the customer before making a substitution.')
                .then(function(){
                    var hideSheet = $ionicActionSheet.show({
                        buttons: [
                            { text: 'Search for Substitute Product' },
                            { text: 'Create Custom Substitute Product' }
                        ],
                        titleText: 'Substitute Product Options',
                        cancelText: 'Cancel',
                        cancel: function() {
                            // add cancel code..
                        },
                        buttonClicked: function(index) {
                            if(index == 0){
                                //show the search to find a new product...
                                $log.info('subClick', sub_order_line);
                                $ionicModal.fromTemplateUrl('app/shopper/orders/orderProducts/substituteItemModal.html', {scope: $scope,focusFirstInput: true})
                                    .then(function(modal) {
                                        subItemModal = modal;
                                        //UIUtil.showWarningAlertMessage('You must get approval from the customer before making a substitution.');
                                        subItemModal.show();
                                    });
                            } else {
                                viewModel.subCustomClick(sub_order_line);
                            }
                            return true;
                        }
                    });
                });


        };

        function hideKeyboard() {
            $timeout(function () {
                if($cordovaKeyboard.isVisible()) {
                    $cordovaKeyboard.close();
                }
            }, 1);
        }

        viewModel.onScroll  = function() {
            hideKeyboard();
        };

        viewModel.removeSubstituteProductClick = function(un_sub_order_item){
            UIUtil.showLoading();
            viewModel.detailItem.actual_product = null;
            viewModel.detailItem.actual_qty = 0;
            MyOrdersService.updateOneOfMyOrders(viewModel.order);
            UIUtil.hideLoading();
        };

        viewModel.chooseSubstituteProduct = function(product){
            UIUtil.showLoading();
            viewModel.detailItem.actual_product = {
                name : product.name,
                brand_name: product.brand_name,
                id: product.id,
                upc: product.upc,
                price: product.price,
                size: product.size,
                actual_product_id: product.id,
                image_url: (product.images[0] ? product.images[0].url : null)
            };
            viewModel.detailItem.actual_product_type = "Product";
            viewModel.detailItem.inCart = true;
            viewModel.closeSubItemModal();
            viewModel.addActualQuantity(viewModel.detailItem);
            MyOrdersService.updateOneOfMyOrders(viewModel.order);
            UIUtil.hideLoading();
        };

        viewModel.closeSubItemModal = function(){
            subItemModal.hide();
            viewModel.searchResults = [];
            viewModel.search = {};
        };

        $scope.$watch('viewModel.search.searchQuery', function (val) {
            val = viewModel.search.searchQuery;
            $log.debug('searching!!! ' + val);
            if(!val || val == "" || val == 'undefined'){
                $log.debug('searching for nothing');
            } else {
                viewModel.filterText = val;
                searchForProducts(viewModel.filterText);
            }
        });

        var searchForProducts = function(text) {
            $log.info('searching:'+text);
            $scope.myPromise = ProductService.searchForShopperProducts(text)
                .then(function(results){
                    viewModel.searchResults = results;
                },function(error){
                    UIUtil.showAlert('Error','Error when searching for products.');
                });
        };


        viewModel.clickViewSettings = function() {
            var hideSheet = $ionicActionSheet.show({
                buttons: [
                    { text: 'Categories View' },
                    { text: 'List View' }
                ],
                titleText: 'Change View Options',
                cancelText: 'Cancel',
                cancel: function() {
                    // add cancel code..
                },
                buttonClicked: function(index) {
                    if(index == 0){
                        viewModel.viewOptions.style = 'categories';
                    } else {
                        viewModel.viewOptions.style = 'list';
                    }
                    return true;
                }
            });
        };

        viewModel.toggleGroup = function(group) {
            if (viewModel.isGroupShown(group)) {
                group.isShown = !group.isShown;
            } else {
                group.isShown = !group.isShown;
                $ionicScrollDelegate.resize();
            }
        };

        viewModel.isGroupShown = function(group) {
            return group.isShown;
        };

        function setGroupsAsShown() {
            angular.forEach(viewModel.order.categories, function(category){
                category.isShown = true;
            });
            viewModel.order.categories = _.sortBy(viewModel.order.categories, function(cat){
                return OrderService.sortCatNamesFunc(cat);
            });

            $log.debug('setGroupsAsShown cats', viewModel.order.categories);
        }

        viewModel.getOrderLineItemForProduct = function(product, category) {
            if(product) {
                var index = viewModel.order.order_lines.map(function(el) {
                    return el.requested_product.id;
                }).indexOf(product.product.id);

                if(index < 0 && product.product.description){
                    LogService.info('Used the alternate map property.');
                    index = viewModel.order.order_lines.map(function(el) {
                        return el.requested_product.description;
                    }).indexOf(product.product.description);
                    var orderLine = viewModel.order.order_lines[index];
                    viewModel.orderLinesInOrder.push(orderLine);
                    return orderLine;
                }

                var orderLine = viewModel.order.order_lines[index];
                viewModel.orderLinesInOrder.push(orderLine);
                return orderLine;
            }
        };

        viewModel.getCategoryCountInCart = function(category) {
            try {
                var count = 0;
                angular.forEach(category.products, function(product, index){
                    var order_line = viewModel.getOrderLineItemForProduct(product);
                    if(order_line && order_line.inCart){
                        count ++;
                    }
                });
                return count;
            } catch (exception){
                LogService.error(['getCategoryCountInCart', exception, category]);
                return 0;
            }
        };

        viewModel.subtractFromCustomItemCount = function(subCustomProdForm){
            if(subCustomProdForm.count != 1){
                subCustomProdForm.count = (subCustomProdForm.count - 1);
            }
        };

        viewModel.addToCustomItemCount = function(subCustomProdForm){
            subCustomProdForm.count = (subCustomProdForm.count + 1);
        };

        loadData();

        var imageModal = null;
        viewModel.openImageModal = function(product){
            $ionicModal.fromTemplateUrl('image-modal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(modal) {
                imageModal = modal;
                var url = product.image_url; //by default
                try {
                    if(product.original_image_url) {
                        url = product.original_image_url;
                    }
                } catch (exception) {
                    LogService.error(exception);
                }
                viewModel.imageModalImageUrl = url;
                $ionicSlideBoxDelegate.slide(0);
                imageModal.show();
            });

        };

        viewModel.closeImageModal = function() {
            imageModal.hide();
        };

        viewModel.imageSlideChanged = function() {
            imageModal.hide();
        };

        viewModel.productDataWrongClick = function(product) {
            OrderService.submitWrongProductData(product, viewModel.order.id);
        };

        viewModel.productNotAvailableClick = function(product) {
            OrderService.requestedProductNotAvailableText(product, viewModel.order.id);
        };

        viewModel.markProductAsNotFound = function(orderLine) {
            ProductListService.markProductAsNotFound(orderLine);
        };

        function getIndexString(index) {
            viewModel.orderLinesInOrder = _.uniq(viewModel.orderLinesInOrder);

            return (index + 1) + ' of ' + (viewModel.orderLinesInOrder.length)
        }

        function getIndexOfOrderLineInOrderLines (orderLineItem) {
            viewModel.orderLinesInOrder = _.uniq(viewModel.orderLinesInOrder);
            var orderLine = _.findWhere(viewModel.orderLinesInOrder, {id: viewModel.detailItem.id});
            var index = viewModel.orderLinesInOrder.indexOf(orderLine);
            return index;
        }

        viewModel.onDetailSwipeRight = function () {
            $scope.swipeRight = true;
            var index = getIndexOfOrderLineInOrderLines(viewModel.detailItem);
            var indexToShow = index - 1;
            var nextOrderLine = viewModel.orderLinesInOrder[indexToShow];
            $scope.detailItemIndex = (index) + '/' + (viewModel.orderLinesInOrder.length);
            if(nextOrderLine) {
                $scope.detailItemIndex = getIndexString(indexToShow) ;
                viewModel.changeItem = true;
                $timeout(function(){
                    viewModel.detailItem = nextOrderLine;
                    viewModel.changeItem = false;
                }, 200);
            }
        };

        viewModel.onDetailSwipeLeft = function() {
            $scope.swipeRight = false;
            var index = getIndexOfOrderLineInOrderLines(viewModel.detailItem);
            var indexToShow = index + 1;
            var nextOrderLine = viewModel.orderLinesInOrder[indexToShow];

            if(nextOrderLine) {
                $scope.detailItemIndex = getIndexString(indexToShow) ;
                viewModel.changeItem = true;
                $timeout(function(){
                    viewModel.detailItem = nextOrderLine;
                    viewModel.changeItem = false;
                }, 200);
            }
        };

        viewModel.getOrderLineImageUrl = function(orderLine) {
            var noImage = 'img/itemNoImage.gif';
            if(orderLine.actual_product) {
                if(orderLine.actual_product.image_url) {
                    return orderLine.actual_product.image_url;
                } else {
                    return noImage;
                }
            } else {
                if(orderLine.requested_product.image_url) {
                    return orderLine.requested_product.image_url;
                } else {
                    return noImage;
                }
            }
        };

        LogService.info('Product List Open.');
    }
})();
