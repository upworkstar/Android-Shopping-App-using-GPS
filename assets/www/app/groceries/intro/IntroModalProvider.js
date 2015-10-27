/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('GrubrollApp').factory('IntroModalProvider', [
        '$rootScope',
        '$ionicModal',
        '$ionicSlideBoxDelegate',
        'common',
        IntroModalProvider]);

    function IntroModalProvider(
                              $rootScope,
                              $ionicModal,
                              $ionicSlideBoxDelegate,
                              common) {

      var introModal, welcomeModal = null;

      var initIntroModal = function($scope) {
          var promise;
          var tpl = 'app/groceries/intro/intro.html'
          $scope = $scope || $rootScope.$new();
          if(!introModal){
            $ionicModal.fromTemplateUrl(tpl, {
                scope: $scope,
                animation: 'slide-in-up'
              }).then(function(modal) {
                introModal = modal;
                modal.show();
              });
          } else {
              introModal.show();
          }
          $scope.closeIntro = function () {
              if($scope.slideIndex != 3){
                  $scope.next();
              } else {
                  introModal.hide();
              }
          };
          $scope.slideChanged = function(index) {
              $scope.slideIndex = index;
          };
          $scope.next = function() {
              $ionicSlideBoxDelegate.next();
          };
          $scope.previous = function() {
              $ionicSlideBoxDelegate.previous();
          };
        };

        var initWelcomeModal = function($scope) {
            var promise;
            var tpl = 'app/groceries/intro/welcome.html'
            $scope = $scope || $rootScope.$new();
            if(!welcomeModal){
              $ionicModal.fromTemplateUrl(tpl, {
                  scope: $scope,
                  animation: 'slide-in-up'
                }).then(function(modal) {
                  welcomeModal = modal;
                  welcomeModal.show();
                });
            } else {
                welcomeModal.show();
            }
            $scope.closeWelcomeIntro = function (screenToShow) {
                if(screenToShow == 'login'){
                    common.checkLogin();
                } else {
                    $rootScope.$broadcast('show-register-page');
                }
                welcomeModal.hide();
            };

          };

        return {
          showIntroModal: initIntroModal,
          showWelcomModal: initWelcomeModal
        }

    }
})();
