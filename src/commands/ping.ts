import { Session, Context, h } from "koishi"

import { ipAPI, ipAPIArgs } from "../configs/configs"
import { ipAPIResult } from "../types/types"
import { Config } from ".."

export default async function ping(ctx: Context, session: Session, ip: string) {
    const config: Config = ctx.config
    if (ip) {
        let newip = ip.replace(new RegExp('h?t?t?p?s?:?//', 'g'), '')
        if (newip.includes(':')) {
            newip = newip.split(':')[0]
        }

        if (newip.includes('/') || newip.includes('\\')) {
            newip = newip.split('/')[0]
            newip = newip.split('\\')[0]
        }

        if (newip != ip) {
            ip = newip
            session.send(`注意: IP 已自动格式化为 ${ip}`)
        }
    }

    try {
        const data: ipAPIResult = (await ctx.http.axios(`${ipAPI}${ip ?? ''}?${ipAPIArgs}`, { timeout: config.axiosConfig ? config.axiosTimeout : null, validateStatus: () => { return true } })).data
        if (!data || typeof data === 'string') {
            return `请求失败, 返回值不符合 JSON 标准\n${data}`
        } else if (data.status == 'fail') {
            return `请求失败, 请检查 IP 是否正确\n错误信息: ${data.message}`
        }

        return `请求返回
IP: ${data.query}
IP 属地: ${data.continent} ${data.country} ${data.regionName} ${data.city} ${data.district}
运营商: ${data.isp}
组织名称: ${data.org}
公司归属: ${data.as}
DNS 查询信息: ${data.reverse}
(是/否)移动设备(使用数据连接): ${data.mobile}
(是/否)代理服务器/虚拟专用网络服务器/洋葱路由出口地址: ${data.proxy}
(是/否)数据中心/网络托管商 IP: ${data.hosting}`

    } catch (error) {
        return `请求失败\n${error.stack}`
    }
}