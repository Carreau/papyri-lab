import { ReactWidget } from '@jupyterlab/apputils';
import { style } from 'typestyle';

import React, { useState } from 'react';
import { requestAPI } from './handler';

export const PBStyle = style({
  height: 'inherit',
  overflow: 'scroll',
  paddingLeft: '12px',
  paddingRight: '12px'
});

export const AdmStyle = style({
  borderLeft: '3px solid #0070f3',
  paddingLeft: '1em',
  $nest: {
    '&>div:first-child': {
      backgroundColor: 'rgba(0, 123, 255, 0.1)',
      position: 'relative',
      margin: '0 -1rem',
      padding: '0.4rem 0.1rem 0.4rem 1.5rem',
      fontWeight: 'bold',
      textTransform: 'capitalize'
    }
  }
});

/**
 * React component for a counter.
 *
 * @returns The React component
 */
const PapyriComponent = (props: any): JSX.Element => {
  const [counter, setCounter] = useState(0);
  const [stack, setStack] = useState([
    ['numpy', '1.22.3', 'module', 'numpy.dual']
  ]);
  const [data, setData] = useState([]);
  const [mod, setMod] = useState('numpy');
  const [ver, setVer] = useState('1.22.3');
  const [kind, setKind] = useState('module');
  const [path, setPath] = useState('numpy.dual');
  const arb = data.map((x: any) => {
    try {
      const s = new Section(x.children, x.title);
      return s;
    } catch (e) {
      console.log(`Error...|${e}|`);
      return 1;
    }
  });

  const refresh = async (): Promise<void> => {
    return await regen(mod, ver, kind, path);
  };

  const back = () => {
    stack.pop();
    const old: any = stack.pop();
    setStack(stack);
    setAll(old[0], old[1], old[2], old[3]);
  };

  const regen = async (
    mod: string,
    ver: string,
    kind: string,
    path: string
  ): Promise<void> => {
    const cc = stack.concat([[mod, ver, kind, path]]);
    setStack(cc);
    try {
      const res = await requestAPI<any>(
        `get_example/${mod}/${ver}/${kind}/${path}`
      );
      const ar2 = res.data.arbitrary;
      if (res.data.example_section_data.children.length != 0) {
        ar2.push({
          children: res.data.example_section_data.children,
          title: 'Examples'
        });
      }
      const content = res.data._content;
      for (const key in content) {
        const value = content[key];
        if (value.children.length > 0) {
          ar2.push({ children: value.children, title: key });
        }
      }
      setData(ar2);
    } catch (e) {
      console.error(`Error in reply ${e}`);
    }
    setCounter(counter + 1);
  };

  const setAll = (mod: string, ver: string, kind: string, path: string) => {
    setMod(mod);
    setVer(ver);
    setKind(kind);
    setPath(path);
    regen(mod, ver, kind, path);
  };

  const _to_papyri = () => {
    setAll('papyri', '0.0.8', 'module', 'papyri');
  };
  const _to_einsum = () => {
    setAll('numpy', '1.22.3', 'module', 'numpy.einsum');
  };

  return (
    <div className={`papyri-browser  jp-RenderedHTMLCommon ${PBStyle}`}>
      <input value={mod} onChange={e => setMod(e.target.value)} />
      <input value={ver} onChange={e => setVer(e.target.value)} />
      <input value={kind} onChange={e => setKind(e.target.value)} />
      <input value={path} onChange={e => setPath(e.target.value)} />
      <button onClick={refresh}>Go</button>
      <button onClick={_to_papyri}>papyri</button>
      <button onClick={_to_einsum}>einsum</button>
      <button onClick={back}>Back</button>
      {arb.map((x: any) => (
        <DSection setAll={setAll}>{x}</DSection>
      ))}
    </div>
  );
};

/**
 * A Counter Lumino Widget that wraps a CounterComponent.
 */
export class PapyriWidget extends ReactWidget {
  data: any;
  /**
   * Constructs a new CounterWidget.
   */
  constructor() {
    super();
    this.addClass('jp-ReactWidget');
    this.data = {};
  }

  setDX(data: any) {
    this.data = data;
  }

  render(): JSX.Element {
    return <PapyriComponent data={this.data} />;
  }
}

const DSection = (props: any) => {
  const px: Section = props.children;
  if (props.setAll == 0) {
    console.log('Empty setAll Section');
  }
  return (
    <div>
      <h1>{px.title}</h1>
      {px.children.map((x: any) => dynamic_render(x, props.setAll))}
    </div>
  );
};

