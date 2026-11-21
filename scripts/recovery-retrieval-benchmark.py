#!/usr/bin/env python3
"""Small deterministic lexical retrieval benchmark; no external AI is called."""
import concurrent.futures
import html.parser
import math
import re
import urllib.request
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ORIGIN = 'https://mdftungphat.com'
CASES = ROOT / 'docs/recovery-2026-11-19/retrieval-cases.md'
OUTPUT = ROOT / 'docs/recovery-2026-11-19/internal-retrieval-results.md'
STOP = set('là gì có các của và cho trong nào thế nào như sao ở với trên được không một hay khi nào theo từ tại về tìm hiểu tôi cần hỏi thông tin những này đó'.split())
def terms(text):
    return [w for w in re.findall(r'[^\W_]+', text.lower(), re.UNICODE) if len(w) > 1 and w not in STOP]
class Content(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(); self.main=0; self.skip=0; self.capture=0; self.buffer=[]; self.fragments=[]
    def handle_starttag(self, tag, attrs):
        if tag == 'main': self.main += 1
        if self.main and tag in ('nav','script','style','footer'): self.skip += 1
        if self.main and not self.skip and tag in ('h1','h2','h3','p','li'): self.capture += 1
    def handle_data(self, data):
        if self.main and not self.skip and self.capture: self.buffer.append(data)
    def handle_endtag(self, tag):
        if self.main and not self.skip and tag in ('h1','h2','h3','p','li') and self.capture:
            self.capture -= 1
            if not self.capture:
                text=' '.join(' '.join(self.buffer).split()); self.buffer=[]
                if len(text)>=20: self.fragments.append(text)
        if self.main and tag in ('nav','script','style','footer') and self.skip: self.skip -= 1
        if tag=='main' and self.main: self.main -= 1

def fetch(path):
    try:
        req=urllib.request.Request(ORIGIN+path,headers={'User-Agent':'Mozilla/5.0 (compatible; InternalRetrievalTest/1.0)'})
        with urllib.request.urlopen(req,timeout=20) as response:
            if response.status != 200 or response.geturl().rstrip('/') != (ORIGIN+path).rstrip('/'): return path, []
            parser=Content();parser.feed(response.read(2_000_000).decode('utf-8','replace'));return path, parser.fragments
    except Exception: return path, []

cases=[]
for line in CASES.read_text().splitlines():
    fields=[s.strip() for s in line.strip().strip('|').split('|')]
    if len(fields)>=6 and re.fullmatch(r'\d\d',fields[0]):
        paths=list(dict.fromkeys(re.findall(r'(?<![\w])/(?:[a-z0-9-]+/)*',fields[2])))
        cases.append((fields[0],fields[1],paths))
paths=sorted({p for _,_,paths in cases for p in paths})
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool: docs=dict(pool.map(fetch,paths))
doc_terms={p:set(terms(' '.join(parts))) for p,parts in docs.items()}
df=Counter(token for tokens in doc_terms.values() for token in tokens)
lines=['# Kiểm thử truy hồi nội bộ', '', 'Chạy tìm kiếm từ vựng trên nội dung `<main>` của các URL nguồn dự kiến trong 33 câu hỏi. Xếp hạng theo từ khớp và độ hiếm; PASS chỉ nghĩa là một URL nguồn dự kiến nằm trong top 3, không chứng minh câu trả lời đúng, đủ hoặc phù hợp trích dẫn; trích đoạn ứng viên được chọn theo từ khóa và cần người kiểm tra ngữ cảnh. Không gọi ChatGPT, Gemini, Claude hay Perplexity. Corpus giới hạn các URL dự kiến, không đại diện toàn web.', '', '| ID | Nguồn dự kiến | Kết quả truy hồi top 3 | Discovery | Lý do | Trích đoạn ứng viên cần đối chiếu | Đánh giá câu trả lời |', '|---|---|---|---|---|---|---|']
for id_, question, expected in cases:
    q=set(terms(question)); scores=[]
    for path,tokens in doc_terms.items():
        score=sum(math.log((len(docs)+1)/(df[t]+1))+1 for t in q & tokens)
        if score>0: scores.append((score,path))
    ranked=[p for _,p in sorted(scores,key=lambda item:(-item[0],item[1]))[:3]]
    result='BLOCKED' if not expected or any(not docs.get(p) for p in expected) else ('PASS' if any(p in ranked for p in expected) else 'FAIL')
    reason = 'Nguồn dự kiến không nằm trong top 3' if result == 'FAIL' else ('Không đọc được nguồn dự kiến' if result == 'BLOCKED' else '—')
    candidates = [(len(q & set(terms(part))), path, part) for path in expected for part in docs.get(path, []) if len(part) >= 60]
    best = max(candidates, default=(0, '', ''), key=lambda item: item[0])
    evidence = (best[1] + ': ' + best[2][:220].replace('|', '/') + ('…' if len(best[2]) > 220 else '')) if best[0] else 'Không tìm được đoạn khớp từ khóa'
    lines.append(f'| {id_} | {", ".join(expected)} | {", ".join(ranked) or "không có"} | {result} | {reason} | {evidence} | NOT RUN |')
OUTPUT.write_text('\n'.join(lines)+'\n')
print(f'Internal benchmark: {len(cases)} cases; {sum("| PASS |" in l for l in lines)} PASS, {sum("| FAIL |" in l for l in lines)} FAIL, {sum("| BLOCKED |" in l for l in lines)} BLOCKED; answer accuracy NOT RUN.')
