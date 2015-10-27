
/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('GrubrollApp').controller('ProductsController', [
        '$scope',
        '$ionicModal',
        '$state',
        '$stateParams',
        'ShoppingService',
        '$log',
        'UIUtil',
        '$timeout',
        '$cordovaKeyboard',
        'LogService',
        '$ionicSlideBoxDelegate',
        'AccountService',
        ProductsController]);

    function ProductsController($scope,
                                $ionicModal,
                                $state,
                                $stateParams,
                                ShoppingService,
                                $log,
                                UIUtil,
                                $timeout,
                                $cordovaKeyboard,
                                LogService,
                                $ionicSlideBoxDelegate,
                                AccountService) {



        var mq = window.matchMedia('all and (max-width: 700px)');
        if(mq.matches) {
            $scope.itemWidth = '33.3%';
        } else {
            $scope.itemWidth = '20%';
        }
        $scope.getItemWidth =function() {
            return $scope.itemWidth;
        };

        $scope.searchText = null;
        $scope.addCustomProductModal = null;
        $scope.dataLoaded = false;
        $scope.showingProductHistory = false;
        var current_page = 0;
        var total_pages = null;

        $scope.searchForProduct = function (item){
            if(item.addButton) {
                return true;
            }
            if(!$scope.searchText) {
                return true;
            }
            if (item.name.toLowerCase().indexOf($scope.searchText.toLowerCase()) > -1 || item.brand_name.toLowerCase().indexOf($scope.searchText.toLowerCase()) > -1) {
                return true;
            }
            if( (item.name.toLowerCase() + ' ' + item.brand_name.toLowerCase()).indexOf($scope.searchText.toLowerCase()) > -1 ) {
                return true;
            }
            if( (item.brand_name.toLowerCase() + ' ' + item.name.toLowerCase()).indexOf($scope.searchText.toLowerCase()) > -1 ) {
                return true;
            }
            return false;
        };

        $ionicModal.fromTemplateUrl('app/groceries/shop/cartProductNotes/cartProductNotes.html', {
            scope: $scope,
            focusFirstInput: true,
            animation: 'scale-in'
        }).then(function(modal) {
            $scope.noteModal = modal;
        });

        var searchButtonIonItem = {
            addButton: true
        };

        $scope.goToCart = function() {
            $state.go('app.shoppingCart');
        };

        $scope.addItem = function(product){
            if (canClickInList()) {
                ShoppingService.addProductToCart(product);
                product.added = true;
                refreshCartItems();
            }
        };

        angular.element('#clearProductSearchText').on('touchstart' , function(){
            $log.debug('touchstart');
            $timeout(function () {
                $scope.searchText = '';
            }, 1);
        });

        $scope.removeItemFromCart = function(product){
            if (canClickInList()) {
                ShoppingService.removeOneProductFromCart(product);
                refreshCartItems();
            }
        };

        $scope.removeCartItemForProductFromCartCompletely = function(product) {
            if (canClickInList()) {
                ShoppingService.removeProductsCartItemFromCart(product);
                refreshCartItems();
            }
        };

        $scope.cartItemCountForProduct = function(product, includeZero){
            if(product){
                if(product.isCustom) {
                    var index = $scope.cartItems().map(function(el) {
                        return  el.product.name;
                    }).indexOf(product.name);
                    if(index > -1){
                        return $scope.cartItems()[index].qty;
                    } else if (includeZero) {
                        return 0;
                    }
                }

                var index = $scope.cartItems().map(function(el) {
                    return el.product.id;
                }).indexOf(product.id);
                if(index > -1){
                    if(product.product_type != "by weight") {
                        return parseInt($scope.cartItems()[index].qty);
                    } else {
                        return parseFloat($scope.cartItems()[index].qty);
                    }

                } else if (includeZero) {
                    return 0;
                }
            }
        };

        $scope.clearSearch = function(){
            $scope.searchText = null;
        };

        $scope.$on('$ionicView.beforeEnter', function(){
            refreshCartItems();
        });

        var loadData = function() {
            if($state.includes('app.recentProducts')) {
                $scope.categoryName =  "Recent Items";
                $scope.showingProductHistory = true;
            } else if($state.includes('app.recentSpecialRequests')) {
                $scope.categoryName =  "Recent Special Requests";
            } else {
                var subCat = angular.fromJson($stateParams.category);
                $scope.subCategory = subCat;
                $log.info('showing products for category:', $scope.subCategory);
                $log.info('category name: ' + $scope.subCategory.name);
                $scope.categoryName =  $scope.subCategory.name;
            }
            refreshCartItems();
        };

        function loadProducts() {
            if($state.includes('app.recentProducts')) {
                getRecentProducts();
            } else if($state.includes('app.recentSpecialRequests')) {
                recentSpecialRequests();
            } else {
                getProducts();
            }
        }

        function getRecentProducts() {
            ShoppingService.getRecentlyPurchasedProducts()
                .then(function(products) {
                    $scope.products = products;
                    $scope.dataLoaded = true;
                    $scope.products.push(searchButtonIonItem);
                    $scope.$broadcast('scroll.refreshComplete');
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                    total_pages = 0;
                }, function(error) {
                    UIUtil.showErrorAlert('Error Loading Recently Purchased Products');
                    $scope.$broadcast('scroll.refreshComplete');
                    LogService.error({
                        message: 'getRecentlyPurchasedProducts error',
                        error:error
                    });
                });
        }

        function recentSpecialRequests() {
            ShoppingService.getRecentlyPurchasedSpecialRequests()
                .then(function(products) {
                    $scope.products = products;
                    var i = 0;
                    for (i = 0; i < $scope.products.length; i++) {
                        var product = $scope.products[i];
                        if(product.product_type == 'custom') {
                            product.name = product.description;
                            product.isCustom = true;
                        }
                    }
                    $scope.dataLoaded = true;
                    $scope.products.push(searchButtonIonItem);
                    $scope.$broadcast('scroll.refreshComplete');
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                    total_pages = 0;
                }, function(error) {
                    UIUtil.showErrorAlert('Error Loading Recently Purchased Products');
                    $scope.$broadcast('scroll.refreshComplete');
                    LogService.error({
                        message: 'getRecentlyPurchasedProducts error',
                        error:error
                    });
                });
        }


        function removeAddSpecialButton() {
            var index = $scope.products.map(function(el) {
                return el.addButton;
            }).indexOf(searchButtonIonItem.addButton);
            if(index > -1) {
                $scope.products.splice(index, 1);
            }
        }

        function getProducts() {
            ShoppingService.getProducts($scope.subCategory, true, current_page += 1)
                .then(function(data){
                    current_page = data.current_page;
                    total_pages = data.total_pages;
                    if($scope.products && $scope.products.length > 1){
                        angular.forEach(data.products,function(item){
                            $scope.products.push(item)
                        });
                    } else {
                        $scope.products = data.products;
                    }
                    if((current_page -1) == total_pages) {
                        $scope.products.push(searchButtonIonItem);
                    } else {
                        removeAddSpecialButton();
                        if($scope.products.length > 0){
                            $scope.products.push(searchButtonIonItem);
                        }
                    }
                    $scope.$broadcast('scroll.refreshComplete');
                    $scope.dataLoaded = true;
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                }, function (error) {
                    UIUtil.showErrorAlert('Error retrieving products.');
                    $scope.$broadcast('scroll.refreshComplete');
                    LogService.error({
                        message: 'getProducts error',
                        error:error
                    });
                });
        }

        $scope.doRefresh = function(){
            loadProducts();
        };

        $scope.guest_account = function() {
            return AccountService.isCustomerGuest()
        };

        $scope.goToCat = function(catId){
            $state.go('app.shopping');
        };

        $scope.productInCart = function(product) {
            if(!product){
                return false;
            }
            if(product.isCustom) {
                var index = $scope.cartItems().map(function(el) {
                    return el.product.name;
                }).indexOf(product.name);
                return index > -1;
            }
            var index = $scope.cartItems().map(function(el) {
                return el.product.id;
            }).indexOf(product.id);
            return index > -1;
        };

        $ionicModal.fromTemplateUrl('app/groceries/shop/productDetail/productDetailModal.html', {scope: $scope})
            .then(function(modal) {
                $scope.productDetailModal = modal;
            });

        $scope.productDetail = function(product) {
            if (canClickInList()) {
                if(product.addButton){
                    $scope.addCustomProduct();
                    return;
                }
                $scope.productDetailProduct = product;
                $scope.productDetailModal.show();
            }
        };

        $scope.closeProductDetail = function(){
            $scope.productDetailModal.hide();
            $scope.productDetailCartItem = null;
            $scope.productDetailProduct = null;
        };

        $scope.addCustomProduct = function(){
            $ionicModal.fromTemplateUrl('app/groceries/shop/customProduct/addCustomProductModal.html', {
                scope: $scope,
                focusFirstInput: true
            }).then(function(modal) {
                $scope.addCustomProductModal = modal;
                $scope.addCustomProductModal.show();
            });
        };

        $scope.$on('close.addCustomProduct',function(){
            $scope.addCustomProductModal.hide();
            refreshCartItems();
        });

        $scope.moreDataCanBeLoaded = function() {

            if(total_pages == 0){
                return false;
            }
            if(total_pages){
                if(current_page != 0){
                    return total_pages > current_page
                }
            } else {
                return true;
            }
        };

        $scope.loadMoreItems = function() {
            $log.debug('loadMoreItems');
            loadProducts();
        };

        var lastScrolling = Date.now();

        $scope.scrollList = function() {
            lastScrolling = Date.now();
        };

        angular.element('#productsIonContent').on('touchstart' , function(){
            $log.debug('productsIonContent touchstart');
            $timeout(function () {
                if(window.cordova) {
                    if ($cordovaKeyboard.isVisible()) {
                        $cordovaKeyboard.close();
                    }
                }
            }, 1);
        });

        function canClickInList() {
            var diff =  Date.now() - lastScrolling;
            return diff > 400;
        }

        function refreshCartItems() {
            $scope.cartItems();
            $scope.cartCount();
        }

        $scope.cartItems = function(){
            return ShoppingService.getCartItems();
        };

        $scope.cartCount = function(){
            return ShoppingService.getCartItemCount();
        };

        $scope.addNoteForProduct = function(product) {
            if(product){
                var index = -1;
                if(product.isCustom) {
                    index = $scope.cartItems().map(function(el) {
                        return  el.product.name;
                    }).indexOf(product.name);
                } else {
                    index = $scope.cartItems().map(function(el) {
                        return el.product.id;
                    }).indexOf(product.id);
                }

                if(index > -1) {
                    $scope.notePopoverItem = $scope.cartItems()[index];
                    $scope.noteModal.show();
                    $scope.$broadcast('data.productNotes', $scope.notePopoverItem.note);
                }
            }
        };

        $scope.$on('close.productNotes',function(event, data){
            $scope.notePopoverItem.note = data;
            ShoppingService.updateNoteOnItem($scope.notePopoverItem);
            $scope.notePopoverItem = null;
            $scope.noteModal.hide();
            refreshCartItems();
        });

        $scope.$on('cancel.productNotes', function(){
            $scope.notePopoverItem = null;
            $scope.noteModal.hide();
        });

        var searchFocused = false;
        $scope.showCancelSearch = false;

        $scope.searchFocus = function() {
            searchFocused = true;
            $scope.showCancelSearch = true;
        };

        $scope.searchUnFocus = function() {
            searchFocused = false;
            if($scope.searching) {
                $scope.showCancelSearch = true;
            } else {
                $scope.showCancelSearch = false;
            }
            if(window.cordova && cordova.plugins.Keyboard) {
                $log.debug('closingkeyboard');
                cordova.plugins.Keyboard.close();
            }
        };

        loadData();


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

        $scope.viewRecentSpecialRequestsClick = function(){
            $state.go('app.recentSpecialRequests');
        }

    }
})();


