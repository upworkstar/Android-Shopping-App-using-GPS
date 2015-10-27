/**
 * Created by JH on 9/25/15.
 */

(function () {
    'use strict';

    angular.module('GrubrollApp').controller('RegisterController', [
        '$scope',
        '$log',
        '$rootScope',
        'UIUtil',
        'AuthService',
        'LogService',
        RegisterController]);

    function RegisterController($scope,
                                $log,
                                $rootScope,
                                UIUtil,
                                AuthService,
                                LogService) {

        $log.info('LoginController loaded');

        $scope.invalidLogin = false;
        $scope.login = {
            username: null,
            password: null
        };

        $scope.invalidRegisterMessage = "Registration Invalid";
        $scope.errorRegisterMessage = "There was an error.";

        $scope.metros = [];

        function loadMetros() {
            AuthService.getMetros()
                .then(function(data) {
                    $scope.metros = data;
                },function(error){
                    LogService.error(['Error getting metros', error]);
                })
        }

        $scope.registerSubmit = function(registerData) {
            UIUtil.showLoading();
            var newUserData = angular.copy(registerData);

            newUserData.metro_id = newUserData.metro.id;

            newUserData = _.omit(newUserData, 'metro');

            AuthService.registerUser(newUserData)
                .then(function(data){
                    $log.info('register success');
                    registerData = null;
                    $scope.register = null;
                    $scope.loginError = false;
                    $scope.invalidLogin = false;
                    //fire off the event telling the app that there has been a successful login
                    $rootScope.$broadcast('user.registered', data);
                    UIUtil.hideLoading();
                },function(data){
                    $log.error('error', data);
                    LogService.error(data);
                    var message = getErrorMessageForRegister(data);
                    UIUtil.hideLoading();
                    UIUtil.showErrorAlert(message);
                    if(data){
                        $scope.invalidLogin = true;
                        $scope.loginError = false;
                    } else {
                        $scope.loginError = true;
                        $scope.invalidLogin = false;
                    }
                });
        };

        function getErrorMessageForRegister(error) {
            try {
                if(!error || !error.errors){
                    return 'There was an error when attempting to register.';
                }
                var message = '';
                var i;


                if(error.errors.base){
                    for (i=0; i< error.errors.base.length; i++) {
                        message += '\n';
                        message += ' ' + error.errors.base[i];
                    }
                }

                if(error.errors.metro){
                    for (i=0; i< error.errors.metro.length; i++) {
                        message += '\n';
                        message += ' ' + error.errors.metro[i];
                    }
                }

                if(error.errors.email){
                    for (i=0; i< error.errors.email.length; i++) {
                        message += '\nEmail';
                        message += ' ' + error.errors.email[i] + '.';
                    }
                }
                if(error.errors.name){
                    for (i=0; i< error.errors.name.length; i++) {
                        message += '\nFull Name';
                        message += ' ' + error.errors.name[i] + '.';
                    }
                }
                if(error.errors.password){
                    for (i=0; i< error.errors.password.length; i++) {
                        message += '\nPassword';
                        message += ' ' + error.errors.password[i] + '.';
                    }
                }
                if(error.errors.username) {
                    for (i = 0; i < error.errors.username.length; i++) {
                        if (error.errors.username[i] == 'has already been taken') {
                            message += '\nEmail';
                            message += ' ' + error.errors.username[i] + '.';
                        } else {
                            message += '\nUsername';
                            message += ' ' + error.errors.username[i] + '.';
                        }
                    }
                }
                if(error.errors.phone){
                    for (i=0; i< error.errors.phone.length; i++) {
                        message += '\nPhone';
                        message += ' ' + error.errors.phone[i] + '.';
                    }
                }

                return message;
            } catch (exception) {
                return 'There was an error when attempting to register.';
            }
        }

        $scope.signUp = function(){
            $log.info('signup');
        };

        $scope.cancelRegister = function(){
            $rootScope.$broadcast('cancel-register');
        };

        loadMetros();

    }
})();


