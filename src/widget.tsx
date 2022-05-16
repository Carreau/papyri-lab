import { ReactWidget } from '@jupyterlab/apputils';
import { style } from 'typestyle';

import React, { useState } from 'react';
import { requestAPI } from './handler';
import { ServerConnection } from '@jupyterlab/services';
import { URLExt } from '@jupyterlab/coreutils';
import { Provider, Node } from '@nteract/mathjax';

import PapyriToolbar from './PapyriToolbar';
import { ILocation, IBookmark } from './location';

const PBStyle = style({
  height: 'inherit',
  overflow: 'scroll',
  paddingLeft: '12px',
  paddingRight: '12px',
});

const AdmStyle = style({
  borderLeft: '3px solid #0070f3',
  paddingLeft: '1em',
  $nest: {
    '&>div:first-child': {
      backgroundColor: 'rgba(0, 123, 255, 0.1)',
      position: 'relative',
      margin: '0 -1rem',
      padding: '0.4rem 0.1rem 0.4rem 1.5rem',
      fontWeight: 'bold',
      textTransform: 'capitalize',
    },
  },
});

/**
 * @returns Main Papyri component; contains documentation and navigation widgets
 */
function PapyriComponent(): JSX.Element {
  const [data, setData] = useState<Array<string>>([]);
  const [bookmarks, setBookmarks] = useState<Array<IBookmark>>([
    {
      name: 'papyri',
      location: {
        moduleName: 'papyri',
        version: '0.0.8',
        kind: 'module',
        path: 'papyri',
      },
    },
    {
      name: 'papyri:index',
      location: {
        moduleName: 'papyri',
        version: '0.0.8',
        kind: 'docs',
        path: 'index',
      },
    },
    {
      name: 'numpy.einsum',
      location: {
        moduleName: 'numpy',
        version: '1.22.3',
        kind: 'module',
        path: 'numpy.einsum',
      },
    },
    {
      name: 'dpss',
      location: {
        moduleName: 'scipy',
        version: '*',
        kind: 'api',
        path: 'scipy.signal.windows._windows.dpss',
      },
    },
    {
      name: 'Numpy Dev Index',
      location: {
        moduleName: 'numpy',
        version: '1.22.3',
        kind: 'docs',
        path: 'dev:index',
      },
    },
  ]);
  const [activeLocation, setActiveLocation] = useState<ILocation>({
    moduleName: 'numpy',
    version: '1.22.3',
    kind: 'module',
    path: 'numpy.dual',
  });
  const [history, setHistory] = useState<Array<ILocation>>([]);

  function onLocationChange(loc: ILocation): void {
    loadPage(loc).then(exists => {
      if (exists) {
        setHistory([...history, activeLocation]);
        setActiveLocation(loc);
      }
    });
  }

  function goBack(): void {
    const loc = history.pop();
    if (loc !== undefined) {
      loadPage(loc).then(exists => {
        if (exists) {
          setActiveLocation(loc);
          setHistory(history);
        }
      });
    }
  }

  function refresh(): void {
    const loc = history.pop();
    if (loc !== undefined) {
      setActiveLocation(loc);
      loadPage(loc);
    }
  }

  async function loadPage({
    moduleName,
    version,
    kind,
    path,
  }: ILocation): Promise<boolean> {
    const endpoint = `get_example/${moduleName}/${version}/${kind}/${path}`;

    try {
      const {
        data: {
          arbitrary,
          signature,
          _content: content,
          ordered_sections,
          example_section_data,
        },
      } = await requestAPI<any>(endpoint);
      const newData = arbitrary;

      // If the response has a function signature, create a section for it
      if (signature !== undefined) {
        newData.push({
          children: [
            {
              type: 'Paragraph',
              data: {
                children: [{ type: 'Words', data: { value: signature.value } }],
              },
            },
          ],
        });
      }

      // Ordered sections of a doc page should be shown first; other sections are handled after
      ordered_sections.forEach((section: string) => {
        if (content[section] !== undefined) {
          newData.push({ children: content[section].children, title: section });
          delete content[section];
        }
      });
      Object.entries(content).forEach(([key, value]: [string, any]) => {
        if (value.children.length > 0) {
          newData.push({ children: value.children, title: key });
        }
      });
      if (example_section_data.children.length !== 0) {
        newData.push({
          children: example_section_data.children,
          title: 'Examples',
        });
      }
      setData(newData);
      return true;
    } catch (e) {
      console.warn(`Error loading page [${endpoint}] ${e}`);
      return false;
    }
  }

  const arb = data.map((x: any) => {
    return new Section(x.children, x.title);
  });

  return (
    <div className={`papyri-browser jp-RenderedHTMLCommon ${PBStyle}`}>
      <PapyriToolbar
        bookmarks={bookmarks}
        setBookmarks={setBookmarks}
        location={history[history.length - 1]}
        onLocationChange={onLocationChange}
        goBack={goBack}
        refresh={refresh}
      />
      <hr />
      {arb.map((x: any, index: number) => {
        return (
          <DSection key={index} setAll={setHistory}>
            {x}
          </DSection>
        );
      })}
    </div>
  );
}

