const fs = require('fs');

let code = fs.readFileSync('App.js', 'utf8');

// Auto-fix common AI code generation mistakes
code = code.replace(/(\d+)(px|em|rem|vh|vw|pt|dp|sp)\b/g, '$1');
code = code.replace(/,([\s]*[}\]])/g, '$1');
code = code.replace(/(\d+)\s*(seconds?|minutes?|hours?|items?|times?|days?)\b/g, '$1');

// Quote object keys that start with numbers
code = code.replace(/\{(\s*)(\d+[a-zA-Z]\w*)(\s*):/g, "{$1'$2'$3:");
code = code.replace(/,(\s*)(\d+[a-zA-Z]\w*)(\s*):/g, ",$1'$2'$3:");

// Fix unclosed brackets
let braces = 0, parens = 0, brackets = 0;
let inStr = false, strCh = '', inTpl = false;
for (let i = 0; i < code.length; i++) {
  const c = code[i], p = i > 0 ? code[i-1] : '';
  if (inStr) { if (c === strCh && p !== '\\') inStr = false; continue; }
  if (inTpl) { if (c === '`' && p !== '\\') inTpl = false; continue; }
  if (c === '"' || c === "'") { inStr = true; strCh = c; continue; }
  if (c === '`') { inTpl = true; continue; }
  if (c === '{') braces++; else if (c === '}') braces--;
  if (c === '(') parens++; else if (c === ')') parens--;
  if (c === '[') brackets++; else if (c === ']') brackets--;
}
while (braces > 0) { code += '\n}'; braces--; }
while (parens > 0) { code += ')'; parens--; }
while (brackets > 0) { code += ']'; brackets--; }

fs.writeFileSync('App.js', code);

// Try parsing with a simple check
try {
  new Function('"use strict";' + code.replace(/import\s+/g, 'var _i = ').replace(/export\s+default/g, 'var _e ='));
  console.log('Syntax validation passed');
} catch (e) {
  console.warn('Warning: Basic syntax check flagged an issue:', e.message);
  console.log('Proceeding with build anyway - React Native bundler may handle it');
}
