const { db } = require('../config');
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
                if(data.length == 1) resolve(data[0]);
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

    update(table, object = {}, conditions = {}) {
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
}

class Session extends Query {
    constructor() {
        super('sessions');
    }
}

class User extends Query {
    constructor() {
        super('users');
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