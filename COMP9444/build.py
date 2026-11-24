"""Assemble review/index.html from review/src/*.html fragments."""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'src')

def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()

def main():
    shell = read(os.path.join(SRC, '00-shell.html'))
    parts = {'HOWTO': '01-howto.html'}
    for i in range(1, 12):
        parts['CH%02d' % i] = '%02d-ch%02d.html' % (i + 1, i)
    for i in range(1, 4):
        parts['MOCK%d' % i] = '%d-mock%d.html' % (12 + i, i)

    for key, fn in parts.items():
        path = os.path.join(SRC, fn)
        if not os.path.exists(path):
            sys.exit('missing part: ' + fn)
        shell = shell.replace('<!--{{%s}}-->' % key, read(path))

    left = re.findall(r'<!--\{\{[A-Z0-9]+\}\}-->', shell)
    if left:
        sys.exit('unfilled markers: %s' % left)

    out = os.path.join(HERE, 'index.html')
    with open(out, 'w', encoding='utf-8') as f:
        f.write(shell)
    print('built %s  %.0f KB' % (out, len(shell.encode('utf-8')) / 1024))

if __name__ == '__main__':
    main()
