"""Assemble the single-file site from src/.

Run from anywhere:  python src/build.py
Writes index.html next to src/. If a site/ folder exists, it also writes site/index.html (fragment)
and site/standalone.html, as the original build did.
"""
import pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
S = ROOT / 'src'
rd = lambda name: (S / name).read_text(encoding='utf-8')  # explicit UTF-8: Windows defaults to cp1252

css, body, cfg, app = rd('styles.css'), rd('body.html'), rd('config.js'), rd('app.js')
lenis = re.sub(r'\s*//# sourceMappingURL=\S+\s*$', '', rd('vendor/lenis.min.js'))

GOOGLE_FONTS = ('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500'
                '&family=Manrope:wght@400;500;600;700&family=Pinyon+Script&display=swap')
FAVICON = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E"
           "%3Crect width='64' height='64' rx='14' fill='%235B2333'/%3E"
           "%3Ctext x='32' y='45' text-anchor='middle' font-family='Georgia,serif' font-style='italic' font-size='40' fill='%23F7F2E8'%3EH%3C/text%3E%3C/svg%3E")

head = '''<title>Haven Gifts &amp; Hampers</title>
<meta name="description" content="Website concept for Haven Gifts &amp; Hampers, Rohini — every scroll unwraps a little more.">
<meta name="theme-color" content="#F7F2E8">
<link rel="icon" href="''' + FAVICON + '''">
<link rel="preload" href="fonts/cormorant-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/cormorant-italic-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/manrope-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="f/d/u000.webp" as="fetch" crossorigin media="(min-width: 821px)" fetchpriority="high">
<link rel="preload" href="f/m/u000.webp" as="fetch" crossorigin media="(max-width: 820px)" fetchpriority="high">
<script>/* opened straight from disk (file://), browsers refuse local font files; borrow Google's copies instead */
if (location.protocol === "file:") { var l = document.createElement("link"); l.rel = "stylesheet"; l.href = "''' + GOOGLE_FONTS + '''"; document.head.appendChild(l); }</script>
<style>
''' + css + '''
</style>
'''
tail = ('<script>\n/*! Lenis 1.3.26 | MIT License | (c) darkroom.engineering | https://github.com/darkroomengineering/lenis */\n'
        + lenis + '\n</script>\n<script>\n' + cfg + '\n</script>\n<script>\n' + app + '\n</script>\n')

standalone = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
              '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
              + head + '</head>\n<body>\n' + body + tail + '</body>\n</html>\n')

def write(path, text):
    path.write_text(text, encoding='utf-8', newline='\n')

write(ROOT / 'index.html', standalone)
site = ROOT / 'site'
if site.is_dir():
    write(site / 'index.html', head + body + tail)
    write(site / 'standalone.html', standalone)
print('ok', len(standalone.encode('utf-8')), 'bytes ->', ROOT / 'index.html')
