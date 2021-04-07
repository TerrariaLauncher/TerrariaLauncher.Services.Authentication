import winston from 'winston';

export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.errors({
            stack: true
        })
    ),
    transports: [
        new winston.transports.Console({
            level: 'info',
            format: winston.format.combine(
                winston.format.prettyPrint({ colorize: true })
            )
        })
    ]
});

export default logger;
