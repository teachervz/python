"""خادم محلي بسيط لتجربة المنصة والاختبارات: python3 tests/serve.py [port]
يخدم مجلد python-lab ويعامل ملفات .gs كجافاسكربت (لتشغيل Code.gs في صفحات الاختبار)."""
import http.server
import os
import sys
from functools import partial

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map,
                          **{'.gs': 'text/javascript', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json'})

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
