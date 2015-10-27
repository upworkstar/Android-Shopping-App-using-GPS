/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('common').factory('UIUtil', ['$ionicLoading', '$cordovaDialogs', '$ionicPopup', '$q', UIUtil]);

    function UIUtil($ionicLoading, $cordovaDialogs, $ionicPopup, $q) {


        var service = {
            showLoading: showLoading,
            hideLoading: hideLoading,
            showAlert: showAlert,
            showConfirm: showConfirm,
            showYesNoConfirm: showYesNoConfirm,
            showErrorAlert: showErrorAlert,
            promptForInput: promptForInput,
            promptForNumber: promptForNumber,
            showWarningAlertMessage:showWarningAlertMessage,
            showInfoAlertMessage:showInfoAlertMessage,
            showSocailShareUrl:showSocailShareUrl,
            promptForProductWeightInput: promptForProductWeightInput
        };

        return service;

        function showLoading(loadingMessage){
            var message = loadingMessage ? loadingMessage : 'Loading...';
            $ionicLoading.show({
                template: "<ion-spinner></ion-spinner><br/>" + message
            });
        }

        function hideLoading(){
            $ionicLoading.hide();
        }

        function showAlert(title, message){
            if(window.cordova){
                return $cordovaDialogs.alert(message, title, 'OK');
            } else {
                var alertPopup = $ionicPopup.alert({
                    title: title,
                    template: message
                });
            }
        }

        function showYesNoConfirm(title, message){
            var deferred = $q.defer();
            if(window.cordova){
                $cordovaDialogs.confirm(message, title, ['Yes','No'])
                    .then(function(buttonIndex) {
                        // 'OK' = 1, 'Cancel' = 2
                        var result = buttonIndex == 1;
                        deferred.resolve(result);
                    });
            } else {
                var myPopup = $ionicPopup.show({
                    template: message,
                    title: title,
                    buttons: [
                        { text: 'No',
                            onTap: function(e) {
                                deferred.resolve(false);
                            }

                        },
                        {
                            text: '<b>Yes</b>',
                            type: 'button-positive',
                            onTap: function(e) {
                                deferred.resolve(true);
                            }
                        }
                    ]
                });
            }
            return deferred.promise;
        }

        function showConfirm(title, message){
            var deferred = $q.defer();
            if(window.cordova){
                $cordovaDialogs.confirm(message, title, ['OK','Cancel'])
                    .then(function(buttonIndex) {
                        // 'OK' = 1, 'Cancel' = 2
                        var result = buttonIndex == 1;
                        deferred.resolve(result);
                    });
            } else {
                var confirmPopup = $ionicPopup.confirm({
                    title: title,
                    template: message
                });
                confirmPopup.then(function(res) {
                    deferred.resolve(res);
                });
            }
            return deferred.promise;
        }

        function showErrorAlert(message) {
            if(window.cordova){
                return $cordovaDialogs.alert(message, 'Error', 'OK');
            } else {
                return $ionicPopup.alert({
                    title: "<i  class='icon ion-alert-circled tax-pop-icon'></i>",
                    template: message
                });
            }
        }

        function showWarningAlertMessage(message) {
            var alertPopup = $ionicPopup.alert({
                title: "<i  class='icon ion-alert-circled warning-pop-icon'></i>",
                template: "<div class='text-center'>" + message + "</div>"
            });
            return alertPopup;
        }

        function showInfoAlertMessage(message) {
            var alertPopup = $ionicPopup.alert({
                title: "<i  class='icon ion-ios-information-outline warning-pop-icon'></i>",
                template: "<div class='text-center'>" + message + "</div>"
            });
            return alertPopup;
        }

        function promptForProductWeightInput($scope) {
            $scope = $scope;
            var deferred = $q.defer();
            $scope.data.popupWeightInput = null;
            var template = "<label class='item item-input'>"+
                                '<input size="font-size: 100%;" type="tel" ui-number-mask="2" placeholder="0.00"  ng-model="data.popupWeightInput">'+
                            "</label>";
            var myPopup = $ionicPopup.show({
                template: template,
                title: 'Product Weight',
                subTitle: 'What is the weight of this product?',
                scope: $scope,
                buttons: [
                    { text: 'Cancel' },
                    {
                        text: '<b>'+'Save Weight'+'</b>',
                        type: 'button-positive',
                        onTap: function(e) {
                            if (!$scope.data.popupWeightInput) {
                                e.preventDefault();
                            } else {
                                deferred.resolve(angular.copy($scope.data.popupWeightInput));
                            }
                        }
                    }
                ]
            });

            return deferred.promise;
        }

        function promptForNumber(title, message, buttonText, placeholder) {

            var deferred = $q.defer();
            if(!placeholder){
                placeholder = '';
            }
            $ionicPopup.prompt({
                title: title,
                template: message,
                inputType: 'number',
                inputPlaceholder: placeholder
            }).then(function(res) {
                console.log('Your input is', res);
                if(!res){
                    deferred.reject(res);
                } else {
                    deferred.resolve(res);
                }
            });


            return deferred.promise;

        }

        function promptForInput(title, message, buttonText) {
            var deferred = $q.defer();

            if(window.cordova) {
                $cordovaDialogs.prompt(message, title, ['Cancel', buttonText])
                    .then(function(response) {
                        if(response.buttonIndex == 2){
                            deferred.resolve(response.input1);
                        } else {
                            defer.reject();
                        }
                    });
            } else {
                var response = prompt(title + '\n\n' + message);
                deferred.resolve(response);
            }
            return deferred.promise;
        }

        function showSocailShareUrl(link) {
            var alertPopup = $ionicPopup.alert({
                title: "Share This Link!",
                template: "<label class='item item-input'>" +
                            "<input type='text'  value='"+link+"' readonly>" +
                          "</label>"
            });
        }
    }
})();
