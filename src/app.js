import gRpcLibrary from '@grpc/grpc-js';
import gRpcServer from './grpc/grpc-server.js';
import configs from './configs/index.js';
import logger from './logger/index.js';

const host = configs.get('gRpc.server.host');
const port = configs.get('gRpc.server.port');
gRpcServer.bindAsync(`${host}:${port}`, gRpcLibrary.ServerCredentials.createInsecure(), (error, port) => {
    if (error) {
        logger.error(`Error: ${error}`);
        process.exit();
    }
    logger.info(`gRPC is binded to port ${port}.`);

    gRpcServer.start();
});
