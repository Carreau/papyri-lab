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
 * A with a title and an array of children. Each child can be its own subsection, each containing
 * any number of subsections.
 * @param title
 * @param children
 * @returns
 */
function PapyriSection({
  title,
  children,
  onLocationChange,
}: IPapyriSectionProps): JSX.Element {
  // console.log("title", title, children)
  return (
    <div className="Section">
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
  item: ISubsection,
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
    ['Parameters', Parameters],
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
  // console.log("Unsupported subsection: ", {data})
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
    return <p className="Paragraph">{data.children.map(item => resolveComponent(item, onLocationChange))}</p>
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
    <em className="Emph">{value}</em>
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
    <code className="DLINK Link">
      <a
        className="exists"
        onClick={() => onLocationChange({moduleName, version, kind, path})}
      >
        {value}
      </a>
    </code>
  )
}

function Parameters(
  data: {children?: Array<any>},
  onLocationChange: (loc: ILocation) => void
): JSX.Element {
  if (data.children !== undefined) {
    return (
      <div className="Parameters">
        {data.children.map(item => Parameter(item, onLocationChange))}
      </div>
    )
  } else {
    return <></>
  }
}

/**
 * @param param - Name of a function parameter
 * @param type_ - Type of the function parameter
 * @param desc - Description of the function parameter
 * @param onLocationChange - Callback used to update the current location
 * @returns
 */
function Parameter({
  param,
  type_,
  desc,
}: {
    param: string,
    type_: string,
    desc: Array<any>
},
  onLocationChange: (loc: ILocation) => void
): JSX.Element {
  console.log("Parameter", {param, type_, desc})
  return (
    <div className="Parameter">
      <dt>
        {param} : {type_}
      </dt>
      <dd>
        {desc.map(item => resolveComponent(item, onLocationChange))}
      </dd>
    </div>
  )
}
