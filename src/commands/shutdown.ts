import { Dict } from 'koishi'
import * as os from 'node:os'

import { Context, Session, logger } from '../constants'

interface shutdownEvent {
    status: boolean,
    session: Session,
    date: number,
    timeoutId: NodeJS.Timeout
}

const shutdownEvents: Dict<shutdownEvent | undefined> = {}

export async function shutdown(ctx: Context, { session: _session }) {
    const session: Session = _session

    const userId = session.userId
    if (!userId) {
        return session.text('commands.shutdown.undefinedUserId')
    }

    const event = shutdownEvents[userId]
    if (!event || !event.status) {
        shutdownEvents[userId] = {
            status: true,
            session: session,
            date: new Date().getTime(),
            timeoutId: setTimeout(() => {  // 超时自动清除
                shutdownEvents[userId] = undefined
                session.splitedSend(session.text('commands.shutdown.delete'))
            }, ctx.config.shutdownTimeout)
        }

        const ETA = ctx.config.shutdownTimeout / 1000
        return session.text('commands.shutdown.first', [ETA % 1 == 0 ? ETA : ETA.toFixed(3)])
    }
    clearTimeout(event.timeoutId)  // 关闭清除信息的timeout
    shutdownEvents[userId] = undefined  // 手动清除

    logger.info(`will shutdown in ${ctx.config.shutdownDelay} seconds`)
    session.splitedSend(session.text('commands.shutdown.shutdown'))

    if (ctx.config.shutdownExperimentalOptions) {
        session.content = `cmd ${ctx.config.shutdownCommand.replaceAll('{delay}', ctx.config.shutdownDelay).trim()}`  // 修改context以符合cmd语法
    } else {
        session.content = os.platform() === 'win32' ? `cmd shutdown /f /s /t ${ctx.config.shutdownDelay}` : `shutdown -f ${ctx.config.shutdownDelay}`  // 未开启实验性使用默认命令
    }

    // await session.execute('cmd')  // 不支持 commandGroup 的方法
    await session.execute(`${(globalThis['systools'] ?? {commandGroup: ''})['commandGroup']}cmd`)  // 使用 commandGroup 以免指令不存在
    setTimeout(() => {
        session.splitedSend(session.text('commands.shutdown.exited'))
        setTimeout(() => {
            process.exit(0)
        }, 1500)
    }, 3000)
}
