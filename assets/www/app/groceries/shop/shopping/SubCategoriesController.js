/**
 * Created by JH
 */


(function () {
    'use strict';

    angular.module('GrubrollApp').controller('SubCategoriesController', [
        '$scope',
        '$state',
        'ShoppingService',
        '$stateParams',
        'UIUtil',
        'LogService',
        'AccountService',
        SubCategoriesController]);

    function SubCategoriesController($scope,
                                     $state,
                                     ShoppingService,
                                     $stateParams,
                                     UIUtil,
                                     LogService,
                                     AccountService) {

        $scope.dataLoaded = false;

        $scope.guest_account= function(){
            return AccountService.isCustomerGuest();
        } ;

        $scope.doRefresh = function() {
            ShoppingService.getSubCategories($scope.parentCat,true)
                .then(function(data){
                    $scope.subCategories = data.categories;
                    $scope.$broadcast('scroll.refreshComplete');
                }
                ,function(error){
                    LogService.error({
                        message: 'getSubCategories error',
                        error:error
                    });
                    $scope.$broadcast('scroll.refreshComplete');
                });
        };

        $scope.$on('$ionicView.beforeEnter', function(){
            refreshCartItems();
        });

        var loadData = function(){
            $scope.parentCat = angular.fromJson($stateParams.parentCat);
            refreshCartItems();
            $scope.title = $scope.parentCat.name;
        };

        var loadSubCategories = function () {
            ShoppingService.getSubCategories($scope.parentCat, true)
                .then(function(data){
                    $scope.subCategories = data.categories;
                    $scope.$broadcast('scroll.refreshComplete');
                    $scope.dataLoaded = true;
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                }
                ,function(error){
                    UIUtil.showErrorAlert('Error loading categories.')
                });
        };

        $scope.loadMoreItems = function() {
            loadSubCategories();
        };

        $scope.showProducts = function(subCat) {
            $state.go('app.products', {category: angular.toJson(subCat)});
        };

        $scope.goToCart = function() {
            $state.go('app.shoppingCart');
        };

        $scope.moreDataCanBeLoaded = function() {
            if($scope.dataLoaded){
                return false;
            } else {
                return true;
            }
        };

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

        loadData();

    };
})();


