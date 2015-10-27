/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('common').factory('SharingService', ['$cordovaSocialSharing', '$q', 'UIUtil', 'FriendBuyService', SharingService]);

    function SharingService($cordovaSocialSharing, $q, UIUtil, FriendBuyService) {


        var service = {
            shareFriendBuy: shareFriendBuy,
            shareNativeShareSheet: shareNativeShareSheet,
            shareTwitter: shareTwitter,
            shareFacebook: shareFacebook,
            shareViaEmail: shareViaEmail,
            shareSMS: shareSMS
        };

        return service;

        function shareFriendBuy() {
            UIUtil.showLoading();
            FriendBuyService.getTrackableLinkForCurrentCustomer()
                .then(function(data) {
                    UIUtil.hideLoading();
                    shareNativeShareSheet(
                        data.friend_buy_campaign_message,
                        'Grubroll Groceries',
                        null,
                        data.trackable_link);
                }, function(error){
                    //fallback if we cannot get the other stuff just share grubroll.com
                    UIUtil.hideLoading();
                    shareNativeShareSheet(
                        'I love Grubroll!',
                        'Grubroll Groceries',
                        null,
                        'https://www.grubroll.com');
                });
        }

        function shareNativeShareSheet(message, subject, file, link){
            if('cordova' in window) {
                $cordovaSocialSharing
                    .share(message, subject, file, link) // Share via native share sheet
                    .then(function(result) {
                        // Success!
                    }, function(err) {
                        // An error occured. Show a message to the user
                    });
            } else {
                UIUtil.showSocailShareUrl(link);
            }
        }

        function shareTwitter(message, image, link) {
            if('cordova' in window) {
                $cordovaSocialSharing
                    .shareViaTwitter(message, image, link)
                    .then(function (result) {
                        // Success!
                    }, function (err) {
                        // An error occurred. Show a message to the user
                    });
            }
        }

        function shareFacebook (message, image, link) {
            if('cordova' in window) {
                $cordovaSocialSharing
                    .shareViaFacebook(message, image, link)
                    .then(function(result) {
                        // Success!
                    }, function(err) {
                        // An error occurred. Show a message to the user
                    });
            }
        }

        function shareSMS (message, number) {
            $cordovaSocialSharing
                .shareViaSMS(message, number)
                .then(function(result) {
                    // Success!
                }, function(err) {
                    // An error occurred. Show a message to the user
                });
        }

        function shareViaEmail (message, subject, toArr, ccArr, bccArr, file) {
            $cordovaSocialSharing
                .shareViaEmail(message, subject, toArr, ccArr, bccArr, file)
                .then(function(result) {
                    // Success!
                }, function(err) {
                    // An error occurred. Show a message to the user
                });
        }

    }
})();
