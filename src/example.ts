/**
 * 示例脚本：该脚本读取自己的代码，并打印出来
 */

import fs from 'node:fs/promises'

const fileContent = await fs.readFile(import.meta.filename, 'utf-8')
console.log(fileContent)