/**
 * A Lumino Widget that wraps a react PapyriWidget.
 */
export class PapyriWidget extends ReactWidget {
  data: any;
  constructor() {
    super();
    this.addClass('jp-ReactWidget');
    this.data = {};
  }

  setDX(data: any) {
    this.data = data;
  }

  render(): JSX.Element {
    return <PapyriComponent />;
  }
}

const DSection = (props: any) => {
  const px: Section = props.children;
  if (props.setAll === 0) {
    console.log('Empty setAll Section');
  }
  return (
    <div>
      <h1 key={0}>{px.title}</h1>
      {dynamic_render_many(px.children, props.setAll)}
    </div>
  );
};

const DParagraph = (props: any) => {
  const px = props.children;
  if (px.children !== undefined) {
    return <p>{dynamic_render_many(px.children, props.setAll)}</p>;
  } else {
    console.info('strange, empty paragraph');
    return (
      <div>
        <p key={0}>An empty paragraph</p>
      </div>
    );
  }
};

const DBulletList = (props: any) => {
  const ls: BulletList = props.children;
  return <ul>{dynamic_render_many(ls.children, props.setAll)}</ul>;
};

const DEnumeratedList = (props: any) => {
  const ls: EnumeratedList = props.children;
  return <ol>{dynamic_render_many(ls.children, props.setAll)}</ol>;
};

const DDefList = (props: any) => {
  const ls: DefList = props.children;
  if (props.setAll == 0) {
    console.log('Empty setAll DefList');
  }
  return <dl>{dynamic_render_many(ls.children, props.setAll)}</dl>;
};

const DLink = (props: any) => {
  const lk: Link = props.children;
  const r = lk.reference;
  return (
    <code className="DLINK">
      <a
        href={`${r.module}/${r.version}/${r.kind}/${r.path}`}
        className="exists"
        onClick={e => {
          const r = lk.reference;
          e.preventDefault();
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
          props.setAll(r.module, r.version, r.kind, r.path);
        }}
      >
        {lk.value}
      </a>
    </code>
  );
};

const DFig = (props: any) => {
  const fig: Fig = props.children;
  const settings = ServerConnection.makeSettings();
  const img_url = URLExt.join(
    settings.baseUrl,
    'papyri-lab',
    'static',
    fig.module,
    fig.version,
    'assets',
    fig.path,
  );
  return <img src={img_url} />;
};

const DDefListItem = (props: any) => {
  const ls: DefListItem = props.children;
  if (props.setAll === 0) {
    console.log('Emty setAll in Dbullet');
  }
  return (
    <React.Fragment>
      <dt>{dynamic_render(ls.dt, props.setAll, 'dt')}</dt>
      <dd>{dynamic_render_many(ls.dd, props.setAll)}</dd>
    </React.Fragment>
  );
};

const DListItem = (props: any) => {
  const ls: ListItem = props.children;
  if (props.setAll === 0) {
    console.log('Emty setAll in Dbullet');
  }
  return <li>{dynamic_render_many(ls.children, props.setAll)}</li>;
};

class Leaf {
  value: string;

  constructor(data: any) {
    this.value = data.value;
  }
}
class BlockMath extends Leaf {}
class Words extends Leaf {}
class Math extends Leaf {}
class BlockVerbatim extends Leaf {}

class BlockDirective {
  argument: string;
  content: string;
  name: string;
  options: any;

  constructor(data: any) {
    this.argument = data.argument;
    this.content = data.content;
    this.name = data.name;
    this.options = data.options;
  }
}

class DefList {
  children: [DefListItem];
  constructor(data: any) {
    this.children = data.children.map((x: any) => new DefListItem(x));
  }
}

class Link {
  value: string;
  reference: any;
  kind: string;
  exists: boolean;

  constructor(data: any) {
    this.value = data.value;
    this.reference = data.reference;
    this.kind = data.kind;
    this.exists = data.exists;
  }
}

class Fig {
  module: string;
  version: string;
  path: string;
  constructor(data: any) {
    this.module = data.value.module;
    this.version = data.value.version;
    this.path = data.value.path;
  }
}

