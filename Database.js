const sqlite3 = require('sqlite3')

// Sqlite数据库支持
class Sqlite extends sqlite3.Database {
    constructor(file) {
        super(file)    // 打开文件
    }

    // 选择记录
    select(sql, params) {
        // WARNING：绝对禁止直接执行sql语句，一定要使用占位符来防止注入
        return new Promise((res, rej) => {
            this.all(sql, params, (err, rows) => {
                if (err) rej(err)
                else res(rows || [])
            })
        })
    }

    // 选择记录并只返回第一个
    selectOne(sql, params) {
        // WARNING：绝对禁止直接执行sql语句，一定要使用占位符来防止注入
        return new Promise((res, rej) => {
            this.all(sql, params, (err, row) => {
                if (err) rej(err)
                else res(row[0] || null)
            })
        })
    }

    // 执行SQL语句
    run(sql, params) {
        // WARNING：绝对禁止直接执行sql语句，一定要使用占位符来防止注入
        return new Promise((res, rej) => {
            super.run(sql, params, err => {
                if (err) rej(err)
                else res()
            })
        })
    }
}

module.exports.Sqlite = Sqlite