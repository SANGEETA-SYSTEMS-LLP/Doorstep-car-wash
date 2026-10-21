import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fitsWasherShift} from '../src/utils/washerSchedule.js';
const shifts=[{day_of_week:4,start_time:'09:00:00',end_time:'17:00:00',is_available:true}];
test('washer shifts require the complete service to fit on the correct day',()=>{
 assert.equal(fitsWasherShift(shifts,'2026-10-15','16:00:00',60),true);
 for(const [date,time,duration] of [['2026-10-15','16:30:00',60],['2026-10-16','10:00:00',30],['2026-10-15','08:59:00',30],['2026-02-30','10:00:00',30],['2026-10-15','23:00:00',120]])assert.equal(fitsWasherShift(shifts,date,time,duration),false);
 assert.equal(fitsWasherShift([],'2026-10-15','10:00:00',30),false);
 assert.equal(fitsWasherShift([{...shifts[0],is_available:false}],'2026-10-15','10:00:00',30),false);
});
