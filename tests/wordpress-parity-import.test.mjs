import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlan, applyPlan, rollbackJournal } from '../scripts/wordpress/parity-import-core.mjs';

const ids = [[10,'mdf-thuong-va-chong-am'],[11,'chuan-bi-file-cnc'],[12,'go-ghep-la-gi']];
const posts = () => ids.map(([id,slug]) => ({id,slug,status:'publish',body:`old-${id}`}));
const targets = () => ids.map(([id,slug]) => ({id,slug,status:'publish',body:`new-${id}`}));
function store(initial=posts()) {
  const data=new Map(initial.map(x=>[x.id,structuredClone(x)]));
  return { data, async get(id){return structuredClone(data.get(id));}, async compareAndReplace(id,old,value){ if(JSON.stringify(data.get(id))!==JSON.stringify(old)) throw Error('conflict'); data.set(id,structuredClone(value)); return structuredClone(value); } };
}
const backup={ async verify(){return true;} };
const save=async()=>{};

test('plan maps exact existing published IDs and identifies no-op changes',()=>{
  const p=posts(); const next=targets(); next[0]=structuredClone(p[0]);
  const plan=createPlan(p,next,[]);
  assert.deepEqual(plan.operations.map(x=>[x.id,x.action]),[[10,'unchanged'],[11,'update'],[12,'update']]);
  assert.throws(()=>createPlan(p.map(x=>x.id===10?{...x,id:32}:x),next,[]),/mapping/);
  assert.throws(()=>createPlan([...p,p[0]],next,[]),/mapping/);
});
test('missing assets and failed backup stop all writes',async()=>{
  const s=store(); let plan=createPlan(posts(),targets(),['missing required featured image 10']);
  await assert.rejects(applyPlan(plan,s,backup,save),/blocker/); assert.deepEqual([...s.data.values()],posts());
  plan=createPlan(posts(),targets(),[]);
  await assert.rejects(applyPlan(plan,s,{async verify(){return false;}},save),/backup/); assert.deepEqual([...s.data.values()],posts());
});
test('apply is idempotent and rollback restores only original mapped posts',async()=>{
  const s=store([...posts(),{id:32,slug:'draft',status:'draft',body:'untouched'}]);
  const first=await applyPlan(createPlan(posts(),targets(),[]),s,backup,save);
  const second=await applyPlan(createPlan(targets(),targets(),[]),s,backup,save);
  assert.equal(second.entries.length,0);
  await rollbackJournal(first,s,save);
  assert.deepEqual(await s.get(10),posts()[0]); assert.deepEqual(await s.get(11),posts()[1]); assert.deepEqual(await s.get(12),posts()[2]);
  assert.equal((await s.get(32)).body,'untouched');
});
test('refuses stale data and refuses rollback over a later edit',async()=>{
  const s=store(); const plan=createPlan(posts(),targets(),[]); s.data.set(10,{...posts()[0],body:'edited'});
  await assert.rejects(applyPlan(plan,s,backup,save),/changed/);
  const current=posts(); s.data.set(10,current[0]); const journal=await applyPlan(plan,s,backup,save);
  s.data.set(12,{...targets()[2],body:'editor change'});
  await assert.rejects(rollbackJournal(journal,s,save),/changed/); assert.equal((await s.get(12)).body,'editor change');
});
test('journal is persisted before write and failure halts mutation',async()=>{
  const s=store(); await assert.rejects(applyPlan(createPlan(posts(),targets(),[]),s,backup,async()=>{throw Error('disk full');}),/disk full/);
  assert.deepEqual([...s.data.values()],posts());
});

test('audit reports each unapproved featured image and detects wrong local IDs', async()=>{
  const { auditArticles }=await import('../scripts/wordpress/parity-audit.mjs');
  const source=ids.map(([id,slug])=>({id,slug,title:`Title ${id}`,excerpt:`Excerpt ${id}`,publishedAt:'2026-07-16',featuredImage:`https://cdn.mdftungphat.com/uploads/${id}.webp`,faq:[{}],relatedProducts:['x'],relatedArticles:[]}));
  const wp=source.map(x=>({id:x.id,slug:x.slug,status:'publish',title:{rendered:x.title},excerpt:{rendered:x.excerpt},date_gmt:'2026-07-16T12:00:00',featured_media:0,tungphat_seo:{title:'',description:''}}));
  const result=auditArticles(source,wp,'https://cdn.mdftungphat.com/uploads/10.webp,src,proof,usage,note,UNCHANGED LEGACY\n');
  assert.equal(result.articles.length,3);
  assert.equal(result.blockers.filter(x=>x.includes('featured')).length,3);
  assert.throws(()=>auditArticles(source,wp.map(x=>x.id===10?{...x,id:32}:x),''),/mapping/);
});

