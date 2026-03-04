import * as Blockly from 'blockly'
import { javascriptGenerator } from 'blockly/javascript'

// ============================================
// BLOCK DEFINITIONS (Bahasa Indonesia)
// ============================================

// 1. GERAK MAJU (Move Forward)
Blockly.Blocks['gerak_maju'] = {
    init: function (this: Blockly.Block) {
        this.appendDummyInput()
            .appendField('🚀 Gerak Maju')
            .appendField(new Blockly.FieldNumber(10, 1, 100), 'STEPS')
            .appendField('langkah')
        this.setPreviousStatement(true, null)
        this.setNextStatement(true, null)
        this.setColour('#4C97FF') // Blue - Motion
        this.setTooltip('Menggerakkan sprite ke depan sesuai arah hadap')
        this.setHelpUrl('')
    }
}

// 2. PUTAR KANAN (Turn Right)
Blockly.Blocks['putar_kanan'] = {
    init: function (this: Blockly.Block) {
        this.appendDummyInput()
            .appendField('↪️ Putar Kanan')
            .appendField(new Blockly.FieldNumber(90, 1, 360), 'DEGREES')
            .appendField('derajat')
        this.setPreviousStatement(true, null)
        this.setNextStatement(true, null)
        this.setColour('#4C97FF') // Blue - Motion
        this.setTooltip('Memutar sprite ke kanan')
        this.setHelpUrl('')
    }
}

// 3. PUTAR KIRI (Turn Left)
Blockly.Blocks['putar_kiri'] = {
    init: function (this: Blockly.Block) {
        this.appendDummyInput()
            .appendField('↩️ Putar Kiri')
            .appendField(new Blockly.FieldNumber(90, 1, 360), 'DEGREES')
            .appendField('derajat')
        this.setPreviousStatement(true, null)
        this.setNextStatement(true, null)
        this.setColour('#4C97FF') // Blue - Motion
        this.setTooltip('Memutar sprite ke kiri')
        this.setHelpUrl('')
    }
}

// 4. KEJADIAN MULAI (When Green Flag Clicked / Start Event)
Blockly.Blocks['kejadian_mulai'] = {
    init: function (this: Blockly.Block) {
        this.appendDummyInput()
            .appendField('🚩 Ketika Bendera Hijau diklik')
        this.setNextStatement(true, null)
        this.setColour('#FFAB19') // Yellow/Gold - Events
        this.setTooltip('Memulai program ketika bendera hijau diklik')
        this.setHelpUrl('')
    }
}

// 5. KONTROL ULANGI (Repeat / Loop)
Blockly.Blocks['kontrol_ulangi'] = {
    init: function (this: Blockly.Block) {
        this.appendDummyInput()
            .appendField('🔁 Ulangi')
            .appendField(new Blockly.FieldNumber(10, 1, 100), 'TIMES')
            .appendField('kali')
        this.appendStatementInput('DO')
            .setCheck(null)
        this.setPreviousStatement(true, null)
        this.setNextStatement(true, null)
        this.setColour('#FFBF00') // Orange - Control
        this.setTooltip('Mengulangi blok di dalamnya beberapa kali')
        this.setHelpUrl('')
    }
}

// 6. TUNGGU (Wait)
Blockly.Blocks['tunggu'] = {
    init: function (this: Blockly.Block) {
        this.appendDummyInput()
            .appendField('⏱️ Tunggu')
            .appendField(new Blockly.FieldNumber(1, 0.1, 10), 'SECONDS')
            .appendField('detik')
        this.setPreviousStatement(true, null)
        this.setNextStatement(true, null)
        this.setColour('#FFBF00') // Orange - Control
        this.setTooltip('Menunggu beberapa detik sebelum melanjutkan')
        this.setHelpUrl('')
    }
}

