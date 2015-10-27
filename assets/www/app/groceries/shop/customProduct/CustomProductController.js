/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('GrubrollApp').controller('CustomProductController', [
        '$scope',
        '$rootScope',
        'ShoppingCartService',
        CustomProductController]);

    function CustomProductController($scope,
                                     $rootScope,
                                     ShoppingCartService) {
        var viewModel = this;

        viewModel.cancelAddCustomProduct = function(){
            loadViewModelData();
            $rootScope.$broadcast('close.addCustomProduct');
        };

        viewModel.saveCustomProduct = function(){
            ShoppingCartService.addProductToCart(viewModel.customProduct);
            loadViewModelData();
            $rootScope.$broadcast('close.addCustomProduct');
        };

        viewModel.subtractFromCustomItemCount = function(){
            if(viewModel.customProduct.qty != 1){
                viewModel.customProduct.qty = (viewModel.customProduct.qty - 1);
            }
        };

        viewModel.addToCustomItemCount = function(){
            viewModel.customProduct.qty = (viewModel.customProduct.qty + 1);
        };


        function loadViewModelData(){
            viewModel.customProduct = {
                isCustom: true,
                price: 0,
                qty:1
            };

            viewModel.title = "Special Request";
        }

        loadViewModelData();

    };
})();