const DParagraph = (props: any) => {
  const px = props.children;
  if (px.children != undefined) {
    return (
      <p>{px.children.map((x: any) => dynamic_render(x, props.setAll))}</p>
    );
  } else {
    return (
      <div>
        <p>An empty paragraph</p>
      </div>
    );
  }
};

const DBulletList = (props: any) => {
  const ls: BulletList = props.children;
  return (
    <ul>{ls.children.map((x: any) => dynamic_render(x, props.setAll))}</ul>
  );
};

const DEnumeratedList = (props: any) => {
  const ls: EnumeratedList = props.children;
  return (
    <ol>{ls.children.map((x: any) => dynamic_render(x, props.setAll))}</ol>
  );
};

const DDefList = (props: any) => {
  const ls: DefList = props.children;
  if (props.setAll == 0) {
    console.log('Empty setAll DefList');
  }
  return (
    <dl>{ls.children.map((x: any) => dynamic_render(x, props.setAll))}</dl>
  );
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

const DDefListItem = (props: any) => {
  const ls: DefListItem = props.children;
  if (props.setAll == 0) {
    console.log('Emty setAll in Dbullet');
  }
  return (
    <React.Fragment>
      <dt>{dynamic_render(ls.dt, props.setAll)}</dt>
      <dd>{ls.dd.map((x: any) => dynamic_render(x, props.setAll))}</dd>
    </React.Fragment>
  );
};

const DListItem = (props: any) => {
  const ls: ListItem = props.children;
  if (props.setAll == 0) {
    console.log('Emty setAll in Dbullet');
  }
  return (
    <li>{ls.children.map((x: any) => dynamic_render(x, props.setAll))}</li>
  );
};

class Leaf {
  value: string;

  constructor(data: any) {
    this.value = data.value;
  }
}
class BlockMath extends Leaf {}
class Words extends Leaf {}
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

const DEmph = (props: any) => {
  const emp: Emph = props.children;
  return (
    <em>
      <DWords>{emp.value}</DWords>
    </em>
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
  return <a href={el.target}>{el.value}(Ext)</a>;
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
    this.title = title;
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
      {adm.children.map((x: any) => dynamic_render(x, props.setAll))}
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
  value: [any];
  constructor(data: any) {
    this.value = data.value;
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
  ['Param', Param],
  ['BlockDirective', BlockDirective],
  ['DefList', DefList],
  ['Link', Link],
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
  ['Directive', Directive]
]);

const DBlockVerbatim = (props: any) => {
  const verb: BlockVerbatim = props.children;
  return <pre>{verb.value}</pre>;
};
const DBlockQuote = (props: any) => {
  const q: BlockQuote = props.children;
  return <pre>{q.value.map((x: any) => x + '\n')}</pre>;
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
  ['Section', DSection],
  ['Paragraph', DParagraph],
  ['Words', DWords],
  ['Emph', DEmph],
  ['Param', DParam],
  ['BlockDirective', DBlockDirective],
  ['DefList', DDefList],
  ['Admonition', DAdmonition],
  ['Link', DLink],
  ['Verbatim', DVerbatim],
  ['BlockVerbatim', DBlockVerbatim],
  ['BlockQuote', DBlockQuote],
  ['DefListItem', DDefListItem],
  ['ListItem', DListItem],
  ['BulletList', DBulletList],
  ['EnumeratedList', DEnumeratedList],
  ['Token', DToken],
  ['Code2', DCode2],
  ['ExternalLink', DExternalLink],
  ['Directive', DDirective]
]);

const dynamic_render = (obj: any, setAll: any) => {
  const oname = obj.constructor.name;
  if (setAll === undefined) {
    console.log('Empty setAll in drander', obj.constructor.name, obj);
    throw Error('Wrong');
  }
  if (dmap.has(oname)) {
    return React.createElement(dmap.get(oname), { setAll: setAll }, obj);
  }
  console.log('Unknown object type', obj, obj.constructor.name);
  return <div>{JSON.stringify(obj)}</div>;
};

const dynamic_render_many = (objs: any, setAll: any) => {
  return objs.map((x: any) => dynamic_render(x, setAll));
};

const deserialise = (item: any) => {
  const ty: string = item.type;
  if (smap.has(ty)) {
    const co = smap.get(ty);
    const res = new co(item.data);
    return res;
  }
  console.trace('Seen Unknown item during deserialisation', item, ty);

  return item;
};
