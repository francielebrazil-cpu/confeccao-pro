from pathlib import Path
text = Path('src/App.tsx').read_text(encoding='utf-8').replace('\r\n', '\n')
for name in ['deleteClient', 'saveProduct', 'deleteProduct']:
    idx = text.find(name)
    print('---', name, 'index', idx)
    if idx == -1:
        continue
    start = max(0, idx - 120)
    end = idx + 440
    snippet = text[start:end]
    print(repr(snippet))
    print('--- text ---')
    print(snippet)
    print('============')
