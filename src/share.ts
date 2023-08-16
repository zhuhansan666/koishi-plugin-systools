import { Logger } from "koishi"

import { useFrequencys } from "./types/types"
import { defaultGlobal } from "./configs/configs"
import { execProcess } from "./types/types"

export const logger = new Logger('systools')

export const systoolsGlobal = Object.assign({}, defaultGlobal)
export const execProcesses: Array<execProcess> = []

export function getReloadTime(useFrequencys: Array<useFrequencys>, defaultTime: number=3): number {
    let nulls = 0
    for (let i=0; i < useFrequencys.length; i++) {
        if (!useFrequencys[i].result) {
            nulls += 1
        }
    }

    if (24 - nulls > 3) {  // 如果有三个以上的 null, 就把 凌晨 3 点 作为默认值
        return defaultTime
    }

    let min = null
    let minIndex = null
    for (let i=0; i < useFrequencys.length; i++) {
        const item = useFrequencys[i]
        if (item.result && (!min || item.result < min)) {
            min = item.result
            minIndex = i
        }
    }

    return minIndex ?? defaultTime
}
