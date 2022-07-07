import React, { useState } from 'react';

import { style } from 'typestyle';
import { Button, HTMLSelect, InputGroup } from '@jupyterlab/ui-components';

import { ILocation, IBookmark } from '../location';

// Needed to make the downward-pointing-caret in the HTMLSelect appear in the correct place
const htmlSelectStyle = style({
  position: 'relative',
  borderColor: 'var(--jp-input-border-color)',
  borderStyle: 'solid',
  borderWidth: 'var(--jp-border-width)',
});

const toolbarStyle = style({
  margin: '1em 0em 1em 0em',
});

const toolbarRowStyle = style({
  display: 'flex',
  flexDirection: 'row',
  gap: '1em',
  alignItems: 'center',
  margin: '0em 0em 1em 0em',
});

/**
 * @param bookmarks - List of bookmarks to show in the dropdown
 * @param location - Current location
 * @param onLocationChange - List of bookmarks to show in the dropdown
 * @param goBack - Go back one page in the browsing history
 * @param refresh - Refresh the current page
 * @returns A toolbar component for papyri-lab
 */
export default function PapyriToolbar({
  bookmarks,
  location,
  onLocationChange,
  goBack,
  refresh,
  inst,
}: {
  bookmarks: Array<IBookmark>;
  setBookmarks: (bookmark: Array<IBookmark>) => void;
  location: ILocation;
  goBack: () => void;
  onLocationChange: (loc: ILocation) => void;
  refresh: () => void;
  inst: any;
}): JSX.Element {
  const [activeBookmark, setActiveBookmark] = useState<IBookmark | undefined>();

  function onActiveBookmarkChange(event: any) {
    const bookmark = bookmarks.find(({ name }) => name === event.target.value);
    if (bookmark !== undefined) {
      setActiveBookmark(bookmark);
      inst.onLocationChange(bookmark.location);
    }
  }

  return (
    <div className={toolbarStyle}>
      <div className={toolbarRowStyle}>
        <InputGroup
          value={location?.moduleName}
          onChange={(e: any) =>
            inst.onLocationChange({ ...location, moduleName: e.target.value })
          }
          type="text"
          placeholder="Module"
          leftIcon="box"
        />
        <InputGroup
          value={location?.version}
          onChange={(e: any) =>
            inst.onLocationChange({ ...location, version: e.target.value })
          }
          type="text"
          placeholder="Version"
        />
        <HTMLSelect
          className={htmlSelectStyle}
          value={location?.kind}
          defaultValue="docs"
          onChange={e =>
            inst.onLocationChange({ ...location, kind: e.target.value })
          }
        >
          <option value="api">API</option>
          <option value="docs">Narrative</option>
          <option value="gallery">Pas là</option>
        </HTMLSelect>
        <InputGroup
          value={location?.path}
          onChange={(e: any) =>
            inst.onLocationChange({ ...location, path: e.target.value })
          }
          type="text"
          placeholder="Search Path"
          leftIcon="path-search"
        />
        <Button onClick={goBack} icon="arrow-left" small>
          Back
        </Button>
        <Button onClick={refresh} icon="refresh" small>
          Refresh
        </Button>
      </div>
      <div className={toolbarRowStyle}>
        Bookmarks:
        <HTMLSelect
          className={htmlSelectStyle}
          value={activeBookmark?.name}
          onChange={e => onActiveBookmarkChange(e)}
        >
          {bookmarks.map(({ name }) => (
            <option value={name} key={name}>
              {name}
            </option>
          ))}
        </HTMLSelect>
      </div>
    </div>
  );
}
