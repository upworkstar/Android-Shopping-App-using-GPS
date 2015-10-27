

(function () {
    'use strict';

    angular.module('GrubrollApp').controller('ArticleController', [
        '$scope',
        '$stateParams',
        '$state',
        'UIUtil',
        '$log',
        'AccountService',
        'HelpService',
        ArticleController]);

    function ArticleController($scope,
                               $stateParams,
                           $state,
                           UIUtil,
                           $log,
                           AccountService,
                           HelpService) {

        var viewModel = this;

        viewModel.article = angular.fromJson($stateParams.article);
 
    }
})();
