import { Context, Schema, Session, Time } from 'koishi'
import path from 'path'

import { machineId } from './configs/configs'

export const name = 'systools'

export const usage = `
Your UniqueID: ${machineId}
`

export const using = ['installer']

export interface Config {
    axiosConfig: boolean,
    axiosTimeout: number,

    enableExec: boolean,

    enableBackup: boolean,
    backupFiles: Array<string>,
    backupInterval: number,
    keepBackupFiles: number

    enableGithubBackup: boolean,
    githubUsername: string,
    githubToken: string,
    repoName: string,
    githubBackupFiles: Array<string>,
    githubBackupInterval: number,
    keepGithubBackupFiles: number,

    checkUpdateInterval: number,

}

export const Config: Schema<Config> = Schema.intersect([
    Schema.object({
        axiosConfig: Schema.boolean()
            .default(false)
            .description('启用自定义请求配置 <br>> 不启用将使用全局请求配置'),
    }).description('请求配置'),
    Schema.union([
        Schema.object({
            axiosConfig: Schema.const(true).required(),
            axiosTimeout: Schema.number()
                .default(300000)
                .description('请求超时 毫秒')
        }),
        Schema.object({})
    ]),

    Schema.object({
        enableExec: Schema.boolean()
            .default(false)
            .description('`taskrun` 指令使用 `Exec` 运行进程 <br> 启用该选项后不支持流输出, 仅等待进程运行结束后输出内容<br>? 该选项可能导致 `tasklist` `taskinput` 指令无效'),
    }).description('进程配置'),

    Schema.object({
        enableBackup: Schema.boolean()
            .default(false)
            .description('启用备份'),
    }).description('本地备份配置'),
    Schema.union([
        Schema.object({
            enableBackup: Schema.const(true).required(),
            '': Schema.never()
                .description(
                    `本地备份规则: data/systools/backup/<文件名>/<文件名>.<备份时间的13位时间戳>.bak`
                ),
            backupFiles: Schema.array(String)
                .role('table')
                .default([])
                .description('需要备份的文件, 暂**不支持**正则表达式'),
            backupInterval: Schema.number()
                .min(0)
                .default(60000)
                .description('备份间隔 毫秒'),
            keepBackupFiles: Schema.number()
                .min(1)
                .default(60)
                .description('保留备份文件数量最大值 个 (包含上限) <br> 备份位置位于 `/data/systools/backup/koishi.yml/`'),

        }),
        Schema.object({})
    ]),

    Schema.object({
        enableGithubBackup: Schema.boolean()
            .default(false)
            .description('启用 GitHub 云备份'),
    }).description('云备份配置'),
    Schema.union([
        Schema.object({
            enableGithubBackup: Schema.const(true).required(),
            '': Schema.never()
                .description(
                    `GitHub 备份规则: 在所创建的仓库的 master 分支的 <[设备唯一识别码](#设备唯一识别码)>/<文件名>/<文件名>.<备份时间的13位时间戳>.bak`
                ),
            githubUsername: Schema.string()
                .required(true)
                .description('GitHub 用户名'),
            githubToken: Schema.string()
                .required(true)
                .description('GitHub token 用于创建仓库和上传备份文件 <br>注意: 请使用 classic token, 否则可能发生未知错误'),
            repoName: Schema.string()
                .default('koishi.backup')
                .description('GitHub 云备份的仓库名称 <br>注意: 由于 `koishi.yml` 可能存在账户等敏感信息, 备份仓库已默认设置为私有, 切勿将敏感信息公开, 否则所造成一切后果于本插件 / koishi 框架 / 开源普通 等均无关'),
            githubBackupFiles: Schema.array(String)
                .role('table')
                .default([])
                .description('需要备份至 GitHub 的文件, 暂**不支持**正则表达式'),
            githubBackupInterval: Schema.number()
                .min(0)
                .default(3600000)
                .description('Github 备份间隔 毫秒'),
            keepGithubBackupFiles: Schema.number()
                .min(1)
                .default(24)
                .description('在 Github 保留备份文件数量最大值 个 (包含上限)'),
        }),
        Schema.object({})
    ]),

    Schema.object({
        checkUpdateInterval: Schema.number()
            .min(-1)
            .max(-1)
            .default(-1)
            .description('检查更新间隔 毫秒 设置为负数 以关闭自动更新')
    }).description('更新配置')
]) as Schema<Config>  // 奇奇怪怪的 bug 给他修掉

import { backup } from './common/backup'
import { logger, systoolsGlobal } from './share'

import ping from './commands/ping'
import exec from './commands/exec'
import { kill, input, list } from './commands/exec'
import sysinfo from './commands/sysinfo'