test('rollback resumes after a journal write fails following a successful restore',async()=>{
  const s=store(); const journal=await applyPlan(createPlan(posts(),targets(),[]),s,backup,save);
  let durable; let fail=true;
  const flaky=async j=>{if(j.entries.some(e=>e.id===12&&e.state==='reverted')&&fail){fail=false;throw Error('disk full');}durable=structuredClone(j);};
  await assert.rejects(rollbackJournal(journal,s,flaky),/disk full/);
  assert.deepEqual(await s.get(12),posts()[2]);
  await rollbackJournal(durable,s,save);
  assert.deepEqual(await s.get(10),posts()[0]); assert.deepEqual(await s.get(11),posts()[1]);
});

test('backup checker detects changed database rows and missing uploads', async()=>{
  const {mkdtemp, mkdir, writeFile, unlink, rm}=await import('node:fs/promises'); const os=await import('node:os'); const path=await import('node:path'); const {spawnSync}=await import('node:child_process');
  const dir=await mkdtemp(path.join(os.tmpdir(),'wp-backup-check-'));
  try {
    for(const side of ['live','backup']){await mkdir(path.join(dir,side,'uploads'),{recursive:true}); await writeFile(path.join(dir,side,'uploads','a.png'),'same'); const init=spawnSync('python3',['-c','import sqlite3,sys; c=sqlite3.connect(sys.argv[1]); c.execute("create table posts (id integer primary key, body text)"); c.execute("insert into posts values (10, ?)", ("test",)); c.commit()',path.join(dir,side,'wordpress.sqlite')]); assert.equal(init.status,0);}
    const run=()=>spawnSync('python3',['scripts/wordpress/verify-local-backup.py',path.join(dir,'live','wordpress.sqlite'),path.join(dir,'live','uploads'),path.join(dir,'backup','wordpress.sqlite'),path.join(dir,'backup','uploads')],{encoding:'utf8'});
    assert.equal(run().status,0);
    const index=spawnSync('python3',['-c','import sqlite3,sys; c=sqlite3.connect(sys.argv[1]); c.execute("create index body_idx on posts(body)"); c.commit()',path.join(dir,'live','wordpress.sqlite')]); assert.equal(index.status,0); assert.equal(run().status,1);
    const drop=spawnSync('python3',['-c','import sqlite3,sys; c=sqlite3.connect(sys.argv[1]); c.execute("drop index body_idx"); c.commit()',path.join(dir,'live','wordpress.sqlite')]); assert.equal(drop.status,0);
    await writeFile(path.join(dir,'live','uploads','a.png'),'changed'); assert.equal(run().status,1);
    await unlink(path.join(dir,'live','uploads','a.png')); assert.equal(run().status,1);
    await writeFile(path.join(dir,'live','uploads','a.png'),'same');
    const edit=spawnSync('python3',['-c','import sqlite3,sys; c=sqlite3.connect(sys.argv[1]); c.execute("update posts set body= ?", ("changed",)); c.commit()',path.join(dir,'live','wordpress.sqlite')]); assert.equal(edit.status,0); assert.equal(run().status,1);
  } finally {await rm(dir,{recursive:true,force:true});}
});

test('local dry-run executable rejects apply and rollback before any network access',async()=>{
  const {spawnSync}=await import('node:child_process');
  for(const flag of ['--apply','--rollback']){
    const result=spawnSync(process.execPath,['scripts/wordpress/parity-import.mjs',flag],{encoding:'utf8'});
    assert.equal(result.status,1); assert.match(result.stderr,/disabled/);
  }
});

test('a lost apply response leaves a recoverable pending journal',async()=>{
  const s=store(); const replace=s.compareAndReplace; let first=true;
  s.compareAndReplace=async(...args)=>{const r=await replace(...args);if(first){first=false;throw Error('lost response');}return r;};
  let durable; await assert.rejects(applyPlan(createPlan(posts(),targets(),[]),s,backup,async j=>{durable=structuredClone(j);}),/lost response/);
  assert.equal(durable.entries[0].state,'pending'); assert.deepEqual(await s.get(10),targets()[0]);
  await rollbackJournal(durable,s,save); assert.deepEqual(await s.get(10),posts()[0]);
});
