import grpc from '@grpc/grpc-js';
import * as authentication from './grpc-services/authentication.js';
import * as authorization from './grpc-services/authorization.js';
import { AuthenticationService } from './generated-code/services/authentication/authentication_grpc_pb.cjs';
import { AuthorizationService } from './generated-code/services/authentication/authorization_grpc_pb.cjs';

import logger from '../logger/index.js';
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
                            code: grpc.status.INTERNAL,
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
                        code: grpc.status.INTERNAL,
                        details: 'Internal error.'
                    }, null);
                }
            } catch (callbackError) {
                logger.error(callbackError);
            }
        }
    }
}

const gRpcServer = new grpc.Server();
gRpcServer.addService(AuthenticationService,
    {
        register: asyncWrapper(authentication.register),
        login: asyncWrapper(authentication.login),
        renewAccessToken: asyncWrapper(authentication.renewAccessToken),
        parseAccessToken: asyncWrapper(authentication.verifyAccessToken),
        changePassword: asyncWrapper(authentication.changePassword),
        updateUser: asyncWrapper(authentication.updateUser),
        getUser: asyncWrapper(authentication.getUser),
    }
);
gRpcServer.addService(AuthorizationService,
    {
        isGroupAllowed: syncWrapper(authorization.isGroupAllowed)
    }
);

export default gRpcServer;
