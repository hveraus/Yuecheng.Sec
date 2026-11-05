import {demoHistory} from './safety-index.js';
const host=document.querySelector('#safetyIndex'),dialog=document.querySelector('#safetyDialog');
const overviewMetrics=document.querySelector('.index-overview-metrics');
let history,expanded=false;
try{expanded=localStorage.getItem('yuecheng-index-expanded')==='true';}catch{}
function applyExpansion(){
 host.classList.toggle('index-collapsed',!expanded);
 host.querySelector('#indexExpanded').hidden=!expanded;
 const toggle=host.querySelector('#indexToggle');
 toggle.setAttribute('aria-expanded',String(expanded));
 toggle.textContent=expanded?'收起详情 ⌃':'展开详情 ⌄';
}
const number=v=>v===null?'—':Number(v.toFixed(1)).toLocaleString('zh-CN');
function chart(values,label){
 const valid=values.filter(Number.isFinite),min=Math.min(...valid),max=Math.max(...valid),span=max-min||1;
 const points=values.map((v,i)=>v===null?null:[8+i*38,48-(v-min)/span*36]);
 let paths='',previous=null;
 for(const p of points){if(p&&previous)paths+=`M${previous.join(',')}L${p.join(',')}`;previous=p;}
 return `<svg viewBox="0 0 244 58" role="img" aria-label="${label}：${values.map(number).join('、')}"><path d="M8 48H236" stroke="#ffffff16"/><path d="${paths}" fill="none" stroke="currentColor" stroke-width="2"/>${points.filter(Boolean).map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="currentColor"/>`).join('')}</svg>`;
}
function openDimension(id){
 const today=history[6],g=today.groups.find(g=>g.id===id);
 document.querySelector('#safetyDialogTitle').textContent=`${g.name} · ${number(g.score)} 分 · 权重 ${g.weight*100}%`;
 document.querySelector('#safetyDialogBody').innerHTML=`<p class="index-note">演示配置 v0.1 · 同一口径计算 7 日；阈值待院方书面确认。缺失项不计分，其余项按权重重新归一。排队日均与高峰各占半项权重。</p><div class="index-atoms">${g.items.map(m=>`<article><div class="atom-title"><h3>${m.name}</h3><b>${number(m.score)}<small> 分</small></b></div><p class="atom-value">${number(m.value)} <small>${m.unit} · 当日实际值（演示）</small></p>${m.value===null?'<span class="index-warning">数据不全 · 未计分</span>':''}${chart(history.map(d=>d.values[m.id]),m.name+'近7日实际值')}<div class="index-dates"><span>${history[0].date}</span><span>${history[6].date}</span></div><dl><dt>差 / 良 / 优阈值</dt><dd>${m.thresholds.join(' / ')} ${m.unit} → 0 / 70 / 100 分，区间线性插值</dd><dt>计算口径</dt><dd>${m.formula}</dd><dt>数据来源</dt><dd>${m.source}</dd></dl><details><summary>查看 7 日数值</summary><p>${history.map(d=>`${d.date}：${number(d.values[m.id])}`).join(' · ')}</p></details></article>`).join('')}</div><div class="index-note">月度抽盘值在有效月份内沿用，并非每日抽盘；存在采样偏差。实际接入时须核验数据时间和有效期，过期视为缺失。当前所有数值均为演示快照，未接入业务平台。</div>`;
 dialog.showModal();
}
function render(mode){
 history=demoHistory(mode);const today=history[6],yesterday=history[5],valid=history.map(d=>d.score).filter(Number.isFinite),delta=today.score===null||yesterday.score===null?null:today.score-yesterday.score;
 const coverage=d=>d.groups.flatMap(g=>g.items.filter(m=>m.score!==null).map(m=>m.id)).join(',');
 const comparable=coverage(today)===coverage(yesterday);
 host.dataset.grade=today.grade;
 const advice=document.querySelector('#indexAdvice');
 host.innerHTML=`<div class="index-summary"><div class="index-eyebrow">院区安全态势<small class="index-demo-label">演示数据</small></div><div class="index-score"><strong>${number(today.score)}</strong><span>/ 100 <b>${today.grade}</b></span></div><span class="index-change">${!comparable?'覆盖变化 · 暂不比较':delta===null?'暂无可比数据':`较昨日 ${delta>0?'+':''}${delta} 分 · ${delta<0?'态势下滑':delta>0?'态势改善':'持平'}`}</span><button id="indexToggle" class="index-toggle" aria-controls="indexExpanded" aria-expanded="false">展开详情 ⌄</button></div><div class="index-quick">${today.groups.map(g=>`<button data-dimension="${g.id}" aria-label="查看${g.name}指标"><span>${g.name.slice(0,2)}</span><b>${number(g.score)}</b><i style="--score:${g.score??0}%"></i></button>`).join('')}</div><div id="indexExpanded" class="index-expanded" hidden><div class="index-trend"><span>近 7 日区间 <b>${valid.length?Math.min(...valid)+'–'+Math.max(...valid):'—'}</b></span>${chart(history.map(d=>d.score),'近7日指数')}<div class="index-dates"><span>${history[0].date}</span><span>${history[6].date}</span></div></div><div class="index-dimensions">${today.groups.map(g=>`<button data-dimension="${g.id}" aria-label="查看${g.name}原子指标"><span>${g.name}<small>${g.weight*100}%</small></span><strong>${number(g.score)}<small> ↗</small></strong><i style="--score:${g.score??0}%"></i><small>${g.incomplete?'数据不全':'查看指标与阈值'}</small></button>`).join('')}</div><div class="index-meta"><span>演示数据 · 基线期 · 配置待确认 ${today.incomplete?'· 数据不全':''}</span><label>演示场景 <select id="indexScenario"><option value="baseline">日常态势</option><option value="pressure">风险升高</option><option value="missing">数据缺失</option></select></label><button id="indexRules">口径与使用边界 ↗</button></div></div>`;
 host.querySelector('.index-quick').before(overviewMetrics);
 host.querySelector('#indexExpanded').append(advice);
 applyExpansion();
 const toggleExpansion=()=>{expanded=!expanded;applyExpansion();try{localStorage.setItem('yuecheng-index-expanded',String(expanded));}catch{}};
 host.querySelector('#indexToggle').onclick=toggleExpansion;
 host.querySelector('#indexScenario').value=mode;host.querySelector('#indexScenario').onchange=e=>render(e.target.value);
 host.querySelectorAll('[data-dimension]').forEach(b=>b.onclick=()=>openDimension(b.dataset.dimension));
 advice.hidden=!(today.score!==null&&today.score<55);
 advice.innerHTML=`<div class="panel-heading"><h2>优先改进 · 指数低于 55</h2></div><p>按对总分的加权损失排序</p>${today.drivers.slice(0,2).map(m=>`<button data-dimension="${m.dimension}"><b>${m.name} <span>拖低 ${number(m.loss)} 分</span></b><p>${m.action}</p><small>查看指标依据 ↗</small></button>`).join('')}`;
 advice.querySelectorAll('button').forEach(b=>b.onclick=()=>openDimension(b.dataset.dimension));
 host.querySelector('#indexRules').onclick=()=>{
  document.querySelector('#safetyDialogTitle').textContent='指数口径与使用边界';
  document.querySelector('#safetyDialogBody').innerHTML=`<div class="index-rules"><h3>15 项计分 · 5 个维度</h3><p>表列 14 项业务指标，其中入口排队拆为日均与高峰两项计分（各半权重），共 15 个计分项；其它项在维度内等权。各入口取最差值是演示口径，正式口径须确认。</p><h3>合成与分级</h3><p>原子指标按差 / 良 / 优阈值映射 0 / 70 / 100 分，线性插值并截断至 0–100。指数为五维得分按 15% / 20% / 25% / 25% / 15% 加权后取整。85–100 良好，70–84 正常，55–69 关注，低于 55 预警并显示前两项建议。</p><h3>缺失与可比性</h3><p>零分母、无有效数据均不计分；维度内重新归一。整个维度缺失时不生成总分。覆盖变化时不显示日环比，趋势缺失不连线。正式历史需按同一版本重算或标记版本变更。</p><h3>防作弊核验 · 待业务接入</h3><p>报修下线相机仍纳入已接入分母，在线状态与工单交叉核验；巡逻打卡与定位轨迹核验。事件须有跨系统统一事件 ID 后去重。当前没有真实平台接口，未执行真实数据核验。</p><h3>上线配置与基线期</h3><p>三档阈值、维度权重及是否对外发布均需院方书面确认。当前为未批准的演示参数，默认仅内部参考。上线首月建立基线，运行三个月复核权重；开始真实统计后低分不等于安全突然恶化。</p><h3>管理参考，非安全结论</h3><p>仅作本院纵向对比，不跨院排名、不评优、不用于个人考核，不替代事故调查或责任认定。高分不保证无事故；危化品依赖月度人工抽盘，自动读取结果仍存在采样偏差。</p></div>`;
  dialog.showModal();
 };
}
document.querySelector('#safetyDialogClose').onclick=()=>dialog.close();
dialog.addEventListener('keydown',e=>{if(e.key==='Escape')e.stopPropagation();});
render('baseline');
