
/**
 * Created by JH
 */

(function () {
    'use strict';

    angular.module('common').factory('LogService', ['$log',LogService]);

    function LogService($log) {

        var service = {
            info:logInfo,
            debug:logDebug,
            critical: logCritical,
            error: logError,
            errorLog: logError,
            warning: logWarning,
            configUserLogInfo: configureRollbarLog
        };

        return service;

        function logInfo(object){
            try {
                $log.info( object);
                if (Rollbar && document.location.hostname != "localhost") {
                    Rollbar.info(object);
                }
            } catch (exception) {

            }
        }

        function logDebug(object){
            try {
                $log.debug( object);
                if (Rollbar && document.location.hostname != "localhost") {
                    Rollbar.debug(object);
                }
            } catch (exception) {

            }
        }

        function logCritical(object){
            try {
                $log.error( object);
                if (Rollbar && document.location.hostname != "localhost") {
                    Rollbar.critical(object);
                }
            } catch (exception) {

            }
        }

        function logError(object) {
            try {
                $log.error( object);
                if (Rollbar && document.location.hostname != "localhost") {
                    Rollbar.error(object);
                }
            } catch (exception) {
            }
        }

        function logWarning(object) {
            try {
                $log.warn( object);
                if (Rollbar && document.location.hostname != "localhost") {
                    Rollbar.warning(object);
                }
            } catch (exception) {

            }
        }

        function configureRollbarLog(userInfo) {
            try {
                if(userInfo && document.location.hostname != "localhost") {
                    Rollbar.configure({
                        payload: {
                            person: {
                                id: userInfo.id,
                                username: userInfo.name,
                                email: userInfo.email
                            }
                        }
                    });
                }
            } catch (exception) {

            }
        }
    }
})();