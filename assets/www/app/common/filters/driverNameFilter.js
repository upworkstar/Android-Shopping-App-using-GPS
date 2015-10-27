angular.module('common').filter('driverNameFilter', function () {
    return function (name) {
        name = $.trim(name);
        var names = name.split(' ');
        var namesLength = names.length;
        if(namesLength > 1) {
            names[namesLength - 1] = names[namesLength - 1].charAt(0) + '.';
        }
        var adjustedName = names.join(' ');
        return adjustedName;
    };
});