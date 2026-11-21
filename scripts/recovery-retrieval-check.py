#!/usr/bin/env python3
"""Check reachability, canonical and robots of sources in the retrieval draft.

This is source discovery only; it does not claim an AI system retrieved or answered.
"""
import concurrent.futures
import html.parser
import re
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urljoin, urlparse

ORIGIN = 'https://mdftungphat.com'
ROOT = Path(__file__).resolve().parent.parent
CASES = ROOT / 'docs/recovery-2026-11-19/retrieval-cases.md'
OUTPUT = ROOT / 'docs/recovery-2026-11-19/source-discovery-results.md'

class Head(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(); self.canonical = None; self.robots = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'link' and 'canonical' in attrs.get('rel', '').lower().split(): self.canonical = attrs.get('href')
        if tag == 'meta' and attrs.get('name', '').lower() in ('robots', 'googlebot'): self.robots.append(attrs.get('content', '').lower())

def inspect(path):
    try:
        request = urllib.request.Request(ORIGIN + path, headers={'User-Agent': 'Mozilla/5.0 (compatible; SourceDiscoveryCheck/1.0)'})
        with urllib.request.urlopen(request, timeout=25) as response:
            final = response.geturl(); status = response.status; headers = response.headers
            parser = Head(); parser.feed(response.read(2_000_000).decode('utf-8', errors='replace'))
        canonical = urljoin(final, parser.canonical) if parser.canonical else ''
        expected = ORIGIN + path
        noindex = 'noindex' in ','.join(parser.robots) or 'noindex' in headers.get('X-Robots-Tag', '').lower()
        ok = status == 200 and final.rstrip('/') == expected.rstrip('/') and canonical.rstrip('/') == expected.rstrip('/') and not noindex
        return ('PASS' if ok else 'FAIL', status, final, canonical, noindex)
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        return ('BLOCKED', str(exc), '', '', False)

cases = []
for line in CASES.read_text().splitlines():
    fields = [part.strip() for part in line.strip().strip('|').split('|')]
    if len(fields) >= 6 and re.fullmatch(r'\d\d', fields[0]):
        paths = re.findall(r'(?<![\w])/(?:[a-z0-9-]+/)*', fields[2])
        paths = list(dict.fromkeys(p for p in paths if p.startswith('/')))
        cases.append((fields[0], fields[1], paths))
paths = sorted({p for _, _, ps in cases for p in ps})
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    results = dict(zip(paths, pool.map(inspect, paths)))
lines = ['# Kiểm tra nguồn retrieval trên production', '', 'Chỉ kiểm tra HTTP, redirect, canonical và noindex trên HTML công khai; **không** kiểm tra câu trả lời, factual correctness, nội dung trích dẫn hay retrieval của hệ thống AI. Các trường hợp cần đánh giá câu trả lời vẫn NOT RUN trong bộ câu hỏi.', '', '| ID | Nguồn | Discovery | Chi tiết |', '|---|---|---|---|']
for id_, _, ps in cases:
    states = [results[p][0] for p in ps]
    status = 'BLOCKED' if not ps or 'BLOCKED' in states else ('PASS' if all(x == 'PASS' for x in states) else 'FAIL')
    details = '; '.join(f'{p}: {results[p][0]} (HTTP {results[p][1]}, canonical {results[p][3] or "thiếu"}, noindex={results[p][4]})' for p in ps) or 'Không phân tích được nguồn'
    lines.append(f'| {id_} | {", ".join(ps)} | {status} | {details} |')
OUTPUT.write_text('\n'.join(lines) + '\n')
print(f'Checked {len(cases)} cases, {len(paths)} distinct sources; {sum(v[0] == "PASS" for v in results.values())} source URLs passed, {sum(v[0] == "FAIL" for v in results.values())} failed, {sum(v[0] == "BLOCKED" for v in results.values())} blocked.')
