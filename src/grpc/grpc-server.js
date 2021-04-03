import gRpcLibrary from '@grpc/grpc-js';
import gRpcObject from './grpc-object.js';
import * as authentication from './grpc-services/authentication.js';

const gRpcServer = new gRpcLibrary.Server();
gRpcServer.addService(gRpcObject
    .terraria_launcher.protos.services.authentication
    .Authentication.service,
    {
        Register: authentication.register,
        Login: authentication.login,
        RenewAccessToken: authentication.issueAccessToken,
        ParseAccessToken: authentication.verifyAccessToken,
        ChangePassword: authentication.changePassword,
        CreatePasswordRecoveryRequest: authentication.createPasswordRecoveryRequest,
        IsPasswordRecoveryRequestValid: authentication.isPasswordRecoveryRequestValid,
        ResolvePasswordRecoveryRequest: authentication.resolvePasswordRecoveryRequest
    }
);

export default gRpcServer;
