import gRpcLibrary from '@grpc/grpc-js';
import gRpcObject from './grpc-object.js';
import * as authentication from './grpc-services/authentication.js';
import * as authorization from './grpc-services/authorization.js';
import logger from '../logger/index.js';
import gRpc from '@grpc/grpc-js';
/**
 * 
 * @param {Promise<any>} func 
 */
function asyncWrapper(func) {
    return function (...params) {
        func(...params)
            .catch(error => {
                logger.error(error);

                const call = params[0];
                const callback = params[1];
                if (callback) {
                    try {
                        callback({
                            code: gRpc.status.INTERNAL,
                            details: 'Internal error.'
                        }, null);
                    } catch (callbackError) {
                        logger.error(callbackError);
                    }
                } else {
                    // call.??
                }
            });
    };
}

function syncWrapper(func) {
    return function (...params) {
        try {
            func(...params);
        } catch (error) {
            logger.error(error);

            try {
                const callback = params[1];
                if (callback) {
                    callback({
                        code: gRpc.status.INTERNAL,
                        details: 'Internal error.'
                    }, null);
                }
            } catch (callbackError) {
                logger.error(callbackError);
            }
        }
    }
}

const gRpcServer = new gRpcLibrary.Server();
gRpcServer.addService(gRpcObject.terraria_launcher.protos.services.authentication
    .Authentication.service,
    {
        Register: asyncWrapper(authentication.register),
        Login: asyncWrapper(authentication.login),
        RenewAccessToken: asyncWrapper(authentication.renewAccessToken),
        ParseAccessToken: asyncWrapper(authentication.verifyAccessToken),
        ChangePassword: asyncWrapper(authentication.changePassword),
        UpdateUser: asyncWrapper(authentication.updateUser),
        GetUserByName: asyncWrapper(authentication.getUserByName),
        GetUserByEmail: asyncWrapper(authentication.getUserByEmail)
    }
);
gRpcServer.addService(gRpcObject.terraria_launcher.protos.services.authentication
    .Authorization.service,
    {
        DoesGroupContainsPermission: syncWrapper(authorization.doesGroupContainsPermission)
    }
);

export default gRpcServer;
