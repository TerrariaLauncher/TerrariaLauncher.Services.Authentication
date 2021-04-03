import convict from 'convict';

const configs = convict({
    env: {
        default: 'development',
        format: ['production', 'development'],
        env: 'NODE_ENV'
    },
    gRpc: {
        server: {
            host: {
                default: 'localhost'
            },
            port: {
                default: 3101
            }
        },
        tShockPlugins: {
            tShockManagement: {
                host: {
                    default: 'localhost',
                },
                port: {
                    default: 3102
                }
            }
        }
    },
    database: {
        host: {
            default: 'localhost'
        },
        port: {
            default: 3306
        },
        name: {
            default: 'terraria_launcher'
        },
        userName: {
            default: 'launcher'
        },
        password: {
            default: 'Th3B3stP@ssw0rd3v3r'
        }
    },
    accessTokenSecret: {
        default: 'S3cret_#'
    }
});

const env = configs.get('env');
configs.loadFile(`./configs.${env}.json`);
configs.validate({ allowed: 'strict' });

export default configs;
