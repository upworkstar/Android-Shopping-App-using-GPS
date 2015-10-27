
(function () {
    'use strict';

    angular.module('GrubrollApp').controller('TextNotesModalController', [
        '$scope',
        '$rootScope',
        TextNotesModalController]);

    function TextNotesModalController($scope,
                                     $rootScope) {
        var viewModel = this;

        viewModel.placeholder = "please add more detail about the product.";
        viewModel.text = "";

        viewModel.cancelNotes = function(){
            $scope.cancelModal();
        };

        viewModel.saveNotes = function(){
            $scope.saveModal(viewModel.text);
        };

        viewModel.title = $scope.title;
        viewModel.text = $scope.text;
        viewModel.placeholder = $scope.placeholder;

    }
})();


