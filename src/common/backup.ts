import { Context } from 'koishi'
import { copyFile, unlink, readdir } from 'fs/promises'
import { PathLike } from 'fs'
import path from 'path'

import { logger } from '../share'
import { functionStatusPromise } from '../types/types'
import { writeFile } from './fs'

export async function backupCore(filename: string & PathLike, outpath: string & PathLike): functionStatusPromise {
    const fileParse = path.parse(filename)
    const outFilename = `${fileParse.base}.${Date.now()}.bak`  // out: bar.yml.1691822165868.bak
    const outfile = path.resolve(outpath, outFilename)

    try {
        const { status, msg } = await writeFile(outfile, '')  // create file

        status != 0 ? logger.warn(`backup create file error: ${msg}`) : null

        await copyFile(filename, outfile)  // copy file
        return {
            status: 0,
            data: outfile,
            msg: 'success'
        }
    } catch(error) {
        return {
            status: -1,
            data: outfile,
            msg: error
        }
    }
}

export async function backup(filename: string & PathLike, outpath: string & PathLike, keepBackupFiles: number) {
    const { status, data, msg } = await backupCore(filename, outpath)
    if (status != 0) {
        logger.warn(`备份失败: ${msg}`)
        return
    }
    logger.info(`备份成功 ${filename} -> ${data}`)
    // data 是输出文件的绝对路径

    try {
        const outFiles = await readdir(outpath)
        if (outFiles.length > keepBackupFiles) {
            logger.debug(`超过最大备份上限 (${outFiles.length} > ${keepBackupFiles}) 开始删除多余备份文件`)
            
            for (let i=0; i < (outFiles.length - keepBackupFiles); i++) {
                const targetFile = path.resolve(outpath, outFiles[i])
                logger.debug(`删除旧的备份文件: ${targetFile}`)
                try {
                    await unlink(targetFile)
                } catch(error) {
                    logger.warn(`删除旧的备份文件错误: ${error}`)
                }
            }
        }
    } catch(error) {
        logger.warn(`读取备份文件夹文件列表错误: ${error}`)
    }
}
