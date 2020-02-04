const { db } = require('../config');
const isObject = require('lodash/isArray');
class Query {
    constructor(table) {
        this.table = table;
    }

    fetchValues = (object) => {
        let values = [];
        let values_question = [];
        let values_string = '';
        for (let key in object) {
            values.push(object[key]);
            values_question.push('?');
        }
        values_string = '(' + values_question.join(',') + ')';
        return { values_string, values };
    }

    fetchKeys(object) {
        const keys = [];
        for (let key in object) {
            keys.push(key);
        }
        return keys.join(',');
    }

    insert(object = {}) {
        const table = this.table;
        object.id = Math.ceil(Date.now() + Math.random());
        const keys = this.fetchKeys(object);
        const { values_string, values } = this.fetchValues(object);
        const sql = `INSERT INTO ${table}(${keys}) Values ${values_string}`;
        return new Promise(resolve => {
            db.run(sql, values, function (err) {
                if (err) resolve({ success: false, message: err });
                resolve({ success: true, message: "success" });
            });
        });
    }

    toCondition(object, terminate = ",") {
        let condition = '';
        let values = [];
        let i = 0;
        for (let key in object) {
            condition = i == 0 ? `${condition} ${key}=?` : `${condition} ${terminate} ${key}=?`;
            values.push(object[key]);
            i++;
        }
        return { condition, values };
    };

    findAll() {
        const table = this.table;
        const sql = `Select * From ${table}`;
        return new Promise(resolve => {
            db.all(sql, [], (err, data) => {
                if (err) resolve(err);
                if (data == undefined) resolve([]);
                console.log(data);
                resolve(data);
            });
        });
    }

    async find(object = '*', terminate = 'AND') {
        const table = this.table;
        if (object == "*") {
            return await this.findAll();
        }
        const { values, condition } = this.toCondition(object, terminate);
        const sql = `Select * From ${table} Where ${condition}`;
        return new Promise(resolve => {
            db.all(sql, values, (err, data) => {
                if (err) resolve(err);
                if (data == undefined) resolve({ error: true });
                resolve(data);
            });
        });
    }

    delete(object = {}, terminate = 'AND'){
        const table = this.table;
        const { condition, values } = this.toCondition(object, terminate);
        const sql = `DELETE FROM ${table} WHERE ${condition}`;
        return new Promise(resolve => {
            db.run(sql, values, async function (err) {
                if (err) resolve({ success: false, message: err });
                resolve({ success: true, message: "success" });
            });
        });
    }

    update(object = {}, conditions = {}) {
        const table = this.table;
        const { condition, values } = this.toCondition(object);
        const con = this.toCondition(conditions, 'AND');
        const arr = values.concat(con.values);
        let sql = `UPDATE ${table}
                SET ${condition}
                WHERE ${con.condition}`;
        return new Promise(resolve => {
            db.run(sql, arr, function (err) {
                if (err) {
                    resolve({ success: false });
                }
                resolve({ success: true });
            });
        });
    }
}

class Store extends Query {
    constructor() {
        super('stores');
    }

    async hasStore(page_id) {
        const stores = await this.find({ page_id });
        if(stores.length > 0) return stores;
        return false;
    }

    async fetchStore(store_name) {
        const stores = await this.find({ fb_token: store_name });
        if(stores.length > 0) return stores[0] || {};
        return {};
    }
}

class Session extends Query {
    constructor() {
        super('sessions');
    }

    async hasSelectedStore(sender) {
        const session = await this.find({ sender });
        if(session.length > 0) {
            const { store_name } = session[0];
            return store_name;
        }
        return false;
    }

    async fetchSession(sender) {
        const session = await this.find({ sender });
        if(session.length > 0) return session[0];
        return {};
    }
}

class User extends Query {
    constructor() {
        super('users');
    }

    async fetchUser(page_id) {
        const user = await this.find({ page_id });
        return user[0] || {};
    }
}

const store = new Store();
const session = new Session();
const user = new User();
module.exports = {
    store,
    session,
    user
}