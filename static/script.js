// 编者注：太离谱了 前些日子总写Python 导致现在对象寻址方法都变成了 obj['xxx'] 了

function $$(id) { return document.getElementById(id) }

function $(tagName) { return document.createElement(tagName) }

function $$$(element, text) {
    element.textContent = text
    return element
}

function hideInfo() {
    $$('express-info').classList.add('mdui-hidden')
}

async function queryByZec() {
    let result
    const zec = $$('zec').value.trim()
    if (!zec) return mdui.alert('你想查询什么？', '失败', undefined, { confirmText: '确定', history: false })
    if (wantToDie(zec)) return (new mdui.Dialog('#you-must-survive', { history: false })).open()
    try {
        result = await (await fetch('/api/query-by-zec?zec=' + zec)).json()
    } catch(ee) {
        return mdui.alert('API异常 请联系开发人员解决', '服务异常', undefined, { confirmText: '确定', history: false })
    }

    if (!result.success) {
        if (result.code === 404) return (new mdui.Dialog('#404', { history: false })).open()
        else return (new mdui.alert(result.reason, '失败', undefined, { confirmText: '确定', history: false }))
    }

    showResult(result)
    $$('zec').value = ''
    mdui.mutation()
}

async function queryByEcc() {
    let result
    const ecc = $$('ecc').value.trim()
    if (!ecc) return mdui.alert('你想查询什么？', '失败', undefined, { confirmText: '确定', history: false })
    if (wantToDie(ecc)) return (new mdui.Dialog('#you-must-survive', { history: false })).open()
    try {
        result = await (await fetch('/api/query-by-ecc?ecc=' + ecc)).json()
    } catch(ee) {
        return mdui.alert('API异常 请联系开发人员解决', '服务异常', undefined, { confirmText: '确定', history: false })
    }

    if (!result.success) {
        if (result.code === 404) return (new mdui.Dialog('#404')).open()
        else return (new mdui.alert(result.reason, '失败', undefined, { confirmText: '确定', history: false }))
    }

    showResult(result)
    $$('ecc').value = ''
    mdui.mutation()
}

async function receive() {
    let result
    const zec = $$('zec-recv').value.trim()
    if (!zec) return mdui.alert('你签收了个寂寞...', '失败', undefined, { confirmText: '确定', history: false })
    if (wantToDie(zec)) return (new mdui.Dialog('#you-must-survive', { history: false })).open()
    try {
        result = await (await fetch('/api/receive?zec=' + zec)).json()
    } catch(ee) {
        return mdui.alert('API异常 请联系开发人员解决', '服务异常', undefined, { confirmText: '确定', history: false })
    }

    if (!result.success) {
        if (result.code === 404) return (new mdui.Dialog('#404', { history: false })).open()
        else return (new mdui.alert(result.reason, '失败', undefined, { confirmText: '确定', history: false }))
    }
    mdui.alert(`签收成功 小张物流码为：${zec}`, '成功', undefined, { confirmText: '确定', history: false })
    $$('zec-recv').value = ''
    mdui.mutation()
}

async function myExpresses() {
    $$('expresses-table').innerHTML = ''
    let result
    const name = $$('name').value.trim()
    const password = $$('password').value

    if (!name) return mdui.alert('你查了个寂寞...', '失败', undefined, { confirmText: '确定', history: false })
    if (wantToDie(name)) return (new mdui.Dialog('#you-must-survive', { history: false })).open()

    try {
        result = await (await fetch('/api/my-expresses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name, password
            })
        })).json()
    } catch(ee) {
        return mdui.alert('API异常 请联系开发人员解决', '服务异常', undefined, { confirmText: '确定', history: false })
    }

    if (!result.success) {
        if (result.code === 404) return (new mdui.Dialog('#404', { history: false })).open()
        else if (result.code === 401) return mdui.alert('该用户设置了密码 而你提供了空密码或错误密码', '失败', undefined, { confirmText: '确定', history: false })
        else return (new mdui.alert(result.reason, '失败', undefined, { confirmText: '确定', history: false }))
    }

    if (result['expresses'].length === 0) return mdui.alert('该用户没有任何物流', '成功', undefined, { confirmText: '确定', history: false })

    const table = $$('expresses-table')
    for (let i of result.expresses) {
        let tr = $('tr')
        
        let zec = $('td')
        tr.appendChild($$$(zec, i['zec']))

        let ecc = $('td')
        tr.appendChild($$$(ecc, i['ecc'] || '暂无'))

        let state = $('td')
        switch (i['state']) {
            case 0:
                state = $$$(state, '运输中')
                break
            case 1:
                state = $$$(state, '已签收')
                break
            case 2:
                state = $$$(state, '异常（可能已丢失或被扣押 请访问官方查询网站获取详细信息）')
                break
            default:
                state = $$$(state, '无法识别 请联系开发人员解决')
        }
        tr.appendChild(state)

        let markedBy = $('td')
        switch (i['markedBy']) {
            case 0:
                markedBy = $$$(markedBy, '发件人')
                break
            case 1:
                markedBy = $$$(markedBy, '收件人')
                break
            default:
                markedBy = $$$(markedBy, '无法识别 请联系开发人员解决')
        }
        tr.appendChild(markedBy)

        let website = $('td')
        let websiteLink = $('a')
        if (!i['website']) {
            websiteLink.href = 'javascript:;'
            websiteLink.textContent = '暂无'
        } else {
            websiteLink.href = i['website']
            websiteLink.textContent = '点此访问'
            websiteLink.target = '_blank'
        }
        website.appendChild(websiteLink)
        tr.appendChild(website)

        let describe = $('td')
        tr.appendChild($$$(describe, i['describe'] || '暂无'))

        let sender = $('td')
        tr.appendChild($$$(sender, i['sender']))

        let sendLocation = $('td')
        tr.appendChild($$$(sendLocation, i['sendLocation']))

        let sendTime = $('td')
        tr.appendChild($$$(sendTime, ( new Date(i['sendTime']).toLocaleString())))

        let receiver = $('td')
        tr.appendChild($$$(receiver, i['receiver']))

        let targetLocation = $('td')
        tr.appendChild($$$(targetLocation, i['targetLocation']))

        let arriveTime = $('td')
        tr.appendChild($$$(arriveTime, i['arriveTime'] !== 0 ? (new Date(i['arriveTime']).toLocaleString()) : '未送达'))

        table.appendChild(tr)
    }

    $$('name').value = ''
    $$('password').value = ''
}

