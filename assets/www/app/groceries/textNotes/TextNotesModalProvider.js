
(function () {
    'use strict';

    angular.module('GrubrollApp').factory('TextNotesModalProvider', [
        '$rootScope',
        '$ionicModal',
        '$q',
        TextNotesModalProvider]);

    function TextNotesModalProvider($rootScope,
                                    $ionicModal,
                                    $q ){

        var textModal = null;

        function getModal($scope) {
            var defer = $q.defer();

            var tpl = 'app/groceries/textNotes/textNotesModal.html';
            $ionicModal.fromTemplateUrl(tpl, {
                scope: $scope
                //animation: 'slide-in-up',
                //backdropClickToClose: false,
                //hardwareBackButtonClose: false
            }).then(function(modal) {
                textModal = modal;
                defer.resolve(textModal);
            });
            return defer.promise;
        }


        var init = function($scope, title, placeholder, text) {
            var defer = $q.defer();
            $scope = $scope || $rootScope.$new();
            $scope.text = null;
            $scope.text = text;
            $scope.title = title;
            $scope.placeholder = placeholder;
            getModal($scope)
                .then(function(modal){
                    modal.show();
                });

            $scope.saveModal = function(text) {
                defer.resolve(text);
                textModal.hide();
                textModal.remove();
                textModal = null;
            };
            $scope.cancelModal = function(){
                defer.reject();
                textModal.hide();
                textModal.remove();
                textModal = null;
            };
            $scope.$on('$destroy', function() {
                if(textModal)textModal.remove();
            });

            return defer.promise;
        };

        return {
            showModal: init
        }

    }
})();
