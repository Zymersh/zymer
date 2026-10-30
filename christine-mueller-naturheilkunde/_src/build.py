#!/usr/bin/env python3
"""Setzt die Seiten der Website zusammen.

Jede Datei in _src/pages/ beginnt mit einem Kopfbereich zwischen zwei Zeilen
'---' (title, description, nav, scripts, robots) und enthält danach nur den
Inhalt von <main>. Header, Footer und Icons kommen aus _src/layout.html.

Aufruf (im Ordner christine-mueller-naturheilkunde):  python3 _src/build.py
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / '_src'
BASE_URL = 'https://naturheilkunde-heilpraktiker-rastatt.de/'

NAV = [
    ('ueber-mich', 'ueber-mich.html', 'Über mich'),
    ('diagnostik', 'diagnostik.html', 'Diagnostik'),
    ('behandlung', 'behandlung.html', 'Behandlung'),
    ('anamnesebogen', 'anamnesebogen.html', 'Anamnesebogen'),
    ('gutscheine', 'gutscheine.html', 'Gutscheine'),
    ('kontakt', 'kontakt.html', 'Kontakt'),
]


def parse(page: Path):
    text = page.read_text(encoding='utf-8')
    m = re.match(r'---\n(.*?)\n---\n', text, flags=re.S)
    meta = {}
    for line in m.group(1).splitlines():
        key, _, value = line.partition(':')
        meta[key.strip()] = value.strip()
    return meta, text[m.end():]


def nav_links(current: str, mobile: bool = False) -> str:
    items = [('start', 'index.html', 'Startseite')] + NAV if mobile else NAV
    out = []
    for key, href, label in items:
        cur = ' aria-current="page"' if key == current else ''
        out.append(f'<li><a href="{href}"{cur}>{label}</a></li>')
    return '\n      '.join(out)


def build():
    layout = (SRC / 'layout.html').read_text(encoding='utf-8')
    for page in sorted((SRC / 'pages').glob('*.html')):
        meta, body = parse(page)
        name = page.name
        canonical = BASE_URL + ('' if name == 'index.html' else name)
        scripts = ''.join(
            f'\n<script src="assets/js/{s.strip()}" defer></script>'
            for s in meta.get('scripts', '').split(',') if s.strip()
        )
        head_extra = ''
        if meta.get('robots'):
            head_extra += f'\n<meta name="robots" content="{meta["robots"]}">'
        jsonld = SRC / 'jsonld.html'
        if name == 'index.html' and jsonld.exists():
            head_extra += '\n' + jsonld.read_text(encoding='utf-8').strip()
        html = (layout
                .replace('{{title}}', meta['title'])
                .replace('{{description}}', meta['description'])
                .replace('{{canonical}}', canonical)
                .replace('{{head_extra}}', head_extra)
                .replace('{{nav}}', nav_links(meta.get('nav', '')))
                .replace('{{nav_mobile}}', nav_links(meta.get('nav', ''), mobile=True))
                .replace('{{body}}', body.strip())
                .replace('{{scripts}}', scripts))
        (ROOT / name).write_text(html, encoding='utf-8')
        print('✓', name)


if __name__ == '__main__':
    build()
