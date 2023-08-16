import { machineIdSync } from 'node-machine-id'

import { systoolsGlobal } from "../types/types"

const defaultFrequency = {
    commands: 0,
    receivedMessages: 0,
    sendMessages: 0,
    result: null
}

export function getUseFrequency(commands: number, receivedMessages: number, sendMessages: number): number {
    return (commands * 50 + receivedMessages * 20 + sendMessages * 30) / 100
}

export const defaultGlobal: systoolsGlobal = {
    systoolsGlobalCacheFile: '',
    eventsLoopIntervalId: null,
    eventsList: [],
    updateStatus: {
        updated: false,
        code: 0,
        msg: 'init',
        desc: '',
        timestamp: null,
        totalTried: 0
    },
    useFrequencys: [
        Object.assign([], defaultFrequency),  // 00:00, to 00:59:59
        Object.assign([], defaultFrequency),  // 01:00, to 01:59:59
        Object.assign([], defaultFrequency),  // ...
        Object.assign([], defaultFrequency),
        Object.assign([], defaultFrequency),
        Object.assign([], defaultFrequency),
        Object.assign([], defaultFrequency),
        Object.assign([], defaultFrequency),
        Object.assign([], defaultFrequency),
        Object.assign([], defaultFrequency),
        Object.assign([], defaultFrequency),
        Object.assign([], defaultFrequency),
        Object.assign([], defaultFrequency),
        Object.assign([], defaultFrequency),
        Object.assign([], defaultFrequency),
        Object.assign([], defaultFrequency),
        Object.assign([], defaultFrequency),
        Object.assign([], defaultFrequency),
        Object.assign([], defaultFrequency),
        Object.assign([], defaultFrequency),
        Object.assign([], defaultFrequency),
        Object.assign([], defaultFrequency),
        Object.assign([], defaultFrequency),  // ...
        Object.assign([], defaultFrequency),  // 23:00 to 23:59:59
    ],
    packageJson: {},
}

export const ipAPI = 'http://ip-api.com/json/'
export const ipAPIArgs = `lang=zh-CN&fields=66846719`

export const machineId = machineIdSync(true)
