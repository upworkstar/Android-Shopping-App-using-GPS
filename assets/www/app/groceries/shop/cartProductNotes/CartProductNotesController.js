/**
 * Created by JH
 */


(function () {
    'use strict';

    angular.module('GrubrollApp').controller('CartProductNotesController', [
        '$scope',
        '$rootScope',
        CartProductNotesController]);

    function CartProductNotesController($scope,
                                     $rootScope) {
        var viewModel = this;

        viewModel.orderNotes = false;
        viewModel.comment = false;
        viewModel.placeholder = "please add more detail about the product.";
        viewModel.noteCartItem = {
            note: ""
        };

        viewModel.cancelNotes = function(){
            if(viewModel.orderNotes) {
                $rootScope.$broadcast('cancel.orderNotes');
            } else if (viewModel.comment){
                $rootScope.$broadcast('cancel.grubrunnerComment');
            } else {
                $rootScope.$broadcast('cancel.productNotes');
            }
        };

        viewModel.saveNotes = function(){
            if(viewModel.orderNotes) {
                $rootScope.$broadcast('close.orderNotes', viewModel.noteCartItem.note);
            } else if (viewModel.comment){
                $rootScope.$broadcast('close.grubrunnerComment', viewModel.noteCartItem.note);
            } else {
                $rootScope.$broadcast('close.productNotes', viewModel.noteCartItem.note);
            }
        };

        viewModel.addToCustomItemCount = function(){
            viewModel.customProduct.qty = (viewModel.customProduct.qty + 1);
        };

        $scope.$on('data.productNotes',function(event, data){
            if(data && (data.title || data.notes)) {
                viewModel.title = data.title;
                viewModel.noteCartItem.note = data.notes;
                viewModel.orderNotes = true;
                viewModel.placeholder = "please add more detail about the product.";
            } else {
                viewModel.title = "Product Notes";
                viewModel.noteCartItem.note = data;
            }

        });
        $scope.$on('data.grubrunnerComment',function(event, data){
            if(data && (data.title || data.comment)) {
                viewModel.title = data.title;
                viewModel.noteCartItem.note = data.comment;
                viewModel.comment = true;
                viewModel.placeholder = "please write the comment on Grubrunner.";
            } else {
                viewModel.title = "Comment on grubrunner";
                viewModel.noteCartItem.note = data;
            }

        });
    };
})();