class Parameters {
  children: [Param];
  constructor(props: any) {
    this.children = props.children.map(
      (x: any) => new Param({ ...x, setAll: props.setAll }),
    );
  }
}

const DParameters = (props: any) => {
  const p: Parameters = props.children;
  return (
    <React.Fragment>
      {dynamic_render_many(p.children, props.setAll)}
    </React.Fragment>
  );
};

class Param {
  param: string;
  type_: string;
  desc: [any];
  constructor(data: any) {
    this.param = data.param;
    this.type_ = data.type_;
    this.desc = data.desc.map(deserialise);
  }
}

const DParam = (props: any) => {
  const p: Param = props.children;
  return (
    <React.Fragment>
      <dt>
        {p.param} : {p.type_}
      </dt>
      <dd>{dynamic_render_many(p.desc, props.setAll)}</dd>
    </React.Fragment>
  );
};

class Emph {
  value: Words;
  constructor(data: any) {
    this.value = new Words(data.value);
  }
}

class Strong {
  value: Words;
  constructor(data: any) {
    this.value = new Words(data.content);
  }
}

const DEmph = (props: any) => {
  const emp: Emph = props.children;
  return (
    <em>
      <DWords>{emp.value}</DWords>
    </em>
  );
};

const DStrong = (props: any) => {
  const str: Strong = props.children;
  return (
    <b>
      <DWords>{str.value}</DWords>
    </b>
  );
};

class ExternalLink {
  value: string;
  target: string;
  constructor(data: any) {
    this.value = data.value;
    this.target = data.target;
  }
}

const DExternalLink = (props: any) => {
  const el: ExternalLink = props.children;
  return (
    <a className="external" href={el.target}>
      {el.value}
    </a>
  );
};

const DMath = (props: any) => {
  const m: BlockMath = props.children;
  return (
    <span className="not-implemented">
      <Provider>
        <Node inline>{m.value}</Node>
      </Provider>
    </span>
  );
  //return <div className="not-implemented">{`$$${m.value}$$`}</div>;
};

const DBlockMath = (props: any) => {
  const m: BlockMath = props.children;
  return (
    <Provider>
      <Node>{m.value}</Node>
    </Provider>
  );
  //return <div className="not-implemented">{`$$${m.value}$$`}</div>;
};

class Token {
  type_: string;
  link: Link | string;
  disp: string;

  constructor(data: any) {
    this.type_ = data.type;
    if (data.link.type === 'str') {
      this.disp = 'str';
      this.link = data.link.data;
    } else {
      this.disp = 'link';
      this.link = new Link(data.link.data);
    }
  }
}

const DToken = (props: any) => {
  const t: Token = props.children;
  if (t.disp === 'str') {
    if (t.link === '\n') {
      return (
        <React.Fragment>
          <br />
          <span className="nsl">... </span>
        </React.Fragment>
      );
    } else {
      return <span className={t.type_}>{t.link}</span>;
    }
  } else {
    return (
      <span className={t.type_}>
        <DLink className={t.type_} setAll={props.setAll}>
          {t.link}
        </DLink>
      </span>
    );
  }
};

class Code2 {
  entries: [Token];
  out: string;
  ce_status: string;

  constructor(data: any) {
    this.entries = data.entries.map((x: any) => new Token(x));
    this.out = data.out;
    this.ce_status = data.ce_status;
  }
}

const DCode2 = (props: any) => {
  return (
    <React.Fragment>
      <pre className={`highlight ${props.children.ce_status}`}>
        <span className="nsl">{'>>> '}</span>
        {dynamic_render_many(props.children.entries, props.setAll)}
        <br />
        {props.children.out}
      </pre>
    </React.Fragment>
  );
};

class Directive {
  value: string;
  domain: string;
  role: string;
  constructor(data: any) {
    this.value = data.value;
    this.domain = data.domain;
    this.role = data.role;
  }
}

const DDirective = (props: any) => {
  const d: Directive = props.children;
  return (
    <code className="not-implemented inline-directive">
      :{d.domain}:{d.role}:{d.value}
    </code>
  );
};

class DefListItem {
  dt: Paragraph;
  dd: [any];
  constructor(data: any) {
    this.dt = new Paragraph(data.dt);
    this.dd = data.dd.map(deserialise);
  }
}

class Paragraph {
  children: [any];

  constructor(data: any) {
    this.children = data.children.map(deserialise);
  }
}

class Section {
  title: string;
  children: [any];

  constructor(children: any, title: string) {
    if (['Extended Summary', 'Summary'].includes(title)) {
      this.title = '';
    } else {
      this.title = title;
    }
    this.children = children.map(deserialise);
  }
}

