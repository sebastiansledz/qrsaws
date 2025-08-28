// scripts/fix-missing-router-imports.mjs
// Scans src/**/*.tsx and ensures symbols from react-router-dom are imported when used.
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(process.cwd(), 'src')
const ROUTER_PKG = 'react-router-dom'

// JSX components + hooks we support
const SYMBOLS = {
  // JSX elements
  Link: /<\s*Link(?:\s|>)/,
  NavLink: /<\s*NavLink(?:\s|>)/,
  Navigate: /<\s*Navigate(?:\s|>)/,
  Outlet: /<\s*Outlet(?:\s|>)/,
  // Hooks / fns
  useNavigate: /\buseNavigate\s*\(/,
  useParams: /\buseParams\s*\(/,
  useSearchParams: /\buseSearchParams\s*\(/,
  useLocation: /\buseLocation\s*\(/,
}

/** Recursively list .tsx files */
function listTSX(dir, arr = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) listTSX(p, arr)
    else if (p.endsWith('.tsx')) arr.push(p)
  }
  return arr
}

function parseExistingRouterImports(code) {
  // matches: import { A, B as C } from 'react-router-dom'
  const re = /import\s*\{([^}]+)\}\s*from\s*['"]react-router-dom['"];?/g
  const imported = new Set()
  let m
  while ((m = re.exec(code))) {
    const names = m[1].split(',').map(s => s.trim())
    for (const n of names) {
      // support "X as Y"
      const base = n.split(/\s+as\s+/i)[0].trim()
      if (base) imported.add(base)
    }
  }
  return imported
}

function ensureRouterImports(file) {
  let code = fs.readFileSync(file, 'utf8')
  const imported = parseExistingRouterImports(code)

  // Find which symbols are used in this file
  const needed = []
  for (const [sym, regex] of Object.entries(SYMBOLS)) {
    if (regex.test(code) && !imported.has(sym)) needed.push(sym)
  }
  if (needed.length === 0) return false

  // If there is already a react-router-dom import, extend it
  const importRe = /import\s*\{([^}]*)\}\s*from\s*['"]react-router-dom['"];?/
  if (importRe.test(code)) {
    code = code.replace(importRe, (_all, inside) => {
      const existing = inside.split(',').map(s => s.trim()).filter(Boolean)
      const merged = Array.from(new Set([...existing, ...needed])).join(', ')
      return `import { ${merged} } from '${ROUTER_PKG}'`
    })
  } else {
    // Insert a fresh import after first import block or at top
   const lines = code.split('\n')
    let insertAt = 0
    while (insertAt < lines.length && lines[insertAt].startsWith('import ')) insertAt++
    const importLine = `import { ${needed.join(', ')} } from '${ROUTER_PKG}'`
    lines.splice(insertAt, 0, importLine)
    code = lines.join('\n')
  }

  fs.writeFileSync(file, code, 'utf8')
  console.log(`🔧 ${path.relative(process.cwd(), file)} -> added: ${needed.join(', ')}`)
  return true
}

const files = listTSX(ROOT)
let changed = 0
for (const f of files) {
  try { if (ensureRouterImports(f)) changed++ } catch (e) {
    console.error(`⚠️  Failed on ${f}:`, e.message)
  }
}
console.log(`\n✅ Done. Files updated: ${changed}`)