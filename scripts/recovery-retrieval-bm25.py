#!/usr/bin/env python3
"""Independent production-only lexical comparison; does not evaluate answers."""
import concurrent.futures
import html.parser
import math
import re
import sys
import unicodedata
import urllib.request
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ORIGIN = 'https://mdftungphat.com'
HOLDOUT = len(sys.argv) == 2 and sys.argv[1] == '--holdout'
if len(sys.argv) > 1 and not HOLDOUT:
    raise SystemExit('Usage: recovery-retrieval-bm25.py [--holdout]')
CASES = ROOT / ('docs/recovery-2026-11-19/retrieval-holdout.md' if HOLDOUT else 'docs/recovery-2026-11-19/retrieval-cases.md')
OUTPUT = ROOT / ('docs/recovery-2026-11-19/bm25-holdout-results.md' if HOLDOUT else 'docs/recovery-2026-11-19/bm25-retrieval-results.md')
STOP = set('la gi co cac cua va cho trong nao the nhu sao o voi tren duoc khong mot hay khi theo tu tai ve tim hieu toi can hoi thong tin nhung nay do'.split())
def tokens(text):
    text = unicodedata.normalize('NFKD', text.casefold().replace('đ', 'd'))
    text = ''.join(c for c in text if not unicodedata.combining(c))
    return [w for w in re.findall(r'[^\W_]+', text) if len(w) > 1 and w not in STOP]
class Extract(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(); self.main = 0; self.skip = 0; self.heading = 0; self.body = []; self.titles = []
    def handle_starttag(self, tag, attrs):
        if tag == 'main': self.main += 1
        if self.main and tag in ('nav', 'script', 'style', 'footer'): self.skip += 1
        if self.main and not self.skip and tag in ('h1', 'h2'): self.heading += 1
    def handle_endtag(self, tag):
        if self.main and not self.skip and tag in ('h1', 'h2') and self.heading: self.heading -= 1
        if self.main and tag in ('nav', 'script', 'style', 'footer') and self.skip: self.skip -= 1
        if tag == 'main' and self.main: self.main -= 1
    def handle_data(self, data):
        if self.main and not self.skip:
            self.body.append(data)
            if self.heading: self.titles.append(data)
def fetch(path):
    try:
        req = urllib.request.Request(ORIGIN + path, headers={'User-Agent': 'Mozilla/5.0 (compatible; InternalRetrievalTest/2.0)'})
        with urllib.request.urlopen(req, timeout=20) as response:
            if response.status != 200 or response.geturl().rstrip('/') != (ORIGIN + path).rstrip('/'): return path, None
            p = Extract(); p.feed(response.read(2_000_000).decode('utf-8', 'replace'))
            return path, (tokens(' '.join(p.body)), tokens(' '.join(p.titles)))
    except Exception: return path, None
cases = []
for line in CASES.read_text().splitlines():
    fields = [s.strip() for s in line.strip().strip('|').split('|')]
    if len(fields) >= 6 and re.fullmatch(r'\d\d', fields[0]):
        cases.append((fields[0], fields[1], list(dict.fromkeys(re.findall(r'(?<![\w])/(?:[a-z0-9-]+/)*', fields[2])))))
paths = sorted({p for _, _, expected in cases for p in expected})
if HOLDOUT:
    baseline = (ROOT / 'docs/recovery-2026-11-19/retrieval-cases.md').read_text()
    for line in baseline.splitlines():
        fields = [s.strip() for s in line.strip().strip('|').split('|')]
        if len(fields) >= 6 and re.fullmatch(r'\d\d', fields[0]):
            paths.extend(re.findall(r'(?<![\w])/(?:[a-z0-9-]+/)*', fields[2]))
    paths = sorted(set(paths))
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool: docs = dict(pool.map(fetch, paths))
available = {p: d for p, d in docs.items() if d and d[0]}
df = Counter(t for body, _ in available.values() for t in set(body))
avg = sum(len(d[0]) for d in available.values()) / max(1, len(available))
lines = ['# So sánh retrieval BM25 nội bộ', '', 'Corpus chỉ gồm các URL nguồn dự kiến trên production; không trộn bản local. Chuẩn hóa Unicode và dấu, BM25 trên main và cộng điểm H1/H2. Nguồn kỳ vọng và câu hỏi giữ nguyên; câu nhiều nguồn chỉ yêu cầu một nguồn ở top 3, không chứng minh đủ căn cứ. Không phải kết quả công cụ tìm kiếm hoặc chatbot, không đánh giá tính đúng của câu trả lời.', '', '| ID | Top 3 | Hạng nguồn đầu tiên | Kết quả |', '|---|---|---:|---|']
reciprocal = []; ranks = []
for id_, question, expected in cases:
    query = set(tokens(question)); scores = []
    for path, (body, headings) in available.items():
        counts = Counter(body); hc = Counter(headings); score = 0.0
        for t in query:
            if not counts[t]: continue
            idf = math.log(1 + (len(available) - df[t] + .5) / (df[t] + .5))
            score += idf * counts[t] * 2.2 / (counts[t] + 1.2 * (.25 + .75 * len(body) / avg)) + .5 * idf * min(hc[t], 1)
        if score: scores.append((score, path))
    ranking = [p for _, p in sorted(scores, key=lambda x: (-x[0], x[1]))]
    blocked = not expected or any(p not in available for p in expected)
    rank = min((ranking.index(p) + 1 for p in expected if p in ranking), default=0)
    if not blocked: ranks.append(rank); reciprocal.append(1 / rank if rank else 0)
    result = 'BLOCKED' if blocked else ('PASS' if 0 < rank <= 3 else 'FAIL')
    lines.append(f'| {id_} | {", ".join(ranking[:3]) or "—"} | {rank or "—"} | {result} |')
n = len(ranks)
lines += ['', f'Đánh giá được {n}/{len(cases)}; Recall@1: {sum(r == 1 for r in ranks)}/{n}; Recall@3: {sum(0 < r <= 3 for r in ranks)}/{n}; MRR: {sum(reciprocal)/n if n else 0:.3f}. Factual correctness, completeness và citation support: NOT RUN.']
OUTPUT.write_text('\n'.join(lines) + '\n')
print(lines[-1])
