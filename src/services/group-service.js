import * as database from '../database/index.js';

export function getGroupById(id) {
    return database.groups.getGroupById(id);
}