// 7. JIKA (If condition)
Blockly.Blocks['kontrol_jika'] = {
    init: function (this: Blockly.Block) {
        this.appendDummyInput()
            .appendField('❓ Jika')
        this.appendValueInput('CONDITION')
            .setCheck('Boolean')
        this.appendStatementInput('DO')
            .setCheck(null)
            .appendField('maka')
        this.setPreviousStatement(true, null)
        this.setNextStatement(true, null)
        this.setColour('#FFBF00')
        this.setTooltip('Jalankan blok jika kondisi benar')
        this.setHelpUrl('')
    }
}

// 8. SELAMANYA (Forever loop)
Blockly.Blocks['kontrol_selamanya'] = {
    init: function (this: Blockly.Block) {
        this.appendDummyInput()
            .appendField('♾️ Selamanya')
        this.appendStatementInput('DO')
            .setCheck(null)
        this.setPreviousStatement(true, null)
        // No next statement - forever loop doesn't end
        this.setColour('#FFBF00')
        this.setTooltip('Ulangi blok di dalamnya selamanya')
        this.setHelpUrl('')
    }
}

// 9. UBAH X (Change X by N)
Blockly.Blocks['ubah_x'] = {
    init: function (this: Blockly.Block) {
        this.appendDummyInput()
            .appendField('↔️ Ubah X sebesar')
            .appendField(new Blockly.FieldNumber(10, -500, 500), 'VALUE')
        this.setPreviousStatement(true, null)
        this.setNextStatement(true, null)
        this.setColour('#4C97FF')
        this.setTooltip('Geser sprite ke kanan (positif) atau kiri (negatif)')
        this.setHelpUrl('')
    }
}

// 10. UBAH Y (Change Y by N)
Blockly.Blocks['ubah_y'] = {
    init: function (this: Blockly.Block) {
        this.appendDummyInput()
            .appendField('↕️ Ubah Y sebesar')
            .appendField(new Blockly.FieldNumber(10, -500, 500), 'VALUE')
        this.setPreviousStatement(true, null)
        this.setNextStatement(true, null)
        this.setColour('#4C97FF')
        this.setTooltip('Geser sprite ke atas (positif) atau bawah (negatif)')
        this.setHelpUrl('')
    }
}

// 11. PERGI KE X Y (Go to X: Y:)
Blockly.Blocks['pergi_ke'] = {
    init: function (this: Blockly.Block) {
        this.appendDummyInput()
            .appendField('📍 Pergi ke x:')
            .appendField(new Blockly.FieldNumber(0, -240, 240), 'X')
            .appendField('y:')
            .appendField(new Blockly.FieldNumber(0, -180, 180), 'Y')
        this.setPreviousStatement(true, null)
        this.setNextStatement(true, null)
        this.setColour('#4C97FF')
        this.setTooltip('Pindahkan sprite ke posisi absolut. (0,0) = tengah panggung. X positif = kanan, Y positif = atas.')
        this.setHelpUrl('')
    }
}

// 12. GANTI KOSTUM (Next Costume)
Blockly.Blocks['ganti_kostum'] = {
    init: function (this: Blockly.Block) {
        this.appendDummyInput()
            .appendField('🎭 Ganti Kostum')
        this.setPreviousStatement(true, null)
        this.setNextStatement(true, null)
        this.setColour('#CF63CF')
        this.setTooltip('Ganti tampilan sprite ke kostum berikutnya')
        this.setHelpUrl('')
    }
}

// 13. MAINKAN SUARA (Play Sound)
Blockly.Blocks['mainkan_suara'] = {
    init: function (this: Blockly.Block) {
        this.appendDummyInput()
            .appendField('🔊 Mainkan Suara Kucing')
        this.setPreviousStatement(true, null)
        this.setNextStatement(true, null)
        this.setColour('#CF63CF')
        this.setTooltip('Mainkan suara kucing "Meow"')
        this.setHelpUrl('')
    }
}

// ============================================
// CODE GENERATORS
// ============================================

javascriptGenerator.forBlock['gerak_maju'] = function (block: Blockly.Block) {
    const steps = block.getFieldValue('STEPS')
    return `await moveForward(${steps});\n`
}

