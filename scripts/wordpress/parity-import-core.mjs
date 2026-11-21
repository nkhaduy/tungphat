/** Transaction prototype. A store must provide *atomic* compareAndReplace.
 * No WordPress adapter is provided: WordPress REST does not satisfy that contract. */
const mapping = new Map([[10,'mdf-thuong-va-chong-am'],[11,'chuan-bi-file-cnc'],[12,'go-ghep-la-gi']]);
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const copy = (value) => structuredClone(value);
function checkRecords(rows) {
  if (!Array.isArray(rows) || rows.length !== mapping.size) throw Error('invalid mapping');
  const seen = new Set();
  for (const row of rows) {
    if (!row || mapping.get(row.id)!==row.slug || row.status!=='publish' || seen.has(row.id)) throw Error('invalid mapping');
    seen.add(row.id);
  }
}
export function createPlan(current, target, blockers) {
  checkRecords(current); checkRecords(target);
  if (!Array.isArray(blockers) || blockers.some(x=>typeof x!=='string' || !x)) throw Error('invalid blockers');
  return { version:1, blockers:[...blockers], operations:[...mapping].map(([id])=>{
    const before=current.find(x=>x.id===id), after=target.find(x=>x.id===id);
    return {id,action:same(before,after)?'unchanged':'update',before:copy(before),after:copy(after)};
  }) };
}
function validatePlan(plan) {
  if (!plan || plan.version!==1 || !Array.isArray(plan.operations)) throw Error('invalid plan');
  const expected=createPlan(plan.operations.map(x=>x.before),plan.operations.map(x=>x.after),plan.blockers);
  if (!same(expected,plan)) throw Error('invalid plan');
}
export async function applyPlan(plan,store,backup,persist) {
  validatePlan(plan);
  if (plan.blockers.length) throw Error('parity blockers prevent apply');
  if (!await backup.verify()) throw Error('backup verification failed');
  for (const op of plan.operations) if (!same(await store.get(op.id),op.before)) throw Error(`post ${op.id} changed since plan`);
  const journal={version:1,state:'applying',entries:[]};
  await persist(copy(journal));
  for (const op of plan.operations.filter(x=>x.action==='update')) {
    const entry={id:op.id,before:copy(op.before),after:copy(op.after),state:'pending'};
    journal.entries.push(entry);
    await persist(copy(journal)); // Durable intent must precede each external mutation.
    const result=await store.compareAndReplace(op.id,copy(op.before),copy(op.after));
    if (!same(result,op.after)) throw Error(`unexpected result for ${op.id}; inspect journal`);
    entry.state='applied'; await persist(copy(journal));
  }
  journal.state='applied'; await persist(copy(journal)); return copy(journal);
}
export async function rollbackJournal(journal,store,persist) {
  if (!journal || journal.version!==1 || !Array.isArray(journal.entries) || !['applying','applied','rolling-back'].includes(journal.state)) throw Error('invalid journal');
  const seen=new Set();
  for (const entry of journal.entries) {
    if (!entry || seen.has(entry.id) || mapping.get(entry.id)!==entry.before?.slug || entry.before?.id!==entry.id || entry.after?.id!==entry.id || entry.after?.slug!==entry.before.slug || entry.before?.status!=='publish' || entry.after?.status!=='publish' || !['pending','applied','reverting','reverted'].includes(entry.state)) throw Error('invalid journal');
    seen.add(entry.id);
    const now=await store.get(entry.id);
    if (entry.state==='reverted' ? !same(now,entry.before) : !(same(now,entry.after) || (['pending','reverting'].includes(entry.state) && same(now,entry.before)))) throw Error(`post ${entry.id} changed; rollback refused`);
  }
  journal.state='rolling-back'; await persist(copy(journal));
  for (const entry of [...journal.entries].reverse()) {
    if (entry.state==='reverted') continue;
    const now=await store.get(entry.id);
    if (same(now,entry.after)) {
      entry.state='reverting'; await persist(copy(journal));
      const result=await store.compareAndReplace(entry.id,copy(entry.after),copy(entry.before));
      if (!same(result,entry.before)) throw Error(`unexpected rollback result for ${entry.id}`);
    } else if (!(['pending','reverting'].includes(entry.state) && same(now,entry.before))) throw Error(`post ${entry.id} changed; rollback refused`);
    entry.state='reverted'; await persist(copy(journal));
  }
  journal.state='reverted'; await persist(copy(journal)); return copy(journal);
}
