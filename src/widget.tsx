import { ReactWidget } from '@jupyterlab/apputils';

import React, { useState } from 'react';

/**
 * React component for a counter.
 *
 * @returns The React component
 */
const PapyriComponent = (props: any): JSX.Element => {
  const [counter, setCounter] = useState(0);
  //const arb = props.data.arbitrary.map((x: any) => new Section(x.children, x.title));
  const arb = props.data.arbitrary.map((x: any) => {
    try {
      console.log(x.children, x.title)
      const s = new Section(x.children, x.title);
      return s;
    } catch (e) {
      console.log(`Error...|${e}|`);
      return 1;
    }
  });
  return (
    <div className='papyri-browser lm-Widget p-Widget lm-Panel p-Panel lm-BoxPanel p-BoxPanel jp-RenderedHTMLCommon'>
      <p>You clicked {counter} times! With value </p>
      <button
        onClick={(): void => {
          setCounter(counter + 1);
        }}
      >
        Increment
      </button>
      {arb.map((x: any) => <DSection>{x}</DSection>)}
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
  return (
    <div>
      <h1>{px.title}</h1>
      {px.children.map((x: any) => dynamic_render(x))}
    </div>
  );
};

const DParagraph = (props: any) => {
  const px = props.children;
  if (px.children != undefined) {
    return <p>{px.children.map((x: any) => dynamic_render(x))}</p>;
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
  return <ul>{ls.children.map(dynamic_render)}</ul>;
};

const DDefList = (props: any) => {
  const ls: DefList = props.children;
  return <dl>{ls.children.map(dynamic_render)}</dl>;
};

const DLink = (props: any) => {
  const lk: Link = props.children;
  return (
    <code>
      <a href={lk.reference} className="exists">
        {lk.value}
      </a>
    </code>
  );
};

const DDefListItem = (props: any) => {
  const ls: DefListItem = props.children;
  return (
    <React.Fragment>
      <dt>{dynamic_render(ls.dt)}</dt>
      <dd>{ls.dd.map(dynamic_render)}</dd>
    </React.Fragment>
  );
};

const DListItem = (props: any) => {
  const ls: ListItem = props.children;
  return <li>{ls.children.map(dynamic_render)}</li>;
};

class Leaf {
  value: string;

  constructor(data: any) {
    this.value = data.value;
  }
}
class BlockMath extends Leaf { }
class Words extends Leaf { }
class BlockVerbatim extends Leaf { }

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

const smap = new Map<string, any>([
  ["Section", Section],
  ["Paragraph", Paragraph],
  ["Words", Words],
  ["BlockDirective", BlockDirective],
  ["DefList", DefList],
  ["Link", Link],
  ["Verbatim", Verbatim],
  ["BlockVerbatim", BlockVerbatim],
  ["BlockQuote", BlockQuote],
  ["BlockMath", BlockMath],
  ["ListItem", ListItem],
  ["BulletList", BulletList],
]);

const DBlockVerbatim = (props: any) => {
  const verb: BlockVerbatim = props.children;
  return <pre>{verb.value}</pre>;
};
const DBlockQuote = (props: any) => {
  const q: BlockQuote = props.children;
  return <pre>{q.value.map((x: any) => x + "\n")}</pre>;
};

const DVerbatim = (props: any) => {
  const verb: BlockVerbatim = props.children;
  return <code>{verb.value}</code>;
};

const DBlockDirective = (props: any) => {
  const dir: BlockDirective = props.children;
  return (
    <pre>
      .. {dir.name}:: {dir.argument}
      {"\n"}
      {dir.options}
      {"    "}
      {dir.content}
    </pre>
  );
};

const DWords = (props: any) => {
  return props.children.value;
};

const dmap = new Map<string, any>([
  ["Section", DSection],
  ["Paragraph", DParagraph],
  ["Words", DWords],
  ["BlockDirective", DBlockDirective],
  ["DefList", DDefList],
  ["Link", DLink],
  ["Verbatim", DVerbatim],
  ["BlockVerbatim", DBlockVerbatim],
  ["BlockQuote", DBlockQuote],
  ["DefListItem", DDefListItem],
  ["ListItem", DListItem],
  ["BulletList", DBulletList],
]);

const dynamic_render = (obj: any) => {
  const oname = obj.constructor.name;
  if (dmap.has(oname)) {
    return React.createElement(dmap.get(oname), null, obj);
  }
  console.log("Unknown object type", obj.constructor.name);
  return <div>{obj.constructor.name}</div>;
};

const deserialise = (item: any) => {
  const ty: string = item.type;
  if (smap.has(ty)) {
    const co = smap.get(ty);
    const res = new co(item.data);
    return res;
  }
  console.log("Seen", item);

  return item;
};