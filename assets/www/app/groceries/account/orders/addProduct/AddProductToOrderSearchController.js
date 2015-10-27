/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('GrubrollApp').controller('AddProductToOrderSearchController', [
        '$scope',
        '$log',
        '$rootScope',
        'ShoppingService',
        'ProductService',
        'UIUtil',
        '$ionicModal',
        '$ionicSlideBoxDelegate',
        'common',
        AddProductToOrderSearchController]);

    function AddProductToOrderSearchController($scope,
                                               $log,
                                               $rootScope,
                                               ShoppingService,
                                               ProductService,
                                               UIUtil,
                                               $ionicModal,
                                               $ionicSlideBoxDelegate,
                                               common) {
        var viewModel = this;


        viewModel.search = {searchQuery: null};
        viewModel.productDetailModal = null;
        var mq = window.matchMedia('all and (max-width: 700px)');
        var searchButtonIonItem = {
            addButton: true
        };
        if(mq.matches) {
            $scope.itemWidth = '33.3%';
        } else {
            $scope.itemWidth = '20%';
        }

        $scope.$on('modal.shown', function(event, modal) {
            if(modal.id == 'addProductToOrderSearch') {
                viewModel.orderAddingTo = $scope.addProductToOrder;
            }
        });

        viewModel.getItemWidth =function() {
            return $scope.itemWidth;
        };

        $ionicModal.fromTemplateUrl('app/groceries/account/orders/addProduct/addProductToOrderDetailModal.html', {scope: $scope})
            .then(function(modal) {
                viewModel.productDetailModal = modal;
            });

        viewModel.addCustomProductClick = function() {
            $rootScope.$broadcast('customProduct.addProductToOrderSearch');
        };

        viewModel.closeProductDetail = function(){
            viewModel.productDetailModal.hide();
            viewModel.productDetailProduct = null;
        };

        viewModel.productClick = function(product) {
            if (product.addButton) {
                viewModel.addCustomProductClick();
                return;
            }

            viewModel.productDetailProduct = product;
            viewModel.productDetailModal.show();

        };

        viewModel.closeAddItemModal = function(){
            $rootScope.$broadcast('close.addProductToOrderSearch');
        };

        viewModel.saveProduct = function(){
            $rootScope.$broadcast('close.addProductToOrderSearch', viewModel.productToAdd);
        };

        function loadViewModelData(){
            viewModel.productToAdd = {};
        }

        viewModel.productInCart = function(product) {
            if(!product || !viewModel.orderAddingTo){
                return false;
            }
            var index = viewModel.orderAddingTo.order_lines.map(function(el) {
                return el.requested_product.id;
            }).indexOf(product.id);
            return index > -1;
        };

        $scope.productInCart = viewModel.productInCart;

        $scope.addItemProductToOrder = function(product) {
            if(viewModel.productInCart(product)) {
                var orderLine = getOrderLineForProduct (product);
                if(orderLine.requested_product.product_type == 'by weight'){
                    orderLine.requested_qty = (orderLine.requested_qty + .5);
                } else {
                    orderLine.requested_qty ++;
                }
            } else {
                var orderLine = {};
                orderLine.requested_product = product;
                if(product.product_type == 'by weight'){
                    orderLine.requested_qty = .5;
                } else {
                    orderLine.requested_qty = 1;
                }
                orderLine.notes = null;
                viewModel.orderAddingTo.order_lines.push(orderLine);
            }
            $rootScope.$broadcast('update.OrderHistoryDetailModalController', viewModel.orderAddingTo);

        };

        function getOrderLineForProduct (product) {
            var index = viewModel.orderAddingTo.order_lines.map(function(el) {
                return el.requested_product.id;
            }).indexOf(product.id);
            if(index > -1) {
                return viewModel.orderAddingTo.order_lines[index];
            } else {
                return null;
            }
        }

        $scope.orderLineCountForProduct = function (product) {
            var orderLine = getOrderLineForProduct (product);
            if(orderLine) {
                return orderLine.requested_qty;
            }
        };

        $scope.removeItemProductToOrder = function(product) {
            var index = viewModel.orderAddingTo.order_lines.map(function(el) {
                return el.requested_product.id;
            }).indexOf(product.id);
            if(index > -1) {
                var orderLine = viewModel.orderAddingTo.order_lines[index];
                if(orderLine.requested_qty == 1 || orderLine.requested_qty == .5 ) {
                    if(orderLine.requested_product.product_type == 'by weight'){
                        if(orderLine.requested_qty == .5) {
                            viewModel.orderAddingTo.order_lines.splice(index, 1);
                        } else {
                            orderLine.requested_qty = (orderLine.requested_qty - .5);
                        }
                    } else {
                        viewModel.orderAddingTo.order_lines.splice(index, 1);
                    }
                } else {
                    if(orderLine.requested_product.product_type == 'by weight'){
                        orderLine.requested_qty = (orderLine.requested_qty - .5);
                    } else {
                        orderLine.requested_qty --;
                    }
                }
                $rootScope.$broadcast('update.OrderHistoryDetailModalController', viewModel.orderAddingTo);
            }
        };

        function refreshCartItems() {
            viewModel.cartItems = ShoppingService.getCartItems();
            viewModel.cartCount = ShoppingService.getCartItemCount();
        }

        viewModel.submitSearch = function() {
            if(viewModel.search.searchQuery != "") {
                searchForProducts(viewModel.search.searchQuery);
            }
        }

        var searchForProducts = function(text) {
            $log.info('searching:'+text);
            $scope.myPromise = ProductService.searchForGroceryProducts(text, 1)
                .then(function(results){
                      
                    viewModel.searchResults = results.products;
                    viewModel.searchResults.push(searchButtonIonItem);
                      
                },function(error){
                    UIUtil.showAlert('Error','Error when searching for products.');
                });
        };

        loadViewModelData();

        var imageModal = null;
        $scope.imageModalImageUrl = '';
        $scope.openImageModal = function(product){
            $ionicModal.fromTemplateUrl('image-modal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(modal) {
                imageModal = modal;
                var url = '';
                try {
                    if(product.images.length > 0 && product.images[0].original_size_url) {
                        url = product.images[0].original_size_url
                    }
                } catch (exception) {
                    LogService.error(exception);
                }
                $scope.imageModalImageUrl = url;
                $ionicSlideBoxDelegate.slide(0);
                imageModal.show();
            });

        };

        $scope.closeImageModal = function() {
            imageModal.hide();
        };

        $scope.imageSlideChanged = function() {
            imageModal.hide();
        };

    }
})();
