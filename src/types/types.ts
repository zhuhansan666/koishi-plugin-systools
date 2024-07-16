import { ChildProcessByStdio } from "child_process"
import { Session } from "koishi"
import { Writable, Readable } from "stream"

import { Events } from "../events/events"

export type functionStatus = {
    status: number  // 0 -> no error
    data?: any  // the function result
    msg: 'success' | Error  // the error object
}

export type functionStatusPromise = Promise<functionStatus>

export type execProcess = {
    process: ChildProcessByStdio<Writable, Readable, Readable>,
    session: Session
}

export type useFrequencys = {
    commands: number,
    receivedMessages: number,
    sendMessages: number,
    result?: number  // 这个就是判断的标准, 通过上面命令调用次数 收到的信息个数 发送的信息个数综合计算的
    // result 越小代表该时段越不常用
    // 计算公式: (commands * 50 + receivedMessages * 20 + sendMessages * 30) / 100
}

export type systoolsGlobal = {
    systoolsGlobalCacheFile: string
    eventsLoopIntervalId: number,
    eventsList: Array<Events>,
    updateStatus: UpdateStatus,
    useFrequencys: [
        useFrequencys,  // 00:00 to 00:59:59
        useFrequencys,  // 01:00 to 01:59:59
        useFrequencys,  // ...
        useFrequencys,
        useFrequencys,
        useFrequencys,
        useFrequencys,
        useFrequencys,
        useFrequencys,
        useFrequencys,
        useFrequencys,
        useFrequencys,
        useFrequencys,
        useFrequencys,
        useFrequencys,
        useFrequencys,
        useFrequencys,
        useFrequencys,
        useFrequencys,
        useFrequencys,
        useFrequencys,
        useFrequencys,
        useFrequencys,  // ...
        useFrequencys,  // 23:00 to 23:59:59
    ],
    packageJson: object,
}

export type UpdateStatus = {
    updated: boolean  // 上次是否更新
    code: number  // 0 -> no error
    msg: 'isLatest' | 'updatedSuccessfully' | 'updateError' | 'init'
    desc: string
    timestamp: number  // 时间戳
    totalTried: number  // 连续尝试次数
}

export type ipAPIResult = {  // https://ip-api.com/docs/api:json
    status: 'success',
    continent: string,
    continentCode: string,
    country: string,
    countryCode: string,
    region: string,
    regionName: string,
    city: string,
    district: string,
    zip: string,
    lat: number,
    lon: number,
    timezone: string,
    offset: string,
    currency: string,
    isp: string,
    org: string,
    as: string,
    asname: string,
    reverse: string,
    mobile: string,
    proxy: string,
    hosting: string,
    query: string
} | {
    status: 'fail',
    message: string,
    query?: string
}
