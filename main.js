const Database = require('./Database')
const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto')
const speakeasy = require('speakeasy')

const port = 6789    // 端口

const verifySecret = speakeasy.generateSecret().base32
const zecSecret = speakeasy.generateSecret().base32

const app = express()
const db = new Database.Sqlite('data.db')

function getKey(secret) { return speakeasy.totp({ secret, encoding: 'base32', step: 30 }) }

function sleep(ms) { return new Promise(res => setTimeout(res, ms)) }

async function autoShowVerifyKey() {
    const timeStep = 30;
    const timestamp = Math.floor(Date.now() / 1000);
    const remainingSeconds = (timeStep - (timestamp % timeStep)) % timeStep;
    if (remainingSeconds === 0) {
        await sleep(1000)
        return autoShowVerifyKey()
    }

    console.info(`当前系统安全验证码为：${getKey(verifySecret)}\n有效时间：${remainingSeconds}s`)
    setTimeout(autoShowVerifyKey, remainingSeconds * 1000)
}

app.use(express.static('static'))
app.post('/api/*', bodyParser())
app.get('/api/query-by-zec', async (req, res) => {
    const zec = req.query.zec
    if (!zec) return res.json({
        success: false,
        code: 400,
        reason: '未提供小张物流码'
    })

    const record = await db.selectOne('select * from expresses where zec = ?', [zec])
    if (!record) return res.json({
        success: false,
        code: 404,
        reason: '找不到相关记录'
    })
    res.json({
        success: true,
        ...record
    })
})

app.get('/api/query-by-ecc', async (req, res) => {
    const ecc = req.query.ecc
    if (!ecc) return res.json({
        success: false,
        code: 400,
        reason: '未提供物流公司码'
    })

    const record = await db.selectOne('select * from expresses where ecc = ?', [ecc])
    if (!record) return res.json({
        success: false,
        code: 404,
        reason: '找不到相关记录'
    })
    res.json({
        success: true,
        ...record
    })
})

app.get('/api/receive', async (req, res) => {
    const zec = req.query.zec
    if (!zec) return res.json({
        success: false,
        code: 400,
        reason: '未提供小张物流码'
    })

    const record = await db.selectOne('select * from expresses where zec = ?', [zec])
    if (!record) return res.json({
        success: false,
        code: 404,
        reason: '找不到相关记录',
    })

    if (record.state === 1) return res.json({
        success: false,
        reason: '此物流已经被标记为已签收 不可二次签收',
    })

    await db.run('update expresses set arriveTime = ?, state = 1, markedBy = 1 where zec = ?', [Date.now(), zec])
    res.json({
        success: true,
    })
})

app.post('/api/my-expresses', async (req, res) => {
    const name = req.body.name
    const password = req.body.password ? crypto.createHash('sha512').update(req.body.password).digest('hex') : ''

    if (!name) return res.json({
        success: false,
        code: 401,
        reason: '你没告诉我你是谁',
    })

    const user = await db.selectOne('select * from users where name = ?', [name])
    if (user && password !== user.password) return res.json({
        success: false,
        code: 401,
        reason: '密码不匹配',
    })

    const expresses = await db.select('select * from expresses where receiver = ? or sender = ?', [name, name])
    res.json({
        success: true,
        expresses,
    })
})

app.post('/api/send-express', async (req, res) => {
    let keys = [
        'sender', 'password', 'ecc', 'describe',
        'website', 'sendLocation', 'receiver', 'targetLocation',
    ]

    for (let i of keys) {
        if ((!req.body[i] && !['ecc', 'website'].includes(i)) || typeof req.body[i] !== 'string') return res.json({
            success: false,
            reason: '非法数据',
            code: 400,
        })
    }

    req.body.password = crypto.createHash('sha512').update(req.body.password).digest('hex')

    const sender = await db.selectOne('select * from users where name = ?', [req.body.sender])
    if (!sender) return res.json({
        success: false,
        code: 404,
        reason: '该发件人不存在',
    })
    if (sender.password !== req.body.password) return res.json({
        success: false,
        code: 401,
        reason: '密码错误',
    })

    const zec = getKey(zecSecret)
    await db.run('insert into expresses (zec, ecc, sender, receiver, sendLocation, targetLocation, describe, sendTime, arriveTime, state, markedBy, website) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);', [
        zec, req.body.ecc, req.body.sender, req.body.receiver, req.body.sendLocation, req.body.targetLocation, req.body.describe, Date.now(), 0, 0, 0, req.body.website,
    ])

    res.json({
        success: true,
        code: 200,
        zec,
    })
})

app.post('/api/user-add', async (req, res) => {
    let keys = [
        'name', 'password', 'safeCode'
    ]

    for (let i of keys) {
        if (!req.body[i] || typeof req.body[i] !== 'string') return res.json({
            success: false,
            reason: '非法数据',
            code: 400,
        })
    }

    if (req.body.safeCode !== getKey(verifySecret)) return res.json({
        success: false,
        code: 401,
        reason: '系统安全验证码错误',
    })

    req.body.password = crypto.createHash('sha512').update(req.body.password).digest('hex')

    const user = await db.selectOne('select * from users where name = ?', [req.body.name])
    if (user) return res.json({
        success: false,
        code: 403,
        reason: '该用户已经存在',
    })

    await db.run('insert into users (name, password) values (?, ?);', [
        req.body.name.trim(), req.body.password,
    ])

    res.json({
        success: true,
        code: 200,
    })
})

app.post('/api/user-del', async (req, res) => {
    let keys = [
        'name', 'safeCode'
    ]

    for (let i of keys) {
        if (!req.body[i] || typeof req.body[i] !== 'string') return res.json({
            success: false,
            reason: '非法数据',
            code: 400,
        })
    }

    if (req.body.safeCode !== getKey(verifySecret)) return res.json({
        success: false,
        code: 401,
        reason: '系统安全验证码错误',
    })

    const user = await db.selectOne('select * from users where name = ?', [req.body.name.trim()])
    if (!user) return res.json({
        success: false,
        code: 404,
        reason: '该用户不存在',
    })

    await db.run('delete from users where name = ?;', [
        req.body.name.trim()
    ])

    res.json({
        success: true,
        code: 200,
    })
})

app.post('/api/append-express', async (req, res) => {
    const zec = req.body.zec
    const password = req.body.password ? crypto.createHash('sha512').update(req.body.password).digest('hex') : ''
    const ecc = req.body.ecc
    const website = req.body.website

    if (!zec || !password || !ecc || !website || typeof zec !== 'string' || typeof password !== 'string' || typeof ecc !== 'string' || typeof website !== 'string') return res.json({
        success: false,
        code: 400,
        reason: '非法数据',
    })

    const exp = await db.selectOne('select * from expresses where zec = ?', [zec])
    if (!exp) return res.json({
        success: false,
        code: 404,
        reason: '找不到对应的物流信息',
    })

    const user = await db.selectOne('select * from users where name = ?', [exp.sender])
    if (!user) return res.json({
        success: false,
        code: 403,
        reason: '发件人没有注册',
    })

    if (password !== user.password) return res.json({
        success: false,
        code: 401,
        reason: '密码不匹配',
    })

    await db.run('update expresses set ecc = ?, website = ? where zec = ?', [ecc, website, zec])
    res.json({
        success: true,
    })
})

autoShowVerifyKey()
app.listen(port)
