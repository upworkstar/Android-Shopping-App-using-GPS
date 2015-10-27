/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('GrubrollApp').controller('ShareModalController', [
        '$scope',
        '$log',
        '$rootScope',
        'UIUtil',
        'SharingService',
        'LogService',
        ShareModalController]);

    function ShareModalController($scope,
                                  $log,
                                  $rootScope,
                                  UIUtil,
                                  SharingService,
                                  LogService){
        var viewModel = this;



        viewModel.cancelShare = function() {
            $log.info('cancel share');
            $rootScope.$broadcast('hide.share.modal');
        }

        viewModel.shareOrder = function() {
            SharingService.shareFriendBuy();
        };

    };
})();
