angular
    .module('common')
    .directive('guestAccountCallout', [guestAccountCallout]);

function guestAccountCallout() {

    var directive = {
        restrict: 'EA',
        template: '' +

        '<label class="item item-input item-select">'+
        '<div class="input-label">'+
        'Market : '+
        '</div>'+
        '<select ng-model="market" ng-change="showOption(market)"' +
        'required>'+
        '<option ng-selected="selected" value="5">Whole Foods</option>'+
        '<option value="7">Publix</option>'+
        '<option value="8">Winn Dixie</option>'+
        '</select>'+
        '</label>',
        
        
        link: function (scope, element, attr) {

            scope.showOption = function(market_id) {
                
//                scope.$on("toggleAnimation", function (event, args) {
//                          scope.broadcastedText = args;
//                 });
                scope.$emit('market.change', market_id);
                scope.$on('market.change', function (event, args) {
                    var broadcastedText = args;
                });
                console.log("this is option sheet" + market_id);
            }
        },
        scope: { value: '='},
        
    };
    
    return directive;
    
}