javascriptGenerator.forBlock['putar_kanan'] = function (block: Blockly.Block) {
    const degrees = block.getFieldValue('DEGREES')
    return `await turnRight(${degrees});\n`
}

javascriptGenerator.forBlock['putar_kiri'] = function (block: Blockly.Block) {
    const degrees = block.getFieldValue('DEGREES')
    return `await turnLeft(${degrees});\n`
}

javascriptGenerator.forBlock['kejadian_mulai'] = function () {
    return '' // Start event doesn't generate code itself, it's the entry point
}

javascriptGenerator.forBlock['kontrol_ulangi'] = function (block: Blockly.Block) {
    const times = block.getFieldValue('TIMES')
    const statements = javascriptGenerator.statementToCode(block, 'DO')
    return `for (let i = 0; i < ${times}; i++) {\n${statements}}\n`
}

javascriptGenerator.forBlock['tunggu'] = function (block: Blockly.Block) {
    const seconds = block.getFieldValue('SECONDS')
    return `await wait(${seconds});\n`
}

javascriptGenerator.forBlock['kontrol_jika'] = function (block: Blockly.Block) {
    const condition = javascriptGenerator.valueToCode(block, 'CONDITION', 0) || 'false'
    const statements = javascriptGenerator.statementToCode(block, 'DO')
    return `if (${condition}) {\n${statements}}\n`
}

javascriptGenerator.forBlock['kontrol_selamanya'] = function (block: Blockly.Block) {
    const statements = javascriptGenerator.statementToCode(block, 'DO')
    // Limit iterations to prevent infinite loops
    return `for (let _forever = 0; _forever < 100; _forever++) {\n${statements}}\n`
}

javascriptGenerator.forBlock['ubah_x'] = function (block: Blockly.Block) {
    return `changeX(${block.getFieldValue('VALUE')});\n`
}

javascriptGenerator.forBlock['ubah_y'] = function (block: Blockly.Block) {
    return `changeY(${block.getFieldValue('VALUE')});\n`
}

javascriptGenerator.forBlock['pergi_ke'] = function (block: Blockly.Block) {
    return `goTo(${block.getFieldValue('X')}, ${block.getFieldValue('Y')});\n`
}

javascriptGenerator.forBlock['ganti_kostum'] = function () {
    return `nextCostume();\n`
}

javascriptGenerator.forBlock['mainkan_suara'] = function () {
    return `playSound();\n`
}

// ============================================
// TOOLBOX CONFIGURATION
// ============================================

export const toolboxConfig = {
    kind: 'categoryToolbox',
    contents: [
        {
            kind: 'category',
            name: '🚩 Kejadian',
            colour: '#FFAB19',
            contents: [
                { kind: 'block', type: 'kejadian_mulai' }
            ]
        },
        {
            kind: 'category',
            name: '🔵 Gerakan',
            colour: '#4C97FF',
            contents: [
                { kind: 'block', type: 'gerak_maju' },
                { kind: 'block', type: 'putar_kanan' },
                { kind: 'block', type: 'putar_kiri' },
                { kind: 'block', type: 'ubah_x' },
                { kind: 'block', type: 'ubah_y' },
                { kind: 'block', type: 'pergi_ke' },
            ]
        },
        {
            kind: 'category',
            name: '🟡 Kontrol',
            colour: '#FFBF00',
            contents: [
                { kind: 'block', type: 'kontrol_ulangi' },
                { kind: 'block', type: 'tunggu' },
                { kind: 'block', type: 'kontrol_selamanya' }
            ]
        },
        {
            kind: 'category',
            name: '🟣 Tampilan & Suara',
            colour: '#CF63CF',
            contents: [
                { kind: 'block', type: 'ganti_kostum' },
                { kind: 'block', type: 'mainkan_suara' },
            ]
        }
    ]
}

// Export function to ensure blocks are registered
export function registerCustomBlocks() {
    console.log('✅ Custom Blockly blocks registered (Indonesian)')
}