import { readFile, writeFile } from './common/fs'
import { toObject } from './common/json'
import { githubBackup } from './common/githubBackup'

import { getLatestVersion, checkVersion, install } from './common/updater'


export async function apply(ctx: Context, config: Config) {
    const systoolsGlobalCacheFile = path.resolve(ctx.baseDir, 'cache/systools/systoolGlobal.json')
    systoolsGlobal.systoolsGlobalCacheFile = systoolsGlobalCacheFile

    const { status, data, msg } = await readFile(systoolsGlobalCacheFile)
    if (!status) {  // 读写成功
        for (const key in data) {  // 覆写
            systoolsGlobal[key] = data[key]
        }
    } else {
        logger.debug(`read cache/systools/systoolGlobal.json error: ${msg}`)
    }

    const { status: packageJsonStatus, data: packageJsonData, msg: packageJsonMsg } = await readFile(path.resolve(__dirname, '../package.json'))
    let packageJson = {}
    if (!packageJsonStatus) {
        packageJson = packageJsonData ?? {}
    } else {
        logger.warn(`读取 package.json 错误: ${packageJsonMsg}`)
    }
    systoolsGlobal.packageJson = packageJson

    if (systoolsGlobal.backupIntervalId) {
        try {
            clearInterval(systoolsGlobal.backupIntervalId)
        } catch (error) {
            logger.debug(`clear backup interval error: ${error}`)
        }
    }

    if (systoolsGlobal.githubBackupIntervalId) {
        try {
            clearInterval(systoolsGlobal.githubBackupIntervalId)
        } catch (error) {
            logger.debug(`clear GitHub backup interval error: ${error}`)
        }
    }

    if (systoolsGlobal.checkUpdateIntervalId) {
        try {
            clearInterval(systoolsGlobal.checkUpdateIntervalId)
        } catch (error) {
            logger.debug(`clear check update interval error: ${error}`)
        }
    }

    if (config.enableBackup) {  // 初始化 本地备份
        if (config.backupFiles.length <= 0) {
            logger.warn(`备份列表为空, 退出备份`)
            return
        }

        let backupFunc = async () => {
            for (let i = 0; i < config.backupFiles.length; i++) {
                const file = config.backupFiles[i]
                try {
                    await backup(path.resolve(ctx.baseDir, file), path.resolve(ctx.baseDir, `data/systools/backup/${path.parse(file).base}/`), config.keepBackupFiles)
                } catch (error) {
                    logger.debug(`backup ${file} error: ${error}`)
                }
            }
        }

        setTimeout(backupFunc, 0)  // first run
        systoolsGlobal.backupIntervalId = setInterval(backupFunc, config.backupInterval)
    }

    if (config.enableGithubBackup) {  // 初始化 GitHub 云备份
        if (!config.githubUsername || !config.githubToken) {
            logger.warn(`GitHub 备份配置缺少必填项, 退出备份`)
            return
        }

        if (config.githubBackupFiles.length <= 0) {
            logger.warn(`GitHub 备份列表为空, 退出备份`)
            return
        }

        let githubBackupFunc = async () => {
            for (let i = 0; i < config.githubBackupFiles.length; i++) {
                const file = config.githubBackupFiles[i]
                try {
                    await githubBackup(ctx, path.resolve(ctx.baseDir, file), `${machineId}/${path.parse(file).base}`)  // githubPath like "94cfe6ee-a66f-4f77-a949-2241c125f33f/koishi.yml"
                } catch (error) {
                    logger.debug(`GitHub backup ${file} error: ${error}`)
                }
            }
        }

        setTimeout(githubBackupFunc, 0)
        systoolsGlobal.githubBackupIntervalId = setInterval(githubBackupFunc, config.githubBackupInterval)
    }

    if (config.checkUpdateInterval > 0) {
        const checkUpdateFunc = async () => {
            logger.debug(`开始检查更新`)

            const updateStatus = systoolsGlobal.updateStatus
            updateStatus.updated = true

            const { status, data: latestVersion, msg } = await getLatestVersion(ctx, packageJson['name'])
            if (status) {
                logger.warn(`检查更新错误: ${msg}, 退出更新操作`)
                updateStatus.code = -1
                updateStatus.msg = 'updateError'
                updateStatus.desc = `检查更新错误: ${msg}`
                updateStatus.timestamp = Date.now()
                updateStatus.totalTried += 1
                writeFile(systoolsGlobalCacheFile, systoolsGlobal)
                return
            }

            if (!checkVersion(latestVersion, packageJson['version'])) {
                logger.debug(`已经是最新版本 (${latestVersion}) 或更高版本, 退出更新操作`)
                updateStatus.updated = false
                updateStatus.code = 0
                updateStatus.msg = 'isLatest'
                updateStatus.desc = '已经是最新版本 (${latestVersion}) 或更高版本'
                updateStatus.timestamp = Date.now()
                updateStatus.totalTried = 0
                writeFile(systoolsGlobalCacheFile, systoolsGlobal)
                return
            }

            const deps = {}
            deps[packageJson['name']] = latestVersion
            const { status: installStatus } = await install(ctx, deps)
            if (installStatus) {
                logger.warn(`更新失败`)
                updateStatus.code = -1
                updateStatus.msg = 'updateError'
                updateStatus.desc = '更新失败'
                updateStatus.timestamp = Date.now()
                updateStatus.totalTried += 1
                writeFile(systoolsGlobalCacheFile, systoolsGlobal)
                return
            }

            logger.info(`更新成功 ${packageJson['version']} => ${latestVersion}`)
            updateStatus.code = 0
            updateStatus.msg = 'updatedSuccessfully'
            updateStatus.desc = `更新成功 ${packageJson['version']} => ${latestVersion}`
            updateStatus.timestamp = Date.now()
            updateStatus.totalTried = 0
            writeFile(systoolsGlobalCacheFile, systoolsGlobal)
        }

        setTimeout(checkUpdateFunc, 0)  // first run
        systoolsGlobal.checkUpdateIntervalId = setInterval(checkUpdateFunc, config.checkUpdateInterval)
    }

    writeFile(systoolsGlobalCacheFile, systoolsGlobal)  // 更新 backupIntervalId 和/或 githubBackupIntervalId

    ctx.command('systools/system/ping [ip:text]', '使用 API ping 指定网站\n> 当不指定 IP 时, 获取 koishi 所在设备 IP')
        .action(async ({ session }, ip?: string) => {
            return await ping(ctx, (session as Session), ip)
        })

    ctx.command('systools/system/sysinfo', '获取系统运行信息')
        .action(async ({ session }) => {
            return await sysinfo(ctx, (session as Session))
        })

    ctx.command('systools/process/taskrun <command:text>', '使用 exec 运行系统命令\n> 注意: 运行的所有指令将直接应用于您的系统, 固最低权限为 3, 请您按需更改指令权限.\n> 同时, 该指令为实验性指令, 可能发送诸如 命令输出混乱 / 刷屏 / 杀死进程无效 等状况, 所造成的任何后果均需用户自行承担.', { authority: 3 })
        .action(async ({ session }) => {
            return await exec(ctx, (session as Session))
        })

    ctx.command('systools/process/taskkill', '杀死指定或所有未关闭进程(仅限由 taskrun 指令所运行的进程)\n当 pid 为空时杀死所有进程\n> 注意: 本指令最低权限为 3, 请您按需更改指令权限.', { authority: 3 })
        .option('pid', '-p [pid:posint] 指定进程的 PID')
        .action(async ({ session, options }) => {
            return await kill(ctx, (session as Session), options.pid)
        })

    ctx.command('systools/process/taskinput', '向指定进程(仅限由 taskrun 指令所运行的进程)输入内容\n> 注意: 本指令最低权限为 3, 请您按需更改指令权限.', { authority: 3 })
        .option('pid', '-p <pid:posint> 指定进程的 PID')
        .option('msg', '-m <msg:text> 输入的内容')
        .action(async ({ session, options }) => {
            return await input(ctx, (session as Session), options.pid, options.msg)
        })

    ctx.command('systools/process/tasklist', '获取进程列表(仅限由 taskrun 指令所运行的进程)')
        .option('pid', '-p [pid:posint] 获取指定进程 PID 的信息')
        .action(async ({ session, options }) => {
            return await list(ctx, (session as Session), options.pid)
        })

    ctx.on('dispose', () => {
        if (config.enableBackup && systoolsGlobal.backupIntervalId) {
            try {
                clearInterval(systoolsGlobal.backupIntervalId)
                systoolsGlobal.backupIntervalId = null
            } catch (error) {
                logger.debug(`clear backup interval error: ${error}`)
            }
        }

        if (config.enableGithubBackup && systoolsGlobal.githubBackupIntervalId) {
            try {
                clearInterval(systoolsGlobal.githubBackupIntervalId)
                systoolsGlobal.githubBackupIntervalId = null
            } catch (error) {
                logger.debug(`clear GitHub backup interval error: ${error}`)
            }
        }

        writeFile(systoolsGlobalCacheFile, systoolsGlobal)  // 更新 backupIntervalId 和/或 githubBackupIntervalId
    })
}
