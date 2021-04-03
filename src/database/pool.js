import mysql from 'mysql2/promise';
import configs from '../configs/index.js';

export const pool = mysql.createPool({
    host: configs.get('database.host'),
    port: configs.get('database.port'),
    database: configs.get('database.name'),
    user: configs.get('database.userName'),
    password: configs.get('database.password')
});

export default pool;
