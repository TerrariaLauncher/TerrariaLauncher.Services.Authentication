import gRpcLibrary from '@grpc/grpc-js';
import gRpcObject from './grpc-object.js';
import * as authentication from './grpc-services/authentication.js';
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
                logger.error(error);
            });
    };
}

const gRpcServer = new gRpcLibrary.Server();
gRpcServer.addService(gRpcObject
    .terraria_launcher.protos.services.authentication
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

export default gRpcServer;