function wantToDie(text) {
    const keywords = [
        '自杀', '死亡', '去死', '紫砂', '毁灭',
        '跳楼', '割腕', '创死', '撞死', '撞车', '安乐', '窒息', '服毒', '嗑药',
        '离开人世', '离开人间',
        '安眠药',
    ]

    for (let i of keywords) if (text.includes(i)) return true
    return false
}

function showResult(result) {
    for (let i in result) {
        if (i === 'success') continue
        if (!result[i] && typeof result[i] === 'number') continue
        if (i === 'website') {
            if (!result[i]) {
                $$('info-' + i).href = 'javascript:;'
                $$('info-' + i).textContent = '暂无'
                $$('info-' + i).target = '_self'
            } else {
                $$('info-' + i).href = result[i]
                $$('info-' + i).textContent = '点此访问'
                $$('info-' + i).target = '_blank'
            }
            continue
        } else if (['sendTime', 'arriveTime'].includes(i) && result[i] !== 0) {
            $$('info-' + i).textContent = (new Date(result[i])).toLocaleString()
        } else if (i === 'state') {
            let txt = ''
            switch(result[i]) {
                case 0:
                    txt = '运输中'
                    break
                case 1:
                    txt = '已签收'
                    break
                case 2:
                    txt = '异常（可能已丢失或被扣押 请访问官方查询网站获取详细信息）'
                    break
                default:
                    txt = '无法识别 请联系开发人员解决'
            }
            $$('info-' + i).textContent = txt
        } else if (i === 'markedBy') {
            let txt = ''
            switch(result[i]) {
                case 0:
                    txt = '发件人'
                    break
                case 1:
                    txt = '收件人'
                    break
                default:
                    txt = '无法识别 请联系开发人员解决'
            }
            $$('info-' + i).textContent = txt
        } else if (result[i] === 0) {
            continue
        } else {
            $$('info-' + i).textContent = result[i]
        }
    }
    $$('express-info').classList.remove('mdui-hidden')
}

async function sendExpress(ee) {
    let keys = [
        'sender', 'password', 'ecc', 'describe',
        'website', 'sendLocation', 'receiver', 'targetLocation',
    ]

    let payload = {}
    for (let i of keys) {
        payload[i] = ee[i].value
    }

    let result
    try {
        result = await (await fetch('/api/send-express', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })).json()
    } catch(err) {
        return mdui.alert('API异常 请联系开发人员解决', '服务异常', undefined, { confirmText: '确定', history: false })
    }

    if (!result.success) {
        if (result.code === 404) return (new mdui.Dialog('#404')).open()
        else if (result.code === 401) return mdui.alert('密码错误', '失败', undefined, { confirmText: '确定', history: false })
        else return mdui.alert(result.reason, '失败', undefined, { confirmText: '确定', history: false })
    }

    let copySuccess = true

    try{
        await navigator.clipboard.writeText(`嘿，${payload.receiver}，${payload.sender}向你发了一个物流，小张物流码是 ${result.zec}，记得及时处理哟`)
    } catch(err) { copySuccess = false }

    mdui.alert(`小张物流码：${result.zec}\n${copySuccess ? '已为你自动复制到剪贴板上了' : '请妥善保管'} 请勿分享给除 ${payload.receiver} 之外的人`, '成功', undefined, { confirmText: '确定', history: false })
    ee.reset()
    return false
}

