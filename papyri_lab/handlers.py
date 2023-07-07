import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado

class RouteHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self, path=None):
        from papyri.render import GraphStore, Key
        from papyri.render import ingest_dir
        from papyri.crosslink import encoder

        store = GraphStore(ingest_dir)
        if path is not None:
            module, version, kind, path = path.split("/")
            if module is "*":
                module = path.split(".")[0]
            if version == "*":
                version = None
            if kind == "api":
                kind = "module"
            key = Key(module, version, kind, path)
            self.log.warning("Got %s", key)

        else:
            key = Key(None, None, None, "papyri")
        if None in key:
            key = store.glob(key)[0]
        print("finishing with", key)
        data, backrefs, fref = store.get_all(key)
        res = encoder.decode(data).to_dict()

        # import ipdb as pdb; pdb.set_trace()
        # self.finish(json.dumps({"data": res, "refs": list(sorted(backrefs))}))
        self.finish(json.dumps({"data": res}))


# /papyri-lab/get_example/numpy/1.22.3/module/numpy.einsum?1649790118903


def setup_handlers(web_app):
    host_pattern = ".*$"
    import os.path

    # pp = os.path.expanduser('~/.papyri/ingest/skimage/0.17.2/assets/skimage-logo.png')
    pp = os.path.expanduser("~/.papyri/ingest")

    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "papyri-lab", "get_example")
    static_pattern = url_path_join(base_url, "papyri-lab", "static")
    handlers = [
        (route_pattern, RouteHandler),
        (route_pattern + r"/(.*)", RouteHandler),
        (static_pattern + r"/(.*)", tornado.web.StaticFileHandler, {"path": pp}),
    ]
    print(handlers)
    web_app.add_handlers(host_pattern, handlers)
