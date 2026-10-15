(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined') module.exports = api;
  else root.MaiCalendar = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];
  const SKINS = {
    paper: {name: '奶油纸笺', background: '#FFFCF5', wash: '#F6E7B5', ink: '#51362B', muted: '#967E6C', accent: '#E87968', hero: 'fries'},
    picnic: {name: '野餐格纹', background: '#FFFEF8', wash: '#FFF0CC', ink: '#51362B', muted: '#967E6C', accent: '#E87968', hero: 'bag'},
    sunshine: {name: '奶黄晴天', background: '#FFF7DE', wash: '#FFE9A5', ink: '#51362B', muted: '#967E6C', accent: '#E87968', hero: 'cup'}
  };
  // Rules prefer specific product names over broad categories at the same position.
  const PRODUCTS = [
    ['复古棒球帽', 'gift'], ['早餐两件套', 'burger'], ['联名棒球帽', 'gift'], ['联名徽章', 'gift'],
    ['蓝莓爆爆珠麦旋风', 'icecream'], ['龙焰芝士棒鸡腿堡', 'chicken'], ['龙焰鸡腿堡', 'chicken'],
    ['韩式辣椒黄油风味酱', 'chicken'], ['韩式烟熏芝士风味酱', 'chicken'], ['韩式风味蘸酱', 'chicken'],
    ['鸡薯双全盒', 'fries'], ['姜汁撞奶风味派', 'pie'], ['奶香大米派', 'pie'], ['厚松饼堡', 'burger'],
    ['麦辣鸡腿汉堡', 'chicken'], ['麦乐鸡', 'chicken'], ['麦麦脆汁鸡', 'chicken'], ['板烧鸡腿堡', 'chicken'],
    ['巨无霸', 'burger'], ['双层吉士汉堡', 'burger'], ['麦香鱼', 'burger'], ['麦香鸡', 'chicken'],
    ['灰焰圆筒', 'icecream'], ['麦旋风', 'icecream'], ['甜筒', 'icecream'], ['圆筒', 'icecream'],
    ['心形薯饼', 'fries'], ['薯条', 'fries'], ['炸鸡', 'chicken'], ['鸡腿堡', 'chicken'],
    ['鲜萃咖啡', 'cup'], ['浓浓黑巧', 'cup'], ['拿铁', 'cup'], ['美式', 'cup'], ['咖啡', 'cup'], ['汉堡', 'burger']
  ];
  const MARKS = {fries: '🍟', icecream: '🍦', chicken: '🍗', cup: '🥤', burger: '🍔', pie: '🥧', gift: '🎁', cake: '🍰', moon: '🌕', lantern: '🏮', leaf: '🍃', flower: '🌼', flag: '🇨🇳'};
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const [y, m, d] = value.split('-').map(Number), t = new Date(Date.UTC(y, m - 1, d));
    return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
  }
  function chinaDate(date) {
    return new Date((date || new Date()).getTime() + 8 * 3600000).toISOString().slice(0, 10);
  }
  function dateParts(key) {
    if (!validDate(key)) throw new Error('无效日期');
    const [year, month, day] = key.split('-').map(Number);
    const weekday = (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
    return {year, month, day, weekday};
  }
  function monthGrid(key) {
    const {year, month} = dateParts(key), first = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
    const length = new Date(Date.UTC(year, month, 0)).getUTCDate(), cells = [];
    for (let i = 0; i < Math.ceil((first + length) / 7) * 7; i++) {
      const n = i - first + 1;
      cells.push(n >= 1 && n <= length ? `${year}-${String(month).padStart(2, '0')}-${String(n).padStart(2, '0')}` : null);
    }
    return cells;
  }
  function weekGrid(key) {
    const p = dateParts(key), start = Date.UTC(p.year, p.month - 1, p.day - p.weekday);
    return Array.from({length: 7}, (_, i) => new Date(start + i * 86400000).toISOString().slice(0, 10));
  }
  function cleanText(text) {
    return String(text || '').normalize('NFKC').replace(/<[^>]*>/g, '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function firstMatch(text) {
    const matches = PRODUCTS.map(([name, icon]) => ({name, icon, at: text.indexOf(name)})).filter(p => p.at >= 0);
    matches.sort((a, b) => a.at - b.at || b.name.length - a.name.length);
    return matches[0] || null;
  }
  function eventProduct(event) {
    const article = event.articleDto || {}, title = cleanText(article.title || event.activityTitle);
    const content = cleanText(article.content || event.activitySubTitle);
    // Editorial headline has precedence, followed by body; promotional highlights are not authoritative.
    const found = firstMatch(title) || firstMatch(content);
    if (!found) return null;
    return {name: found.name, icon: found.icon, activityId: String(event.activityCode || event.resourceId || ''), sourceTitle: title};
  }
  function unwrap(response) {
    const result = response && response.result ? response.result : response;
    if (!result || result.isError) throw new Error('MCP 查询失败');
    if (result.structuredContent) return result.structuredContent;
    if (result.data && Array.isArray(result.data.dailyList)) return result;
    for (const c of result.content || []) {
      if (c.type !== 'text') continue;
      try { const obj = JSON.parse(c.text); if (obj.data) return obj; } catch (_) { /* try other blocks */ }
      const marker = c.text.indexOf('## Original Response');
      if (marker >= 0) {
        const body = c.text.slice(marker + 20), begin = body.indexOf('{');
        if (begin >= 0) { try { return JSON.parse(body.slice(begin)); } catch (_) { /* fail closed */ } }
      }
    }
    throw new Error('活动日历响应缺少结构化日期数据');
  }
  function normalize(response) {
    const payload = unwrap(response);
    if (payload.success !== true || payload.code !== 200 || !payload.data || !Array.isArray(payload.data.dailyList)) throw new Error('活动日历业务查询失败');
    const byDate = {};
    for (const entry of payload.data.dailyList) {
      if (!validDate(entry.date)) continue;
      // Repeated dates merge in official order. Same activityCode is considered once per day.
      const existing = byDate[entry.date] || {product: null, seen: new Set()};
      for (const e of Array.isArray(entry.events) ? entry.events : []) {
        const id = e.activityCode || e.resourceId;
        if (id && existing.seen.has(id)) continue;
        if (id) existing.seen.add(id);
        if (!existing.product) existing.product = eventProduct(e);
      }
      byDate[entry.date] = existing;
    }
    const days = {};
    for (const key of Object.keys(byDate).sort()) {
      const product = byDate[key].product;
      if (product) days[key] = {product: product.name, icon: product.icon};
    }
    return {schemaVersion: 1, fetchedAt: new Date().toISOString(), sourceTime: payload.data.currentTime || payload.datetime || '', source: 'mcd-mcp', days};
  }
  function shortText(value, max) {
    const chars = Array.from(value || '');
    return chars.length <= max ? chars.join('') : chars.slice(0, max - 1).join('') + '…';
  }
  function birthdayValid(value) {
    if (!/^\d{2}-\d{2}$/.test(value || '')) return false;
    return validDate('2000-' + value);
  }
  function chooseTheme(key, settings, holidays) {
    const s = settings || {}, skin = SKINS[s.skin] ? s.skin : 'picnic';
    if (s.autoTheme === false) return {skin, special: null, hero: SKINS[skin].hero, greeting: null};
    // Leap-day birthdays are celebrated only on February 29, never silently changed.
    if (birthdayValid(s.birthday) && key.slice(5) === s.birthday) return {skin, special: 'birthday', hero: 'birthday', greeting: '祝你生日快乐！', icon: 'cake'};
    const holiday = (holidays || {})[key];
    if (holiday) return {skin, special: holiday.id, hero: holiday.hero || SKINS[skin].hero, greeting: holiday.greeting, icon: holiday.icon};
    return {skin, special: null, hero: SKINS[skin].hero, greeting: null};
  }
  function model(key, snapshot, settings, holidays, stale) {
    const date = dateParts(key), theme = chooseTheme(key, settings, holidays);
    const days = snapshot && snapshot.days || {}, entry = days[key];
    const subtitle = stale ? '资讯待更新' : entry ? `今日 · ${entry.product}` : '';
    return {dateKey: key, date, theme, colors: SKINS[theme.skin], days, weekday: WEEKDAYS[date.weekday],
      summary: theme.greeting || subtitle, summarySmall: theme.greeting || shortText(subtitle, 13),
      todayIcon: theme.icon || (entry && entry.icon) || null, stale: !!stale, sourceTime: snapshot && snapshot.sourceTime || '',
      month: monthGrid(key), week: weekGrid(key)};
  }
  function parseRPC(raw, id) {
    if (!String(raw).trim()) return null;
    const parse = text => { try { return JSON.parse(text); } catch (_) { return null; } };
    const json = parse(raw);
    if (json && (id === undefined || json.id === id)) return json;
    for (const block of String(raw).replace(/\r\n/g, '\n').split('\n\n')) {
      const str = block.split('\n').filter(l => l.startsWith('data:')).map(l => l.slice(5).trim()).join('\n');
      const obj = parse(str);
      if (obj && (id === undefined || obj.id === id)) return obj;
    }
    throw new Error('MCP 响应格式无法识别');
  }
  function cacheFresh(snapshot, now) {
    if (!snapshot || snapshot.source !== 'mcd-mcp') return false;
    const time = Date.parse(snapshot.fetchedAt), age = now.getTime() - time;
    return Number.isFinite(time) && age >= 0 && age < 6 * 3600000 && chinaDate(new Date(time)) === chinaDate(now);
  }
  return {WEEKDAYS, SKINS, MARKS, validDate, chinaDate, dateParts, monthGrid, weekGrid, cleanText, eventProduct, normalize, model, chooseTheme, birthdayValid, shortText, parseRPC, cacheFresh};
});
