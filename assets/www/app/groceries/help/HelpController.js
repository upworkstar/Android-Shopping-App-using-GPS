

(function () {
    'use strict';

    angular.module('GrubrollApp').controller('HelpController', [
        '$scope',
        '$rootScope',
        '$state',
        'UIUtil',
        '$log',
        'VersionProvider',
        HelpController]);

    function HelpController($scope,
                            $rootScope,
                            $state,
                            UIUtil,
                            $log,
                            VersionProvider) {

        var viewModel = this;

        viewModel.navToFaq = function(){
            $state.go('app.faq');
        };

        viewModel.contactClick = function(){
            $state.go('app.contactUs');
        };

        viewModel.showFaq = function(){
            if(webVersion){
                return false;
            } else {
                return true;
            }
        };

        function loadVersion(){
            try {
                VersionProvider.getVersionObject()
                    .then(function(version){
                        viewModel.version = version;
                    });
            } catch (exception) {
                $log.error(exception);
            }
        }

        loadVersion();

    }
})();
