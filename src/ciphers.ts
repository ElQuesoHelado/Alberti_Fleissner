export const ALBERTI_OUTER = 'ABCDEFGILMNOPQRSTVXZ1234'
export const ALBERTI_INNER = 'usqomkhfdbacegilnprtxz&y'
export const LATIN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export type PreprocessOptions = { uppercase: boolean; removeDiacritics: boolean; removeSpaces: boolean; keep: 'all' | 'letters' | 'alphanumeric' }
export const DEFAULT_PREPROCESS: PreprocessOptions = { uppercase: true, removeDiacritics: true, removeSpaces: true, keep: 'all' }
export type AlbertiConfig = { version: 1; algorithm: 'alberti'; outerAlphabet: string; innerAlphabet: string; offset: number; advance: number; periodLength: number; unsupported: 'remove' | 'preserve'; letterCase: 'preserve' | 'uppercase'; preprocess?: PreprocessOptions }
export type GrilleConfig = { version: 1; algorithm: 'grille'; size: number; holes: number[]; length: number; direction: 'clockwise' | 'counterclockwise'; mode: 'four' | 'untilDone'; keep: 'alphanumeric' | 'nonspace'; preprocess?: PreprocessOptions }
export type CipherConfig = AlbertiConfig | GrilleConfig

export function encodeConfig(config: CipherConfig): string { return JSON.stringify(config, null, 2) }

export function preprocessText(input: string, options: PreprocessOptions): string {
  let text = input.normalize('NFC')
  if (options.removeDiacritics) text = text.normalize('NFD').replace(/\p{M}/gu, '').replace(/ñ/gi, match => match === 'Ñ' ? 'N' : 'n').normalize('NFC')
  if (options.uppercase) text = text.toLocaleUpperCase('es')
  if (options.removeSpaces) text = text.replace(/\s/gu, '')
  if (options.keep === 'letters') text = [...text].filter(ch => /\p{L}/u.test(ch)).join('')
  if (options.keep === 'alphanumeric') text = [...text].filter(ch => /[\p{L}\p{N}]/u.test(ch)).join('')
  return text
}

export function decodeConfig(raw: string): CipherConfig {
  const source = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const config = JSON.parse(source) as CipherConfig
  if (config.version !== 1 || !['alberti', 'grille'].includes(config.algorithm)) throw new Error('La configuración no tiene un formato válido.')
  if (config.algorithm === 'alberti') {
    config.periodLength ??= 1
    config.unsupported ??= 'preserve'; config.letterCase ??= 'preserve'
    if (!['remove', 'preserve'].includes(config.unsupported) || !['preserve', 'uppercase'].includes(config.letterCase)) throw new Error('El tratamiento de caracteres del disco no es válido.')
    validateAlberti(config.outerAlphabet, config.innerAlphabet, config.offset, config.advance, config.periodLength)
  } else {
    config.direction ??= 'clockwise'; config.mode ??= 'four'; config.keep ??= 'nonspace'
    if (!Number.isInteger(config.size) || config.size < 2 || config.size > 16 || !Array.isArray(config.holes) || !Number.isInteger(config.length) || config.length < 0 || !['clockwise', 'counterclockwise'].includes(config.direction) || !['four', 'untilDone'].includes(config.mode) || !['alphanumeric', 'nonspace'].includes(config.keep)) throw new Error('Los parámetros de la rejilla no son válidos.')
  }
  if (config.preprocess && (typeof config.preprocess.uppercase !== 'boolean' || typeof config.preprocess.removeDiacritics !== 'boolean' || typeof config.preprocess.removeSpaces !== 'boolean' || !['all', 'letters', 'alphanumeric'].includes(config.preprocess.keep))) throw new Error('Las opciones de preprocesado no son válidas.')
  return config
}

export function albertiEncrypt(input: string, outerAlphabet: string, innerAlphabet: string, offset: number, advance = 0, periodLength = 1, unsupported: 'remove' | 'preserve' = 'preserve', letterCase: 'preserve' | 'uppercase' = 'preserve'): string {
  const [outer, inner] = validateAlberti(outerAlphabet, innerAlphabet, offset, advance, periodLength)
  let position = 0
  return [...input].map(char => {
    const index = findSymbol(outer, char)
    if (index < 0) return unsupported === 'preserve' ? char : ''
    const shift = mod(offset + Math.floor(position / periodLength) * advance, outer.length)
    position++
    const result = inner[mod(index + shift, outer.length)]
    return letterCase === 'uppercase' ? result.toLocaleUpperCase() : matchCase(result, char)
  }).join('')
}

export function albertiDecrypt(input: string, outerAlphabet: string, innerAlphabet: string, offset: number, advance = 0, periodLength = 1, unsupported: 'remove' | 'preserve' = 'preserve', letterCase: 'preserve' | 'uppercase' = 'preserve'): string {
  const [outer, inner] = validateAlberti(outerAlphabet, innerAlphabet, offset, advance, periodLength)
  let position = 0
  return [...input].map(char => {
    const index = findSymbol(inner, char)
    if (index < 0) return unsupported === 'preserve' ? char : ''
    const shift = mod(offset + Math.floor(position / periodLength) * advance, outer.length)
    position++
    const result = outer[mod(index - shift, outer.length)]
    return letterCase === 'uppercase' ? result.toLocaleUpperCase() : matchCase(result, char)
  }).join('')
}