class Admonition {
  kind: string;
  title: string;
  children: [any];
  constructor(data: any) {
    this.title = data.title;
    this.children = data.children.map(deserialise);
    this.kind = data.kind;
  }
}
const DAdmonition = (props: any) => {
  const adm: Admonition = props.children;
  return (
    <div className={AdmStyle}>
      <div>
        {adm.kind}:{adm.title}
      </div>
      {dynamic_render_many(adm.children, props.setAll)}
    </div>
  );
};

class Verbatim {
  value: [string];
  constructor(data: any) {
    this.value = data.value;
  }
}

class BlockQuote {
  children: [any];
  constructor(data: any) {
    this.children = data.children;
  }
}

class ListItem {
  children: [any];
  constructor(data: any) {
    this.children = data.children.map(deserialise);
  }
}

class BulletList {
  children: [ListItem];
  constructor(data: any) {
    this.children = data.children.map((x: any) => new ListItem(x));
  }
}

class EnumeratedList {
  children: [ListItem];
  constructor(data: any) {
    this.children = data.children.map((x: any) => new ListItem(x));
  }
}

const smap = new Map<string, any>([
  ['Section', Section],
  ['Paragraph', Paragraph],
  ['Words', Words],
  ['Emph', Emph],
  ['Strong', Strong],
  ['Math', Math],
  ['Param', Param],
  ['Parameters', Parameters],
  ['BlockDirective', BlockDirective],
  ['DefList', DefList],
  ['Link', Link],
  ['Fig', Fig],
  ['Verbatim', Verbatim],
  ['Admonition', Admonition],
  ['BlockVerbatim', BlockVerbatim],
  ['BlockQuote', BlockQuote],
  ['BlockMath', BlockMath],
  ['ListItem', ListItem],
  ['BulletList', BulletList],
  ['EnumeratedList', EnumeratedList],
  ['Code2', Code2],
  ['ExternalLink', ExternalLink],
  ['Directive', Directive],
]);

const DBlockVerbatim = (props: any) => {
  const verb: BlockVerbatim = props.children;
  return <pre>{verb.value}</pre>;
};
const DBlockQuote = (props: any) => {
  const q: BlockQuote = props.children;
  return <pre>{q.children.map((x: any) => x + '\n')}</pre>;
};

const DVerbatim = (props: any) => {
  const verb: Verbatim = props.children;
  return <code className="inline-verbatim">{verb.value}</code>;
};

const DBlockDirective = (props: any) => {
  const dir: BlockDirective = props.children;
  return (
    <pre>
      .. {dir.name}:: {dir.argument}
      {'\n'}
      {dir.options}
      {'    '}
      {dir.content}
    </pre>
  );
};

const DWords = (props: any) => {
  return props.children.value;
};

const dmap = new Map<string, any>([
  [Admonition.name, DAdmonition],
  [BlockDirective.name, DBlockDirective],
  [BlockQuote.name, DBlockQuote],
  [BlockVerbatim.name, DBlockVerbatim],
  [BulletList.name, DBulletList],
  [Code2.name, DCode2],
  [DefList.name, DDefList],
  [DefListItem.name, DDefListItem],
  [Directive.name, DDirective],
  [Emph.name, DEmph],
  [Strong.name, DStrong],
  [EnumeratedList.name, DEnumeratedList],
  [ExternalLink.name, DExternalLink],
  [Link.name, DLink],
  [Fig.name, DFig],
  [ListItem.name, DListItem],
  [BlockMath.name, DBlockMath],
  [Math.name, DMath],
  [Paragraph.name, DParagraph],
  [Param.name, DParam],
  [Parameters.name, DParameters],
  [Section.name, DSection],
  [Token.name, DToken],
  [Verbatim.name, DVerbatim],
  [Words.name, DWords],
]);

const dynamic_render = (obj: any, setAll: any, key: any) => {
  const oname = obj.constructor.name;
  if (setAll === undefined) {
    console.log('Empty setAll in drander', obj.constructor.name, obj);
    throw Error('Wrong');
  }
  if (dmap.has(oname)) {
    return React.createElement(
      dmap.get(oname),
      { setAll: setAll, key: key },
      obj,
    );
  }
  console.log('Unknown object type', obj, obj.constructor.name);
  return <div>{JSON.stringify(obj)}</div>;
};

const dynamic_render_many = (objs: any, setAll: any) => {
  return objs.map((x: any, index: number) => dynamic_render(x, setAll, index));
};

const deserialise = (item: any) => {
  const ty: string = item.type;
  if (smap.has(ty)) {
    const co = smap.get(ty);
    const res = new co(item.data);
    return res;
  }
  console.warn('Seen Unknown item during deserialisation', item, ty);

  return item;
};
