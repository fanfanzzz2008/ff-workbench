/* ============ FF 工作台 - 主逻辑 v2 ============ */

/* ---------- 工具函数 ---------- */
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const save = (k, v) => localStorage.setItem('ff_' + k, JSON.stringify(v));
const load = k => { try { return JSON.parse(localStorage.getItem('ff_' + k)) || null } catch(e){ return null } };
const todayStr = () => new Date().toLocaleDateString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',weekday:'long'});

/* ---------- 侧边栏切换 ---------- */
const moduleMap = {
  life: { title:'生活日常', desc:'记录每日待办事项与灵感想法' },
  tea:  { title:'饮茶日常', desc:'查询茶叶泡制方法与品饮要点' },
  english:{ title:'每日打卡', desc:'坚持每日好习惯' },
  guide:{ title:'攻略制作', desc:'查询与制作旅游/博物馆攻略' },
  today:{ title:'今日速览', desc:'天气 · 一言 · 每日茶知识' }
};
$$('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const m = btn.dataset.module;
    $$('.module').forEach(s => s.classList.remove('active'));
    $('#module-' + m).classList.add('active');
    $('#moduleTitle').textContent = moduleMap[m].title;
  });
});

/* ---------- 顶栏日期 ---------- */
$('#dateDisplay').textContent = '📅 ' + todayStr();

/* ---------- 侧边栏折叠 ---------- */
let sidebarCollapsed = false;
const sidebar = document.querySelector('.sidebar');
const overlay = $('#sidebarOverlay');

function openSidebar(){
  sidebar.classList.remove('collapsed');
  overlay.classList.add('show');
  sidebarCollapsed = false;
}
function closeSidebar(){
  sidebar.classList.add('collapsed');
  overlay.classList.remove('show');
  sidebarCollapsed = true;
}

$('#sidebarToggle').addEventListener('click', () => {
  if(sidebarCollapsed) openSidebar();
  else closeSidebar();
});
overlay.addEventListener('click', closeSidebar);

// 点击导航项后自动收起（移动端体验）
$$('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    // 保留原切换逻辑
    if(window.innerWidth < 768) closeSidebar();
  });
});

/* ---------- 每日一句（一言 API） ---------- */
const fallbackQuotes = [
  '把每一天都当作新的开始。',
  '日拱一卒，功不唐捐。',
  '一口茶，一段时光，慢即是快。',
  '坚持，是平凡人非凡的秘诀。',
  '行万里路，读万卷书。',
  '今天的努力，是明天的底气。',
  '小步快跑，持续迭代。'
];

async function fetchHitokoto(){
  try {
    const resp = await fetch('https://v1.hitokoto.cn/');
    if(!resp.ok) throw new Error('fetch failed');
    const data = await resp.json();
    const hitokoto = data.hitokoto;
    const from = data.from || '';
    const fromWho = data.from_who || '';
    let source = '';
    if(fromWho && from) source = '—— ' + from + ' · ' + fromWho;
    else if(from) source = '—— ' + from;
    else if(fromWho) source = '—— ' + fromWho;

    $('#dailyQuote').textContent = hitokoto;
    const srcEl = $('#dailySource');
    if(srcEl) srcEl.textContent = source;

    // 缓存到 localStorage，同一天不重复请求
    save('quoteCache', { text: hitokoto, source, date: new Date().toLocaleDateString('zh-CN') });
  } catch(e){
    // 尝试用缓存
    const cached = load('quoteCache');
    if(cached && cached.date === new Date().toLocaleDateString('zh-CN')){
      $('#dailyQuote').textContent = cached.text;
      const srcEl = $('#dailySource');
      if(srcEl) srcEl.textContent = cached.source || '';
    } else {
      // 回退到本地
      $('#dailyQuote').textContent = fallbackQuotes[new Date().getDate() % fallbackQuotes.length];
    }
  }
}

// 检查缓存，有的话先显示缓存内容
const cachedQuote = load('quoteCache');
if(cachedQuote && cachedQuote.date === new Date().toLocaleDateString('zh-CN')){
  $('#dailyQuote').textContent = cachedQuote.text;
  const srcEl = $('#dailySource');
  if(srcEl) srcEl.textContent = cachedQuote.source || '';
} else {
  $('#dailyQuote').textContent = fallbackQuotes[new Date().getDate() % fallbackQuotes.length];
}
// 异步更新为网络版
fetchHitokoto();

/* ---------- 天气（wttr.in + 自动定位） ---------- */
const weatherCodeMap = {
  '113': { icon:'☀️', text:'晴' },
  '116': { icon:'⛅', text:'多云' },
  '119': { icon:'☁️', text:'阴' },
  '122': { icon:'☁️', text:'阴' },
  '143': { icon:'🌫️', text:'薄雾' },
  '176': { icon:'🌦️', text:'小雨' },
  '179': { icon:'🌧️', text:'小雨夹雪' },
  '182': { icon:'🌫️', text:'雾霾' },
  '185': { icon:'🌫️', text:'雾霾' },
  '200': { icon:'🌫️', text:'薄雾' },
  '227': { icon:'🌨️', text:'小雪' },
  '230': { icon:'❄️', text:'大雪' },
  '248': { icon:'🌫️', text:'雾' },
  '260': { icon:'🌫️', text:'冻雾' },
  '263': { icon:'🌦️', text:'毛毛雨' },
  '266': { icon:'🌦️', text:'小雨' },
  '281': { icon:'🌧️', text:'冻雨' },
  '284': { icon:'🌧️', text:'冻雨' },
  '293': { icon:'🌦️', text:'小雨' },
  '296': { icon:'🌦️', text:'小雨' },
  '299': { icon:'🌧️', text:'中雨' },
  '302': { icon:'🌧️', text:'中雨' },
  '305': { icon:'🌧️', text:'大雨' },
  '308': { icon:'🌧️', text:'大雨' },
  '311': { icon:'🌧️', text:'冻雨' },
  '314': { icon:'🌧️', text:'冻雨' },
  '317': { icon:'🌨️', text:'雨夹雪' },
  '320': { icon:'🌨️', text:'雨夹雪' },
  '323': { icon:'❄️', text:'小雪' },
  '326': { icon:'❄️', text:'小雪' },
  '329': { icon:'❄️', text:'大雪' },
  '332': { icon:'❄️', text:'大雪' },
  '335': { icon:'❄️', text:'暴雪' },
  '338': { icon:'❄️', text:'暴雪' },
  '350': { icon:'🌧️', text:'冻雨' },
  '353': { icon:'🌦️', text:'阵雨' },
  '356': { icon:'🌧️', text:'阵雨' },
  '359': { icon:'🌧️', text:'暴雨' },
  '362': { icon:'🌨️', text:'阵雪' },
  '365': { icon:'🌨️', text:'阵雪' },
  '368': { icon:'🌨️', text:'小雪' },
  '371': { icon:'❄️', text:'大雪' },
  '374': { icon:'🌧️', text:'冻雨夹雪' },
  '377': { icon:'🌨️', text:'冰粒' },
  '386': { icon:'⛈️', text:'雷阵雨' },
  '389': { icon:'⛈️', text:'雷暴' },
  '392': { icon:'⛈️', text:'雷阵雪' },
  '395': { icon:'⛈️', text:'雷暴雪' }
};

async function fetchWeatherByCoords(lat, lon){
  try {
    const url = `https://wttr.in/${lat},${lon}?format=j1`;
    const resp = await fetch(url);
    if(!resp.ok) throw new Error('fetch failed');
    const data = await resp.json();

    const cur = data.current_condition[0];
    const code = cur.weatherCode;
    const w = weatherCodeMap[code] || { icon:'🌈', text: cur.weatherDesc[0].value };

    // 渲染当前天气
    $('#weatherIcon').textContent = w.icon;
    $('#weatherTemp').textContent = cur.temp_C + '°';
    $('#weatherDesc').textContent = w.text + ' · 湿度' + cur.humidity + '%';
    $('#weatherCity').textContent = '📍 ' + lat.toFixed(1) + '°N ' + lon.toFixed(1) + '°E';
    $('#weatherCard').classList.remove('loading');

    // 渲染未来3天预报
    const forecastEl = $('#weatherForecast');
    if(forecastEl && data.weather){
      let html = '';
      for(let i = 0; i < Math.min(3, data.weather.length); i++){
        const dayLabel = i === 0 ? '今天' : i === 1 ? '明天' : '后天';
        const wInfo = weatherCodeMap[data.weather[i].hourly[4].weatherCode] || { icon:'🌈', text:'?' };
        html += `<div class="weather-day">
          <div class="weather-day-date">${dayLabel}</div>
          <div class="weather-day-icon">${wInfo.icon}</div>
          <div class="weather-day-temp">${data.weather[i].maxtempC}° ${data.weather[i].mintempC}°</div>
        </div>`;
      }
      forecastEl.innerHTML = html;
    }

    // 缓存1小时
    save('weatherCache', {
      lat, lon, temp: cur.temp_C, code, desc: w.text, humidity: cur.humidity,
      forecast: data.weather ? data.weather.slice(0,3).map(w => ({max:w.maxtempC,min:w.mintempC,code:w.hourly[4].weatherCode})) : [],
      fetchedAt: Date.now()
    });
  } catch(e){
    showWeatherFallback();
  }
}

function showWeatherFallback(){
  const cached = load('weatherCache');
  if(cached && Date.now() - cached.fetchedAt < 3600000){
    const w = weatherCodeMap[cached.code] || { icon:'🌈', text: cached.desc || '未知' };
    $('#weatherIcon').textContent = w.icon;
    $('#weatherTemp').textContent = cached.temp + '°';
    $('#weatherDesc').textContent = w.text + (cached.humidity ? ' · 湿度' + cached.humidity + '%' : '');
    $('#weatherCity').textContent = '📍 缓存数据';
    $('#weatherCard').classList.remove('loading');

    if(cached.forecast && cached.forecast.length){
      const forecastEl = $('#weatherForecast');
      let html = '';
      cached.forecast.forEach((f, i) => {
        const dayLabel = i === 0 ? '今天' : i === 1 ? '明天' : '后天';
        const wInfo = weatherCodeMap[f.code] || { icon:'🌈', text:'?' };
        html += `<div class="weather-day">
          <div class="weather-day-date">${dayLabel}</div>
          <div class="weather-day-icon">${wInfo.icon}</div>
          <div class="weather-day-temp">${f.max}° ${f.min}°</div>
        </div>`;
      });
      forecastEl.innerHTML = html;
    }
  } else {
    $('#weatherCard').innerHTML = '<div class="weather-error">📍 天气获取失败<br><span style="font-size:10px">请检查网络</span></div>';
  }
}

async function initWeather(){
  const cached = load('weatherCache');
  if(cached && Date.now() - cached.fetchedAt < 3600000){
    showWeatherFallback();
    fetchWeatherByCoords(cached.lat, cached.lon);
    return;
  }

  if(!navigator.geolocation){
    fetchWeatherByCoords(39.9, 116.4);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
    () => fetchWeatherByCoords(39.9, 116.4),
    { timeout: 5000, maximumAge: 600000 }
  );
}

initWeather();


