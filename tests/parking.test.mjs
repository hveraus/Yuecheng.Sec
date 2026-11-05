import assert from 'node:assert/strict';
import {createParkingInventory,parkingStats,filterParking} from '../dist/parking.js';
const slots=createParkingInventory();
assert.equal(new Set(slots.map(s=>s.id)).size,700);
assert.deepEqual(parkingStats(slots),{total:700,occupied:386,free:314,mechanical:200});
assert.equal(slots.filter(s=>s.kind==='standard').length,500);
for(let group=1;group<=100;group++){
 const pair=slots.filter(s=>s.group===group);assert.equal(pair.length,2);assert.deepEqual(pair.map(s=>s.level),[0,1]);assert.equal(pair[0].x,pair[1].x);assert.equal(pair[0].z,pair[1].z);assert(pair[1].y>pair[0].y);
}
assert.equal(filterParking(slots,{level:'1'}).length,100);
assert.equal(filterParking(slots,{level:'0'}).length,600);
assert.equal(filterParking(slots,{zone:'M'}).length,200);
assert.equal(filterParking(slots,{query:' m-001-u '})[0].id,'M-001-U');
assert.equal(filterParking(slots,{zone:'A',level:'1'}).length,0);
for(const s of filterParking(slots,{zone:'M',status:'free',level:'1'}))assert(s.zone==='M'&&!s.occupied&&s.level===1);
const before=parkingStats(slots);slots[0].occupied=false;const after=parkingStats(slots);assert.equal(after.free,before.free+1);assert.equal(after.occupied,before.occupied-1);assert.equal(after.free+after.occupied,700);
assert.equal(createParkingInventory()[0].occupied,true,'Demo changes must not mutate initial inventory');
console.log('PASS: 700 unique slots, 500 standard + 100 two-level pairs, occupancy totals, combined filters, independent state updates');
