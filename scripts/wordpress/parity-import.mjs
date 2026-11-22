/** Local-only, read-only migration audit. Apply/rollback are deliberately disabled. */
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { auditArticles } from './parity-audit.mjs';

async function main() {
  if (process.argv.slice(2).some(x=>x!=='--dry-run')) throw Error('apply and rollback are disabled: no verified WordPress transactional adapter');
  const root=process.cwd();
  const source=JSON.parse(await readFile(path.join(root,'docs/release-and-wordpress-migration-2026-11/fixtures/final-payload-articles.json'),'utf8'));
  const manifest=await readFile(path.join(root,'docs/search-ai-visibility-2026-11/phase5/RELEASE_ASSET_RIGHTS.csv'),'utf8');
  const response=await fetch('http://127.0.0.1:9400/wp-json/wp/v2/posts?include=10,11,12&per_page=3&_embed=1',{
    headers:{cookie:'playground_auto_login_already_happened=1'},redirect:'error',signal:AbortSignal.timeout(5000),
  });
  if(!response.ok) throw Error(`local WordPress REST HTTP ${response.status}`);
  const posts=await response.json();
  if(!Array.isArray(posts) || posts.length!==3) throw Error('invalid local REST response');
  const audit=auditArticles(source,posts,manifest);
  const check=spawnSync(process.execPath,['scripts/wordpress/parity-preflight.mjs'],{cwd:root,encoding:'utf8',maxBuffer:1024*1024});
  let figures;
  try {figures=JSON.parse(check.stdout).assets;} catch {throw Error('figure asset preflight failed');}
  for(const asset of figures) if(!asset.ok) audit.blockers.push(`${asset.slug}: required figure ${asset.assetPath}: ${asset.reason}`);
  const base=path.join(os.homedir(),'.wordpress-playground');
  const wp=path.join(base,'sites/5495a7aaa79a0f44bdd488918873647412a00ed6a5f20a3b8b463b32cf68124b/wp-content');
  const backup=path.join(base,'tungphat-backups/phase11-20261118-153438');
  const verify=spawnSync('python3',['scripts/wordpress/verify-local-backup.py',path.join(wp,'database/.ht.c1f6798ce32320fb1c2610e0c62c5ed5/.ht.sqlite'),path.join(wp,'uploads'),path.join(backup,'wordpress.sqlite'),path.join(backup,'uploads')],{cwd:root,encoding:'utf8',timeout:30000,maxBuffer:1024*1024});
  let backupResult;
  try {backupResult=JSON.parse(verify.stdout);} catch {backupResult={ok:false,error:'backup comparison unavailable',restore_tested:false};}
  if(verify.status!==0 || !backupResult.ok) audit.blockers.push('Full existing backup does not match current local database and uploads; restore has not been tested');
  console.log(JSON.stringify({mode:'dry-run',target:'http://127.0.0.1:9400',mapping:audit.articles,figureAssets:figures,backup:backupResult,blockers:audit.blockers,applyEnabled:false,rollbackEnabled:false},null,2));
  if(audit.blockers.length) process.exitCode=1;
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
