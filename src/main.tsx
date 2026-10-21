import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Check, Copy, Grid2X2, LockKeyhole, RotateCcw, UnlockKeyhole } from 'lucide-react'
import { albertiDecrypt, albertiEncrypt, ALBERTI_INNER, ALBERTI_OUTER, decodeConfig, encodeConfig, grilleDecrypt, grilleEncrypt, grilleOrbits, validGrille, type CipherConfig } from './ciphers'
import './style.css'

type CipherId = 'alberti' | 'grille'

function App() {
  const [algorithm, setAlgorithm] = useState<CipherId>('alberti')
  const [plain, setPlain] = useState('INVIARERINFORZIDOMANI')
  const [encrypted, setEncrypted] = useState('')
  const [configOut, setConfigOut] = useState('')
  const [cipherInput, setCipherInput] = useState('')
  const [configInput, setConfigInput] = useState('')
  const [decrypted, setDecrypted] = useState('')
  const [outerAlphabet, setOuterAlphabet] = useState(ALBERTI_OUTER)
  const [innerAlphabet, setInnerAlphabet] = useState(ALBERTI_INNER)
  const [offset, setOffset] = useState(0)
  const [advance, setAdvance] = useState(1)
  const [periodLength, setPeriodLength] = useState(4)
  const [albertiUnsupported, setAlbertiUnsupported] = useState<'remove' | 'preserve'>('preserve')
  const [albertiLetterCase, setAlbertiLetterCase] = useState<'preserve' | 'uppercase'>('preserve')
  const [size, setSize] = useState(4)
  const [direction, setDirection] = useState<'clockwise' | 'counterclockwise'>('clockwise')
  const [grilleMode, setGrilleMode] = useState<'four' | 'untilDone'>('four')
  const [grilleKeep, setGrilleKeep] = useState<'alphanumeric' | 'nonspace'>('nonspace')
  const [holes, setHoles] = useState<number[]>(grilleOrbits(4).map(orbit => orbit[0]))
  const [encryptError, setEncryptError] = useState('')
  const [decryptError, setDecryptError] = useState('')
  const [copied, setCopied] = useState('')

  const orbits = useMemo(() => grilleOrbits(size, direction), [size, direction])
  const validAlphabet = outerAlphabet
  const validInnerAlphabet = innerAlphabet
  const alphabetError = [...validAlphabet].length < 2 || new Set([...validAlphabet]).size !== [...validAlphabet].length || new Set([...validInnerAlphabet]).size !== [...validInnerAlphabet].length || [...validInnerAlphabet].length !== [...validAlphabet].length

  function encrypt() {
    setEncryptError(''); setEncrypted(''); setConfigOut('')
    try {
      let config: CipherConfig
      let text: string
      if (algorithm === 'alberti') {
        if (alphabetError) throw new Error('Los alfabetos fijo y móvil deben tener la misma cantidad de símbolos únicos y al menos dos caracteres.')
        config = { version: 1, algorithm, outerAlphabet: validAlphabet, innerAlphabet: validInnerAlphabet, offset, advance, periodLength, unsupported: albertiUnsupported, letterCase: albertiLetterCase }
        text = albertiEncrypt(plain, validAlphabet, validInnerAlphabet, offset, advance, periodLength, albertiUnsupported, albertiLetterCase)
      } else {
        if (!validGrille(size, holes, direction)) throw new Error(`Elige exactamente ${orbits.length} perforaciones, una por cada grupo de rotación.`)
        const result = grilleEncrypt(plain, size, holes, direction, grilleMode, grilleKeep)
        config = { version: 1, algorithm, size, holes, length: result.length, direction, mode: grilleMode, keep: grilleKeep }
        text = result.text
      }
      setEncrypted(text); setConfigOut(encodeConfig(config))
    } catch (issue) { setEncryptError(issue instanceof Error ? issue.message : 'No se pudo cifrar el mensaje.') }
  }

  function decrypt() {
    setDecryptError(''); setDecrypted('')
    try {
      const config = decodeConfig(configInput)
      if (config.algorithm !== algorithm) throw new Error(`La configuración corresponde a ${config.algorithm === 'alberti' ? 'Alberti' : 'la rejilla'}. Selecciona ese método arriba.`)
      const text = config.algorithm === 'alberti'
        ? albertiDecrypt(cipherInput, config.outerAlphabet, config.innerAlphabet, config.offset, config.advance, config.periodLength, config.unsupported, config.letterCase)
        : grilleDecrypt(cipherInput, config.size, config.holes, config.length, config.direction, config.mode)
      setDecrypted(text)
    } catch (issue) { setDecryptError(issue instanceof Error ? issue.message : 'No se pudo descifrar el mensaje.') }
  }

  function useForDecrypting() {
    setCipherInput(encrypted); setConfigInput(configOut); setDecrypted(''); setDecryptError('')
  }
  function toggleOrbit(orbit: number[], cell = orbit[0]) { setHoles(current => current.some(hole => orbit.includes(hole)) ? current.filter(hole => !orbit.includes(hole)) : [...current, cell]) }
  async function copy(value: string, id: string) {
    await navigator.clipboard.writeText(value); setCopied(id); setTimeout(() => setCopied(''), 1400)
  }
  function loadExample() {
    setPlain('INVIARERINFORZIDOMANI')
    setEncrypted(''); setConfigOut(''); setCipherInput(''); setConfigInput(''); setDecrypted('')
    setEncryptError(''); setDecryptError('')
  }

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark">C</span><span>Cifrario</span></a><div className="method-select" aria-label="Método de cifrado"><button className={algorithm === 'alberti' ? 'active' : ''} onClick={() => setAlgorithm('alberti')}><span className="alberti-symbol">◎</span> Disco de Alberti</button><button className={algorithm === 'grille' ? 'active' : ''} onClick={() => setAlgorithm('grille')}><Grid2X2 size={16}/> Rejilla giratoria</button></div><button className="outline-button" onClick={loadExample}><RotateCcw size={14}/> Ejemplo</button></header>
    <main className="page-wrap">
      <div className="page-heading"><div><h1>{algorithm === 'alberti' ? 'Disco de Alberti' : 'Rejilla giratoria'}</h1><p>{algorithm === 'alberti' ? 'Cifra con dos alfabetos y un giro que cambia letra por letra.' : 'Cifra con una plantilla que se gira cuatro veces.'}</p></div></div>
      <div className="parallel-panels">
        <section className="operation-panel"><div className="panel-heading"><div className="panel-title"><span className="panel-icon encrypt-icon"><LockKeyhole size={16}/></span><div><h2>Cifrar</h2><p>Texto original → mensaje cifrado</p></div></div><button className="run-button" onClick={encrypt}>Cifrar <span>→</span></button></div>
          <label className="field-label" htmlFor="plain">TEXTO ORIGINAL</label><textarea id="plain" className="message-field" value={plain} onChange={event => setPlain(event.target.value)} placeholder="Escribe el mensaje…" spellCheck={false}/><div className="field-meta">{[...plain].length} caracteres</div>
          {encryptError && <div className="error-banner">{encryptError}</div>}
          <div className="result-block"><div className="result-heading"><label className="field-label" htmlFor="encrypted">MENSAJE CIFRADO</label>{encrypted && <button className="mini-copy" onClick={() => copy(encrypted, 'cipher')}>{copied === 'cipher' ? <Check size={13}/> : <Copy size={13}/>} {copied === 'cipher' ? 'Copiado' : 'Copiar texto'}</button>}</div><textarea id="encrypted" className="message-field result-field mono" value={encrypted} onChange={event => setEncrypted(event.target.value)} placeholder="El resultado aparecerá aquí…" spellCheck={false}/></div>
          <div className="result-block config-block"><div className="result-heading"><label className="field-label" htmlFor="config-out">CONFIGURACIÓN PARA DESCIFRAR</label>{configOut && <button className="mini-copy" onClick={() => copy(configOut, 'config')}>{copied === 'config' ? <Check size={13}/> : <Copy size={13}/>} {copied === 'config' ? 'Copiada' : 'Copiar config.'}</button>}</div><textarea id="config-out" className="config-field mono" value={configOut} onChange={event => setConfigOut(event.target.value)} placeholder="La configuración se genera al cifrar…" spellCheck={false}/></div>
          {encrypted && configOut && <button className="transfer-button" onClick={useForDecrypting}>Probar en el descifrador <span>↓</span></button>}
        </section>
        <section className="operation-panel"><div className="panel-heading"><div className="panel-title"><span className="panel-icon decrypt-icon"><UnlockKeyhole size={16}/></span><div><h2>Descifrar</h2><p>Mensaje cifrado + configuración → texto</p></div></div><button className="run-button secondary" onClick={decrypt}>Descifrar <span>→</span></button></div>
          <label className="field-label" htmlFor="cipher-input">MENSAJE CIFRADO</label><textarea id="cipher-input" className="message-field mono" value={cipherInput} onChange={event => setCipherInput(event.target.value)} placeholder="Pega aquí solo el texto cifrado…" spellCheck={false}/><div className="field-meta">{[...cipherInput].length} caracteres</div>
          <div className="result-block config-block decrypt-config"><div className="result-heading"><label className="field-label" htmlFor="config-in">CONFIGURACIÓN</label><span className="field-note">Se comparte por separado</span></div><textarea id="config-in" className="config-field mono" value={configInput} onChange={event => setConfigInput(event.target.value)} placeholder="Pega aquí el JSON de configuración…" spellCheck={false}/></div>
          {decryptError && <div className="error-banner">{decryptError}</div>}
          <div className="result-block"><div className="result-heading"><label className="field-label" htmlFor="decrypted">TEXTO DESCIFRADO</label>{decrypted && <button className="mini-copy" onClick={() => copy(decrypted, 'plain')}>{copied === 'plain' ? <Check size={13}/> : <Copy size={13}/>} {copied === 'plain' ? 'Copiado' : 'Copiar texto'}</button>}</div><textarea id="decrypted" className="message-field result-field" value={decrypted} onChange={event => setDecrypted(event.target.value)} placeholder="El texto recuperado aparecerá aquí…" spellCheck={false}/></div>
        </section>
      </div>
      <section className="settings-section"><div className="settings-heading"><div><h2>Configuración del cifrado</h2><p>Estos parámetros se generan aparte del mensaje cifrado.</p></div></div>
        {algorithm === 'alberti' ? <div className="settings-grid alberti-settings">
          <div className="setting-card"><label className="field-label" htmlFor="outer-alphabet">DISCO 1 · ANILLO EXTERIOR (PLANO)</label><input id="outer-alphabet" className="text-field mono" value={outerAlphabet} onChange={event => setOuterAlphabet(event.target.value)} spellCheck={false}/><div className="field-meta">Ejemplo histórico: 20 letras latinas y los dígitos 1–4.</div></div>
          <div className="setting-card"><label className="field-label" htmlFor="inner-alphabet">DISCO 2 · ANILLO INTERIOR (CIFRADO)</label><input id="inner-alphabet" className="text-field mono" value={innerAlphabet} onChange={event => setInnerAlphabet(event.target.value)} spellCheck={false}/><div className="field-meta">Debe tener igual longitud y símbolos únicos. Se conservan espacios y símbolos ajenos al disco.</div></div>
          <div className="setting-card range-card alberti-range"><div className="range-setting"><label className="field-label" htmlFor="offset">GIRO INICIAL <strong>{offset}</strong></label><input id="offset" type="number" min="0" max={Math.max(1, validAlphabet.length - 1)} value={offset} onChange={event => setOffset(Number(event.target.value))}/></div><div className="range-setting"><label className="field-label" htmlFor="advance">INCREMENTO PERIÓDICO <strong>{advance}</strong></label><input id="advance" type="number" min="0" max={Math.max(1, validAlphabet.length - 1)} value={advance} onChange={event => setAdvance(Number(event.target.value))}/></div><div className="range-setting"><label className="field-label" htmlFor="period-length">PERÍODO EN CARACTERES <strong>{periodLength}</strong></label><input id="period-length" type="number" min="1" max="999" value={periodLength} onChange={event => setPeriodLength(Math.max(1, Number(event.target.value)))}/></div></div>
          <div className="setting-card"><label className="field-label" htmlFor="alberti-case">MAYÚSCULAS Y MINÚSCULAS</label><select id="alberti-case" className="text-field" value={albertiLetterCase} onChange={event => setAlbertiLetterCase(event.target.value as typeof albertiLetterCase)}><option value="preserve">Conservar la caja original</option><option value="uppercase">Normalizar a mayúsculas</option></select><div className="field-meta">En modo conservar, el descifrado recupera la caja de cada letra.</div></div>
          <div className="setting-card"><label className="field-label" htmlFor="alberti-unsupported">CARACTERES QUE NO ESTÁN EN LOS DISCOS</label><select id="alberti-unsupported" className="text-field" value={albertiUnsupported} onChange={event => setAlbertiUnsupported(event.target.value as typeof albertiUnsupported)}><option value="preserve">Conservar sin cifrar</option><option value="remove">Eliminar</option></select><div className="field-meta">Incluye espacios, puntuación, Ñ y letras con tilde si no están en los discos.</div></div>
          <div className="setting-card grille-info"><strong>Avance del disco</strong><p>El giro inicial se aplica al primer símbolo del disco. El incremento se suma cada N caracteres cifrables; usa período 1 para cambiar en cada símbolo o período 4 como en el simulador de referencia.</p></div>
        </div>
        : <div className="settings-grid grille-settings"><div className="setting-card grille-setting">
          <div className="setting-line"><div><label className="field-label" htmlFor="grid-size">TAMAÑO DE REJILLA</label><div className="size-controls"><input id="grid-size" className="text-field mono size-input" type="number" min="2" max="16" value={size} onChange={event => { const next = Math.min(16, Math.max(2, Number(event.target.value))); setSize(next); setHoles(grilleOrbits(next, direction).map(orbit => orbit[0])) }}/><span>× {size}</span></div></div><span className="hole-count">{holes.length}/{orbits.length} perforaciones</span></div>
          <div className="grille-options"><label>Conservar <select value={grilleKeep} onChange={event => setGrilleKeep(event.target.value as typeof grilleKeep)}><option value="alphanumeric">Solo letras y dígitos</option><option value="nonspace">Todos los caracteres, sin espacios</option></select></label><label>Giro <select value={direction} onChange={event => { const next = event.target.value as typeof direction; setDirection(next); setHoles(grilleOrbits(size, next).map(orbit => orbit[0])) }}><option value="clockwise">⟳ Horario</option><option value="counterclockwise">⟲ Antihorario</option></select></label><label>Fin <select value={grilleMode} onChange={event => setGrilleMode(event.target.value as typeof grilleMode)}><option value="four">Después de 4 giros</option><option value="untilDone">Al terminar las letras</option></select></label></div>
          <div className="grille-visual" style={{ '--grid-size': size } as React.CSSProperties}>{Array.from({ length: size * size }, (_, cell) => { const orbit = orbits.find(candidate => candidate.includes(cell))!; const chosen = holes.find(hole => orbit.includes(hole)); const selected = chosen !== undefined; return <button key={cell} onClick={() => toggleOrbit(orbit, cell)} className={`${selected ? 'hole ' : ''}${chosen === cell ? 'chosen' : ''}`} title={`Grupo ${orbits.indexOf(orbit) + 1}${selected ? ', perforación en esta órbita' : ''}`}>{chosen === cell ? <span/> : null}</button> })}</div>
          <div className="grille-help">Elige una perforación por órbita de giro. En tamaño impar, el centro forma una órbita de una sola casilla.</div></div><div className="setting-card grille-info"><strong>{size * size} celdas por bloque</strong><p>El cifrado se lee por filas. Las casillas sin usar se marcan con · y la clave guarda la longitud para descifrar sin ambigüedad.</p></div></div>}
      </section>
      <footer className="page-footer">Cifrados históricos para aprendizaje y demostración. No protegen información sensible.</footer>
    </main>
  </div>
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>)
