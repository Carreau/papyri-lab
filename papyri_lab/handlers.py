import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado

class RouteHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        from papyri.render import GraphStore
        from papyri.render import ingest_dir
        from papyri.crosslink import encoder

        store = GraphStore(ingest_dir)
        key = store.glob((None, None, None, "papyri"))[0]
        res = encoder.decode(store.get(key)).to_json()

        self.finish(json.dumps({"data": res}))


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "papyri-lab", "get_example")
    handlers = [(route_pattern, RouteHandler)]
    web_app.add_handlers(host_pattern, handlers)
