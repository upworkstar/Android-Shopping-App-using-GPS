

(function () {
    'use strict';

    angular.module('GrubrollApp').controller('FaqController', [
        '$state',
        '$filter',
        'HelpService',
        FaqController]);

    function FaqController( $state,
                            $filter,
                            HelpService) {

        var viewModel = this;
        viewModel.searchArticles = [];
        viewModel.searchQuery = "";
        viewModel.showSearch = false;

        function loadFaq(){
            viewModel.loadingSpinner = true;
            HelpService.getFaq()
                .then(function(data){
                    viewModel.articles = data.articles;
                    viewModel.loadingSpinner = false;
                },function(error){
                    viewModel.errorHappened = true;
                    viewModel.loadingSpinner = false;
                })
        }

        viewModel.clearSearch = function(){
            viewModel.searchQuery = '';
        };

        viewModel.showList = function() {
            if(!viewModel.articles) return false;
            if(viewModel.articles.length < 1) return false;
            if($filter('filter')(viewModel.articles, viewModel.searchQuery).length < 1) return false;
            return true;
        };

        viewModel.articleClick = function(article){
            $state.go('app.faqArticle', {article: angular.toJson(article)});
        };

        loadFaq()
    }
})();
