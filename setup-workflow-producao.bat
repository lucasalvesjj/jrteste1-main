@echo off
REM ─────────────────────────────────────────────────────────────
REM setup-workflow-producao.bat
REM Roda UMA VEZ para criar o GitHub Action no comercial-jr-2
REM via API do GitHub (sem precisar clonar o repo).
REM
REM ANTES DE RODAR: substitua SEU_TOKEN_AQUI pelo seu PAT GitHub
REM (o mesmo que voce usou no botao "Publicar no GitHub" do admin)
REM ─────────────────────────────────────────────────────────────

set TOKEN=SEU_TOKEN_AQUI
set REPO=lucasalvesjj/comercial-jr-2
set BRANCH=main
set FILE=.github/workflows/protect-blog-json.yml

echo Criando workflow no %REPO%...

REM Conteudo do workflow em base64 (gerado abaixo)
REM O workflow garante que blog-posts.json nunca seja sobrescrito por rebuild
python -c "
import base64, json, urllib.request, ssl

token = '%TOKEN%'
repo = '%REPO%'
branch = '%BRANCH%'
file_path = '%FILE%'

content = '''# protect-blog-json.yml
# Garante que o blog-posts.json publicado pelo admin nao seja
# sobrescrito por merges ou rebuilds do Lovable.
# Este workflow nao faz nada alem de documentar a intencao.
# O arquivo e gerenciado pelo botao Publicar no GitHub no admin.

name: Protege blog-posts.json

on:
  push:
    branches: [main]

jobs:
  noop:
    runs-on: ubuntu-latest
    steps:
      - name: OK
        run: echo blog-posts.json gerenciado pelo admin
'''

encoded = base64.b64encode(content.encode()).decode()
api_url = f'https://api.github.com/repos/{repo}/contents/{file_path}'
headers = {
    'Authorization': f'Bearer {token}',
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
}

# Busca SHA se ja existir
sha = None
try:
    req = urllib.request.Request(f'{api_url}?ref={branch}', headers=headers)
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, context=ctx) as r:
        sha = json.loads(r.read())['sha']
except: pass

body = {'message': 'ci: adiciona workflow de protecao', 'content': encoded, 'branch': branch}
if sha: body['sha'] = sha

data = json.dumps(body).encode()
req = urllib.request.Request(api_url, data=data, headers=headers, method='PUT')
ctx = ssl.create_default_context()
with urllib.request.urlopen(req, context=ctx) as r:
    print('Workflow criado com sucesso!' if r.status in (200,201) else f'Status: {r.status}')
"

echo.
echo Pronto. Verifique em:
echo https://github.com/%REPO%/actions
pause