/* ============================================
   数据导出/导入 + 自动备份
============================================ */
function exportAllData(){
  const allData = {};
  for(let i = 0; i < localStorage.length; i++){
    const key = localStorage.key(i);
    if(key.startsWith('ff_') && !key.startsWith('ff_autoBackup_')) allData[key] = JSON.parse(localStorage.getItem(key));
  }
  allData['_exportTime'] = new Date().toISOString();
  const blob = new Blob([JSON.stringify(allData, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'FF-backup-' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  // 记录上次导出时间
  save('lastExportDate', new Date().toLocaleDateString('zh-CN'));
}
function importAllData(file){
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try{
      const data = JSON.parse(ev.target.result);
      const count = Object.keys(data).length;
      if(confirm(`即将导入 ${count} 组数据。\n\n当前数据会被覆盖，确定继续吗？`)){
        Object.entries(data).forEach(([k,v]) => {
          if(k.startsWith('ff_')) localStorage.setItem(k, JSON.stringify(v));
        });
        alert('✅ 数据导入成功！页面将刷新以应用更改。');
        location.reload();
      }
    }catch(err){
      alert('❌ 文件格式错误，请选择有效的 FF 备份文件 (.json)');
    }
  };
  reader.readAsText(file);
}

/* ---------- 自动本地备份（保留最近 7 天） ---------- */
function autoBackup(){
  const allData = {};
  for(let i = 0; i < localStorage.length; i++){
    const key = localStorage.key(i);
    if(key.startsWith('ff_') && !key.startsWith('ff_autoBackup_')) allData[key] = JSON.parse(localStorage.getItem(key));
  }
  const today = new Date().toLocaleDateString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit'});
  // 存今天的数据快照
  localStorage.setItem('ff_autoBackup_' + today, JSON.stringify({
    time: new Date().toISOString(),
    data: allData
  }));
  // 清理 7 天前的自动备份
  const cutoff = Date.now() - 7 * 86400000;
  for(let i = localStorage.length - 1; i >= 0; i--){
    const key = localStorage.key(i);
    if(key && key.startsWith('ff_autoBackup_')){
      try{
        const snap = JSON.parse(localStorage.getItem(key));
        if(new Date(snap.time).getTime() < cutoff) localStorage.removeItem(key);
      }catch(e){ localStorage.removeItem(key); }
    }
  }
}

/* ---------- 备份提醒 ---------- */
function checkBackupReminder(){
  const lastExport = load('lastExportDate');
  const today = new Date().toLocaleDateString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit'});
  if(lastExport === today) return; // 今天已导出过
  
  // 计算距上次导出天数
  const lastReminder = load('lastBackupReminder');
  if(lastReminder === today) return; // 今天已提醒过
  
  let daysSince = 999;
  if(lastExport){
    const last = new Date(lastExport.replace(/\//g,'-'));
    daysSince = Math.floor((Date.now() - last.getTime()) / 86400000);
  }
  
  // 超过 7 天未导出备份，提醒
  if(daysSince >= 7){
    setTimeout(() => {
      if(confirm(`📅 数据安全提醒\n\n您已经 ${daysSince >= 999 ? '很久' : daysSince + ' 天'} 没有导出备份数据了。\n\n建议定期导出备份文件保存到安全位置，防止数据丢失。\n\n现在导出备份吗？`)){
        exportAllData();
      }
      save('lastBackupReminder', today);
    }, 2000);
  }
}

// 侧边栏按钮
$('#exportDataBtn').addEventListener('click', exportAllData);
$('#importDataBtn').addEventListener('click', () => $('#importFileInput').click());
$('#importFileInput').addEventListener('change', e => { importAllData(e.target.files[0]); e.target.value = ''; });

// 恢复自动备份
$('#restoreBackupBtn').addEventListener('click', () => {
  const backups = [];
  for(let i = 0; i < localStorage.length; i++){
    const key = localStorage.key(i);
    if(key && key.startsWith('ff_autoBackup_')){
      try{
        const snap = JSON.parse(localStorage.getItem(key));
        backups.push({ key, time: snap.time, dataKeys: Object.keys(snap.data || {}).length });
      }catch(e){}
    }
  }
  if(backups.length === 0){
    alert('📭 暂无自动备份记录。\n\n自动备份会在每次打开应用时创建，保留最近 7 天。');
    return;
  }
  backups.sort((a,b) => new Date(b.time) - new Date(a.time));
  const list = backups.map((b,i) => {
    const d = new Date(b.time);
    return `${i+1}. ${d.toLocaleDateString('zh-CN')} ${d.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})} (${b.dataKeys} 组数据)`;
  }).join('\n');
  const choice = prompt(`🔄 恢复自动备份\n\n可用备份（最近 ${backups.length} 条）：\n\n${list}\n\n输入序号选择要恢复的备份（1 为最新）：`, '1');
  if(!choice) return;
  const idx = parseInt(choice) - 1;
  if(isNaN(idx) || idx < 0 || idx >= backups.length){
    alert('❌ 无效的序号');
    return;
  }
  const snap = JSON.parse(localStorage.getItem(backups[idx].key));
  if(confirm(`确定恢复 ${new Date(snap.time).toLocaleString('zh-CN')} 的备份吗？\n\n当前数据会被覆盖！`)){
    Object.entries(snap.data).forEach(([k,v]) => {
      if(k.startsWith('ff_')) localStorage.setItem(k, JSON.stringify(v));
    });
    alert('✅ 备份恢复成功！页面将刷新。');
    location.reload();
  }
});

// 页面加载时自动备份 + 检查提醒
autoBackup();
checkBackupReminder();


/* ============================================
   模块一：生活日常 - 待办 + 灵感
============================================ */
// 子Tab切换
$$('.life-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    $$('.life-tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    $$('.life-panel').forEach(p=>p.classList.remove('active'));
    $('#panel-' + tab.dataset.sub).classList.add('active');
  });
});

// --- 待办事项 ---
let todos = load('todos') || [];
let currentFilter = 'all';

function renderTodos(){
  const list = $('#todoList');
  let filtered = todos;
  if(currentFilter === 'pending') filtered = todos.filter(t=>!t.done);
  else if(currentFilter === 'done') filtered = todos.filter(t=>t.done);
  else if(currentFilter === 'high') filtered = todos.filter(t=>t.priority==='high');

  list.innerHTML = '';
  // 按日期分组
  const groups = {};
  filtered.forEach(t => {
    const d = t.date || '未标注日期';
    if(!groups[d]) groups[d] = [];
    groups[d].push(t);
  });

  Object.keys(groups).sort((a,b) => b.localeCompare(a)).forEach(date => {
    // 日期标题
    const header = document.createElement('div');
    header.className = 'todo-date-header';
    const isToday = date === new Date().toLocaleDateString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit'});
    const dayLabel = isToday ? '📅 今天' : '📅 ' + date;
    header.textContent = dayLabel;
    list.appendChild(header);

    // 同一天内按 id（时间戳）倒序，最新的在前
    groups[date].sort((a,b) => b.id - a.id).forEach(t => {
      const item = document.createElement('div');
      item.className = 'todo-item' + (t.done ? ' done' : '');
      item.innerHTML = `
        <div class="todo-check ${t.done?'done':''}" data-id="${t.id}"></div>
        <div class="todo-content">${escapeHtml(t.content)}</div>
        <span class="todo-priority ${t.priority}">${t.priority==='high'?'🔥 高':t.priority==='mid'?'⭐ 中':'🌱 低'}</span>
        <span class="todo-time">${t.time}</span>
        <button class="todo-delete" data-id="${t.id}">✕</button>
      `;
      list.appendChild(item);
    });
  });

  $('#todoEmpty').style.display = filtered.length ? 'none' : 'block';
  const total = todos.length, done = todos.filter(t=>t.done).length;
  const rate = total ? Math.round(done/total*100) : 0;
  $('#statTotal').textContent = total;
  $('#statDone').textContent = done;
  $('#statPending').textContent = total - done;
  $('#statRate').textContent = rate + '%';
  // 进度条
  const bar = $('#todoProgress');
  if(bar){
    bar.style.width = rate + '%';
    $('#todoProgressText').textContent = done + '/' + total + ' 已完成 (' + rate + '%)';
    $('#todoProgressWrap').style.display = total ? 'block' : 'none';
  }
}

function addTodo(){
  const input = $('#todoInput');
  const content = input.value.trim();
  if(!content) return;
  const priority = $('#todoPriority').value;
  todos.unshift({
    id: Date.now(),
    content, priority, done:false,
    time: new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}),
    date: new Date().toLocaleDateString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit'})
  });
  save('todos', todos);
  input.value = '';
  renderTodos();
}

$('#addTodoBtn').addEventListener('click', addTodo);
$('#todoInput').addEventListener('keydown', e => { if(e.key==='Enter') addTodo(); });

$('#todoList').addEventListener('click', e => {
  const id = Number(e.target.dataset.id);
  if(e.target.classList.contains('todo-check')){
    const t = todos.find(x=>x.id===id); if(t){ t.done=!t.done; save('todos',todos); renderTodos(); }
  } else if(e.target.classList.contains('todo-delete')){
    todos = todos.filter(x=>x.id!==id); save('todos',todos); renderTodos();
  }
});

$$('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTodos();
  });
});

$('#clearDoneBtn').addEventListener('click', () => {
  todos = todos.filter(t=>!t.done); save('todos',todos); renderTodos();
});

renderTodos();

// --- 每日灵感 ---
let inspires = load('inspires') || [];
let pendingImages = []; // 待上传的图片（base64）

function renderInspires(){
  const list = $('#inspireList');
  list.innerHTML = '';
  inspires.forEach(ins => {
    const item = document.createElement('div');
    item.className = 'inspire-item';
    const imgHtml = (ins.images && ins.images.length)
      ? `<div class="inspire-item-images">${ins.images.map((src,i)=>
          `<div class="inspire-item-img" data-src="${src}"><img src="${src}" alt="灵感图片"></div>`
        ).join('')}</div>`
      : '';
    item.innerHTML = `
      <div class="inspire-item-header">
        <span class="inspire-item-date">${ins.date}${(ins.images&&ins.images.length)?' · 📷 '+ins.images.length+'张':''}</span>
        <div class="inspire-item-actions">
          <button class="inspire-item-edit" data-id="${ins.id}" title="编辑">✏️</button>
          <button class="inspire-item-del" data-id="${ins.id}" title="删除">✕</button>
        </div>
      </div>
      <div class="inspire-item-body">${escapeHtml(ins.content)}</div>
      ${imgHtml}
    `;
    list.appendChild(item);
  });
  $('#inspireEmpty').style.display = inspires.length ? 'none' : 'block';
}

function renderPendingImages(){
  const box = $('#inspireImgPreview');
  box.innerHTML = '';
  pendingImages.forEach((src, i) => {
    const thumb = document.createElement('div');
    thumb.className = 'inspire-img-thumb';
    thumb.innerHTML = `<img src="${src}"><button class="thumb-del" data-i="${i}">✕</button>`;
    box.appendChild(thumb);
  });
  $('#inspireImgTip').textContent = pendingImages.length ? `已选 ${pendingImages.length}/9 张` : '可选，最多9张';
}

