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
    checkUpdateIntervalId: null,
    backupIntervalId: null,
    githubBackupIntervalId: null,
    packageJson: {},
    useFrequencys: {
        0: Object.assign({}, defaultFrequency),  // 00:00, to 00:59:59
        1: Object.assign({}, defaultFrequency),  // 01:00, to 01:59:59
        2: Object.assign({}, defaultFrequency),  // ...
        3: Object.assign({}, defaultFrequency),
        4: Object.assign({}, defaultFrequency),
        5: Object.assign({}, defaultFrequency),
        6: Object.assign({}, defaultFrequency),
        7: Object.assign({}, defaultFrequency),
        8: Object.assign({}, defaultFrequency),
        9: Object.assign({}, defaultFrequency),
        10: Object.assign({}, defaultFrequency),
        11: Object.assign({}, defaultFrequency),
        12: Object.assign({}, defaultFrequency),
        13: Object.assign({}, defaultFrequency),
        14: Object.assign({}, defaultFrequency),
        15: Object.assign({}, defaultFrequency),
        16: Object.assign({}, defaultFrequency),
        17: Object.assign({}, defaultFrequency),
        18: Object.assign({}, defaultFrequency),
        19: Object.assign({}, defaultFrequency),
        20: Object.assign({}, defaultFrequency),
        21: Object.assign({}, defaultFrequency),
        22: Object.assign({}, defaultFrequency),  // ...
        23: Object.assign({}, defaultFrequency),  // 23:00 to 23:59:59
    },
    updateStatus: {
        updated: false,
        code: 0,
        msg: 'init',
        desc: '',
        timestamp: null,
        totalTried: 0
    }
}

export const ipAPI = 'http://ip-api.com/json/'
export const ipAPIArgs = `lang=zh-CN&fields=66846719`

export const machineId = machineIdSync(true)
