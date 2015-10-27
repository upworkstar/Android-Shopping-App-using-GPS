

(function () {
    'use strict';

    angular.module('GrubrollApp').controller('ContactUsController', [
        '$scope',
        '$rootScope',
        '$state',
        'UIUtil',
        '$log',
        'LogService',
        '$cordovaEmailComposer',
        ContactUsController]);

    function ContactUsController($scope,
                                 $rootScope,
                                 $state,
                                 UIUtil,
                                 $log,
                                 LogService,
                                 $cordovaEmailComposer) {

        var viewModel = this;

        viewModel.emailClick = function(){
            try {
                if('cordova' in window){
                    $cordovaEmailComposer.isAvailable().then(function() {
                        var email = {
                            to: 'support@grubroll.com',
                            subject: 'In-App Support',
                            body: '',
                            isHtml: true
                        };
                        $cordovaEmailComposer.open(email).then(null, function () {
                            // user cancelled email
                        });
                    }, function () {
                        window.open('mailto:support@grubroll.com', '_system', 'location=yes'); return false;
                    });
                } else {
                    window.open('mailto:support@grubroll.com', '_system', 'location=yes'); return false;
                }
            } catch (exception) {
                LogService.error(['viewModel.emailClick',exception])
            }
        };

        viewModel.callClick = function(){
            window.open('tel:877-715-1319', '_system', 'location=yes'); return false;
        };

    }
})();