// 图片选择
$('#inspireImgInput').addEventListener('change', e => {
  const files = Array.from(e.target.files);
  const remain = 9 - pendingImages.length;
  if(remain <= 0){ alert('最多只能添加9张图片'); e.target.value=''; return; }
  const toRead = files.slice(0, remain);
  if(files.length > remain) alert(`最多9张，已添加前 ${remain} 张`);
  let loaded = 0;
  toRead.forEach(file => {
    if(!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = ev => {
      // 压缩到合理大小（最大宽度800px）
      compressImage(ev.target.result, 800, 0.7, compressed => {
        pendingImages.push(compressed);
        loaded++;
        if(loaded === toRead.length){ renderPendingImages(); }
      });
    };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
});

// 图片压缩
function compressImage(dataUrl, maxWidth, quality, callback){
  const img = new Image();
  img.onload = () => {
    if(img.width <= maxWidth){ callback(dataUrl); return; }
    const scale = maxWidth / img.width;
    const canvas = document.createElement('canvas');
    canvas.width = maxWidth;
    canvas.height = img.height * scale;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    callback(canvas.toDataURL('image/jpeg', quality));
  };
  img.onerror = () => callback(dataUrl);
  img.src = dataUrl;
}

// 删除待上传图片
$('#inspireImgPreview').addEventListener('click', e => {
  if(e.target.classList.contains('thumb-del')){
    pendingImages.splice(Number(e.target.dataset.i), 1);
    renderPendingImages();
  }
});

function addInspire(){
  const input = $('#inspireInput');
  const content = input.value.trim();
  if(!content && !pendingImages.length) return;
  inspires.unshift({
    id: Date.now(),
    content: content || '（图片记录）',
    images: [...pendingImages],
    date: new Date().toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})
  });
  save('inspires', inspires);
  input.value = '';
  pendingImages = [];
  renderPendingImages();
  renderInspires();
}
$('#addInspireBtn').addEventListener('click', addInspire);

// 点击放大图片
$('#inspireList').addEventListener('click', e => {
  if(e.target.closest('.inspire-item-img')){
    const src = e.target.closest('.inspire-item-img').dataset.src;
    showImageModal(src);
  }
});
function showImageModal(src){
  const modal = document.createElement('div');
  modal.className = 'img-modal';
  modal.innerHTML = `<button class="img-modal-close">✕</button><div class="img-modal-stage"><img src="${src}"></div>`;
  
  const stage = modal.querySelector('.img-modal-stage');
  const img = stage.querySelector('img');
  let scale = 1, tx = 0, ty = 0;
  let dragging = false, lastX = 0, lastY = 0;
  let pinchStartDist = 0, pinchStartScale = 1;
  
  function apply(){
    img.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`;
  }
  
  // 滚轮缩放
  stage.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = stage.getBoundingClientRect();
    const cx = e.clientX - rect.left - rect.width/2;
    const cy = e.clientY - rect.top - rect.height/2;
    const oldScale = scale;
    scale = Math.min(5, Math.max(0.5, scale - e.deltaY * 0.002));
    tx = cx - (cx - tx) * scale / oldScale;
    ty = cy - (cy - ty) * scale / oldScale;
    apply();
  }, {passive: false});
  
  // 鼠标拖拽
  stage.addEventListener('mousedown', e => {
    if(e.target === stage || e.target === img){
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      stage.style.cursor = 'grabbing';
      e.preventDefault();
    }
  });
  window.addEventListener('mousemove', e => {
    if(!dragging) return;
    tx += e.clientX - lastX; ty += e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    apply();
  });
  window.addEventListener('mouseup', () => {
    dragging = false; stage.style.cursor = scale > 1 ? 'grab' : 'default';
  });
  
  // 触摸：双指缩放 + 单指拖拽
  stage.addEventListener('touchstart', e => {
    if(e.touches.length === 2){
      pinchStartDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartScale = scale;
      dragging = false;
    } else if(e.touches.length === 1){
      dragging = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
    }
  }, {passive: false});
  
  stage.addEventListener('touchmove', e => {
    e.preventDefault();
    if(e.touches.length === 2){
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      scale = Math.min(5, Math.max(0.5, pinchStartScale * dist / pinchStartDist));
      apply();
    } else if(e.touches.length === 1 && dragging){
      tx += e.touches[0].clientX - lastX;
      ty += e.touches[0].clientY - lastY;
      lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
      apply();
    }
  }, {passive: false});
  
  stage.addEventListener('touchend', () => { dragging = false; });
  
  // 双击切换 1x / fit
  stage.addEventListener('dblclick', () => {
    if(scale > 1.01){ scale = 1; tx = 0; ty = 0; }
    else { scale = 2; tx = 0; ty = 0; }
    apply();
    stage.style.cursor = scale > 1 ? 'grab' : 'default';
  });
  
  // 关闭：点击背景或关闭按钮
  modal.addEventListener('click', e => {
    if(e.target === modal || e.target.classList.contains('img-modal-close')){
      modal.remove();
    }
  });
  
  // ESC 关闭
  const escHandler = e => { if(e.key==='Escape'){ modal.remove(); document.removeEventListener('keydown', escHandler); } };
  document.addEventListener('keydown', escHandler);
  
  document.body.appendChild(modal);
}

$('#inspireList').addEventListener('click', e => {
  if(e.target.classList.contains('inspire-item-del')){
    inspires = inspires.filter(x=>x.id!==Number(e.target.dataset.id));
    save('inspires', inspires);
    renderInspires();
  } else if(e.target.classList.contains('inspire-item-edit')){
    const id = Number(e.target.dataset.id);
    const ins = inspires.find(x=>x.id===id);
    if(!ins) return;
    showEditInspireModal(ins);
  }
});

function showEditInspireModal(ins){
  const modal = document.createElement('div');
  modal.className = 'img-modal';
  modal.style.alignItems = 'flex-start';
  modal.style.paddingTop = '60px';
  modal.innerHTML = `
    <div class="inspire-edit-modal">
      <div class="inspire-edit-header">
        <span>✏️ 编辑灵感</span>
        <button class="img-modal-close">✕</button>
      </div>
      <textarea class="inspire-edit-textarea" id="editInspireInput">${escapeHtml(ins.content)}</textarea>
      <div class="inspire-edit-images" id="editInspireImages"></div>
      <div class="inspire-edit-actions">
        <button class="btn-secondary" id="editInspireCancel">取消</button>
        <button class="btn-primary" id="editInspireSave">💾 保存</button>
      </div>
    </div>
  `;
  modal.addEventListener('click', e => {
    if(e.target === modal || e.target.classList.contains('img-modal-close')) modal.remove();
  });
  document.body.appendChild(modal);

  // 渲染已有图片（可删除）
  const imgBox = modal.querySelector('#editInspireImages');
  let editImages = [...(ins.images || [])];
  function renderEditImages(){
    imgBox.innerHTML = '';
    editImages.forEach((src, i) => {
      const thumb = document.createElement('div');
      thumb.className = 'inspire-img-thumb';
      thumb.innerHTML = `<img src="${src}"><button class="thumb-del" data-i="${i}">✕</button>`;
      imgBox.appendChild(thumb);
    });
  }
  renderEditImages();
  imgBox.addEventListener('click', e => {
    if(e.target.classList.contains('thumb-del')){
      editImages.splice(Number(e.target.dataset.i), 1);
      renderEditImages();
    }
  });

  modal.querySelector('#editInspireCancel').addEventListener('click', () => modal.remove());
  modal.querySelector('#editInspireSave').addEventListener('click', () => {
    const newContent = modal.querySelector('#editInspireInput').value.trim();
    ins.content = newContent || '（图片记录）';
    ins.images = editImages;
    save('inspires', inspires);
    renderInspires();
    modal.remove();
  });
}
renderInspires();


/* ============================================
   模块二：饮茶日常 - 茶叶库 + 紫砂壶 + 每日知识
============================================ */
const teaDB = [
  {
    name:'西湖龙井', cat:'绿茶 · 不发酵', emoji:'🌿', tags:['绿茶','龙井','杭州'],
    params:{ 水温:'80-85℃', 茶水比:'1:50', 泡制时间:'2-3分钟', 茶具:'玻璃杯首选' },
    intro:'西湖龙井产于浙江杭州西湖山区，是中国十大名茶之首。以"色绿、香郁、味甘、形美"四绝著称，叶片扁平挺直，色泽嫩绿。',
    steps:[
      '温杯：用热水烫洗玻璃杯，提升杯温并清洁',
      '投茶：取3g茶叶投入杯中',
      '润茶：注入少量80℃热水，轻摇使茶叶浸润',
      '冲泡：沿杯壁缓缓注入热水至七分满',
      '品饮：静置2-3分钟，待茶叶舒展后品饮'
    ],
    taste:'香气清幽带豆香/栗香，滋味鲜爽甘甜，回甘明显。前三泡风味最佳。',
    // 从用户已有壶中推荐
    potRecommend: [
      { pot:'瓷壶', reason:'绿茶最怕闷熟，瓷壶不吸味、不闷茶，能展现龙井鲜爽本味。是四把壶里唯一适合绿茶的。', priority:'⭐ 首选' },
      { pot:'玻璃杯', reason:'可观赏茶叶舒展，但若手头没有，瓷壶是最佳替代。', priority:'备选' }
    ],
    notRecommend: '朱泥/紫泥/柴烧朱泥透气性过强或易闷茶，会损失绿茶鲜爽度，不推荐。'
  },
  {
    name:'碧螺春', cat:'绿茶 · 不发酵', emoji:'🌿', tags:['绿茶','江苏','洞庭'],
    params:{ 水温:'75-80℃', 茶水比:'1:60', 泡制时间:'2分钟', 茶具:'玻璃杯首选' },
    intro:'产于江苏苏州太湖洞庭山，条索紧结卷曲如螺，满披白毫。以"形美、色艳、香浓、味醇"闻名。',
    steps:[
      '温杯后投茶2-3g',
      '注入75℃热水至三分满润茶',
      '轻轻摇动杯身使茶叶舒展',
      '再次注水至七分满',
      '约2分钟后品饮，可冲泡3次'
    ],
    taste:'花果香馥郁，滋味鲜爽柔和，回甘悠长。',
    potRecommend: [
      { pot:'瓷壶', reason:'白毫银针类细嫩绿茶需低温不闷，瓷壶导热快、不吸香，能保住花果香。', priority:'⭐ 首选' }
    ],
    notRecommend: '紫砂类壶（朱泥/紫泥/柴烧朱泥）会吸附花香且易闷茶，不推荐用于碧螺春。'
  },
  {
    name:'正山小种', cat:'红茶 · 全发酵', emoji:'🍂', tags:['红茶','武夷山','松烟香'],
    params:{ 水温:'90-95℃', 茶水比:'1:40', 泡制时间:'3-5分钟', 茶具:'紫泥壶/瓷壶' },
    intro:'产于福建武夷山桐木关，是世界红茶鼻祖。传统工艺以松柴熏制，带有独特的松烟香和桂圆汤味。',
    steps:[
      '温壶后投茶5g',
      '注入95℃热水快速洗茶（5秒倒出）',
      '第一泡注水后静置30秒出汤',
      '后续每泡延长10-15秒',
      '可冲泡8-10泡'
    ],
    taste:'松烟香明显，汤色红艳，滋味醇厚甘甜，带桂圆干香。',
    potRecommend: [
      { pot:'紫泥壶', reason:'紫泥透气性好，能柔化松烟香、让桂圆汤感更醇厚，是正山小种的最佳搭档。', priority:'⭐ 首选' },
      { pot:'柴烧朱泥', reason:'柴烧壶经柴窑烧制，胎质有独特气孔，能让茶汤更顺滑，松烟香更内敛。', priority:'⭐ 次选' },
      { pot:'瓷壶', reason:'想突出松烟香的原始风格时可用瓷壶，不吸味、还原度高。', priority:'备选' }
    ],
    notRecommend: '朱泥壶聚香过强，会让松烟香显得冲，不如紫泥柔和。'
  },
  {
    name:'祁门红茶', cat:'红茶 · 全发酵', emoji:'🍂', tags:['红茶','安徽','祁红'],
    params:{ 水温:'90-95℃', 茶水比:'1:50', 泡制时间:'3分钟', 茶具:'朱泥壶/瓷壶' },
    intro:'产于安徽祁门，与印度大吉岭、斯里兰卡乌瓦并称世界三大高香红茶。独特的"祁门香"似花似果似蜜。',
    steps:[
      '温壶后投茶3-5g',
      '注入95℃热水洗茶5秒',
      '第一泡静置30秒出汤',
      '逐泡延长10秒',
      '可冲泡6-8泡'
    ],
    taste:'香气高长带蜜糖香与兰花香，滋味醇厚回甘。',
    potRecommend: [
      { pot:'朱泥壶', reason:'祁红以"祁门香"著称，朱泥聚香效果极佳，能放大花果蜜香，是祁红绝配。', priority:'⭐ 首选' },
      { pot:'柴烧朱泥', reason:'同样聚香，柴烧质感让茶汤更柔顺，适合喜欢温和口感的茶友。', priority:'⭐ 次选' },
      { pot:'瓷壶', reason:'想品鉴祁红原始香气层次时用瓷壶，不干扰茶味。', priority:'备选' }
    ],
    notRecommend: '紫泥透气性强，会散掉一部分祁门香，不如朱泥聚香。'
  },
  {
    name:'铁观音', cat:'乌龙茶 · 半发酵', emoji:'🍃', tags:['乌龙','安溪','兰花香'],
    params:{ 水温:'95-100℃', 茶水比:'1:20', 泡制时间:'30秒起', 茶具:'朱泥壶/盖碗' },
    intro:'产于福建安溪，属半发酵乌龙茶。以"七泡有余香"著称，香气清高持久，有"观音韵"。',
    steps:[
      '温盖碗后投茶7-8g（盖碗容量120ml）',
      '100℃热水高冲洗茶，立即倒出',
      '第一泡注水后10秒出汤',
      '第二泡15秒，逐泡延长5秒',
      '优质铁观音可冲泡7-10泡'
    ],
    taste:'兰花香清幽持久，滋味醇厚甘鲜，回甘悠长，带独特"音韵"。',
    potRecommend: [
      { pot:'朱泥壶', reason:'铁观音核心是"高香"，朱泥聚香第一，能把兰花香和音韵集中呈现，公认铁观音的最佳壶。', priority:'⭐ 首选' },
      { pot:'柴烧朱泥', reason:'聚香同时增加汤感厚度，适合清香型兼浓香型铁观音。', priority:'⭐ 次选' },
      { pot:'瓷壶', reason:'试茶或想品鉴茶叶本味时用瓷壶，不吸香、还原度高。', priority:'备选' }
    ],
    notRecommend: '紫泥透气性会让铁观音香气散失过快，音韵出不来。'
  },
  {
    name:'大红袍', cat:'乌龙茶 · 半发酵', emoji:'🍃', tags:['乌龙','武夷岩茶','岩韵'],
    params:{ 水温:'95-100℃', 茶水比:'1:20', 泡制时间:'20秒起', 茶具:'紫泥壶/柴烧朱泥' },
    intro:'武夷岩茶之王，产于福建武夷山九龙窠。以"岩骨花香"的岩韵著称，是乌龙茶中的珍品。',
    steps:[
      '温壶后投茶8g',
      '100℃热水高冲洗茶5秒倒出',
      '第一泡注水后15秒出汤',
      '逐泡延长5-10秒',
      '可冲泡8-12泡'
    ],
    taste:'岩韵明显，带焙火香与花果香，滋味醇厚回甘，汤色橙红明亮。',
    potRecommend: [
      { pot:'紫泥壶', reason:'岩茶焙火重，紫泥透气性好，能柔化焙火气、突出岩骨花香，是大红袍经典搭配。', priority:'⭐ 首选' },
      { pot:'柴烧朱泥', reason:'柴烧壶能增加汤感醇厚度，让岩韵更立体，适合喜欢厚重口感的人。', priority:'⭐ 次选' },
      { pot:'朱泥壶', reason:'聚香好，但会让焙火香略显尖锐，适合轻焙火大红袍。', priority:'备选' }
    ],
    notRecommend: '瓷壶泡岩茶会显得单薄，岩韵出不来。'
  },
  {
    name:'普洱熟茶', cat:'黑茶 · 后发酵', emoji:'🟤', tags:['普洱','熟茶','云南'],
    params:{ 水温:'95-100℃', 茶水比:'1:15', 泡制时间:'15秒起', 茶具:'紫泥壶首选' },
    intro:'产于云南，经渥堆发酵工艺制成。茶性温和，汤色红浓明亮，有越陈越香的特点，适合日常饮用。',
    steps:[
      '温壶后投茶8g（可撬成小块）',
      '100℃热水洗茶两次（每次5秒）',
      '第一泡注水后立即出汤',
      '第二泡15秒，逐泡延长5秒',
      '可冲泡10-15泡'
    ],
    taste:'陈香明显，汤感醇厚顺滑，带糯香或枣香，回甘甘甜。',
    potRecommend: [
      { pot:'紫泥壶', reason:'普洱熟茶需高温闷泡，紫泥保温性最好、透气性佳，能让陈香充分释放，是普洱的"官配"。', priority:'⭐ 首选' },
      { pot:'柴烧朱泥', reason:'柴烧气孔结构特殊，能软化水质、让熟普汤感更顺滑，老茶友最爱。', priority:'⭐ 次选' }
    ],
    notRecommend: '朱泥壶致密不透气，闷泡熟普容易出酸味；瓷壶保温不够，茶味出不来。'
  },
  {
    name:'白毫银针', cat:'白茶 · 微发酵', emoji:'⚪', tags:['白茶','福鼎','银针'],
    params:{ 水温:'85-90℃', 茶水比:'1:30', 泡制时间:'3-5分钟', 茶具:'瓷壶/盖碗' },
    intro:'白茶中的极品，产于福建福鼎、政和。全部由芽头制成，满披白毫，色白如银，外形如针。',
    steps:[
      '温杯后投茶5g',
      '注入85℃热水洗茶3秒',
      '第一泡静置1分钟出汤',
      '后续每泡延长30秒',
      '可冲泡6-8泡，老白茶可煮饮'
    ],
    taste:'毫香显著，滋味鲜爽甘醇，汤色浅黄透亮，回甘清甜。',
    potRecommend: [
      { pot:'瓷壶', reason:'白毫银针毫香清雅，瓷壶不吸味，最能保留毫香鲜爽，是白茶首选。', priority:'⭐ 首选' }
    ],
    notRecommend: '朱泥/紫泥/柴烧朱泥都会吸附毫香，让白茶风味打折，不推荐。（注：老白茶煮饮时可用紫泥）'
  },
  {
    name:'凤凰单丛', cat:'乌龙茶 · 半发酵', emoji:'🍃', tags:['乌龙','潮州','单丛'],
    params:{ 水温:'95-100℃', 茶水比:'1:20', 泡制时间:'10秒起', 茶具:'朱泥壶/盖碗' },
    intro:'产于广东潮州凤凰山，以"一树一香"闻名，有蜜兰香、芝兰香、黄枝香等众多香型，是工夫茶代表。',
    steps:[
      '温盖碗后投茶8g',
      '100℃热水高冲洗茶5秒',
      '第一泡注水后5-8秒快速出汤',
      '逐泡延长3-5秒',
      '可冲泡10泡以上'
    ],
    taste:'香气高锐持久，带花蜜香，滋味浓郁甘醇，回甘强烈。',
    potRecommend: [
      { pot:'朱泥壶', reason:'凤凰单丛是"高香型"代表，潮州工夫茶传统就用朱泥壶，聚香扬香无出其右。', priority:'⭐ 首选' },
      { pot:'柴烧朱泥', reason:'聚香同时增加汤感，让单丛的花蜜香更有层次。', priority:'⭐ 次选' },
      { pot:'瓷壶', reason:'试香型或品鉴时用瓷壶，还原度高。', priority:'备选' }
    ],
    notRecommend: '紫泥透气性会让高香散失，不适合单丛。'
  },
  {
    name:'茉莉花茶', cat:'花茶 · 窨制', emoji:'🌸', tags:['花茶','茉莉','福州'],
    params:{ 水温:'85-90℃', 茶水比:'1:50', 泡制时间:'2-3分钟', 茶具:'瓷壶/玻璃杯' },
    intro:'以绿茶为茶坯，经多次茉莉花窨制而成。融合茶香与花香，是花茶中的经典，福州茉莉花茶最为著名。',
    steps:[
      '温杯后投茶3g',
      '注入85℃热水至三分满润茶',
      '轻摇后注水至七分满',
      '静置2-3分钟',
      '可冲泡3-4泡'
    ],
    taste:'茉莉花香浓郁持久，茶汤鲜爽甘甜，花香与茶香交融。',
    potRecommend: [
      { pot:'瓷壶', reason:'茉莉花茶灵魂在花香，瓷壶不吸味，能完整保留茉莉花香，是花茶首选。', priority:'⭐ 首选' }
    ],
    notRecommend: '朱泥/紫泥/柴烧朱泥都会吸附花香，且紫砂会带入泥料味干扰花香，均不推荐。'
  },
  // === 绿茶类 ===
  {
    name:'安吉白茶', cat:'绿茶 · 不发酵', emoji:'🌿', tags:['绿茶','安吉','白茶'],
    params:{ 水温:'80-85℃', 茶水比:'1:50', 泡制时间:'2分钟', 茶具:'玻璃杯/瓷壶' },
    intro:'产于浙江安吉，名为"白茶"实为绿茶，因其茶树的嫩叶在特定温度下呈玉白色而得名。氨基酸含量极高，是普通绿茶的2-3倍，口感极其鲜爽。',
    steps:[
      '温杯后投茶3g',
      '注入80℃热水至三分满润茶',
      '轻摇后注水至七分满',
      '静置2分钟品饮',
      '可冲泡3次，第一泡最鲜'
    ],
    taste:'鲜爽度极高，几乎无苦涩，汤色清澈明亮，有淡雅兰花香，回甘清甜持久。',
    potRecommend: [
      { pot:'瓷壶', reason:'安吉白茶灵魂在"鲜"，瓷壶不吸味、不闷茶，最能保留氨基酸带来的极致鲜爽。', priority:'⭐ 首选' }
    ],
    notRecommend: '紫砂类壶会吸附鲜爽物质，且高温会使茶汤变黄失鲜，不推荐。'
  },
  {
    name:'六安瓜片', cat:'绿茶 · 不发酵', emoji:'🌿', tags:['绿茶','六安','瓜片'],
    params:{ 水温:'85-90℃', 茶水比:'1:50', 泡制时间:'2-3分钟', 茶具:'玻璃杯/瓷壶' },
    intro:'产于安徽六安，是世界唯一无芽无梗的片茶。由单片叶制成，形似瓜子，是中国十大名茶之一，以"浓而不苦、香而不涩"著称。',
    steps:[
      '温杯后投茶3g',
      '注入85℃热水至三分满润茶',
      '轻摇后注水至七分满',
      '静置2-3分钟品饮',
      '可冲泡3-4泡'
    ],
    taste:'香气清高带栗香，滋味浓醇鲜爽，回甘生津明显，耐泡度在绿茶中偏高。',
    potRecommend: [
      { pot:'瓷壶', reason:'瓜片茶汤浓郁，瓷壶不吸味，能完整呈现其"浓而不苦"的特点。', priority:'⭐ 首选' }
    ],
    notRecommend: '紫砂类壶容易闷出苦味，破坏瓜片特有的鲜爽。'
  },
  // === 黄茶类 ===
  {
    name:'君山银针', cat:'黄茶 · 轻发酵', emoji:'🌾', tags:['黄茶','湖南','君山'],
    params:{ 水温:'80-85℃', 茶水比:'1:50', 泡制时间:'3-5分钟', 茶具:'玻璃杯/瓷壶' },
    intro:'产于湖南岳阳君山岛，是中国黄茶之极品。全由芽头制成，冲泡后芽尖冲向水面悬空竖立，如"万笔书天"，极具观赏性。',
    steps:[
      '温杯后投茶3g',
      '注入80℃热水至七分满',
      '静置3-5分钟观察芽头竖立',
      '待茶叶下沉后品饮',
      '可冲泡3次'
    ],
    taste:'香气清鲜，滋味甘醇甜爽，汤色杏黄明亮，有独特的"闷黄"工艺带来的柔和甜韵。',
    potRecommend: [
      { pot:'瓷壶', reason:'黄茶与绿茶近似，瓷壶不闷不吸味，能保留闷黄工艺带来的独特甜润。', priority:'⭐ 首选' }
    ],
    notRecommend: '紫砂类壶会破坏黄茶细腻的甜韵，且无法观赏芽头竖立的姿态。'
  },
  // === 白茶类 ===
  {
    name:'白牡丹', cat:'白茶 · 微发酵', emoji:'⚪', tags:['白茶','福鼎','白牡丹'],
    params:{ 水温:'85-90℃', 茶水比:'1:30', 泡制时间:'3-5分钟', 茶具:'盖碗/瓷壶' },
    intro:'产于福建福鼎、政和，以一芽一二叶制成，形似花朵，绿叶夹银白毫心。是白茶中的中坚品种，价格亲民，日常品饮首选。',
    steps:[
      '温杯后投茶5g',
      '注入85℃热水洗茶3秒',
      '第一泡静置1分钟出汤',
      '后续每泡延长30秒',
      '可冲泡6-8泡'
    ],
    taste:'毫香花香交织，滋味醇和清甜，汤色杏黄透亮，年份越久甜度越高。',
    potRecommend: [
      { pot:'瓷壶', reason:'新白牡丹花香清雅，瓷壶不吸香，最能呈现其花香层次。', priority:'⭐ 首选' },
      { pot:'紫泥壶', reason:'陈年白牡丹（3年以上）可用紫泥壶，透气性好能提升甜润度。', priority:'老茶可选' }
    ],
    notRecommend: '朱泥/柴烧朱泥聚香过强会让新白牡丹花香显得沉闷。'
  },
  {
    name:'寿眉', cat:'白茶 · 微发酵', emoji:'🍂', tags:['白茶','福鼎','寿眉'],
    params:{ 水温:'90-95℃', 茶水比:'1:25', 泡制时间:'2-5分钟', 茶具:'盖碗/紫砂壶' },
    intro:'白茶中产量最大的品种，以粗老叶片制成，外形粗犷。陈化后药香、枣香明显，是性价比最高的老白茶选择，适合日常大壶泡或煮饮。',
    steps:[
      '温壶后投茶5-7g',
      '90℃热水洗茶5秒',
      '第一泡静置1分钟出汤',
      '后续每泡延长30秒',
      '老寿眉推荐煮饮：5g茶+500ml水煮5分钟'
    ],
    taste:'新茶清甜带草香，3年以上陈化后出药香、枣香，汤色橙红，滋味醇厚甘甜。',
    potRecommend: [
      { pot:'瓷壶', reason:'新寿眉用瓷壶品其清甜本味。', priority:'新茶首选' },
      { pot:'紫泥壶', reason:'老寿眉用紫泥壶煮饮或冲泡，透气性好能提升枣香药香。', priority:'老茶首选' },
      { pot:'柴烧朱泥', reason:'柴烧能软化水质，煮老寿眉时汤感更顺滑。', priority:'煮饮推荐' }
    ],
    notRecommend: '朱泥壶闷泡新寿眉会出青草味，不推荐。'
  },
  {
    name:'贡眉', cat:'白茶 · 微发酵', emoji:'🍂', tags:['白茶','福鼎','贡眉'],
    params:{ 水温:'90-95℃', 茶水比:'1:25', 泡制时间:'2-5分钟', 茶具:'盖碗/瓷壶' },
    intro:'产于福建福鼎、政和等地，以群体种茶树（菜茶）的一芽二三叶制成，介于白牡丹与寿眉之间。外形较寿眉细嫩，芽叶连枝，毫心显露。是白茶中性价比与品质兼备的日常品饮之选。',
    steps:[
      '温杯后投茶5g',
      '注入90℃热水洗茶5秒',
      '第一泡静置1分钟出汤',
      '后续每泡延长30秒',
      '新茶可冲泡6-8泡；老贡眉推荐煮饮：5g茶+500ml水煮3-5分钟'
    ],
    taste:'新茶毫香与花香交织，滋味清甜醇和，汤色杏黄透亮。陈化3年以上出药香、蜜香，汤色转橙红，滋味更醇厚甜润。',
    potRecommend: [
      { pot:'瓷壶', reason:'新贡眉毫香清雅，瓷壶不吸味，最能呈现其细腻的花香毫香层次。', priority:'⭐ 首选' },
      { pot:'紫泥壶', reason:'陈年贡眉（3年以上）用紫泥壶冲泡或煮饮，透气性好能提升药香蜜香和醇厚度。', priority:'老茶推荐' },
      { pot:'柴烧朱泥', reason:'煮老贡眉时柴烧能软化水质，让汤感更柔顺甜润。', priority:'煮饮推荐' }
    ],
    notRecommend: '朱泥壶致密不透气，闷泡新贡眉会出青草味且花香发闷，不推荐。'
  },
  // === 乌龙茶类 ===
  {
    name:'冻顶乌龙', cat:'乌龙茶 · 半发酵', emoji:'🍃', tags:['乌龙','台湾','冻顶'],
    params:{ 水温:'95-100℃', 茶水比:'1:20', 泡制时间:'30秒起', 茶具:'朱泥壶/瓷壶' },
    intro:'产于台湾南投鹿谷冻顶山，是台湾乌龙茶的代表。中度发酵、中度焙火，茶汤金黄明亮，带独特的焙火香与花果香。',
    steps:[
      '温壶后投茶7-8g',
      '100℃热水高冲洗茶5秒倒出',
      '第一泡注水后30秒出汤',
      '逐泡延长10秒',
      '可冲泡6-8泡'
    ],
    taste:'焙火香与花果香交融，滋味醇厚甘润，有独特的"冻顶韵"——类似焦糖的甜感。',
    potRecommend: [
      { pot:'朱泥壶', reason:'冻顶乌龙焙火适中、香气丰富，朱泥聚香能放大焙火香与花果香的层次。', priority:'⭐ 首选' },
      { pot:'柴烧朱泥', reason:'柴烧能让冻顶的焙火甜感更突出，汤感更柔。', priority:'⭐ 次选' },
      { pot:'瓷壶', reason:'品鉴冻顶原香时用瓷壶，还原度高。', priority:'备选' }
    ],
    notRecommend: '紫泥透气性会让焙火香散失过快。'
  },
  {
    name:'东方美人', cat:'乌龙茶 · 半发酵', emoji:'🫧', tags:['乌龙','台湾','东方美人'],
    params:{ 水温:'85-90℃', 茶水比:'1:30', 泡制时间:'40秒起', 茶具:'瓷壶/朱泥壶' },
    intro:'产于台湾新竹、苗栗，又称"白毫乌龙"或"膨风茶"。经小绿叶蝉叮咬后发酵，产生独特的蜂蜜香与熟果香，是乌龙茶中发酵度最高的品种（约60-70%）。',
    steps:[
      '温壶后投茶5g',
      '85℃热水洗茶3秒（低温保护蜜香）',
      '第一泡注水后40秒出汤',
      '逐泡延长10秒',
      '可冲泡5-7泡'
    ],
    taste:'蜂蜜香、熟果香浓郁，滋味甘甜如蜜，几乎无苦涩，茶汤呈琥珀色，是"茶中香槟"。',
    potRecommend: [
      { pot:'瓷壶', reason:'东方美人灵魂在蜜香，瓷壶不吸味，能完整保留小绿叶蝉叮咬产生的独特蜜甜香。', priority:'⭐ 首选' },
      { pot:'朱泥壶', reason:'聚香好但需降低水温至85℃，否则蜜香会受损。', priority:'谨慎使用' }
    ],
    notRecommend: '紫泥/柴烧朱泥透气性会散失蜜香，且高温会破坏东方美人的细腻甜感。'
  },
  // === 红茶类 ===
  {
    name:'金骏眉', cat:'红茶 · 全发酵', emoji:'🍂', tags:['红茶','武夷山','金骏眉'],
    params:{ 水温:'85-90℃', 茶水比:'1:40', 泡制时间:'2-3分钟', 茶具:'瓷壶/朱泥壶' },
    intro:'产于福建武夷山桐木关，全由芽头制成，是顶级红茶的代表。条索紧细，金毫显露，被誉为"红茶中的极品"。',
    steps:[
      '温壶后投茶3g',
      '85℃热水洗茶3秒（低温护芽）',
      '第一泡静置30秒出汤',
      '逐泡延长10秒',
      '可冲泡8-10泡'
    ],
    taste:'花果蜜香复合，滋味甘甜细腻，汤色金黄透亮，回甘悠长，每一泡香气都在变化。',
    potRecommend: [
      { pot:'瓷壶', reason:'金骏眉芽头细嫩，瓷壶不闷不吸，能逐泡展现其花果蜜香的层次变化。', priority:'⭐ 首选' },
      { pot:'朱泥壶', reason:'聚香好但需严格控制85℃低温，否则会烫坏芽头出涩味。', priority:'谨慎使用' }
    ],
    notRecommend: '紫泥/柴烧朱泥高温高透气性不适合细嫩芽头红茶。'
  },
  {
    name:'滇红', cat:'红茶 · 全发酵', emoji:'🍂', tags:['红茶','云南','滇红'],
    params:{ 水温:'90-95℃', 茶水比:'1:40', 泡制时间:'3-5分钟', 茶具:'紫泥壶/瓷壶' },
    intro:'产于云南凤庆、临沧等地，以大叶种茶树鲜叶制成。条索肥壮，金毫显露，茶汤红艳明亮，以"浓、强、鲜"著称，是中国红茶的重要代表。',
    steps:[
      '温壶后投茶5g',
      '注入90℃热水洗茶5秒',
      '第一泡静置30秒出汤',
      '逐泡延长10-15秒',
      '可冲泡6-8泡'
    ],
    taste:'蜜糖香浓郁，滋味浓强鲜爽，汤色红艳明亮，适合加奶制成奶茶，也适合清饮。',
    potRecommend: [
      { pot:'紫泥壶', reason:'滇红滋味浓强，紫泥透气性好能柔化茶汤、增加醇厚度。', priority:'⭐ 首选' },
      { pot:'瓷壶', reason:'喜欢滇红原始浓强风格时用瓷壶，还原度高。', priority:'备选' },
      { pot:'柴烧朱泥', reason:'柴烧能让滇红汤感更顺滑，降低浓强感的刺激。', priority:'备选' }
    ],
    notRecommend: '朱泥聚香会让滇红的浓强感更冲，不太适合。'
  },
  // === 黑茶类 ===
  {
    name:'普洱生茶', cat:'黑茶 · 后发酵', emoji:'🟤', tags:['普洱','生茶','云南'],
    params:{ 水温:'95-100℃', 茶水比:'1:15', 泡制时间:'10秒起', 茶具:'盖碗/紫泥壶' },
    intro:'以云南大叶种晒青毛茶为原料，经蒸压成型后自然陈化。新茶茶性较烈，随着年份增长，苦涩褪去、甘甜显现，是"可以喝的古董"。',
    steps:[
      '温壶后投茶8g',
      '100℃热水洗茶一次（5秒）',
      '第一泡注水后立即出汤',
      '新茶快速出汤，老茶可稍闷',
      '老生普可冲泡15泡以上'
    ],
    taste:'新茶：花香清冽，苦涩明显但化得快，回甘生津强烈。老茶：陈香药香，滋味醇厚甘甜，茶气足。',
    potRecommend: [
      { pot:'紫泥壶', reason:'紫泥透气性好，新茶能加速苦涩转化，老茶能提升醇厚度，是普洱最佳搭档。', priority:'⭐ 首选' },
      { pot:'瓷壶', reason:'试茶或品新茶山头韵时用瓷壶，不干扰本味。', priority:'试茶首选' },
      { pot:'柴烧朱泥', reason:'泡老生普时柴烧能软化水质，让陈韵更圆润。', priority:'老茶推荐' }
    ],
    notRecommend: '朱泥透气性弱，新茶容易闷出苦涩，不推荐。'
  },
  {
    name:'六堡茶', cat:'黑茶 · 后发酵', emoji:'🟤', tags:['黑茶','广西','六堡'],
    params:{ 水温:'95-100℃', 茶水比:'1:15', 泡制时间:'20秒起', 茶具:'紫泥壶/瓷壶' },
    intro:'产于广西梧州六堡镇，以"红、浓、陈、醇"著称。有独特的槟榔香，茶性温和，祛湿效果显著，是两广地区传统侨销茶。',
    steps:[
      '温壶后投茶8g',
      '100℃热水洗茶两次（每次5秒）',
      '第一泡注水后20秒出汤',
      '逐泡延长10秒',
      '可冲泡10-15泡'
    ],
    taste:'槟榔香独特，陈香明显，汤色红浓明亮，滋味醇厚顺滑，回甘甘甜。',
    potRecommend: [
      { pot:'紫泥壶', reason:'六堡茶与普洱熟茶类似，紫泥保温透气，能充分释放槟榔香和陈香。', priority:'⭐ 首选' },
      { pot:'柴烧朱泥', reason:'柴烧能让六堡汤感更柔顺，槟榔香更内敛。', priority:'备选' }
    ],
    notRecommend: '朱泥致密不透气，闷泡六堡容易出酸味。瓷壶保温不够，陈香出不来。'
  },
  // === 花茶 / 再加工茶 ===
  {
    name:'桂花乌龙', cat:'花茶 · 窨制', emoji:'🌸', tags:['花茶','桂花','乌龙'],
    params:{ 水温:'90-95℃', 茶水比:'1:30', 泡制时间:'2-3分钟', 茶具:'瓷壶/盖碗' },
    intro:'以乌龙茶为茶坯，用新鲜桂花窨制而成。融合乌龙茶的醇厚与桂花的甜香，是秋季最应景的花茶。',
    steps:[
      '温壶后投茶5g',
      '注入90℃热水洗茶3秒',
      '第一泡静置30秒出汤',
      '逐泡延长10秒',
      '可冲泡5-7泡'
    ],
    taste:'桂花甜香扑鼻，乌龙茶底醇和，汤色橙黄明亮，回甘带桂花蜜甜。',
    potRecommend: [
      { pot:'瓷壶', reason:'花茶核心在花香，瓷壶不吸味不串味，能完整保留桂花甜香。', priority:'⭐ 首选' }
    ],
    notRecommend: '紫砂类壶会吸附桂花香，且紫砂泥料味会干扰花香纯度。'
  },
  {
    name:'陈皮普洱', cat:'再加工茶', emoji:'🍊', tags:['普洱','陈皮','广东'],
    params:{ 水温:'95-100℃', 茶水比:'1:15', 泡制时间:'20秒起', 茶具:'紫泥壶/柴烧朱泥' },
    intro:'以普洱熟茶与新会陈皮拼配而成，融合普洱的陈香与陈皮的果香。理气健脾、化痰止咳，是广东地区经典的养生茶饮。',
    steps:[
      '温壶后投茶8g（连陈皮一起）',
      '100℃热水洗茶两次',
      '第一泡注水后20秒出汤',
      '逐泡延长10秒',
      '可冲泡10-15泡，也可煮饮'
    ],
    taste:'陈皮果香与普洱陈香交融，汤色红浓，滋味醇厚带甘甜，有独特的柑橘回韵。',
    potRecommend: [
      { pot:'紫泥壶', reason:'紫泥透气性好，能同时释放普洱陈香和陈皮果香，是最佳搭配。', priority:'⭐ 首选' },
      { pot:'柴烧朱泥', reason:'柴烧煮饮陈皮普洱时汤感更顺滑，陈皮的甜润更突出。', priority:'煮饮推荐' }
    ],
    notRecommend: '朱泥致密不适合陈皮普洱这种需要充分释放的茶。瓷壶可以泡但不如紫泥醇厚。'
  },
  // === 再加工 / 特色茶 ===
  {
    name:'小青柑', cat:'再加工茶', emoji:'🍊', tags:['普洱','青柑','广东'],
    params:{ 水温:'95-100℃', 茶水比:'1颗/壶', 泡制时间:'30秒起', 茶具:'紫泥壶/瓷壶' },
    intro:'将普洱熟茶填入未成熟的新会小青柑中，经干燥制成。外形小巧可爱，一颗一泡，柑香与茶香交融，是近年最受欢迎的便携茶品。',
    steps:[
      '将一颗小青柑放入壶中',
      '100℃热水洗茶一次',
      '第一泡注水后30秒出汤',
      '逐泡延长10-15秒',
      '可冲泡8-12泡，尾水可煮饮'
    ],
    taste:'清新的柑橘果香与普洱陈香完美融合，汤色红亮，滋味甘醇，有独特的柑甜回韵。',
    potRecommend: [
      { pot:'紫泥壶', reason:'紫泥壶空间大、透气好，能让小青柑充分舒展，柑香和茶香释放更均匀。', priority:'⭐ 首选' },
      { pot:'瓷壶', reason:'瓷壶泡小青柑柑香更直接，适合喜欢清爽口感的人。', priority:'备选' }
    ],
    notRecommend: '朱泥壶空间小，小青柑难以充分舒展，柑香和茶香出不来。'
  }
];

// 你的壶 - 壶具知识库（基于用户实际拥有的四把壶）
const myPotsDB = {
  '瓷壶':     { material:'瓷器（釉面）', characteristic:'不吸味、不透气、导热快', strength:'还原茶叶本味，百搭新手', weakness:'保温性一般，无法提升茶汤厚度', care:'用清水冲洗即可，避免磕碰' },
  '朱泥':     { material:'紫砂·朱泥（红泥）', characteristic:'含铁量高、致密、聚香强', strength:'放大高香型茶香气，铁观音/单丛绝配', weakness:'透气性弱于紫泥，易闷茶', care:'一壶一茶，勿骤冷骤热防开裂' },
  '紫泥':     { material:'紫砂·紫泥', characteristic:'透气性好、砂质感、保温佳', strength:'柔化茶性，适合发酵茶，普洱/岩茶首选', weakness:'会吸附部分香气，不适合高香茶', care:'一壶一茶，养壶后温润古朴' },
  '柴烧朱泥': { material:'紫砂·朱泥（柴窑烧制）', characteristic:'柴烧独特气孔、聚香兼增汤感', strength:'兼具聚香与软化水质，老茶友进阶之选', weakness:'数量稀少，需细心养护', care:'一壶一茶，柴烧痕迹需自然养出包浆' }
};

// 渲染茶类标签
function renderTeaTags(){
  const tagBox = $('#teaTags');
  tagBox.innerHTML = '';
  teaDB.forEach((t,i) => {
    const tag = document.createElement('span');
    tag.className = 'tea-tag';
    tag.textContent = t.name;
    tag.addEventListener('click', () => renderTea(i));
    tagBox.appendChild(tag);
  });
}

function renderTea(idx){
  const t = teaDB[idx];
  let potSection = '';
  if(t.potRecommend && t.potRecommend.length){
    const clayItems = t.potRecommend.map(rec => {
      const info = myPotsDB[rec.pot] || { characteristic:'', strength:'' };
      return `<div class="pot-clay-item${rec.priority.includes('首选')?' pot-clay-best':''}">
        <div class="pot-clay-name">🫖 ${rec.pot} <span class="pot-clay-priority">${rec.priority}</span></div>
        <div class="pot-clay-reason">${rec.reason}</div>
        <div class="pot-clay-char">${info.characteristic}</div>
      </div>`;
    }).join('');
    potSection = `
      <div class="pot-recommend">
        <div class="pot-recommend-title">🫖 从你的壶中推荐</div>
        <div class="pot-recommend-sub">基于你已有的：瓷壶 · 朱泥 · 紫泥 · 柴烧朱泥</div>
        <div class="pot-recommend-grid">${clayItems}</div>
        ${t.notRecommend ? `<div class="pot-not-rec">⚠️ ${t.notRecommend}</div>` : ''}
      </div>`;
  }

  const box = $('#teaDetail');
  box.innerHTML = `
    <div class="tea-info">
      <div class="tea-header">
        <div class="tea-emoji">${t.emoji}</div>
        <div>
          <div class="tea-name">${t.name}</div>
          <div class="tea-cat">${t.cat}</div>
        </div>
      </div>
      <div class="tea-grid">
        ${Object.entries(t.params).map(([k,v])=>`
          <div class="tea-param">
            <div class="tea-param-label">${k}</div>
            <div class="tea-param-value">${v}</div>
          </div>
        `).join('')}
      </div>
      ${potSection}
      <div class="tea-section">
        <div class="tea-section-title">📖 茶叶简介</div>
        <div class="tea-section-text">${t.intro}</div>
      </div>
      <div class="tea-section">
        <div class="tea-section-title">🫖 泡制步骤</div>
        <ol class="tea-steps">
          ${t.steps.map(s=>`<li>${s}</li>`).join('')}
        </ol>
      </div>
      <div class="tea-section">
        <div class="tea-section-title">👅 品饮要点</div>
        <div class="tea-section-text">${t.taste}</div>
      </div>
    </div>
  `;
}

function searchTea(){
  const kw = $('#teaSearch').value.trim().toLowerCase();
  if(!kw){ renderTeaTags(); return; }
  const idx = teaDB.findIndex(t =>
    t.name.toLowerCase().includes(kw) ||
    t.cat.toLowerCase().includes(kw) ||
    t.tags.some(tag => tag.toLowerCase().includes(kw))
  );
  if(idx >= 0) renderTea(idx);
  else {
    $('#teaDetail').innerHTML = `
      <div class="tea-welcome">
        <div class="welcome-icon">🔍</div>
        <div class="welcome-title">未找到相关茶叶</div>
        <div class="welcome-desc">试试搜索：龙井、红茶、乌龙、普洱...</div>
      </div>`;
  }
}
$('#teaSearchBtn').addEventListener('click', searchTea);
$('#teaSearch').addEventListener('keydown', e => { if(e.key==='Enter') searchTea(); });
renderTeaTags();

// 每日茶知识推送（根据日期轮换）
const teaFacts = [
  { title:'茶叶的分类', text:'中国茶叶按发酵程度分为六大类：<b>绿茶</b>（不发酵）、<b>白茶</b>（微发酵）、<b>黄茶</b>（轻发酵）、<b>乌龙茶</b>（半发酵）、<b>红茶</b>（全发酵）、<b>黑茶</b>（后发酵）。发酵程度越高，茶性越温和。' },
  { title:'紫砂壶为什么要"一壶一茶"？', text:'紫砂壶的双气孔结构会吸收茶香，长期泡一种茶会形成独特的"茶山"。如果混泡不同茶类，会串味影响品饮体验。建议<b>一种泥料配一类茶</b>，比如朱泥壶专泡铁观音。' },
  { title:'泡茶水温的门道', text:'<b>绿茶 75-85℃</b>（嫩芽怕烫）、<b>红茶/乌龙 90-100℃</b>（高温激发香气）、<b>普洱/黑茶 100℃</b>（沸水醒茶）。水温过高会烫熟绿茶产生熟汤味，过低则香气出不来。' },
  { title:'盖碗 vs 紫砂壶', text:'<b>盖碗</b>不吸味，适合品鉴茶叶本味、试新茶；<b>紫砂壶</b>透气保温，能提升茶汤醇厚度，适合日常品饮和老茶冲泡。新手建议从盖碗入手练习出汤手法。' },
  { title:'洗茶到底要不要？', text:'<b>乌龙茶、普洱、黑茶</b>：必须洗，快速过一遍热水唤醒茶叶；<b>绿茶、白茶（新茶）</b>：不用洗，第一泡是最鲜爽的精华；<b>红茶</b>：可洗可不洗，看个人习惯。' },
  { title:'紫砂壶开壶方法', text:'新壶先用清水洗净内外，再用干净布擦干。然后用要泡的茶叶煮一锅茶汤，将壶放入小火煮30分钟，自然冷却后取出擦干即可。切忌用洗洁精等化学品清洗。' },
  { title:'茶的保存要点', text:'茶叶怕潮湿、怕异味、怕光照、怕高温。<b>绿茶</b>需冷藏（0-5℃）；<b>乌龙茶</b>密封常温即可；<b>普洱</b>需通风干燥、避光存放；<b>红茶</b>密封避光常温保存。所有茶叶都要远离厨房油烟。' },
  { title:'什么是"岩韵"？', text:'岩韵是武夷岩茶特有的风味特征，指茶叶生长在武夷山独特的丹霞地貌岩石风化土壤中，形成的矿物质感和独特的"岩骨"——一种类似岩石矿物气息与花香果香的复合风味，以大红袍最为典型。' },
  { title:'工夫茶的"关公巡城"和"韩信点兵"', text:'这是潮州工夫茶的两个经典动作：<b>关公巡城</b>——用开水淋壶身一周，使壶温均匀；<b>韩信点兵</b>——出汤时在几个杯中来回均匀分茶，确保每杯茶汤浓度一致。' },
  { title:'茶的"回甘"是什么？', text:'回甘是指茶汤入喉后，口腔中自然涌现的甜润感。优质茶叶中的茶多酚先带来微涩，随后与唾液反应转化为甘甜。回甘越明显、越持久，说明茶叶品质越好。' }
];
const todayFact = teaFacts[Math.floor(Date.now() / 86400000) % teaFacts.length];
$('#teaDailyContent').innerHTML = `<b>${todayFact.title}</b>：${todayFact.text}`;


/* ============================================
   模块三：每日打卡（日历记录版）
============================================ */
const defaultCheckinTasks = ['💊 吃维生素', '🎙️ 听VOA', '🏃 运动'];
let checkinTasks = load('checkinTasks') || [...defaultCheckinTasks];
// 历史记录：{ "2026/08/04": {"💊 吃维生素": true, "🏃 运动": false}, ... }
let checkinHistory = load('checkinHistory') || {};
let calCursor = new Date(); // 日历当前显示月份

function todayStrCN(d){
  return d.toLocaleDateString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit'});
}

// 兼容旧数据：把旧的 checkinDone 迁移到 checkinHistory
if(!load('checkinHistory') && load('checkinDone')){
  const oldDone = load('checkinDone');
  const oldDate = load('checkinDate') || todayStrCN(new Date());
  checkinHistory[oldDate] = {...oldDone};
  save('checkinHistory', checkinHistory);
}

function getTodayCheckins(){
  const today = todayStrCN(new Date());
  return checkinHistory[today] || {};
}

function renderCheckins(){
  const grid = $('#checkinGrid');
  grid.innerHTML = '';
  const todayDone = getTodayCheckins();
  checkinTasks.forEach(name => {
    const done = !!todayDone[name];
    const card = document.createElement('div');
    card.className = 'checkin-card' + (done ? ' done' : '');
    card.innerHTML = `
      <div class="checkin-check">${done ? '✓' : ''}</div>
      <div class="checkin-name">${escapeHtml(name)}</div>
      <button class="checkin-del" data-name="${escapeAttr(name)}" title="删除任务">✕</button>
    `;
    card.addEventListener('click', e => {
      if(e.target.closest('.checkin-del')) return;
      const today = todayStrCN(new Date());
      if(!checkinHistory[today]) checkinHistory[today] = {};
      checkinHistory[today][name] = !checkinHistory[today][name];
      save('checkinHistory', checkinHistory);
      renderCheckins();
      renderCalendar();
    });
    grid.appendChild(card);
  });
  $('#checkinEmpty').style.display = checkinTasks.length ? 'none' : 'block';
  const doneCount = Object.values(todayDone).filter(Boolean).length;
  $('#checkinTip').textContent = `📅 ${todayStrCN(new Date())} · 已完成 ${doneCount}/${checkinTasks.length}`;
}

function addCheckinTask(){
  const input = $('#checkinAddInput');
  const name = input.value.trim();
  if(!name) return;
  if(checkinTasks.includes(name)){ alert('该任务已存在'); return; }
  checkinTasks.push(name);
  save('checkinTasks', checkinTasks);
  input.value = '';
  renderCheckins();
}

function deleteCheckinTask(name){
  if(!confirm(`确定删除"${name}"吗？\n\n（历史记录会保留，只是今后不再显示该任务）`)) return;
  checkinTasks = checkinTasks.filter(t => t !== name);
  // 不清理历史记录，保留以前的打卡数据
  save('checkinTasks', checkinTasks);
  save('checkinHistory', checkinHistory);
  renderCheckins();
  renderCalendar();
}

$('#checkinAddBtn').addEventListener('click', addCheckinTask);
$('#checkinAddInput').addEventListener('keydown', e => { if(e.key==='Enter') addCheckinTask(); });

$('#checkinGrid').addEventListener('click', e => {
  if(e.target.closest('.checkin-del')){
    const name = e.target.closest('.checkin-del').dataset.name;
    deleteCheckinTask(name);
  }
});

/* ---------- 日历渲染 ---------- */
function renderCalendar(){
  const grid = $('#calGrid');
  const title = $('#calTitle');
  if(!grid) return;
  grid.innerHTML = '';

  const year = calCursor.getFullYear();
  const month = calCursor.getMonth();
  title.textContent = `${year}年${month+1}月`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month+1, 0);
  const startWeekday = firstDay.getDay(); // 0=周日
  const daysInMonth = lastDay.getDate();
  const today = todayStrCN(new Date());

  // 上月填充
  const prevLastDay = new Date(year, month, 0).getDate();
  for(let i = startWeekday - 1; i >= 0; i--){
    const d = document.createElement('div');
    d.className = 'cal-day other-month';
    d.innerHTML = `<span class="cal-day-num">${prevLastDay - i}</span>`;
    grid.appendChild(d);
  }

  // 本月
  for(let day = 1; day <= daysInMonth; day++){
    const dateObj = new Date(year, month, day);
    const dateStr = todayStrCN(dateObj);
    const rec = checkinHistory[dateStr];
    const doneCount = rec ? Object.values(rec).filter(Boolean).length : 0;
    // 今天用当前任务列表算，历史日期用当天记录的任务数算
    const isToday = dateStr === today;
    const taskCount = isToday ? checkinTasks.length : (rec ? Object.keys(rec).length : 0);

    let cls = 'cal-day';
    if(isToday) cls += ' today';
    if(taskCount > 0 && doneCount >= taskCount) cls += ' cal-full';
    else if(doneCount > 0) cls += ' cal-partial';
    else cls += ' cal-none';

    const d = document.createElement('div');
    d.className = cls;
    d.title = `${dateStr} · ${doneCount}/${taskCount} 完成`;
    d.dataset.date = dateStr;
    d.innerHTML = `<span class="cal-day-num">${day}</span>`;
    grid.appendChild(d);
  }

  // 下月填充
  const totalCells = startWeekday + daysInMonth;
  const remain = (7 - totalCells % 7) % 7;
  for(let i = 1; i <= remain; i++){
    const d = document.createElement('div');
    d.className = 'cal-day other-month';
    d.innerHTML = `<span class="cal-day-num">${i}</span>`;
    grid.appendChild(d);
  }
}

$('#calPrev')?.addEventListener('click', () => {
  calCursor.setMonth(calCursor.getMonth() - 1);
  renderCalendar();
});
$('#calNext')?.addEventListener('click', () => {
  calCursor.setMonth(calCursor.getMonth() + 1);
  renderCalendar();
});

/* ---------- 日历点击详情 ---------- */
$('#calGrid')?.addEventListener('click', e => {
  const cell = e.target.closest('.cal-day:not(.other-month)');
  if(!cell || !cell.dataset.date) return;
  showDayDetail(cell.dataset.date, cell);
});

function showDayDetail(dateStr, anchorEl){
  // 移除已有的详情面板
  document.querySelectorAll('.cal-detail-popup').forEach(el => el.remove());

  const rec = checkinHistory[dateStr] || {};
  const recKeys = Object.keys(rec);
  const dateObj = new Date(dateStr.replace(/\//g,'-'));
  const weekday = ['周日','周一','周二','周三','周四','周五','周六'][dateObj.getDay()];
  const today = todayStrCN(new Date());
  const isFuture = dateStr > today;
  const isToday = dateStr === today;
  // 今天显示当前任务列表，历史日期显示当时的记录
  const taskNames = isToday ? checkinTasks : (recKeys.length > 0 ? recKeys : checkinTasks);

  let itemsHtml = '';
  if(taskNames.length === 0){
    itemsHtml = '<div class="cal-detail-empty">暂无打卡任务</div>';
  } else {
    itemsHtml = taskNames.map(name => {
      const done = !!rec[name];
      return `<div class="cal-detail-item ${done?'done':'undone'}">
        <span class="cal-detail-check">${done?'✅':'⬜'}</span>
        <span class="cal-detail-name">${escapeHtml(name)}</span>
      </div>`;
    }).join('');
  }

  const doneCount = Object.values(rec).filter(Boolean).length;
  const taskCount = isToday ? checkinTasks.length : (recKeys.length > 0 ? recKeys.length : checkinTasks.length);
  const rateText = taskCount > 0 ? `${doneCount}/${taskCount} 完成` : '无任务';

  const popup = document.createElement('div');
  popup.className = 'cal-detail-popup';
  popup.innerHTML = `
    <div class="cal-detail-header">
      <span class="cal-detail-date">📅 ${dateStr} ${weekday}</span>
      <button class="cal-detail-close">✕</button>
    </div>
    <div class="cal-detail-rate">${rateText}</div>
    <div class="cal-detail-items">${itemsHtml}</div>
    ${isFuture ? '<div class="cal-detail-future">📌 该日期尚未到来</div>' : ''}
    ${!isFuture && taskCount === 0 ? '<div class="cal-detail-future">📭 当天无打卡记录</div>' : ''}
  `;

  // 定位到格子附近
  const rect = anchorEl.getBoundingClientRect();
  const popupW = 240;
  let left = rect.left + rect.width/2 - popupW/2;
  left = Math.max(8, Math.min(left, window.innerWidth - popupW - 8));
  let top = rect.bottom + 6;
  // 如果下方空间不够，弹到上方
  if(top + 250 > window.innerHeight) top = rect.top - 250 - 6;
  if(top < 8) top = 8;

  popup.style.left = left + 'px';
  popup.style.top = top + 'px';
  popup.style.width = popupW + 'px';

  // 关闭事件
  popup.querySelector('.cal-detail-close').addEventListener('click', () => popup.remove());

  document.body.appendChild(popup);

  // 点击外部关闭
  setTimeout(() => {
    const outsideHandler = ev => {
      if(!popup.contains(ev.target) && !ev.target.closest('.cal-day')){
        popup.remove();
        document.removeEventListener('click', outsideHandler);
      }
    };
    document.addEventListener('click', outsideHandler);
  }, 10);
}

renderCheckins();
renderCalendar();


let schedules = [];
let checklist = [];

function renderSchedules(){
  const box = $('#scheduleList');
  box.innerHTML = '';
  schedules.forEach((s,i) => {
    const item = document.createElement('div');
    item.className = 'schedule-item';
    item.innerHTML = `
      <input type="text" class="schedule-time" placeholder="时间，如 09:00" value="${escapeAttr(s.time)}" data-i="${i}" data-k="time">
      <input type="text" placeholder="行程内容" value="${escapeAttr(s.item)}" data-i="${i}" data-k="item">
      <button class="schedule-del" data-i="${i}">✕</button>
    `;
    box.appendChild(item);
  });
}
$('#scheduleList').addEventListener('input', e => {
  if(e.target.dataset.i !== undefined){
    schedules[+e.target.dataset.i][e.target.dataset.k] = e.target.value;
  }
});
$('#scheduleList').addEventListener('click', e => {
  if(e.target.classList.contains('schedule-del')){
    schedules.splice(+e.target.dataset.i, 1);
    renderSchedules();
  }
});
$('#addScheduleBtn').addEventListener('click', () => {
  schedules.push({time:'', item:''});
  renderSchedules();
});

function renderChecklist(){
  const box = $('#checklist');
  box.innerHTML = '';
  checklist.forEach((c,i) => {
    const item = document.createElement('div');
    item.className = 'checklist-item';
    item.innerHTML = `<span class="chk-text">${escapeHtml(c)}</span><button class="chk-del" data-i="${i}">✕</button>`;
    box.appendChild(item);
  });
}
$('#checklist').addEventListener('click', e => {
  if(e.target.classList.contains('chk-del')){
    checklist.splice(+e.target.dataset.i,1);
    renderChecklist();
  }
});
$('#addChecklistBtn').addEventListener('click', () => {
  const v = $('#checklistInput').value.trim();
  if(v){ checklist.push(v); $('#checklistInput').value=''; renderChecklist(); }
});
$('#checklistInput').addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); $('#addChecklistBtn').click(); } });

let myGuides = load('myGuides') || [];
function renderMyGuides(){
  const box = $('#myGuidesList');
  box.innerHTML = '';
  myGuides.forEach((g,i) => {
    const card = document.createElement('div');
    card.className = 'my-guide-card';
    card.innerHTML = `
      <button class="my-guide-del" data-i="${i}">✕</button>
      <div class="my-guide-title">${escapeHtml(g.title)}</div>
      <div class="my-guide-meta">${escapeHtml(g.destination)} · ${escapeHtml(g.duration)} · ${g.schedules.length}段行程</div>
    `;
    card.addEventListener('click', e => {
      if(e.target.classList.contains('my-guide-del')) return;
    });
    box.appendChild(card);
  });
  $('#myGuidesEmpty').style.display = myGuides.length ? 'none' : 'block';
}
$('#myGuidesList').addEventListener('click', e => {
  if(e.target.classList.contains('my-guide-del')){
    myGuides.splice(+e.target.dataset.i,1);
    save('myGuides', myGuides);
    renderMyGuides();
  }
});
$('#saveGuideBtn').addEventListener('click', () => {
  const title = $('#guideTitle').value.trim();
  if(!title){ alert('请填写攻略标题'); return; }
  const guide = {
    id: Date.now(),
    title,
    destination: $('#guideDestination').value.trim(),
    duration: $('#guideDuration').value.trim(),
    overview: $('#guideOverview').value.trim(),
    schedules: schedules.filter(s=>s.time||s.item),
    checklist: [...checklist],
    createdAt: new Date().toLocaleString('zh-CN')
  };
  myGuides.unshift(guide);
  save('myGuides', myGuides);
  renderMyGuides();
  alert('✅ 攻略已保存到"我的攻略"！');
});
$('#clearGuideBtn').addEventListener('click', () => {
  if(confirm('确定清空当前所有输入吗？')){
    $('#guideTitle').value=''; $('#guideDestination').value='';
    $('#guideDuration').value=''; $('#guideOverview').value='';
    schedules = []; checklist = []; renderSchedules(); renderChecklist();
  }
});

renderSchedules();
renderChecklist();
renderMyGuides();

/* ============================================
   Tips - 小经验记录（支持图片）
============================================ */
let tips = load('tips') || [];
let pendingTipImages = [];

function renderTips(){
  const list = $('#tipsList');
  list.innerHTML = '';
  const groups = {};
  tips.forEach(t => {
    const d = t.date || '未标注日期';
    if(!groups[d]) groups[d] = [];
    groups[d].push(t);
  });

  Object.keys(groups).sort((a,b) => b.localeCompare(a)).forEach(date => {
    const isToday = date === new Date().toLocaleDateString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit'});
    const header = document.createElement('div');
    header.className = 'todo-date-header';
    header.textContent = isToday ? '📅 今天' : '📅 ' + date;
    list.appendChild(header);

    groups[date].forEach(t => {
      const imgHtml = (t.images && t.images.length)
        ? `<div class="inspire-item-images">${t.images.map((src,i) =>
            `<div class="inspire-item-img" data-idx="${i}" data-tip="${t.id}"><img src="${src}" alt="图片"></div>`
          ).join('')}</div>`
        : '';
      const item = document.createElement('div');
      item.className = 'tip-item';
      item.innerHTML = `
        <div class="tip-item-header">
          <span class="tip-item-time">${t.time}${(t.images&&t.images.length)?' · 📷 '+t.images.length+'张':''}</span>
          <div class="tip-item-actions">
            <button class="tip-item-edit" data-id="${t.id}">✏️</button>
            <button class="tip-item-del" data-id="${t.id}">✕</button>
          </div>
        </div>
        <div class="tip-item-body">${escapeHtml(t.content)}</div>
        ${imgHtml}
      `;
      list.appendChild(item);
    });
  });
  $('#tipsEmpty').style.display = tips.length ? 'none' : 'block';
}

function renderPendingTipImages(){
  const box = $('#tipImgPreview');
  box.innerHTML = '';
  pendingTipImages.forEach((src, i) => {
    const thumb = document.createElement('div');
    thumb.className = 'inspire-img-thumb';
    thumb.innerHTML = `<img src="${src}"><button class="thumb-del" data-i="${i}">✕</button>`;
    box.appendChild(thumb);
  });
  $('#tipImgTip').textContent = pendingTipImages.length ? `已选 ${pendingTipImages.length}/9 张` : '可选，最多9张';
}

function addTip(){
  const input = $('#tipInput');
  const content = input.value.trim();
  if(!content && !pendingTipImages.length) return;
  tips.unshift({
    id: Date.now(),
    content: content || '（图片记录）',
    images: [...pendingTipImages],
    date: new Date().toLocaleDateString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit'}),
    time: new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})
  });
  save('tips', tips);
  input.value = '';
  pendingTipImages = [];
  renderPendingTipImages();
  renderTips();
}

$('#addTipBtn').addEventListener('click', addTip);
$('#tipInput').addEventListener('keydown', e => { if(e.key==='Enter') addTip(); });

// 图片选择
$('#tipImgInput').addEventListener('change', e => {
  const files = Array.from(e.target.files);
  const remain = 9 - pendingTipImages.length;
  if(remain <= 0){ alert('最多只能添加9张图片'); e.target.value=''; return; }
  const toRead = files.slice(0, remain);
  if(files.length > remain) alert(`最多9张，已添加前 ${remain} 张`);
  let loaded = 0;
  toRead.forEach(file => {
    if(!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = ev => {
      compressImage(ev.target.result, 800, 0.7, compressed => {
        pendingTipImages.push(compressed);
        loaded++;
        if(loaded === toRead.length){ renderPendingTipImages(); }
      });
    };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
});

$('#tipImgPreview').addEventListener('click', e => {
  if(e.target.classList.contains('thumb-del')){
    pendingTipImages.splice(Number(e.target.dataset.i), 1);
    renderPendingTipImages();
  }
});

// 点击放大图片 + 编辑/删除
$('#tipsList').addEventListener('click', e => {
  if(e.target.closest('.inspire-item-img')){
    const el = e.target.closest('.inspire-item-img');
    const tipId = Number(el.dataset.tip);
    const idx = Number(el.dataset.idx);
    const tip = tips.find(x=>x.id===tipId);
    if(tip && tip.images && tip.images[idx]){
      showImageModal(tip.images[idx]);
    }
    return;
  }
  const btn = e.target.closest('[data-id]');
  if(!btn) return;
  const id = Number(btn.dataset.id);
  if(btn.classList.contains('tip-item-del')){
    tips = tips.filter(x=>x.id!==id);
    save('tips', tips);
    renderTips();
  } else if(btn.classList.contains('tip-item-edit')){
    const tip = tips.find(x=>x.id===id);
    if(!tip) return;
    showEditTipModal(tip);
  }
});

function showEditTipModal(tip){
  const modal = document.createElement('div');
  modal.className = 'img-modal';
  modal.style.alignItems = 'flex-start';
  modal.style.paddingTop = '60px';
  modal.innerHTML = `
    <div class="inspire-edit-modal">
      <div class="inspire-edit-header">
        <span>✏️ 编辑 Tips</span>
        <button class="img-modal-close">✕</button>
      </div>
      <textarea class="inspire-edit-textarea" id="editTipInput">${escapeHtml(tip.content)}</textarea>
      <div class="inspire-edit-images" id="editTipImages"></div>
      <div class="inspire-edit-actions">
        <button class="btn-secondary" id="editTipCancel">取消</button>
        <button class="btn-primary" id="editTipSave">💾 保存</button>
      </div>
    </div>
  `;
  modal.addEventListener('click', e => {
    if(e.target === modal || e.target.classList.contains('img-modal-close')) modal.remove();
  });
  document.body.appendChild(modal);

  let editImages = [...(tip.images || [])];
  const imgBox = modal.querySelector('#editTipImages');
  function renderEditImages(){
    imgBox.innerHTML = '';
    editImages.forEach((src, i) => {
      const thumb = document.createElement('div');
      thumb.className = 'inspire-img-thumb';
      thumb.innerHTML = `<img src="${src}"><button class="thumb-del" data-i="${i}">✕</button>`;
      imgBox.appendChild(thumb);
    });
  }
  renderEditImages();
  imgBox.addEventListener('click', e => {
    if(e.target.classList.contains('thumb-del')){
      editImages.splice(Number(e.target.dataset.i), 1);
      renderEditImages();
    }
  });

  modal.querySelector('#editTipCancel').addEventListener('click', () => modal.remove());
  modal.querySelector('#editTipSave').addEventListener('click', () => {
    const newContent = modal.querySelector('#editTipInput').value.trim();
    tip.content = newContent || '（图片记录）';
    tip.images = editImages;
    save('tips', tips);
    renderTips();
    modal.remove();
  });
}

renderTips();


/* ---------- 工具：HTML 转义 ---------- */
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) }
function escapeAttr(s){ return String(s).replace(/"/g,'&quot;') }
