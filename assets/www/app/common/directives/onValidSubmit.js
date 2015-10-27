/**
 * Created by JH
 */



angular
    .module('common')
    .directive('validated', ['$parse',validated]);

function validated($parse) {
    return {
        restrict: 'AEC',
        require: '^form',
        link: function(scope, element, attrs, form) {
            var inputs = element.find("*");
            for(var i = 0; i < inputs.length; i++) {
                (function(input){
                    var attributes = input.attributes;
                    if (attributes.getNamedItem('ng-model') != void 0 && attributes.getNamedItem('name') != void 0) {
                        var field = form[attributes.name.value];
                        if (field != void 0) {
                            angular.element(input).bind('blur',function(){
                                scope.$apply(function(){
                                    field.$blurred = true;
                                })
                            });
                            scope.$watch(function() {
                                return form.$submitted + "_" + field.$valid + "_" + field.$blurred;
                            }, function() {console.log(arguments);
                                if (!field.$blurred && form.$submitted != true) return;
                                var inp = angular.element(input);
                                if (inp.hasClass('ng-invalid')) {
                                    element.removeClass('has-success');
                                    element.addClass('has-error');
                                } else {
                                    element.removeClass('has-error').addClass('has-success');
                                }
                            });
                        }
                    }
                })(inputs[i]);
            }
        }
    }
}