import { Context, Session, h } from "koishi";
import os from 'os'

import { machineId } from "../configs/configs";

export default async function sysinfo(ctx: Context, session: Session) {
    return `系统信息
设备唯一识别码: ${machineId}
主机名称: ${os.hostname()}

CPU: ${os.cpus()[0].model}
CPU 线程: ${os.cpus().length}
CPU 架构: ${os.arch()}

已装载内存: ${(os.totalmem() / 1024 ** 3).toFixed(3)} GiB
已使用内存: ${((os.totalmem() - os.freemem()) / 1024 ** 3).toFixed(3)} GiB
空闲内存: ${(os.freemem() / 1024 ** 3).toFixed(3)} GiB
内存使用率: ${((1 - os.freemem() / os.totalmem()) * 100).toFixed(2)}%

系统: ${os.platform()} ${os.release()}

Node 版本: ${process.version}

主机已不间断运行 ${h('i18n:time', { value: os.uptime() * 1000 })}`
}
