
(function () {
    'use strict';

    angular.module('GrubrollApp').controller('CategoriesController', [
        '$scope',
        '$rootScope',
        '$ionicModal',
        '$state',
        'ShoppingService',
        'ProductService',
        '$timeout',
        '$ionicScrollDelegate',
        '$cordovaKeyboard',
        'LogService',
        'AccountService',
        '$ionicSlideBoxDelegate',
        'UIUtil',
        CategoriesController]);

    function CategoriesController($scope,
                                  $rootScope,
                                  $ionicModal,
                                  $state,
                                  ShoppingService,
                                  ProductService,
                                  $timeout,
                                  $ionicScrollDelegate,
                                  $cordovaKeyboard,
                                  LogService,
                                  AccountService,
                                  $ionicSlideBoxDelegate,
                                  UIUtil) {



        var mq = window.matchMedia('all and (max-width: 700px)');
        if(mq.matches) {
            $scope.itemWidth = '33.3%';
        } else {
            $scope.itemWidth = '20%';
        }
        $scope.getItemWidth =function() {
            return $scope.itemWidth;
        };

 
        $scope.store_id = 0;
        $scope.showSearch = false;
        var current_page = 0;
        var total_pages = null;
        var lastSearchText = "";
        $scope.saleCategory = null;
        $scope.search = { searchQuery: null};
        $scope.searchResults = [];
        $scope.searching = false;
        $scope.filterText = '';
        $scope.addCustomProductModal = null;
        var searchFocused = false;
        $scope.showCancelSearch = false;
        //$scope.recentProducts = [];
        $scope.showRecentProducts = false;
        var lastScrolling = Date.now();
        $scope.dataLoaded = false;
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

        function showRecentPurchasedButton() {
            try {
                var orders = AccountService.getOrders();
                if(orders && orders != null && orders.length > 0) {
                    $scope.showRecentProducts = true;
                }
            } catch (exception) {
                LogService.error(exception);
            }
        }

        $scope.showRecentPurchased = function() {
            $state.go('app.recentProducts');
        };

        $scope.guest_account = function() {
            return AccountService.isCustomerGuest()
        };

        $scope.goToCart = function() {
            $state.go('app.shoppingCart');
        };

        $scope.$on('$ionicView.beforeEnter', function() {
            refreshCartItems();
            loadNextAvailableDelivery();
        });

        $scope.categoryClick = function(parentCat) {
            if(parentCat.name == 'StateSale'){
                $state.go('app.products', {category: angular.toJson(parentCat)});
            } else {
                $state.go('app.subcategories', {parentCat: angular.toJson(parentCat)});
            }
        };

        $scope.doRefresh = function() {
            if($scope.searching){
                $scope.$broadcast('scroll.refreshComplete');
                return;
            }
            refreshCartItems();
            showRecentPurchasedButton();
            loadCategoriesFromServer();
            loadNextAvailableDelivery();
        };

        function loadSubCategories (category){
            return ShoppingService.getSubCategories(category, true);
        }

        $scope.showProducts = function(subCat) {
            $state.go('app.products', {category: angular.toJson(subCat)});
        };

        function loadCategoriesFromServer() {
            ShoppingService.getCategories($scope.store_id)
                .then(function(data){
                    $scope.categories = data;
                    $scope.dataLoaded = true;
                    showRecentPurchasedButton();
                    $scope.$broadcast('scroll.refreshComplete');
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                },function(error){
                    $scope.$broadcast('scroll.refreshComplete');
                    $scope.dataLoaded = true;
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                });
        }

        $scope.searchSubmit = function (value) {
            var val = $scope.search.searchQuery;
            if(!val || val == "" || val == 'undefined'){
                $scope.searching = false;
                lastSearchText = "";
            } else {
                $scope.searching = true;
                $scope.filterText = val;
                searchForProducts($scope.filterText);
                $ionicScrollDelegate.$getByHandle('mainScroll').resize();
            }
        };

        $scope.$watch('search.searchQuery', function (val) {
            var val = $scope.search.searchQuery;
            if(!val || val == "" || val == 'undefined'){
                $scope.searching = false;
                lastSearchText = "";
            }
        });

        function removeAddSpecialButton() {
            var index = $scope.searchResults.map(function(el) {
                return el.addButton;
            }).indexOf(searchButtonIonItem.addButton);
            if(index > -1) {
                $scope.searchResults.splice(index, 1);
            }
        }

        function searchForProducts(text) {
            if(!text || text == "") return;
            if (text != lastSearchText) {
                //reset search params if the search is different
                $scope.searchResults = [];
                current_page = 0;
                lastSearchText = text;
            } else if(total_pages != null && total_pages <= current_page){
                //this will catch searches that were not supposed to happen
                return false;
            }
            var searchPromise = ProductService.searchForGroceryProducts(text, current_page += 1)
                .then(function(results){
                    current_page = results.current_page;
                    total_pages = results.total_pages;
                    if($scope.searchResults && $scope.searchResults.length > 1){
                        //add items to the end of the array
                        angular.forEach(results.products,function(item){
                            $scope.searchResults.push(item)
                        });
                    } else {
                        $scope.searchResults = results.products;
                    }
                    if(current_page == total_pages || total_pages == 0) {
                        if(!$scope.searchResults) $scope.searchResults = [];
                        $scope.searchResults.push(searchButtonIonItem);
                    } else {
                        removeAddSpecialButton();
                        if($scope.searchResults.length > 0){
                            $scope.searchResults.push(searchButtonIonItem);
                        }
                    }
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                    $ionicScrollDelegate.$getByHandle('mainScroll').resize();
                },function(error){
                    LogService.error({
                        message: 'Error Searching For Product',
                        error: error
                    });
                });
            if(current_page == 1){
                $scope.myPromise = searchPromise;
            }
        }

        $scope.clearSearch = function() {

            $scope.searching = false;
            $scope.search.searchQuery = null;
            $scope.searchResults = [];
            $ionicScrollDelegate.$getByHandle('mainScroll').scrollTop(true);
            $ionicScrollDelegate.$getByHandle('mainScroll').resize();

            $timeout(function () {
                $ionicScrollDelegate.$getByHandle('mainScroll').resize();
            }, 100);
        };

        angular.element('#clearSearchText').on('touchstart' , function(){
            $timeout(function () {
                $scope.search.searchQuery = '';
            }, 1);
        });

        angular.element('#catIonContent').on('touchstart' , function(){
            $timeout(function () {
                if(window.cordova) {
                    if($cordovaKeyboard.isVisible()) {
                        $cordovaKeyboard.close();
                    }
                }
            }, 1);
        });

        $scope.searchFocus = function() {
            $ionicScrollDelegate.$getByHandle('mainScroll').resize();
            $ionicScrollDelegate.$getByHandle('mainScroll').scrollTop(true);
            $ionicScrollDelegate.$getByHandle('mainScroll').resize();
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
                cordova.plugins.Keyboard.close();
            }
        };

        $scope.addItem = function(product){
            if(canClickInList()) {
                ShoppingService.addProductToCart(product);
                product.added = true;
                refreshCartItems();
            }
        };

        $scope.removeItemFromCart = function(product){
            if(canClickInList()) {
                ShoppingService.removeOneProductFromCart(product);
                refreshCartItems();
            }
        };

        $scope.cartItemCountForProduct = function(product, includeZero){
            if(product){
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

        $scope.removeCartItemForProductFromCartCompletely = function(product) {
            if(canClickInList()) {
                ShoppingService.removeProductsCartItemFromCart(product);
                refreshCartItems();
            }
        };

        $scope.productInCart = function(product) {
            if(!product){
                return false;
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
            if(canClickInList()) {
                if (product.addButton) {
                    $scope.addCustomProduct();
                    return;
                }
                $scope.productDetailProduct = product;
                $scope.productDetailModal.show();
            }
        };

        $scope.closeProductDetail = function(){
            $scope.productDetailModal.hide();
            $scope.productDetailProduct = null;
        };

        $scope.$on('user.loggedin', function (event, data) {
            $scope.dataLoaded = false;
            $scope.doRefresh();
        });
 
        $rootScope.$on('market.change', function (event, data) {
            $scope.store_id = Number(data);
            $scope.dataLoaded = false;
            $scope.doRefresh();

        });
            
        $rootScope.$on('refresh.user-data', function(event,data){
            $scope.dataLoaded = false;
            $scope.doRefresh();
        });

        $scope.$on('user.registered', function (event, data) {
            $scope.dataLoaded = false;
            $scope.doRefresh();
        });

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
                var index = $scope.cartItems().map(function(el) {
                    return el.product.id;
                }).indexOf(product.id);

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

        $scope.scrollList = function() {
            lastScrolling = Date.now();
        };

        function canClickInList() {
            var diff =  Date.now() - lastScrolling;
            return true;
            return diff > 300;
        }

        $scope.moreDataCanBeLoadedSearch = function() {
            if(!$scope.searching || total_pages == 0){
                return false;
            }
            if(total_pages ){
                if($scope.searchResults.length > 1){
                   if( total_pages > current_page){
                       return true;
                   } else {
                       return false;
                   }
                }
            } else {
                return false;
            }
        };

        $scope.loadMoreSearchItems = function() {
            searchForProducts($scope.search.searchQuery);
        };

        $scope.moreDataCanBeLoaded = function() {
            if($scope.dataLoaded){
                return false;
            } else {
                return true;
            }
        };

        $scope.loadMoreItems = function() {
            loadCategoriesFromServer();
        };

        $scope.categories = ShoppingService.getCachedCategories();

        $scope.doRefresh();

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

        $scope.clickAvailableTimeInfo = function() {
            UIUtil.showInfoAlertMessage('This delivery estimate is subject to change. ' +
                'You will be shown available time slots to choose from at checkout.')
        };

        function loadNextAvailableDelivery() {
            AccountService.getNextAvailability()
                .then(function(nextAvailable){
                    $scope.nextAvailability = nextAvailable;
                    $scope.nextAvailableErrorHappened = false;
                }, function(error){
                    $scope.nextAvailableErrorHappened = true;
                    LogService.critical([error, 'Error loading next availablity.']);
                });
        }

    }
})();
