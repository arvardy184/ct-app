import * as Blockly from 'blockly'
import { javascriptGenerator } from 'blockly/javascript'


Blockly.Blocks['robot_mulai'] = {
    init: function (this: Blockly.Block) {
        this.appendDummyInput()
            .appendField('🟡 Ketika permainan dimulai')
        this.setNextStatement(true, null)
        this.setColour('#F59E0B')
        this.setTooltip('Jalankan blok di bawahnya saat permainan dimulai')
    }
}
javascriptGenerator.forBlock['robot_mulai'] = () => ''


Blockly.Blocks['robot_maju'] = {
    init: function (this: Blockly.Block) {
        this.appendDummyInput()
            .appendField('🔵 Maju')
            .appendField(new Blockly.FieldNumber(1, 1, 20), 'N')
            .appendField('langkah')
        this.setPreviousStatement(true, null)
        this.setNextStatement(true, null)
        this.setColour('#3B82F6')
        this.setTooltip('Gerak maju N langkah sesuai arah panah')
    }
}
javascriptGenerator.forBlock['robot_maju'] = function (block: Blockly.Block) {
    return `robot_maju(${block.getFieldValue('N')});\n`
}


Blockly.Blocks['robot_putar'] = {
    init: function (this: Blockly.Block) {
        this.appendDummyInput()
            .appendField('🔵 Putar')
            .appendField(new Blockly.FieldNumber(90, 45, 360), 'DEG')
            .appendField('derajat')
        this.setPreviousStatement(true, null)
        this.setNextStatement(true, null)
        this.setColour('#3B82F6')
        this.setTooltip('Putar searah jarum jam sejumlah derajat')
    }
}
javascriptGenerator.forBlock['robot_putar'] = function (block: Blockly.Block) {
    return `robot_putar(${block.getFieldValue('DEG')});\n`
}


Blockly.Blocks['robot_ulangi'] = {
    init: function (this: Blockly.Block) {
        this.appendDummyInput()
            .appendField('🟠 Ulangi')
            .appendField(new Blockly.FieldNumber(2, 1, 50), 'N')
            .appendField('kali')
        this.appendStatementInput('DO').setCheck(null)
        this.setPreviousStatement(true, null)
        this.setNextStatement(true, null)
        this.setColour('#F97316')
        this.setTooltip('Ulangi blok di dalamnya sebanyak N kali')
    }
}
javascriptGenerator.forBlock['robot_ulangi'] = function (block: Blockly.Block) {
    const n = block.getFieldValue('N')
    const body = javascriptGenerator.statementToCode(block, 'DO')
    return `robot_ulangi(${n}, function() {\n${body}});\n`
}

Blockly.Blocks['robot_jika_finish'] = {
    init: function (this: Blockly.Block) {
        this.appendDummyInput()
            .appendField('🟢 Jika mencapai Finish, maka')
        this.appendStatementInput('DO').setCheck(null)
        this.setPreviousStatement(true, null)
        this.setNextStatement(true, null)
        this.setColour('#22C55E')
        this.setTooltip('Jalankan blok di dalam jika sprite sudah di titik Finish')
    }
}
javascriptGenerator.forBlock['robot_jika_finish'] = function (block: Blockly.Block) {
    const body = javascriptGenerator.statementToCode(block, 'DO')
    return `robot_jika_finish(function() {\n${body}});\n`
}


Blockly.Blocks['robot_bilang'] = {
    init: function (this: Blockly.Block) {
        this.appendDummyInput()
            .appendField('🟣 Bilang')
            .appendField(new Blockly.FieldTextInput('Selesai'), 'TEXT')
        this.setPreviousStatement(true, null)
        this.setNextStatement(true, null)
        this.setColour('#8B5CF6')
        this.setTooltip('Tampilkan teks di atas sprite')
    }
}
javascriptGenerator.forBlock['robot_bilang'] = function (block: Blockly.Block) {
    const text = (block.getFieldValue('TEXT') as string).replace(/"/g, '\\"')
    return `robot_bilang("${text}");\n`
}


export const robotToolboxConfig = {
    kind: 'flyoutToolbox',
    contents: [
        { kind: 'block', type: 'robot_mulai' },
        { kind: 'block', type: 'robot_maju', fields: { N: 1 } },
        { kind: 'block', type: 'robot_putar', fields: { DEG: 90 } },
        { kind: 'block', type: 'robot_ulangi', fields: { N: 4 } },
        { kind: 'block', type: 'robot_jika_finish' },
        { kind: 'block', type: 'robot_bilang', fields: { TEXT: 'Selesai' } },
    ]
}


export interface RobotCommand {
    type: 'maju' | 'putar' | 'ulangi' | 'jika_finish' | 'bilang'
    n?: number
    text?: string
    body?: RobotCommand[]
}


export function parseRobotCode(code: string): RobotCommand[] {
    if (!code.trim()) return []

    const rootCommands: RobotCommand[] = []
    const stack: RobotCommand[][] = [rootCommands]

    const env = {
        robot_maju: (n: number) => {
            stack[stack.length - 1].push({ type: 'maju', n })
        },
        robot_putar: (n: number) => {
            stack[stack.length - 1].push({ type: 'putar', n })
        },
        robot_bilang: (text: string) => {
            stack[stack.length - 1].push({ type: 'bilang', text })
        },
        robot_ulangi: (n: number, fn: () => void) => {
            const body: RobotCommand[] = []
            stack.push(body)
            fn()
            stack.pop()
            stack[stack.length - 1].push({ type: 'ulangi', n, body })
        },
        robot_jika_finish: (fn: () => void) => {
            const body: RobotCommand[] = []
            stack.push(body)
            fn()
            stack.pop()
            stack[stack.length - 1].push({ type: 'jika_finish', body })
        },
    }

    try {
        // eslint-disable-next-line no-new-func
        new Function(...Object.keys(env), code)(...Object.values(env))
    } catch (e) {
        console.error('Robot code parse error:', e)
    }

    return rootCommands
}


export function registerRobotBlocks() {}