function findSymbol(alphabet: string[], char: string) {
  const exact = alphabet.indexOf(char)
  if (exact >= 0) return exact
  const upper = char.toLocaleUpperCase()
  return alphabet.findIndex(symbol => symbol.toLocaleUpperCase() === upper)
}

function matchCase(symbol: string, source: string) {
  if (source.toLocaleUpperCase() !== source.toLocaleLowerCase()) {
    if (source === source.toLocaleUpperCase()) return symbol.toLocaleUpperCase()
    if (source === source.toLocaleLowerCase()) return symbol.toLocaleLowerCase()
  }
  return symbol
}

function validateAlberti(outerText: string, innerText: string, offset: number, advance: number, periodLength: number): [string[], string[]] {
  const outer = [...outerText], inner = [...innerText]
  if (outer.length < 2 || outer.length !== inner.length || new Set(outer).size !== outer.length || new Set(inner).size !== inner.length || !Number.isInteger(offset) || !Number.isInteger(advance) || !Number.isInteger(periodLength) || periodLength < 1) throw new Error('Los discos deben tener alfabetos únicos de igual longitud; período mínimo: 1.')
  return [outer, inner]
}

function mod(value: number, divisor: number) { return ((value % divisor) + divisor) % divisor }
function rotateCell(cell: number, size: number, direction: 'clockwise' | 'counterclockwise'): number {
  const row = Math.floor(cell / size), col = cell % size
  return direction === 'clockwise' ? col * size + size - 1 - row : (size - 1 - col) * size + row
}
function rotatedHoles(size: number, holes: number[], turn: number, direction: 'clockwise' | 'counterclockwise') {
  return holes.map(hole => { let cell = hole; for (let i = 0; i < turn; i++) cell = rotateCell(cell, size, direction); return cell }).sort((a, b) => a - b)
}

export function grilleOrbits(size: number, direction: 'clockwise' | 'counterclockwise' = 'clockwise'): number[][] {
  const seen = new Set<number>(), orbits: number[][] = []
  for (let cell = 0; cell < size * size; cell++) {
    if (seen.has(cell)) continue
    let current = cell; const orbit: number[] = []
    do { orbit.push(current); seen.add(current); current = rotateCell(current, size, direction) } while (current !== cell)
    orbits.push(orbit)
  }
  return orbits
}

export function validGrille(size: number, holes: number[], direction: 'clockwise' | 'counterclockwise' = 'clockwise') {
  const orbits = grilleOrbits(size, direction)
  return holes.length === orbits.length && new Set(holes).size === holes.length && holes.every(h => Number.isInteger(h) && h >= 0 && h < size * size) && new Set(holes.map(h => orbits.findIndex(o => o.includes(h)))).size === orbits.length
}

export function prepareGrilleText(input: string, keep: 'alphanumeric' | 'nonspace') {
  return [...input].filter(ch => keep === 'alphanumeric' ? /[\p{L}\p{N}]/u.test(ch) : !/\s/u.test(ch))
}

export function grilleEncrypt(input: string, size: number, holes: number[], direction: 'clockwise' | 'counterclockwise' = 'clockwise', mode: 'four' | 'untilDone' = 'four', keep: 'alphanumeric' | 'nonspace' = 'nonspace'): { text: string; length: number } {
  if (!Number.isInteger(size) || size < 2 || size > 16 || !validGrille(size, holes, direction)) throw new Error('La rejilla debe tener una perforación por cada órbita de rotación.')
  const chars = prepareGrilleText(input, keep), capacity = size * size, output: string[] = []
  for (let start = 0; start < chars.length || (chars.length === 0 && start === 0); start += capacity) {
    const block = chars.slice(start, start + capacity), grid = Array<string>(capacity).fill('·'), used = new Set<number>()
    let cursor = 0, turns = 0
    while (turns < 4 && (mode === 'four' || cursor < block.length)) {
      for (const cell of rotatedHoles(size, holes, turns, direction)) {
        if (used.has(cell)) continue
        used.add(cell)
        grid[cell] = block[cursor++] ?? 'X'
      }
      turns++
    }
    output.push(...grid)
    if (!chars.length) break
  }
  return { text: output.join(''), length: chars.length }
}

export function grilleDecrypt(input: string, size: number, holes: number[], length: number, direction: 'clockwise' | 'counterclockwise' = 'clockwise', mode: 'four' | 'untilDone' = 'four'): string {
  const chars = [...input], capacity = size * size
  if (!Number.isInteger(size) || size < 2 || size > 16 || !validGrille(size, holes, direction) || !Number.isInteger(length) || length < 0 || chars.length !== Math.max(1, Math.ceil(length / capacity)) * capacity) throw new Error('La clave o la longitud del mensaje no corresponden a esta rejilla.')
  const output: string[] = []
  for (let start = 0; start < chars.length; start += capacity) {
    const block = chars.slice(start, start + capacity), used = new Set<number>()
    let read = 0, turns = 0
    while (turns < 4 && (mode === 'four' || read < length - start)) {
      for (const cell of rotatedHoles(size, holes, turns, direction)) {
        if (used.has(cell)) continue
        used.add(cell)
        const char = block[cell]
        if (char !== '·' && read < length - start) { output.push(char); read++ }
      }
      turns++
    }
  }
  return output.slice(0, length).join('')
}
