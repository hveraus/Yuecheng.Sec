import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../dist/agent/index.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
scripts.forEach(source=>new vm.Script(source));
const script=scripts.at(-1);
new vm.Script(script);
const ids=vm.createContext({alerts:[{id:'A-1042'},{id:'A-1045'}]});
vm.runInContext(script.match(/function nextAlertId\(\)\{[^\n]+/)[0],ids);
for(let i=0;i<3;i++)vm.runInContext('alerts.push({id:nextAlertId()})',ids);
assert.equal(vm.runInContext('new Set(alerts.map(a=>a.id)).size===alerts.length',ids),true);
assert.equal(vm.runInContext('alerts.at(-1).id',ids),'A-1048');
const nodes={};
const context=vm.createContext({$:selector=>nodes[selector]??={}});
vm.runInContext(script.slice(script.indexOf('const HZC='),script.indexOf('/* ---------- views')),context);
vm.runInContext('renderHz()',context);
assert.match(nodes['#hzsum'].innerHTML,/23\.6 L \/ 2\.4 kg/);
assert.doesNotMatch(nodes['#hzsum'].innerHTML,/L\/kg/);
console.log('PASS: agent inline syntax, unique event IDs across repeats/injection, separate volume and mass totals');

const overview=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
for(const scene of ['sec','dec','hz'])assert.ok(overview.includes(`href="agent/#${scene}"`));
assert.match(html, /href="\.\.\/index\.html" style="text-decoration:none">总览/);
assert.ok(html.includes("$$('.navitem[data-v]').forEach(b=>b.onclick"));

for(const scene of ['video','patrol','fire']){
 assert.ok(overview.includes(`data-nav="${scene}"`));
 assert.ok(html.includes(`href="../index.html#${scene}"`));
}
