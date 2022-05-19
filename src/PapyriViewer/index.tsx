import React from 'react';
import { style } from 'typestyle';

import { ILocation } from '../location'

const redBackground = style({
  background: 'red'
})

interface IPapyriSectionProps extends ISection {
  onLocationChange: (loc: ILocation) => void
}

export interface ISection {
  title?: string
  children?: Array<ISubsection>
}

interface ISubsection {
  data: {
    children: Array<any>
  }
  type: string  // type of section; Paragraph, BulletList, etc
}

export default function PapyriViewer({
  data,
  onLocationChange
}: {
    data: Array<ISection>,
    onLocationChange: (loc: ILocation) => void
}): JSX.Element {
  return (
    <div>
      {data.map((item: ISection) => {
        return (
          <PapyriSection
            title={item?.title}
            children={item?.children}
            onLocationChange={onLocationChange}
          />
        )
      })}
    </div>
  )
}


/**
 * A section contains a title and an array of children. Each child can be its own
 * subsection, each containing any number of subsections.
 * @param title
 * @param children
 * @returns
 */
function PapyriSection({
  title,
  children,
  onLocationChange,
}: IPapyriSectionProps): JSX.Element {
  console.log("title", title, children)
  return (
    <div>
      <h1>{title || ""}</h1>
      {children?.map(item => resolveComponent(item, onLocationChange))}
    </div>
  )
}

/**
 * Recursively resolve child sections until all nested components are resolved.
 * @param item -
 * @returns
 */
function resolveComponent(
  item: any,
  onLocationChange: (loc: ILocation) => void
): JSX.Element | string {
  // console.log("Component: ", item)
  const smap = new Map<string, any>([
    // ['Section', Section],
    ['Paragraph', Paragraph],
    ['Words', Words],
    ['Emph', Emph],
    ['Math', Math],
    // ['Param', Param],
    // ['Parameters', Parameters],
    // ['BlockDirective', BlockDirective],
    // ['DefList', DefList],
    ['Link', Link],
    // ['Fig', Fig],
    // ['Verbatim', Verbatim],
    // ['Admonition', Admonition],
    // ['BlockVerbatim', BlockVerbatim],
    // ['BlockQuote', BlockQuote],
    // ['BlockMath', BlockMath],
    // ['ListItem', ListItem],
    // ['BulletList', BulletList],
    // ['EnumeratedList', EnumeratedList],
    // ['Code2', Code2],
    // ['ExternalLink', ExternalLink],
    // ['Directive', Directive],
  ]);

  const element = item.type !== undefined && smap.has(item.type) ? smap.get(item.type) : Unsupported
  return element(item.data, onLocationChange)

}

function Unsupported(data: any): JSX.Element {
  console.log("Unsupported subsection: ", {data})
  return (
    <div className={redBackground}>
      {JSON.stringify(data)}
    </div>
  )
}

function Paragraph(
  data: {children?: Array<any>},
  onLocationChange: (loc: ILocation) => void
): JSX.Element {
  if (data.children !== undefined) {
    return <p>{data.children.map(item => resolveComponent(item, onLocationChange))}</p>
  } else {
    console.error("Paragraph has no children!", {data})
    return <p />
  }
}

function Words({value}: {value: string}): string {
  return value
}

function Emph({value: {value}}: {value: {value: string}}): JSX.Element {
  return (
    <em>{value}</em>
  )
}

function Link({
  value,
  reference: {module: moduleName, version, kind, path},
}: {
  value: string,
  reference: {
    module: string,
    version: string,
    kind: string,
    path: string,
  },
  kind: string,
},
  onLocationChange: (loc: ILocation) => void
): JSX.Element {
  return (
    <code className="DLINK">
      <a
        className="exists"
        onClick={() => onLocationChange({moduleName, version, kind, path})}
      >
        {value}
      </a>
    </code>
  )
}
