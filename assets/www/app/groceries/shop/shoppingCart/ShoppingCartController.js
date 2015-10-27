/**
 * Created by JH
 */



(function () {
    'use strict';

    angular.module('GrubrollApp').controller('ShoppingCartController', [
        '$scope',
        '$rootScope',
        'ShoppingService',
        'ShoppingCartService',
        '$ionicModal',
        '$log',
        '$state',
        'AccountService',
        'ProductDetailProvider',
        ShoppingCartController]);

    function ShoppingCartController($scope,
                                    $rootScope,
                                    ShoppingService,
                                    ShoppingCartService,
                                    $ionicModal,
                                    $log,
                                    $state,
                                    AccountService,
                                    ProductDetailProvider) {

        $scope.guest_account = function(){
            return AccountService.isCustomerGuest();
        };

        $scope.title = "Cart";
        $scope.total = 0;

        $rootScope.$on('cart.items.saved.refresh', function(){
            $scope.refreshCartData();
        });

        $ionicModal.fromTemplateUrl('app/groceries/shop/cartProductNotes/cartProductNotes.html', {
            scope: $scope,
            focusFirstInput: true,
            animation: 'scale-in'
        }).then(function(modal) {
            $scope.noteModal = modal;
        });

        $ionicModal.fromTemplateUrl('app/groceries/shop/customProduct/addCustomProductModal.html', {
            scope: $scope,
            focusFirstInput: true
        }).then(function(modal) {
            $scope.addCustomProductModal = modal;
        });

        $scope.addCustomProduct = function(){
            $scope.addCustomProductModal.show();
        };

        $scope.clickCartItem = function(cartItem){
            ProductDetailProvider.showModal($scope,cartItem.product)
                .then(function(){
                    $scope.refreshCartData()
                });
        };

        $scope.$on('close.addCustomProduct',function(){
            $scope.addCustomProductModal.hide();
            $scope.refreshCartData();
        });

        $scope.refreshCartData = function(fromServer) {
            if(fromServer){
                $scope.cartItems = ShoppingService.getCartItems();
                $scope.updateTotal();
                ShoppingCartService.loadServerCart()
                    .then(function(){
                        $scope.cartItems = ShoppingService.getCartItems();
                        $scope.updateTotal();
                        $scope.$broadcast('scroll.refreshComplete');
                    });
            } else {
                $scope.cartItems = ShoppingService.getCartItems();
                console.log($scope.cartItems);
                $scope.updateTotal();
            }
        };

        $scope.clearCart = function(){
            ShoppingService.clearCart();
            $scope.cartItems = [];
        };

        $scope.updateTotal = function(){
            try {
                var total = 0;
                angular.forEach($scope.cartItems, function(cartItem){
                    if(cartItem.product.on_sale){
                        total = total + (cartItem.product.sale_price * cartItem.qty);
                    } else {
                        total = total + (cartItem.product.price * cartItem.qty);
                    }
                });
                $scope.total = total;
            } catch (exception) {

            }
        };

        $scope.completeOrder = function(){
            $state.go('app.groceryMap', {cart: angular.toJson($scope.cartItems)});
        };

        $scope.$on('$ionicView.beforeEnter', function(){
            $scope.refreshCartData(true);
        });

        $scope.addNote = function(item) {
            $scope.noteModal.show();
            $scope.notePopoverItem = item;
            $scope.$broadcast('data.productNotes',$scope.notePopoverItem.note);
        };

        $scope.$on('close.productNotes',function(event, data){
            $scope.notePopoverItem.note = data;
            ShoppingService.updateNoteOnItem($scope.notePopoverItem);
            $scope.notePopoverItem = null;
            $scope.noteModal.hide();
        });

        $scope.$on('cancel.productNotes', function(){
            $scope.notePopoverItem = null;
            $scope.noteModal.hide();
        });

        $scope.addProduct = function(productToAdd){
            $log.info('add item', productToAdd);
            ShoppingService.addProductToCart(productToAdd);
            $scope.refreshCartData();
        };

        $scope.removeCartItemForProductFromCartCompletely = function(cartItem) {
            ShoppingService.removeProductsCartItemFromCart(cartItem.product);
            $scope.refreshCartData();
        };

        $scope.removeProduct = function(productToRemove){
            ShoppingService.removeOneProductFromCart(productToRemove);
            $scope.refreshCartData();
        };
    }
})();


