/**
 * Created by JH
 */

angular.module('common')
    .directive('stopEvent', function () {
        function stopEvent(e) {
            e.stopPropagation();
        }
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                element.bind(attr.stopEvent, stopEvent);
            }
        };
    });