async function appendExpress() {
    const zec = $$('zec-append').value.trim()
    const password = $$('password-append').value
    const ecc = $$('ecc-append').value.trim()
    const website = $$('website-append').value.trim()

    if (!zec || !password || !ecc || !website) return mdui.alert('你加了个寂寞...', '失败', undefined, { confirmText: '确定', history: false })
    let result
    try {
        result = await (await fetch('/api/append-express', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                zec, password, ecc, website,
            }),
        })).json()
    } catch(err) {
        return mdui.alert('API异常 请联系开发人员解决', '服务异常', undefined, { confirmText: '确定', history: false })
    }

    if (!result.success) {
        if (result.code === 404) return (new mdui.Dialog('#404')).open()
        else if (result.code === 401) return mdui.alert('密码错误', '失败', undefined, { confirmText: '确定', history: false })
        else return mdui.alert(result.reason, '失败', undefined, { confirmText: '确定', history: false })
    }

    mdui.alert(`追加成功 小张物流码为：${zec}`, '成功', undefined, { confirmText: '确定', history: false })
    $$('zec-append').value = ''
    $$('password-append').value = ''
    $$('ecc-append').value = ''
    $$('website-append').value = ''
    return false
}

function makeQRCode() {
    const zec = $$('zec-qr').value
    if (!zec) return mdui.alert('你生成了个寂寞', '失败', undefined, { confirmText: '确定', history: false })
    
    if (window.qrcodeBlack) {
        window.qrcodeBlack.clear()
        window.qrcodeBlack.makeCode(`${location.protocol}//${location.host}/?zec=${zec}`)
    } else {
        window.qrcodeBlack = new QRCode($$('qrcode-black'), {
            text: `${location.protocol}//${location.host}/?zec=${zec}`,
            width: 128,
            height: 128,
            colorDark: '#000000',
            colorLight: '#FFFFFF'
        })
    }
    if (window.qrcodeGreen) {
        window.qrcodeGreen.clear()
        window.qrcodeGreen.makeCode(`${location.protocol}//${location.host}/?zec=${zec}&color=44ff00`)
    } else {
        window.qrcodeGreen = new QRCode($$('qrcode-44ff00'), {
            text: `${location.protocol}//${location.host}/?zec=${zec}&color=44ff00`,
            width: 128,
            height: 128,
            colorDark: '#44FF00',
            colorLight: '#000000'
        })
    }
}

async function userAdd() {
    const name = $$('user-name').value.trim()
    const password = $$('user-password').value.trim()
    const safeCode = $$('safe-code').value.trim()

    if (!name || !password || !safeCode) return mdui.alert('有些数据没有填写', '失败', undefined, { confirmText: '确定', history: false })

    let result
    try {
        result = await (await fetch('/api/user-add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name, password, safeCode,
            })
        })).json()
    } catch(ee) {
        return mdui.alert('API异常 请联系开发人员解决', '服务异常', undefined, { confirmText: '确定', history: false })
    }

    if (!result.success) {
        if (result.code === 401) return mdui.alert('系统安全验证码错误', '失败', undefined, { confirmText: '确定', history: false })
        else if (result.code === 403) return mdui.alert('该用户已经存在', '失败', undefined, { confirmText: '确定', history: false })
        else return mdui.alert(result.reason, '失败', undefined, { confirmText: '确定', history: false })
    }

    $$('user-name').value = ''
    $$('user-password').value = ''
    $$('safe-code').value = ''
    mdui.alert('用户添加成功', '成功', undefined, { confirmText: '确定', history: false })
}

async function userDel() {
    const name = $$('user-name-del').value.trim()
    const safeCode = $$('safe-code-del').value.trim()

    if (!name || !safeCode) return mdui.alert('有些数据没有填写', '失败', undefined, { confirmText: '确定', history: false })
    
    let result
    try {
        result = await (await fetch('/api/user-del', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name, safeCode,
            })
        })).json()
    } catch(ee) {
        return mdui.alert('API异常 请联系开发人员解决', '服务异常', undefined, { confirmText: '确定', history: false })
    }

    if (!result.success) {
        if (result.code === 401) return mdui.alert('系统安全验证码错误', '失败', undefined, { confirmText: '确定', history: false })
        else if (result.code === 404) return (new mdui.Dialog('#404', { history: false })).open()
        else return mdui.alert(result.reason, '失败', undefined, { confirmText: '确定', history: false })
    }

    $$('user-name-del').value = ''
    $$('safe-code-del').value = ''
    mdui.alert('用户删除成功', '成功', undefined, { confirmText: '确定', history: false })
}

function parseSearchString() {
    const search = location.search.slice(1).split('&')

    var ret = {}
    for (let i of search) {
        let splited = i.split('=')
        let [ a, b ] = [decodeURIComponent(splited[0]), decodeURIComponent(splited[1])]
        ret[a] = b
    }

    return ret
}

const searchData = parseSearchString()
if (searchData.zec) {
    const tabs = new mdui.Tab('#tabs')
    tabs.show(2)

    $$('zec-recv').value = searchData.zec
    mdui.mutation()
}

if (searchData.color === '44ff00') mdui.alert('扫绿色二维码 得绿色好心情', '44FF00', undefined, { confirmText: '好耶', history: false })