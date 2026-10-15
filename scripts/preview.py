"""Local-only preview; never serves arbitrary files or credentials."""
import datetime
import json
import mimetypes
import os
import pathlib
import subprocess
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
ROOT=pathlib.Path(__file__).resolve().parents[1]
LOCK=threading.Lock()

def snapshot():
    path=ROOT/'.private/live.json'
    if not path.exists(): return {'snapshot':None,'stale':True}
    data=json.loads(path.read_text(encoding='utf-8'))
    stamp=datetime.datetime.fromisoformat(data['fetchedAt'].replace('Z','+00:00'))
    now=datetime.datetime.now(datetime.timezone.utc)
    zone=datetime.timezone(datetime.timedelta(hours=8))
    stale=(now-stamp).total_seconds()>=21600 or stamp.astimezone(zone).date()!=now.astimezone(zone).date()
    return {'snapshot':data,'stale':stale}

class Handler(BaseHTTPRequestHandler):
    def log_message(self,*_): pass
    def send_json(self,data,code=200):
        body=json.dumps(data,ensure_ascii=False).encode();self.send_response(code);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Cache-Control','no-store');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
    def do_GET(self):
        if self.path=='/api/snapshot': self.send_json(snapshot());return
        mapping={'/':'web/index.html','/index.html':'web/index.html','/style.css':'web/style.css','/app.js':'web/app.js','/src/core.js':'src/core.js','/src/layout.js':'src/layout.js','/data/holidays.json':'data/holidays.json','/docs/INSTALL_IOS.md':'docs/INSTALL_IOS.md','/docs/PRIVACY.md':'docs/PRIVACY.md','/download':'dist/麦麦日历-iPhone安装包.zip'}
        for name in ['fries','bag','cup','birthday','birthday-v2','moon','lantern']: mapping['/assets/'+name+'.png']='assets/'+name+'.png'
        relative=mapping.get(self.path)
        if not relative or not (ROOT/relative).is_file(): self.send_error(404);return
        body=(ROOT/relative).read_bytes();mime=mimetypes.guess_type(relative)[0] or 'application/octet-stream'
        self.send_response(200);self.send_header('Content-Type',mime+'; charset=utf-8' if mime.startswith('text/') else mime);self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
    def do_POST(self):
        if self.headers.get('Origin') and self.headers['Origin']!='http://'+self.headers.get('Host',''):self.send_json({'error':'来源不允许'},403);return
        if self.path!='/api/refresh':self.send_json({'error':'接口不存在'},404);return
        try:
            with LOCK:
                command=['node',str(ROOT/'scripts/sync-live.js')]
                local_file=os.environ.get('MAI_LOCAL_TOKEN_FILE')
                if local_file:command+=['--token-file',local_file]
                r=subprocess.run(command,cwd=ROOT,capture_output=True,timeout=70)
                if r.returncode:raise RuntimeError('sync failed')
                self.send_json(snapshot())
        except Exception:self.send_json({'error':'查询暂未成功，原有数据已保留。请检查网络和本地 Token。'},502)

if __name__=='__main__':
    print('Local: http://127.0.0.1:8766',flush=True)
    ThreadingHTTPServer(('127.0.0.1',8766),Handler).serve_forever()
