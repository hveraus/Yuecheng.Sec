// Draft configuration: thresholds require written hospital approval before production use.
export const dimensions=[['device','设备健康',.15],['traffic','通行秩序',.20],['event','事件态势',.25],['response','处置效能',.25],['compliance','合规与在岗',.15]];
// Thresholds ordered poor / fair / excellent, mapped to 0 / 70 / 100.
const metric=(id,dimension,name,unit,thresholds,source,formula,action,weight=1)=>({id,dimension,name,unit,thresholds,source,formula,action,weight});
export const metrics=[
 metric('online','device','摄像头在线率','%',[90,97,99.5],'视频平台 × 运维工单','在线路数 ÷ 已接入路数；报修设备仍在分母内','核查离线清单与故障工单，安排修复。'),
 metric('repair','device','设备故障平均恢复时长','小时',[48,12,2],'运维工单','已关闭工单的（关闭时间 − 报修时间）均值','优先处理积压故障，核验恢复时间。'),
 metric('queueMean','traffic','入口排队日均值','辆',[25,8,2],'车牌识别','各入口等间隔采样日均排队数，取最差入口','检查入口流量，安排高峰分流。',.5),
 metric('queuePeak','traffic','入口排队高峰值','辆',[60,20,5],'车牌识别','各入口高峰时段最大排队数，取最差入口','核实拥堵后，按预案开放备用入口。',.5),
 metric('turnover','traffic','车位周转率','次/位',[.2,1,2],'车位相机','日周转次数 ÷ 车位数','核查长停车辆并优化车位引导。'),
 metric('throughput','traffic','安检通道通行效率','人/小时',[80,180,240],'安检统计','有效开放时间内通过人数 ÷ 开放小时','核查通道设备，增开可用安检通道。'),
 metric('events','event','今日预警事件数','起',[50,15,0],'各场景事件库','按统一事件 ID 跨系统去重；不按上报条数计数','复核集中发生的事件，安排现场排查。'),
 metric('highRisk','event','高危事件占比','%',[50,15,0],'各场景事件库','高等级事件 ÷ 去重事件总数；零事件时不计分','优先复核高危事件并启动对应处置预案。'),
 metric('repeat','event','重复点位事件数','起',[20,5,0],'事件库','同一位置近 7 日 ≥ 3 次时，计入该位置去重事件数','对重复发生点位进行专项巡查。'),
 metric('response','response','响应时长中位数','分钟',[60,10,2],'工作台','告警产生至首次处置动作时长的中位数；未响应另列超时','检查派单与接单链路，调度就近人员。'),
 metric('closure','response','闭环率','%',[40,85,100],'工作台','已闭环 ÷ 应闭环；超时未处置不计入已闭环','逐项核查应闭环清单并补充复核记录。'),
 metric('overdue','response','超时未处置数','起',[10,2,0],'工作台','超过 24 小时且没有首次处置动作的去重事件数','立即派单跟进超过 24 小时的未处置事件。'),
 metric('patrol','compliance','巡逻打卡完整率','%',[60,90,100],'人员定位 × 轨迹核验','有效实际打卡点 ÷ 计划打卡点；剔除无轨迹佐证记录','核验缺失打卡与定位轨迹，补查漏巡区域。'),
 metric('chemical','compliance','危化品台账准确率','%',[80,95,100],'危化品系统 · 月度人工抽盘','当月抽盘相符项 ÷ 抽盘项；有采样偏差，非每日实盘','核对差异台账并安排复盘。'),
 metric('staff','compliance','重点区域在岗率','%',[60,90,100],'人员定位','实际在岗人数 ÷ 应到人数','核实重点岗位缺岗，安排补岗。')
];
export function normalize(value,thresholds){
 if(!Number.isFinite(value)||value<0)return null;
 const [poor,fair,excellent]=thresholds,sign=excellent>poor?1:-1,x=value*sign,a=poor*sign,b=fair*sign,c=excellent*sign;
 if(!(a<b&&b<c))throw new Error('Invalid thresholds');
 if(x<=a)return 0;if(x>=c)return 100;
 return x<=b?(x-a)/(b-a)*70:70+(x-b)/(c-b)*30;
}
export const ratio=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&a>=0&&b>0?a/b:null;
export function median(values){const a=values.filter(Number.isFinite).sort((a,b)=>a-b);return a.length?(a[Math.floor((a.length-1)/2)]+a[Math.floor(a.length/2)])/2:null;}
export function grade(score){return score===null?'数据不足':score>=85?'良好':score>=70?'正常':score>=55?'关注':'预警';}
export function calculate(values){
 const items=metrics.map(m=>({...m,value:values[m.id]??null,score:normalize(values[m.id],m.thresholds)}));
 const groups=dimensions.map(([id,name,weight])=>{const all=items.filter(m=>m.dimension===id),valid=all.filter(m=>m.score!==null),w=valid.reduce((s,m)=>s+m.weight,0);return {id,name,weight,items:all,incomplete:valid.length!==all.length,score:w?valid.reduce((s,m)=>s+m.score*m.weight,0)/w:null};});
 // Never silently redistribute a whole missing dimension's weight.
 const score=groups.some(g=>g.score===null)?null:Math.round(groups.reduce((s,g)=>s+g.score*g.weight,0));
 const drivers=groups.flatMap(g=>{const w=g.items.filter(m=>m.score!==null).reduce((s,m)=>s+m.weight,0);return g.items.filter(m=>m.score!==null).map(m=>({...m,loss:(100-m.score)*g.weight*m.weight/w}));}).sort((a,b)=>b.loss-a.loss);
 return {score,grade:grade(score),groups,drivers,incomplete:items.some(m=>m.score===null)};
}
export function demoHistory(mode='baseline'){
 const base={online:864/872*100,repair:8,queueMean:12,queuePeak:35,turnover:1.3,throughput:190,events:12,highRisk:1/12*100,repeat:4,response:median([1,2,4,5,9]),closure:9/12*100,overdue:1,patrol:152/157*100,chemical:98,staff:32/36*100};
 return Array.from({length:7},(_,i)=>{
  const values=Object.fromEntries(metrics.map(m=>{const factor=[.75,.8,.7,.85,.9,.85,1][i];return [m.id,m.thresholds[2]>m.thresholds[0]?Math.min(m.unit==='%'?100:Infinity,base[m.id]/factor):base[m.id]*factor];}));
  values.chemical=base.chemical;
  for(const id of ['events','repeat','overdue','queuePeak'])values[id]=Math.round(values[id]);
  if(mode==='pressure'&&i===6)Object.assign(values,{queueMean:28,queuePeak:65,events:48,highRisk:45,response:45,closure:45,overdue:9});
  if(mode==='missing'&&i===6)Object.assign(values,{online:null,chemical:null});
  const date=new Date();date.setDate(date.getDate()-6+i);
  return {date:date.toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit'}),values,...calculate(values)};
 });
}
