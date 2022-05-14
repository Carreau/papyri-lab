import React, { useState } from 'react';
import { style } from 'typestyle';

import { ILocation, IBookmark } from '../location';


export default function PapyriViewer({data}): JSX.Element {
  return (
    data.map(item => <PapyriSection title={item?.title}>{item?.children}</PapyriSection>)
  )
}

function PapyriSection({
  title,
  children,
}: {
  title: string,
  children: Array<JSX.Element>
}): JSX.Element {
  return (
    <div>
      <h1>{title}</h1>
      {getChildSections(children)}
    </div>
  )
}

function getChildSections(children: Array<JSX.Element>): JSX.Element {

  const smap = new Map<string, any>([
    ['Section', Section],
    ['Paragraph', Paragraph],
    ['Words', Words],
    ['Emph', Emph],
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

  return (
    <>
      {children.map((child) => {
        smap.has(child)
      })}
    </>
  )
}

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

class Emph {
  value: Words;
  constructor(data: any) {
    this.value = new Words(data.value);
  }
}

class ExternalLink {
  value: string;
  target: string;
  constructor(data: any) {
    this.value = data.value;
    this.target = data.target;
  }
}

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

function getComponent({type}): JSX.Element {
  const smap = new Map<string, any>([
    ['Section', Section],
    ['Paragraph', Paragraph],
    ['Words', Words],
    ['Emph', Emph],
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

  if ()
}
