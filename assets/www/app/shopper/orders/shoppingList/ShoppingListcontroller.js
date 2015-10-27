/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('GrubrollShopperApp').controller('ShoppingListController', [
        '$scope',
        '$ionicModal',
        '$state',
        '$log',
        'common',
        '$ionicPopover',
        '$ionicScrollDelegate',
        '$cordovaKeyboard',
        'ProductService',
        'UIUtil',
        'LogService',
        '$timeout',
        'ShoppingListService',
        'MyOrdersService',
        '$ionicActionSheet',
        '$ionicSlideBoxDelegate',
        'OrderService',
        '$ionicPopup',
        '$q',
        'ProductListService',
        ShoppingListController]);

    function ShoppingListController(
        $scope,
        $ionicModal,
        $state,
        $log,
        common,
        $ionicPopover,
        $ionicScrollDelegate,
        $cordovaKeyboard,
        ProductService,
        UIUtil,
        LogService,
        $timeout,
        ShoppingListService,
        MyOrdersService,
        $ionicActionSheet,
        $ionicSlideBoxDelegate,
        OrderService,
        $ionicPopup,
        $q,
        ProductListService) {

        var viewModel = this;
        var orderItemModal;
        var subItemModal;
        var subCustomProductModal;
        $scope.data = {popupPrice: null};
        viewModel.numberInputType = ionic.Platform.isAndroid() ? 'tel' :'number';
        viewModel.shoppingListCount = ShoppingListService.getCountInShoppingList();
        viewModel.detailItem = null;
        viewModel.search = {};
        viewModel.searchResults = [];
        viewModel.orderPopover = null;
        viewModel.shoppingListOrders = [];
        viewModel.catNames = [];
        viewModel.products = [];
        viewModel.orderLinesInOrder = [];

        function structureDataForShoppingList() {
            try {
                // All of this is so ugly but it works :( ... For Now.
                viewModel.shoppingListOrders = ShoppingListService.getOrdersInShoppingList();
                angular.forEach(viewModel.shoppingListOrders, function(order) {
                    angular.forEach(order.categories, function(cat) {
                        angular.forEach(cat.products, function(product){
                            //To answer your question yes, we are three loops deep. Bold Strategy.
                            var index = order.order_lines.map(function(el) {
                                return el.requested_product.id;
                            }).indexOf(product.product.id);

                            if(index < 0 && product.product.description){
                                LogService.info('Used the alternate map property.');
                                index = order.order_lines.map(function(el) {
                                    return el.requested_product.description;
                                }).indexOf(product.product.description);
                            }

                            //create one flat object that contains all the data that is needed.
                            //don't want to copy the order line data by reference because that causes circular refernce issues down the road
                            product = angular.copy( order.order_lines[index].requested_product );
                            product.category = cat;
                            product.orderId = order.id;
                            product.order_line = order.order_lines[index];
                            product.backgroundColor = order.backgroundColor;
                            product.customerName = order.customer.name;
                            viewModel.products.push(product);
                        });
                    });
                });
                var categoriesFlattened = _.flatten(_.map(viewModel.shoppingListOrders, function(order, key) {return order.categories;})),
                    uniqueNames = _.uniq(_.map(categoriesFlattened, function(cat, key){ return cat.name; }));

                for (var i = 0, length = uniqueNames.length; i < length; i++) {
                    viewModel.catNames.push ({name:uniqueNames[i], isShown: true });
                }

                viewModel.catNames = _.sortBy(viewModel.catNames, function(cat){
                    return OrderService.sortCatNamesFunc(cat);
                });

            } catch (exception) {
                UIUtil.showErrorAlert('structureDataForShoppingList' + JSON.stringify(exception));
                LogService.errorLog({error: exception});
            }
        }

        viewModel.getProductsForCategory = function(cat) {
            return _.filter(viewModel.products, function(prod){ return prod.category.name == cat.name; });
        };

        viewModel.ordersClicked = function($event) {
            $ionicPopover.fromTemplateUrl('templates/shoppingListOrdersPopover.html', {
                scope: $scope
            }).then(function(popover) {
                viewModel.orderPopover = popover;
                $scope.shoppingListOrders = viewModel.shoppingListOrders;
                viewModel.orderPopover.show($event);
            });
        };

        viewModel.onOrderLintHold =  function(orderId) {
            var hideSheet = $ionicActionSheet.show({
                buttons: [
                    { text: 'Go To Order' + orderId }
                ],
                titleText: 'Order',
                cancelText: 'Cancel',
                cancel: function() {
                    // add cancel code..
                },
                buttonClicked: function(index) {
                    var gotoOrder = MyOrdersService.getOrder(orderId);
                    viewModel.clickOrder(gotoOrder);
                    return true;
                }
            });
        };

        viewModel.clickOrder = function(order) {
            if(viewModel.orderPopover) viewModel.orderPopover.hide();
            var gotoOrder = MyOrdersService.getOrder(order.id);
            $state.go('app.orderDetail', {order: angular.toJson(gotoOrder)});
        };

        viewModel.addProductLineInit = function(product, cat) {
            product.order_line.categoryName = angular.copy(cat.name);
            viewModel.orderLinesInOrder.push(product.order_line);
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

        viewModel.showItemDetail = function(order_line, orderId, customerName, backgroundColor, cat){
            viewModel.detailItem = order_line;
            viewModel.detailItem.categoryName = angular.copy(cat.name);
            viewModel.detailItemOrderId = orderId;
            viewModel.detailItemOrderCustomerName = customerName;
            viewModel.detailItembackgroundColor = backgroundColor;
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

        viewModel.closeOrderItemDetail = function(){
            orderItemModal.hide();
            updateOrderLineOnOrder(viewModel.detailItemOrderId , viewModel.detailItem);
        };

        viewModel.orderLineHasSub = function(order_line) {
            if(order_line.actual_product) {
                return !isSameProduct(order_line.requested_product, order_line.actual_product);
            }
            return false;
        };

        viewModel.addToCart = function(order_line, orderId) {
            if(MyOrdersService.shouldSetOrderStatusToShopping(MyOrdersService.getOrder(orderId))){
                OrderService.setOrderShoppingStatus(orderId);
            }
            order_line.actual_product = order_line.requested_product;
            order_line.actual_product_type = order_line.requested_product_type;
            order_line.inCart = true;
            viewModel.addActualQuantity(order_line, orderId);
            updateOrderLineOnOrder(orderId, order_line);
        };

        viewModel.removeFromCart = function(order_line, orderId) {
            order_line.actual_product = null;
            order_line.actual_qty = 0;
            order_line.inCart = false;
            updateOrderLineOnOrder(orderId, order_line);
        };

        viewModel.getFraction = function(number) {
            return common.getFraction(number);
        };

        viewModel.addItemFromDetailScreen = function(order_line, orderId){
            order_line.inCart = !order_line.inCart;
            if(order_line.inCart){
                viewModel.addActualQuantity(order_line, orderId);
            } else {
                viewModel.subtractActualQuantity(order_line, orderId);
            }
            updateOrderLineOnOrder(orderId, order_line);
        };

        viewModel.subtractActualQuantity = function(order_line, orderId){
            if(order_line.actual_qty > 0){
                order_line.actual_qty --;
                updateOrderLineOnOrder(orderId, order_line);
            }
        };

        viewModel.getPrice = function(product) {
            return product.price;
        };

        viewModel.addActualQuantity = function(order_line, orderId){
            try{
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
                            updateOrderLineOnOrder(orderId, order_line);
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
                                    updateOrderLineOnOrder(orderId, order_line);
                                });
                        }
                    }
                    order_line.actual_qty ++;
                    updateOrderLineOnOrder(orderId, order_line);
                }

            } catch (exception){
                LogService.error(['addActualQuantity',exception,order_line,orderId ]);
                return false;
            }
        };

        function promptForCurrencyInput(title, message, buttonText){
            var deferred = $q.defer();
            var myPopup = $ionicPopup.show({
                template: '<input type="tel" ui-money-mask placeholder="$0.00" ng-model="data.popupPrice">',
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
            try{
                if(order_line.actual_product) {
                    return order_line.actual_product.product_type === 'by weight';
                }
                return order_line.requested_product.product_type == 'by weight';
            } catch (exception){
                LogService.error(['isByWeightOrderLine', exception, order_line]);
                return false;
            }
        };

        viewModel.addItem = function(order_line, orderId){
            $log.info('add item click', order_line);
            if(order_line.requested_qty > 1 && !order_line.inCart ){
                //show the detail so they can do what they do
                viewModel.showItemDetail(order_line);
            } else {
                ///mark it as in the cart
                order_line.inCart = !order_line.inCart;
                if(order_line.inCart){
                    viewModel.addActualQuantity(order_line, orderId);
                } else {
                    viewModel.subtractActualQuantity(order_line, orderId);
                }
            }
            updateOrderLineOnOrder(orderId, order_line);
        };

        viewModel.addToCustomItemCount = function(subCustomProdForm){
            subCustomProdForm.count = (subCustomProdForm.count + 1);
        };

        viewModel.subtractFromCustomItemCount = function(subCustomProdForm){
            if(subCustomProdForm.count != 1){
                subCustomProdForm.count = (subCustomProdForm.count - 1);
            }
        };

        viewModel.onScroll  = function() {
            hideKeyboard();
        };

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

        viewModel.closeSubItemModal = function(){
            subItemModal.hide();
            viewModel.searchResults = [];
            viewModel.search = {};
        };

        viewModel.subCustomClick = function(sub_order_line){
            $log.debug('subCustomClick',sub_order_line);
            $ionicModal.fromTemplateUrl('app/shopper/orders/orderProducts/subCustomProductModal.html', {scope: $scope,focusFirstInput: true})
                .then(function(modal) {
                    subCustomProductModal = modal;
                    subCustomProductModal.show();
                });
        };

        viewModel.cancelSubCustomProd = function(){
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
            updateOrderLineOnOrder(viewModel.detailItemOrderId , viewModel.detailItem);
            UIUtil.hideLoading();
            subCustomProductModal.hide();
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
            viewModel.addActualQuantity(viewModel.detailItem, viewModel.detailItemOrderId);
            updateOrderLineOnOrder(viewModel.detailItemOrderId , viewModel.detailItem);
            UIUtil.hideLoading();
        };

        viewModel.removeSubstituteProductClick = function(un_sub_order_item){
            UIUtil.showLoading();
            viewModel.detailItem.actual_product = null;
            viewModel.detailItem.actual_qty = 0;
            updateOrderLineOnOrder(viewModel.detailItemOrderId , viewModel.detailItem);
            UIUtil.hideLoading();
        };

        viewModel.getCategoryCountInCart = function(category) {
            try{
                var count = 0;
                var products = viewModel.getProductsForCategory(category);
                angular.forEach(products, function(product, index){
                    var order_line = product.order_line;
                    if(order_line.inCart){
                        count ++;
                    }
                });
                return count;
            } catch (exception){
                LogService.error(['getCategoryCountInCart', exception, category]);
                return 0;
            }
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

        function searchForProducts(text) {
            $log.info('searching:'+text);
            $scope.myPromise = ProductService.searchForShopperProducts(text)
                .then(function(results){
                    viewModel.searchResults = results;
                },function(error){
                    UIUtil.showAlert('Error','Error when searching for products.');
                });
        }

        function isSameObject(obj1, obj2){
            return obj1 === obj2;
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

        //This is what brings it all back to earth... and its ugly for now.
        function updateOrderLineOnOrder(orderId, orderLine) {
            //go get the order
            // update the order's order line to match this local order line.
            //then save that shit updateOneOfTheOrders
            var gottenOrder = MyOrdersService.getOrder(orderId);
            var foundOrderLine = _.find(gottenOrder.order_lines, function(ol){ return ol.id == orderLine.id; });
            var index = gottenOrder.order_lines.indexOf(foundOrderLine);
            gottenOrder.order_lines[index] = orderLine;
            MyOrdersService.updateOneOfMyOrders(gottenOrder);
        }

        function hideKeyboard() {
            $timeout(function () {
                if($cordovaKeyboard.isVisible()) {
                    $cordovaKeyboard.close();
                }
            }, 1);
        }

        $scope.$on('$ionicView.beforeEnter', function() {
            viewModel.shoppingListCount = ShoppingListService.getCountInShoppingList();
        });

        $scope.$on('$ionicView.afterEnter', function() {
            viewModel.catNames = [];
            viewModel.products = [];
            structureDataForShoppingList();
        });


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

        viewModel.productDataWrongClick = function(product, orderId) {
            OrderService.submitWrongProductData(product, orderId);
        };

        viewModel.productNotAvailableClick = function(product, orderId) {
            OrderService.requestedProductNotAvailableText(product, orderId);
        };

        viewModel.markProductAsNotFound = function(orderLine, orderId) {
            ProductListService.markProductAsNotFound(orderLine, orderId);
        };

        function getParentProductForOrderLine (orderLine) {
            var orderId;
            var product = _.find(viewModel.products, function(product){ return orderLine.id == product.order_line.id; });
            return product;
        }

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
            if(nextOrderLine) {
                $scope.detailItemIndex = getIndexString(indexToShow) ;
                viewModel.changeItem = true;
                $timeout(function(){
                    var product = getParentProductForOrderLine(nextOrderLine);
                    viewModel.detailItemOrderId = product.orderId;
                    viewModel.detailItemOrderCustomerName = product.customerName;
                    viewModel.detailItembackgroundColor = product.backgroundColor;
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
                    var product = getParentProductForOrderLine(nextOrderLine);
                    viewModel.detailItemOrderId = product.orderId;
                    viewModel.detailItemOrderCustomerName = product.customerName;
                    viewModel.detailItembackgroundColor = product.backgroundColor;
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

        LogService.info('Shopping List Open.');

    }
})();
