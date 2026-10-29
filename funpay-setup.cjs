#!/usr/bin/env node
/* Tokify / Funpay Gateway — универсальный CLI-настройщик.
 * Платформы: Windows / Linux / macOS (автоопределение). Нужен Node.js 18+.
 *_flow: ключ -> проверка и статистика -> выбор CLI (Codex / Claude Code / DSH) ->
 *        автонастройка с подстановкой ключа; для DSH — установка из npm (если нет),
 *        полный конфиг и запуск dsh web с открытием браузера.
 * DSH (DeepSeek Harness): полная автонастройка под нас — провайдер tokify в
 *        ~/.dsh/settings.yaml (модели с contextWindow, defaultInput text+image,
 *        иначе фото не прикрепляются), дефолтная модель agent-default-model, ключ
 *        в ~/.dsh/.credentials.yaml, установка пакета @deepseek-ai/dsh при
 *        отсутствии и запуск веб-интерфейса (dsh web, http://127.0.0.1:3080).
 * Запуск:  node funpay-setup.js        (BASE: env FUNPAY_BASE, по умолчанию прод)
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync, spawn } = require('child_process');

const BASE = (process.env.FUNPAY_BASE || 'https://tokify.sale').replace(/\/+$/, '');
const HOME = os.homedir();
const PLATFORM = process.platform === 'win32' ? 'Windows' : process.platform === 'darwin' ? 'macOS' : 'Linux';
const MAIN_MODEL = 'claude-fable-5.1';
const OPUS_MODEL = 'claude-opus-5.5'; // 20.10: в /model Claude Code пункт «Opus» = Claude Opus 5.5
const FAST_MODEL = 'claude-opus-4.7';

const C = process.stdout.isTTY
  ? { b: '\x1b[1m', d: '\x1b[2m', r: '\x1b[0m', g: '\x1b[38;5;117m', v: '\x1b[38;5;141m', ok: '\x1b[38;5;84m', er: '\x1b[38;5;210m', y: '\x1b[38;5;222m' }
  : { b: '', d: '', r: '', g: '', v: '', ok: '', er: '', y: '' };

function banner() {
  console.log(`\n${C.v}  ____              _____             _   ${C.r}
${C.v} | __ ) _   _ _ __ |__   _|_   _ _ __ | | ___   ${C.r}
${C.v} |  _ \\| | | | '_ \\  | | | | | | '_ \\| |/ __|  ${C.r}
${C.v} | |_) | |_| | | | | | | | |_| | | | | | (__   ${C.r}
${C.v} |____/ \\__,_|_| |_| |_|  \\__,_|_| |_|_|\\___|  ${C.r}
${C.d}  Funpay Gateway · универсальный настройщик CLI · ${PLATFORM}${C.r}\n`);
}

// ---------- ввод ----------
// Единый читатель stdin БЕЗ readline: readline буферизует ввод параллельно с
// raw-режимом и потом «съедает» меню (баг «Ничего не менял»). Для TTY — свой
// raw-читатель (маска, Ctrl+V, средняя кнопка мыши, bracketed paste), для пайпа — построчный буфер.
const lineQueue = [];
let lineWaiter = null;
const emitLine = (l) => { const t = String(l).replace(/[\r\n]+$/, ''); if (lineWaiter) { const w = lineWaiter; lineWaiter = null; w(t); } else lineQueue.push(t); };
let pipeOn = false;
function ensurePipe() {
  if (pipeOn || process.stdin.isTTY) return;
  pipeOn = true;
  process.stdin.setEncoding('utf8');
  let buf = '';
  process.stdin.on('data', (d) => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { emitLine(buf.slice(0, i)); buf = buf.slice(i + 1); } });
  process.stdin.on('end', () => { if (lineWaiter) { const w = lineWaiter; lineWaiter = null; w(''); } });
}
const nextLine = () => new Promise((res) => { ensurePipe(); if (lineQueue.length) res(lineQueue.shift()); else { lineWaiter = res; if (!process.stdin.isTTY) process.stdin.resume(); } });

// ---------- буфер обмена (Ctrl+V / средняя кнопка мыши в raw-режиме) ----------
function readClipboard() {
  try {
    if (process.platform === 'win32')
      return execSync('powershell.exe -NoProfile -Command "Get-Clipboard"', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true });
    if (process.platform === 'darwin') return execSync('pbpaste', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    for (const c of ['wl-paste -n', 'xclip -selection clipboard -o', 'xsel -ob']) {
      try { return execSync(c, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch {}
    }
  } catch {}
  return '';
}

// raw-читатель одной строки: mask=true → эхо '*' (секрет), false — эхо символа.
// gAcc — персистентный буфер между вызовами: хвост ввода (напр. «2\n» после ключа
// при вставке/пайпе) не теряется, а доедается в следующем readLineRaw.
let gAcc = '';
async function readLineRaw(prompt, mask) {
  const stdin = process.stdin;
  const { StringDecoder } = require('string_decoder');
  stdin.setRawMode(true); stdin.resume();
  process.stdout.write(prompt);
  if (mask) process.stdout.write('\x1b[?1000h\x1b[?1006h'); // мышь: средняя кнопка = вставить
  let buf = '';
  const render = () => { process.stdout.write('\r\x1b[K' + prompt + (mask ? (C.g + '*'.repeat(buf.length) + C.r) : buf)); };
  const clipPaste = () => {
    const clip = String(readClipboard() || '').replace(/[\r\n]+/g, '').trim();
    if (clip) { buf += clip; render(); }
    else process.stdout.write(C.y + ' [буфер обмена пуст]' + C.r);
  };
  const dec = new StringDecoder('utf8');
  let done = false;
  return new Promise((resolve) => {
    const finish = () => {
      done = true;
      stdin.removeListener('data', onData);
      try { stdin.setRawMode(false); } catch {}
      process.stdout.write('\x1b[?1000l\x1b[?1006l');
      process.stdout.write('\r\x1b[K' + prompt + (mask ? (C.g + '*'.repeat(buf.length) + C.r) : buf) + '\n');
      resolve(buf);
    };
    const pump = () => {
      for (;;) {
        if (!gAcc.length) return;
        if (gAcc.startsWith('\x1b[200~')) { const e = gAcc.indexOf('\x1b[201~'); if (e < 0) return; buf += gAcc.slice(6, e).replace(/[\r\n]+/g, ''); gAcc = gAcc.slice(e + 6); render(); continue; }
        const mm = gAcc.match(/^\x1b\[<(\d+);(\d+);(\d+)([Mm])/);
        if (mm) { if (mm[4] === 'M' && mm[1] === '1') clipPaste(); gAcc = gAcc.slice(mm[0].length); continue; }
        const c = gAcc[0];
        if (c === '\r' || c === '\n') { gAcc = gAcc.slice(1); finish(); return; }
        if (c === '\x03') { gAcc = gAcc.slice(1); finish(); process.exit(130); return; }
        if (c === '\x7f' || c === '\b') { gAcc = gAcc.slice(1); buf = buf.slice(0, -1); render(); continue; }
        if (c === '\x15') { gAcc = gAcc.slice(1); buf = ''; render(); continue; }
        if (c === '\x16') { gAcc = gAcc.slice(1); clipPaste(); continue; }
        if (c === '\x1b') {
          const em = gAcc.match(/^\x1b(\[[0-9;?]*[a-zA-Z~]|\[[0-9;]*[Mm]|[a-zA-Z])/);
          if (em) { gAcc = gAcc.slice(em[0].length); continue; }
          if (gAcc.length < 8) return;
          gAcc = gAcc.slice(1); continue;
        }
        if (c < ' ') { gAcc = gAcc.slice(1); continue; }
        buf += c; gAcc = gAcc.slice(1); render();
      }
    };
    const onData = (chunk) => { gAcc += dec.write(chunk); pump(); };
    pump(); // доедаем хвост с прошлого вызова (важно для пайпа/вставки)
    if (!done) stdin.on('data', onData);
  });
}

const ask = async (q) => { if (process.stdin.isTTY) return readLineRaw(q, false); process.stdout.write(q); return nextLine(); };
const askSecret = async (q) => { if (process.stdin.isTTY) return readLineRaw(q, true); process.stdout.write(q); return nextLine(); };

// ---------- утилиты ----------
const fmt = (n) => Number(n).toLocaleString('ru-RU');
const fmtTok = (n) => (n >= 1e9 ? (n / 1e9).toFixed(2) + ' млрд' : n >= 1e6 ? (n / 1e6).toFixed(1) + ' млн' : n >= 1e3 ? (n / 1e3).toFixed(1) + ' тыс' : String(n));
function bar(used, limit, width = 24) {
  if (limit == null || limit <= 0) return `${C.d}[${'·'.repeat(width)}] безлимит${C.r}`;
  const pct = Math.min(1, used / limit);
  const filled = Math.round(pct * width);
  const color = pct >= 0.9 ? C.er : pct >= 0.7 ? C.y : C.g;
  return `${color}[${'█'.repeat(filled)}${C.d}${'·'.repeat(width - filled)}${C.r}${color}]${C.r} ${(pct * 100).toFixed(1)}%`;
}
const backup = (p) => { if (fs.existsSync(p)) fs.copyFileSync(p, p + '.bak-funpay-setup'); };

// ---------- статистика ключа ----------
async function keyInfo(key) {
  const resp = await fetch(BASE + '/public/key-info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  });
  if (resp.status === 401) throw new Error('ключ не найден или отключён');
  if (resp.status === 400) throw new Error('неверный формат ключа (нужен sk-…)');
  if (!resp.ok) throw new Error('сервис ответил ' + resp.status);
  return resp.json();
}

function printStats(d) {
  const L = d.limits || {}, U = d.usage || {}, Q = d.quota || {};
  console.log(`\n${C.b}Ключ:${C.r} ${C.g}${d.prefix}…${C.r}  ${C.d}(${d.label || 'без названия'})${C.r}`);
  if (Q.total != null) {
    console.log(`  Пакет токенов   ${bar(Q.used || 0, Q.total)}  остаток ${C.b}${fmtTok(Q.remaining ?? 0)}${C.r} из ${fmtTok(Q.total)}`);
  } else {
    console.log(`  Пакет токенов   ${C.d}безлимит${C.r}`);
  }
  if (L.rpm != null) console.log(`  RPM             ${C.d}лимит ${fmt(L.rpm)} зап/мин${C.r}`);
  if (L.rpd != null) console.log(`  RPD             ${bar(U.today_requests || 0, L.rpd)}  сегодня ${fmt(U.today_requests || 0)}/${fmt(L.rpd)}`);
  if (L.monthly_tokens != null) console.log(`  Токены/месяц    ${bar(U.month_tokens || 0, L.monthly_tokens)}`);
  if (L.win5h_tokens != null) console.log(`  Окно 5ч токены  ${bar(U.win5h_tokens || 0, L.win5h_tokens)}`);
  if (L.weekly_tokens != null) console.log(`  Неделя токены   ${bar(U.weekly_tokens || 0, L.weekly_tokens)}`);
  console.log(`  ${C.d}всего запросов: ${fmt(U.total_requests || 0)} · токенов: ${fmtTok(U.total_tokens || 0)} · сегодня: ${fmt(U.today_requests || 0)}${C.r}\n`);
}

// ---------- Codex ----------
function patchCodexConfig(file, base, catalogPath) {
  let lines = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split(/\r?\n/) : [];
  const sectionOf = (i) => {
    let sec = '';
    for (let j = 0; j <= i; j++) { const m = lines[j] && lines[j].match(/^\s*\[([^\]]+)\]/); if (m) sec = m[1].trim(); }
    return sec;
  };
  const setTop = (key, val) => {
    const re = new RegExp('^\\s*' + key + '\\s*=');
    let idx = lines.findIndex((l, i) => re.test(l) && sectionOf(i) === '');
    const line = `${key} = ${val}`;
    if (idx >= 0) lines[idx] = line;
    else {
      let ins = lines.findIndex((l) => /^\s*\[/.test(l));
      if (ins < 0) ins = lines.length;
      lines.splice(ins, 0, line);
    }
  };
  setTop('model_provider', '"funpay"');
  setTop('model', `"${MAIN_MODEL}"`);
  setTop('review_model', `"${MAIN_MODEL}"`);
  setTop('disable_response_storage', 'true');
  // БЕЗ каталога моделей Codex сваливается в code-mode: ноль function-тулов,
  // агент не может вызывать инструменты вообще. Каталог ставим рядом с конфигом.
  if (catalogPath) setTop('model_catalog_json', `"${catalogPath}"`);

  // секция провайдера
  const secRe = /^\s*\[model_providers\.funpay\]\s*$/;
  let si = lines.findIndex((l) => secRe.test(l));
  const provLines = [
    '[model_providers.funpay]',
    'name = "Funpay Gateway"',
    `base_url = "${base}/v1"`,
    'wire_api = "responses"',
    'env_key = "FUNPAY_API_KEY"',
  ];
  if (si < 0) {
    if (lines.length && lines[lines.length - 1].trim() !== '') lines.push('');
    lines.push(...provLines);
  } else {
    let ei = lines.findIndex((l, i) => i > si && /^\s*\[/.test(l));
    if (ei < 0) ei = lines.length;
    lines.splice(si, ei - si, ...provLines);
  }
  backup(file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, lines.join('\n') + '\n');
}

function setEnvUnix(key) {
  const line = `export FUNPAY_API_KEY="${key}"`;
  const targets = ['.bashrc', '.zshrc', '.bash_profile', '.profile']
    .map((f) => path.join(HOME, f))
    .filter((p) => fs.existsSync(p));
  const list = targets.length ? targets : [path.join(HOME, '.profile')];
  for (const p of list) {
    let txt = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
    const re = /^export FUNPAY_API_KEY=.*$/m;
    txt = re.test(txt) ? txt.replace(re, line) : (txt.endsWith('\n') || txt === '' ? txt : txt + '\n') + line + '\n';
    backup(p);
    fs.writeFileSync(p, txt);
  }
  return list;
}

function setEnvWin(key) {
  execSync(`setx FUNPAY_API_KEY "${key}"`, { stdio: 'ignore' });
  return ['переменная пользователя FUNPAY_API_KEY (setx)'];
}

// Каталог моделей Codex: без model_catalog_json Codex включает code-mode
// (additional_tools вместо function-тулов) и агент перестаёт вызывать инструменты.
async function fetchCatalog(base) {
  const resp = await fetch(base + '/public/codex-models.json');
  if (!resp.ok) throw new Error('сервер ответил ' + resp.status);
  const j = await resp.json();
  if (!j || !Array.isArray(j.models) || !j.models.length) throw new Error('пустой каталог');
  return j;
}

async function setupCodex(key) {
  const dir = path.join(HOME, '.codex');
  const file = path.join(dir, 'config.toml');
  let catalogPath = null;
  try {
    const cat = await fetchCatalog(BASE);
    fs.mkdirSync(dir, { recursive: true });
    const cfile = path.join(dir, 'funpay-models.json');
    backup(cfile);
    fs.writeFileSync(cfile, JSON.stringify(cat, null, 2));
    catalogPath = cfile.split(path.sep).join('/');
  } catch (e) {
    console.log(C.y + ' ! Не смог скачать каталог моделей (' + e.message + '): добавьте model_catalog_json вручную.' + C.r);
  }
  patchCodexConfig(file, BASE, catalogPath);
  const where = process.platform === 'win32' ? setEnvWin(key) : setEnvUnix(key);
  return [file, ...(catalogPath ? [catalogPath] : []), ...where];
}

// ---------- Claude Code ----------
function setupClaude(key) {
  const file = path.join(HOME, '.claude', 'settings.json');
  let s = {};
  if (fs.existsSync(file)) { try { s = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { s = {}; } }
  s.env = Object.assign({}, s.env, {
    ANTHROPIC_BASE_URL: BASE,
    ANTHROPIC_AUTH_TOKEN: key,
    ANTHROPIC_MODEL: MAIN_MODEL,
    ANTHROPIC_SMALL_FAST_MODEL: FAST_MODEL,
    ANTHROPIC_DEFAULT_HAIKU_MODEL: FAST_MODEL,
    ANTHROPIC_DEFAULT_SONNET_MODEL: MAIN_MODEL,
    ANTHROPIC_DEFAULT_OPUS_MODEL: OPUS_MODEL,
  });
  backup(file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(s, null, 2) + '\n');
  return [file];
}

// ---------- DeepSeek Harness (DSH) ----------
// DSH держит провайдеров в ~/.dsh/settings.yaml (namespace llm-pi-ai), а ключ — в
// ~/.dsh/.credentials.yaml под именем, на которое ссылается apiKeyEnv.
// Правим ТОЛЬКО блок llm-pi-ai: остальные настройки покупателя сохраняются.
// defaultInput text+image обязателен — без него DSH считает модель текстовой
// (DEFAULT_INPUT = ["text"]) и кнопка прикрепления файла не работает.
const DSH_CRED = 'BUYTOKENS_API_KEY';
const DSH_DEFAULT_MODEL = 'claude-fable-5.1';
// [id, contextWindow] — ЗАПАСНОЙ список (20.10.2026). Основной берётся живьём с сервера
// по ключу покупателя (GET /v1/models), чтобы новые модели и контексты подхватывались сами.
let DSH_MODELS = [
  ['claude-fable-5.1', 991808],
  ['claude-opus-5.5', 524288],
  ['claude-fable-5', 524288],
  ['claude-opus-5', 524288],
  ['claude-opus-5-thinking', 524288],
  ['claude-opus-4.8', 524288],
  ['claude-opus-4.7', 524288],
  ['gpt-6-astra', 524288],
  ['gpt-6-sol', 524288],
  ['gpt-6-reasoning-pro', 524288],
  ['gpt-5.6-sol', 524288],
  ['gpt-5.6-luna', 524288],
];
// живой список чат-моделей ключа; генерация картинок/видео в чат-клиенты не прописывается
let LIVE_MODELS = null;
async function liveModels(key) {
  if (LIVE_MODELS) return LIVE_MODELS;
  try {
    const r = await fetch(BASE + '/v1/models', { headers: { Authorization: 'Bearer ' + key } });
    const j = await r.json();
    const rows = (j.data || []).filter((m) => m && m.id && !/image|t2v|video/i.test(m.id))
      .map((m) => [m.id, Number(m.context_window) || 524288]);
    if (rows.length) LIVE_MODELS = rows;
  } catch { /* сеть/старый сервер — остаётся запасной список */ }
  return LIVE_MODELS;
}
const topKey = (l) => /^[^\s#]/.test(l); // строка верхнего уровня yaml (ключ)
/** Наш провайдер внутри namespace llm-pi-ai (отступ 4 — сосед по providers). */
const dshProvider = () => {
  const L = ['    tokify:', '      displayName: Tokify', `      apiKeyEnv: ${DSH_CRED}`,
    '      api: openai-completions', `      baseURL: ${BASE}/v1`, '      defaultInput:', '        - text',
    '        - image', '      models:'];
  for (const [id, cw] of DSH_MODELS) L.push(`        - id: ${id}`, `          contextWindow: ${cw}`);
  return L;
};
const dshBlock = () => ['llm-pi-ai:', '  providers:', ...dshProvider()];
/**
 * Аккуратный merge: правим ТОЛЬКО наш провайдер tokify внутри llm-pi-ai (легаси-блок
 * buytokens от старых сетапов вычищаем) — остальные
 * провайдеры покупателя (unlimited/openai/…) и все прочие блоки файла сохраняются.
 */
function mergeDshBlock(lines) {
  const top = lines.findIndex((l) => /^llm-pi-ai:\s*$/.test(l));
  if (top < 0) {
    const out = lines.slice();
    while (out.length && out[out.length - 1].trim() === '') out.pop();
    if (out.length) out.push('');
    return [...out, ...dshBlock()];
  }
  let end = lines.findIndex((l, i) => i > top && topKey(l));
  if (end < 0) end = lines.length;
  const prov = lines.findIndex((l, i) => i > top && i < end && /^\s+providers:\s*$/.test(l));
  if (prov < 0) return [...lines.slice(0, top + 1), ...dshBlock().slice(1), ...lines.slice(top + 1)];
  let pend = lines.findIndex((l, i) => i > prov && i < end && /^\s{0,2}[^\s#]/.test(l));
  if (pend < 0) pend = end;
  // 01.10 (ребрендинг tokify): вычищаем ВСЕ наши блоки (tokify + легаси buytokens
  // от старых сетапов), затем вставляем один свежий — дубликаты провайдеров исключены.
  const region = lines.slice(prov + 1, pend);
  const kept = [];
  for (let i = 0; i < region.length; i++) {
    if (/^\s+(tokify|buytokens):\s*$/.test(region[i])) {
      i++;
      while (i < region.length && !/^\s{0,4}[^\s#]/.test(region[i])) i++;
      i--;
      continue;
    }
    kept.push(region[i]);
  }
  return [...lines.slice(0, prov + 1), ...kept, ...dshProvider(), ...lines.slice(pend)];
}
/**
 * Дефолтная модель DSH (agent-default-model): работает из коробки, ничего выбирать
 * не надо. Чужой дефолт (unlimited/openai/…) НЕ трогаем — только наш или легаси
 * buytokens/tokify, либо отсутствие блока (свежая установка).
 */
const dshDefaultBlock = () => ['agent-default-model:', '  provider: tokify', '  model: ' + DSH_DEFAULT_MODEL];
function mergeDshDefault(lines) {
  const top = lines.findIndex((l) => /^agent-default-model:\s*$/.test(l));
  if (top < 0) {
    const out = lines.slice();
    while (out.length && out[out.length - 1].trim() === '') out.pop();
    if (out.length) out.push('');
    return [...out, ...dshDefaultBlock()];
  }
  let end = lines.findIndex((l, i) => i > top && topKey(l));
  if (end < 0) end = lines.length;
  const block = lines.slice(top, end);
  const pm = block.map((l) => (l.match(/^\s*provider:\s*(\S+)/) || [])[1]).find(Boolean);
  if (pm && !/^(tokify|buytokens)$/.test(pm)) return lines; // чужой дефолт — не трогаем
  return [...lines.slice(0, top), ...dshDefaultBlock(), ...lines.slice(end)];
}
/** Строки, которые в yaml верхнего уровня невозможны: JSON-остатки, «- text» без отступа и т.п. */
function brokenTopLines(lines) {
  const bad = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l.trim() || /^\s*#/.test(l) || /^\s+/.test(l)) continue;
    const isKey = /^[^\s#][^:]*:(\s|$)/.test(l) || /^---\s*$/.test(l);
    if (!isKey) bad.push(i + 1 + ': ' + l.slice(0, 60));
  }
  return bad;
}
function writeDshCredentials(key) {
  const file = path.join(HOME, '.dsh', '.credentials.yaml');
  let lines = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split(/\r?\n/) : [];
  if (!lines.some((l) => /^version:/.test(l))) lines.unshift('version: 1');
  let ri = lines.findIndex((l) => /^refs:/.test(l));
  if (ri < 0) { lines.push('refs:'); ri = lines.length - 1; }
  let end = lines.findIndex((l, i) => i > ri && topKey(l));
  if (end < 0) end = lines.length;
  const entry = `  ${DSH_CRED}: ${key}`;
  const at = lines.findIndex((l, i) => i > ri && i < end && new RegExp('^\\s+' + DSH_CRED + ':').test(l));
  if (at >= 0) lines[at] = entry; else lines.splice(end, 0, entry);
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  backup(file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, lines.join('\n') + '\n');
  return file;
}
async function setupDsh(key) {
  const live = await liveModels(key);
  if (live) DSH_MODELS = live; // свежий список с сервера (контексты из каталога)
  const dir = path.join(HOME, '.dsh');
  const file = path.join(dir, 'settings.yaml');
  let lines = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split(/\r?\n/) : [];
  lines = mergeDshBlock(lines);
  lines = mergeDshDefault(lines);
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  // Повреждённые строки ВНЕ нашего блока (JSON-остатки от ручных правок) валят весь файл —
  // предлагаем чистую пересборку: ui-onboarding + наш блок, остальное в .bak-funpay-setup.
  const bad = brokenTopLines(lines);
  if (bad.length) {
    console.log(C.y + ' ! В файле настроек есть строки, которые ломают yaml:' + C.r);
    for (const b of bad.slice(0, 6)) console.log('     ' + C.d + b + C.r);
    // по умолчанию ДА: файл уже нерабочий, а копия сохраняется рядом (.bak-funpay-setup)
    const ans = (await ask(' Заменить файл настроек целиком чистым? [Y/n]: ')).trim().toLowerCase();
    if (!(ans === 'n' || ans === 'no' || ans === 'н' || ans === 'нет')) {
      lines = ['ui-onboarding:', '  welcomeNoticeVersion: 2026-08-13.1', '', ...dshBlock(), '', ...dshDefaultBlock()];
    }
  }
  backup(file);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, lines.join('\n') + '\n');
  return [file, writeDshCredentials(key)];
}

// ---------- DSH: установка и запуск ----------
function dshInstalled() {
  try { execSync('dsh --version', { stdio: 'ignore', timeout: 20000, windowsHide: true }); return true; }
  catch { return false; }
}
function haveNpm() {
  try { execSync('npm --version', { stdio: 'ignore', timeout: 20000, windowsHide: true }); return true; }
  catch { return false; }
}
/** 'have' — уже стоит/установили, 'fresh' — поставили, но dsh появится в новом терминале, 'no' — нет и не ставили. */
async function ensureDshInstalled() {
  if (dshInstalled()) return 'have';
  if (!haveNpm()) {
    console.log(C.y + ' ! Node.js/npm не найдены. Поставьте Node.js LTS с nodejs.org, затем: npm install -g @deepseek-ai/dsh' + C.r);
    return 'no';
  }
  const ans = (await ask(` DSH не установлен. Поставить сейчас (${C.g}npm install -g @deepseek-ai/dsh${C.r}, 1–3 минуты)? [Y/n]: `)).trim().toLowerCase();
  if (['n', 'no', 'н', 'нет'].includes(ans)) {
    console.log(C.d + ' Поставить позже: npm install -g @deepseek-ai/dsh, затем запустить: dsh web' + C.r);
    return 'no';
  }
  try {
    console.log(C.d + ' Устанавливаю DSH из npm…' + C.r);
    execSync('npm install -g @deepseek-ai/dsh', { stdio: 'inherit', timeout: 600000 });
  } catch (e) {
    console.log(C.er + ' Установка не удалась: ' + String((e && e.message) || e).slice(0, 200) + C.r);
    console.log(C.d + ' Вручную: npm install -g @deepseek-ai/dsh' + C.r);
    return 'no';
  }
  if (dshInstalled()) { console.log(C.ok + ' DSH установлен.' + C.r); return 'have'; }
  console.log(C.y + ' Установлено, но команда dsh появится только в НОВОМ терминале (PATH).' + C.r);
  return 'fresh';
}
async function dshWebUp() {
  try {
    const r = await fetch('http://127.0.0.1:3080', { signal: AbortSignal.timeout(2000) });
    return r.status > 0; // любой HTTP-ответ = веб-интерфейс жив (даже 401)
  } catch { return false; }
}
function openBrowser(url) {
  try {
    if (process.platform === 'win32') execSync('rundll32 url.dll,FileProtocolHandler ' + url, { stdio: 'ignore', windowsHide: true });
    else if (process.platform === 'darwin') execSync('open ' + url, { stdio: 'ignore', timeout: 5000 });
    else execSync('xdg-open ' + url + ' 2>/dev/null', { stdio: 'ignore', timeout: 5000 });
  } catch { /* без браузера — просто откроют вручную */ }
}
/** true = веб-интерфейс доступен. Спрашивает, поднимает dsh web в фоне и открывает браузер. */
async function maybeLaunchDsh() {
  if (await dshWebUp()) {
    console.log(C.ok + ' DSH web уже запущен: ' + C.b + 'http://127.0.0.1:3080' + C.r);
    return true;
  }
  const ans = (await ask(` Запустить DSH сейчас (${C.g}dsh web${C.r}, браузер откроется сам)? [Y/n]: `)).trim().toLowerCase();
  if (['n', 'no', 'н', 'нет'].includes(ans)) return false;
  try {
    const child = spawn('dsh web', { shell: true, detached: true, stdio: 'ignore', windowsHide: true });
    child.unref();
  } catch (e) {
    console.log(C.y + ' Не удалось запустить: ' + String((e && e.message) || e).slice(0, 120) + C.r);
    return false;
  }
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await dshWebUp()) {
      openBrowser('http://127.0.0.1:3080');
      console.log(C.ok + ' DSH запущен: ' + C.b + 'http://127.0.0.1:3080' + C.r + C.d + ' (браузер должен открыться сам)' + C.r);
      console.log(C.d + '   Остановить: Linux/macOS — pkill -f "dsh web"; Windows — Диспетчер задач → node' + C.r);
      return true;
    }
  }
  console.log(C.y + ' DSH web не поднялся за 40 секунд — запустите вручную: dsh web' + C.r);
  return false;
}

// ---------- main ----------
(async () => {
  banner();
  console.log(`${C.d}Сервер: ${BASE}${C.r}\n`);

  let key = process.env.FUNPAY_KEY || '';
  let info = null;
  for (;;) {
    if (!key) key = await askSecret(' Вставьте API-ключ (sk-…): ');
    if (!key) { console.log(C.er + ' Пусто. Попробуйте ещё раз.' + C.r); continue; }
    process.stdout.write(C.d + ' Проверяю ключ…' + C.r + '\n');
    try { info = await keyInfo(key); break; }
    catch (e) { console.log(C.er + ' Ошибка: ' + e.message + C.r); key = ''; }
  }

  printStats(info);

  console.log(`${C.b}Что настроить?${C.r}`);
  console.log(`  ${C.v}1${C.r} — Codex CLI`);
  console.log(`  ${C.v}2${C.r} — Claude Code`);
  console.log(`  ${C.v}3${C.r} — Codex + Claude Code`);
  console.log(`  ${C.v}4${C.r} — DeepSeek Harness (DSH: веб-интерфейс, фото, агенты; сам установит и запустит)`);
  console.log(`  ${C.v}5${C.r} — всё сразу`);
  console.log(`  ${C.v}0${C.r} — выход\n`);
  const choice = await ask(' Выбор [1/2/3/4/5/0]: ');

  const all = choice === '5';
  const cli = choice === '1' || choice === '2' || choice === '3';
  const dsh = choice === '4' || all;
  const written = [];
  let dshState = null; // 'have' | 'fresh' | 'no' | null (не выбирали)
  if (choice === '1' || choice === '3' || all) written.push(...(await setupCodex(key)).map((p) => 'Codex: ' + p));
  if (choice === '2' || choice === '3' || all) written.push(...setupClaude(key).map((p) => 'Claude Code: ' + p));
  if (dsh) {
    written.push(...(await setupDsh(key)).map((p) => 'DSH: ' + p));
    dshState = await ensureDshInstalled();
  }

  if (!written.length) { console.log(C.d + ' Ничего не менял. До встречи!' + C.r); process.exit(0); }

  console.log('\n' + C.ok + ' ✅ Всё настроено!' + C.r);
  for (const w of written) console.log('   ' + C.d + '· ' + C.r + w);
  if (cli) {
    console.log(`\n   Модели: ${C.g}${MAIN_MODEL}${C.r} ${C.d}(основная)${C.r}, ${C.g}${FAST_MODEL}${C.r} ${C.d}(быстрая)${C.r}`);
    if (choice === '2' || choice === '3' || all) console.log(`   Claude Code: в ${C.b}/model${C.r} пункт Opus = ${C.g}${OPUS_MODEL}${C.r}, Sonnet = ${C.g}${MAIN_MODEL}${C.r}; любую другую модель — ${C.g}/model <имя>${C.r}`);
    console.log(`   ${C.b}Откройте новый терминал${C.r} — переменные окружения подхватятся там.`);
  }
  if (dsh) {
    console.log(`\n   ${C.b}DSH:${C.r} модель по умолчанию ${C.g}${DSH_DEFAULT_MODEL}${C.r}, контексты и прикрепление фото настроены.`);
    if (dshState === 'fresh') {
      console.log(`   Установлен. Откройте ${C.b}новый терминал${C.r} и запустите: ${C.g}dsh web${C.r} → http://127.0.0.1:3080`);
    } else if (dshState === 'no') {
      console.log(`   Конфиг записан. Установите DSH: ${C.g}npm install -g @deepseek-ai/dsh${C.r}, затем ${C.g}dsh web${C.r}.`);
    } else if (!(await maybeLaunchDsh())) {
      console.log(`   Если dsh web уже был открыт — остановите его (Ctrl+C) и запустите заново: ${C.g}dsh web${C.r}`);
      console.log('   затем обновите страницу браузера (http://127.0.0.1:3080).');
    }
  }
  const lm = await liveModels(key);
  if (lm) console.log(`\n   Доступные модели на ключе (${lm.length}): ${C.g}${lm.map((m) => m[0]).join(', ')}${C.r}`);
  console.log(C.d + '   Откат: файлы сохранены с суффиксом .bak-funpay-setup' + C.r + '\n');
  process.exit(0);
})().catch((e) => {
  console.error(C.er + ' Сбой: ' + (e && e.message ? e.message : e) + C.r);
  process.exit(1);
  process.exit(1);
});
