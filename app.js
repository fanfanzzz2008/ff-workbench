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
  english:{ title:'英语口语', desc:'每天跟读 VOA，提升发音语感' },
  guide:{ title:'攻略制作', desc:'查询与制作旅游/博物馆攻略' }
};
$$('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const m = btn.dataset.module;
    $$('.module').forEach(s => s.classList.remove('active'));
    $('#module-' + m).classList.add('active');
    $('#moduleTitle').textContent = moduleMap[m].title;
    $('#moduleDesc').textContent = moduleMap[m].desc;
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

/* ---------- 每日一句 ---------- */
const quotes = [
  '把每一天都当作新的开始。',
  '日拱一卒，功不唐捐。',
  '一口茶，一段时光，慢即是快。',
  '坚持，是平凡人非凡的秘诀。',
  '语言是通向世界的钥匙。',
  '行万里路，读万卷书。',
  '今天的努力，是明天的底气。',
  '小步快跑，持续迭代。'
];
$('#dailyQuote').textContent = quotes[new Date().getDate() % quotes.length];


/* ============================================
   数据导出/导入
============================================ */
function exportAllData(){
  const allData = {};
  for(let i = 0; i < localStorage.length; i++){
    const key = localStorage.key(i);
    if(key.startsWith('ff_')) allData[key] = JSON.parse(localStorage.getItem(key));
  }
  const blob = new Blob([JSON.stringify(allData, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'FF-backup-' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
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
// 侧边栏按钮
$('#exportDataBtn').addEventListener('click', exportAllData);
$('#importDataBtn').addEventListener('click', () => $('#importFileInput').click());
$('#importFileInput').addEventListener('change', e => { importAllData(e.target.files[0]); e.target.value = ''; });
// 顶栏按钮
$('#exportDataBtn2').addEventListener('click', exportAllData);
$('#importDataBtn2').addEventListener('click', () => $('#importFileInput2').click());
$('#importFileInput2').addEventListener('change', e => { importAllData(e.target.files[0]); e.target.value = ''; });


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
  filtered.forEach(t => {
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

  $('#todoEmpty').style.display = filtered.length ? 'none' : 'block';
  const total = todos.length, done = todos.filter(t=>t.done).length;
  $('#statTotal').textContent = total;
  $('#statDone').textContent = done;
  $('#statPending').textContent = total - done;
  $('#statRate').textContent = total ? Math.round(done/total*100)+'%' : '0%';
}

function addTodo(){
  const input = $('#todoInput');
  const content = input.value.trim();
  if(!content) return;
  const priority = $('#todoPriority').value;
  todos.unshift({
    id: Date.now(),
    content, priority, done:false,
    time: new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})
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
        <button class="inspire-item-del" data-id="${ins.id}">✕</button>
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
  modal.innerHTML = `<button class="img-modal-close">✕</button><img src="${src}">`;
  modal.addEventListener('click', () => modal.remove());
  document.body.appendChild(modal);
}

$('#inspireList').addEventListener('click', e => {
  if(e.target.classList.contains('inspire-item-del')){
    inspires = inspires.filter(x=>x.id!==Number(e.target.dataset.id));
    save('inspires', inspires);
    renderInspires();
  }
});
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
const todayFact = teaFacts[new Date().getDate() % teaFacts.length];
$('#teaDailyContent').innerHTML = `<b>${todayFact.title}</b>：${todayFact.text}`;


/* ============================================
   模块三：英语口语 - VOA 跟读
============================================ */
// VOA 文章 —— 内置备用 + 在线拉取
const fallbackArticles = [
  {
    title:'The Value of Time Management',
    meta:'VOA Learning English',
    text:['Time is one of our most valuable resources, yet many people struggle to use it wisely.','Good time management begins with setting clear priorities for each day.','Experts suggest making a list of tasks the night before, so you can start fresh in the morning.','It is also important to take short breaks during the day to stay focused and energized.','Research shows that people who plan their time well feel less stress and get more done.','Remember, managing your time is really about managing your life.']
  },
  {
    title:'A Walk in the Morning',
    meta:'VOA Learning English',
    text:['Walking in the morning is a simple habit that brings many health benefits.','Doctors say just thirty minutes of walking each day can improve your heart health.','Morning walks also help clear your mind and reduce feelings of anxiety.','Many people enjoy listening to music or podcasts while they walk.','Some prefer to walk in silence, paying attention to the sounds of nature around them.','Whatever you choose, a morning walk is a gentle way to start the day.']
  },
  {
    title:'The Joy of Learning Languages',
    meta:'VOA Learning English',
    text:['Learning a new language opens doors to different cultures and ideas.','Studies show that bilingual people often have better memory and problem-solving skills.','The key to success is practice a little bit every single day.','Reading aloud is one of the most effective ways to improve your pronunciation.','Do not be afraid of making mistakes, because mistakes are part of learning.','Over time, your confidence will grow, and speaking will feel more natural.']
  }
];

let voaArticles = load('voaCache') || fallbackArticles;
let records = load('records') || [];

// 每天自动拉取 VOA Learning English 最新文章
async function fetchVOAArticles(){
  try {
    const rssUrl = 'https://learningenglish.voanews.com/api/zq$omekvi_omzrto';
    // 使用 rss2json 免费 API 代理
    const resp = await fetch('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(rssUrl));
    if(!resp.ok) throw new Error('fetch failed');
    const data = await resp.json();
    if(data.items && data.items.length){
      voaArticles = data.items.slice(0, 15).map(item => {
        // 清洗 HTML 标签，拆分为句子
        const raw = (item.description || item.content || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        const sentences = raw.match(/[^.!?]+[.!?]+/g) || [raw];
        return {
          title: item.title,
          meta: 'VOA Learning English · ' + new Date(item.pubDate).toLocaleDateString('zh-CN'),
          text: sentences.filter(s => s.length > 20).slice(0, 10)
        };
      });
      save('voaCache', voaArticles);
    }
  } catch(e){
    // 网络不通就用缓存或内置备用
    voaArticles = load('voaCache') || fallbackArticles;
  }
  renderArticleList();
  renderArticle();
}

// 检查是否需要刷新（每天一次）
const lastFetch = load('voaLastFetch') || 0;
if(Date.now() - lastFetch > 86400000){
  save('voaLastFetch', Date.now());
  fetchVOAArticles();
}

let currentArticleIdx = 0;
let currentUtterance = null;

function renderArticleList(){
  const sel = $('#voaArticle');
  sel.innerHTML = voaArticles.map((a,i)=>`<option value="${i}">${a.title}</option>`).join('');
  sel.value = currentArticleIdx;
}
function renderArticle(){
  const a = voaArticles[currentArticleIdx];
  $('#engTitle').textContent = a.title;
  $('#engMeta').textContent = a.meta;
  $('#engText').innerHTML = a.text.map((s,i)=>
    `<span class="sentence" data-i="${i}">${s}</span>`
  ).join('');
  $$('#engText .sentence').forEach(s => {
    s.addEventListener('click', () => speak(s.textContent, true));
  });
}
function speak(text, highlightEl){
  if(!('speechSynthesis' in window)){ alert('当前浏览器不支持语音合成'); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = parseFloat($('#speedSelect').value);
  const voices = window.speechSynthesis.getVoices();
  const enVoice = voices.find(v => v.lang.startsWith('en') && /female|samantha|zira|google/i.test(v.name)) || voices.find(v=>v.lang.startsWith('en'));
  if(enVoice) u.voice = enVoice;

  $$('#engText .sentence').forEach(el => el.classList.remove('reading'));
  if(highlightEl) highlightEl.classList.add('reading');

  u.onend = () => { if(highlightEl) highlightEl.classList.remove('reading'); currentUtterance=null; };
  currentUtterance = u;
  window.speechSynthesis.speak(u);
}

$('#voaArticle').addEventListener('change', e => { currentArticleIdx = +e.target.value; renderArticle(); });
$('#prevArticle').addEventListener('click', () => {
  currentArticleIdx = (currentArticleIdx - 1 + voaArticles.length) % voaArticles.length;
  $('#voaArticle').value = currentArticleIdx;
  renderArticle();
});
$('#playBtn').addEventListener('click', () => {
  const a = voaArticles[currentArticleIdx];
  speak(a.text.join(' '));
});
$('#speedSelect').addEventListener('change', () => {
  if(currentUtterance){ window.speechSynthesis.cancel(); }
});

// 录音跟读
let mediaRecorder = null, audioChunks = [];
async function startRecord(){
  try {
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, {type:'audio/webm'});
      const url = URL.createObjectURL(blob);
      const rec = {
        id: Date.now(),
        article: voaArticles[currentArticleIdx].title,
        time: new Date().toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}),
        url
      };
      records.unshift(rec);
      save('records', records.map(r => ({...r, url: r.url.startsWith('blob:') ? null : r.url})));
      renderRecords();
      stream.getTracks().forEach(t=>t.stop());
    };
    mediaRecorder.start();
    $('#recordBtn').disabled = true;
    $('#stopRecordBtn').disabled = false;
    $('#recordBtn').textContent = '🔴 录音中...';
  } catch(err){
    alert('无法访问麦克风：' + err.message + '\n请允许浏览器使用麦克风权限。');
  }
}
function stopRecord(){
  if(mediaRecorder && mediaRecorder.state !== 'inactive'){
    mediaRecorder.stop();
  }
  $('#recordBtn').disabled = false;
  $('#stopRecordBtn').disabled = true;
  $('#recordBtn').textContent = '🎙 录音跟读';
}
$('#recordBtn').addEventListener('click', startRecord);
$('#stopRecordBtn').addEventListener('click', stopRecord);

function renderRecords(){
  const list = $('#recordList');
  list.innerHTML = '';
  records.forEach(r => {
    const item = document.createElement('div');
    item.className = 'record-item';
    const playBtn = r.url ? `<button class="record-play" data-url="${r.url}">▶ 播放</button>` : '<span style="font-size:12px;color:var(--text-light)">本会话录音已失效</span>';
    item.innerHTML = `
      <div class="record-name"><span class="rec-article">${escapeHtml(r.article)}</span><span class="rec-time">${r.time}</span></div>
      ${playBtn}
      <button class="record-del" data-id="${r.id}">✕</button>
    `;
    list.appendChild(item);
  });
  $('#recordEmpty').style.display = records.length ? 'none' : 'block';
}
$('#recordList').addEventListener('click', e => {
  if(e.target.classList.contains('record-play')){
    new Audio(e.target.dataset.url).play();
  } else if(e.target.classList.contains('record-del')){
    records = records.filter(r=>r.id!==Number(e.target.dataset.id));
    save('records', records);
    renderRecords();
  }
});

renderArticleList();
renderArticle();
renderRecords();
if('speechSynthesis' in window){
  window.speechSynthesis.onvoiceschanged = () => {};
  window.speechSynthesis.getVoices();
}


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


/* ---------- 工具：HTML 转义 ---------- */
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) }
function escapeAttr(s){ return String(s).replace(/"/g,'&quot;') }
