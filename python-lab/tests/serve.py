"""خادم محلي بسيط لتجربة المنصة والاختبارات: python3 tests/serve.py [port]
يخدم مجلد python-lab ويعامل ملفات .gs كجافاسكربت (لتشغيل Code.gs في صفحات الاختبار)."""
import http.server
import os
import sys
from functools import partial

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map,
                          **{'.gs': 'text/javascript', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json'})

    def do_POST(self):
        # محاكاة Supabase: /rest/v1/rpc/api ← دالة api في PostgreSQL المحلي (للاختبار فقط)
        if self.path.split('?')[0] != '/rest/v1/rpc/api':
            self.send_error(404)
            return
        import json
        import pg_local
        body = json.loads(self.rfile.read(int(self.headers.get('Content-Length', 0))) or b'{}')
        if not self.headers.get('apikey'):
            out, code = {'message': 'No API key found in request'}, 401
        else:
            out, code = pg_local.api(body.get('req', {})), 200
        data = json.dumps(out, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, *args):
        pass


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', port), partial(Handler, directory=ROOT))
    print(f'http://127.0.0.1:{port}/index.html')
    srv.serve_forever()


if __name__ == '__main__':
    main()
