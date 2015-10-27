/**
 * Created by JH on 9/25/15.
 */

(function () {
    'use strict';

    angular.module('common').controller('LoginController', [
        '$scope',
        '$log',
        '$rootScope',
        'UIUtil',
        'AuthService',
        LoginController]);

    function LoginController($scope,
                                  $log,
                                  $rootScope,
                                  UIUtil,                                  AuthService) {

        $log.info('LoginController loaded');

        $scope.appName = appName;
        if($scope.appName == 'grocery') {
            $scope.userInputType = 'email';
            $scope.userInputLabel = "Email";
            $scope.title = "Grubroll";
        } else {
            $scope.userInputType = 'text';
            $scope.userInputLabel = "Username";
            $scope.title = "Grubroll Grubrunner";
        }

        $scope.invalidLogin = false;
        $scope.login = {
            username: null,
            password: null
        };

        $scope.invalidLoginMessage = "";
        $scope.errorLoginMessage = "There was an error.";

        $scope.loginSubmit = function(loginData) {
            UIUtil.showLoading();
            AuthService.authenticateUser(loginData)
                .then(function(data){
                      if (data.res == "0"){
                      
                          $log.info('login success');
                          loginData = null;
                          $scope.login = {
                          username: null,
                          password: null
                          };
                          $scope.loginError = false;
                          $scope.invalidLogin = false;
                          $rootScope.$broadcast('user.loggedin', data);
                          UIUtil.hideLoading();
                      
                      } else {
                          $scope.invalidLoginMessage = "Invalid credentials";
                          $scope.invalidLogin = true;
                          $scope.loginError = false;
                          UIUtil.hideLoading();
                      }
                      
                },function(data){
                    $log.error('error', data);
                    if(data){
                        if(data.errors){
                            $scope.invalidLoginMessage = data.errors;
                        } else {
                            $scope.invalidLoginMessage = "Invalid credentials";
                        }

                        $scope.invalidLogin = true;
                        $scope.loginError = false;

                    } else {
                        $scope.loginError = true;
                        $scope.invalidLogin = false;
                    }
                    UIUtil.hideLoading();
                });
        };

        $scope.signUp = function(){
            $log.info('signup');
            $rootScope.$broadcast('show-register-page');
        };

        $scope.resetPassword = function () {
            var url = 'https://app.grubroll.com/password_resets/new';
            window.open(url, '_system', 'location=yes'); return false;
        };

        $scope.resetPasswordShopper = function () {
            var url = 'https://app.grubroll.com/shopper/password_resets/new';
            window.open(url, '_system', 'location=yes'); return false;
        };
    }
})();


