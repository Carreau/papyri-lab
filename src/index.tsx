import {
  ILabShell,
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';
import { PapyriWidget } from './widget';

import {
  IInspector,
  KernelConnector
} from '@jupyterlab/inspector'

import { INotebookTracker } from '@jupyterlab/notebook';
import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { PapyriInspectionHandler } from './handler'

import {
  ICommandPalette,
  MainAreaWidget,
  WidgetTracker,
} from '@jupyterlab/apputils';

import { Token } from '@lumino/coreutils';


export interface IPapyriInspector extends IInspector {}
/**
 * The papyri inspector window token.
 */
export const IPapyriInspector = new Token<IPapyriInspector>(
  'papyri-lab/inspector:IPapyriInspector'
);


namespace CommandIDs {
  export const open = 'papyri:open'
  export const close = 'papyri:close'
  export const toggle = 'papyri:toggle'
}

/**
 * Initialization data for the papyri-lab extension.
 */
const papyri: JupyterFrontEndPlugin<void> = {
  id: 'papyri-lab:plugin',
  autoStart: true,
  optional: [ICommandPalette, ISettingRegistry, ILayoutRestorer],
  provides: IPapyriInspector,
  activate: async (
    app: JupyterFrontEnd,
    palette: ICommandPalette | null,
    settingRegistry: ISettingRegistry,
    restorer: ILayoutRestorer | null,
  ) => {
    if (settingRegistry) {
      try {
        const settings = (await settingRegistry.load(papyri.id)).composite;
        console.log('papyri-lab settings loaded:', settings.composite);
      } catch (reason) {
        console.error('Failed to load settings for papyri-lab.', reason);
      }
    }

    // Track and restore the widget state
    const tracker = new WidgetTracker<MainAreaWidget<PapyriWidget>>({
      namespace: 'papyri',
    });

    function isPapyriOpen() {
      return widget && !widget.isDisposed;
    }

    let source: IInspector.IInspectable | null = null;
    let widget: MainAreaWidget<PapyriWidget>;
    const datasetKey = 'papyriInspector'

    function openPapyri(args: string): MainAreaWidget<PapyriWidget> {
      if (!isPapyriOpen()) {
        widget = new MainAreaWidget({
          content: new PapyriWidget()
        })
        widget.id = 'papyri-browser'
        widget.title.label = 'Papyri browser'
        widget.title.closable = true
        void tracker.add(widget)
        source = source && !source.isDisposed ? source : null
        widget.content.source = source
        widget.content.source?.onEditorChange(args)
      }
      if (!widget.isAttached) {
        app.shell.add(widget, 'main', {
          activate: false,
          mode: 'split-right',
        })
      }
      app.shell.activateById(widget.id)
      document.body.dataset[datasetKey] = 'open';
      return widget
    }

    function closePapyri(): void {
      widget.dispose()
      delete document.body.dataset[datasetKey]
    }

    // Add papyri:open to the command registry
    app.commands.addCommand(CommandIDs.open, {
      label: 'Open papyri browser',
      isEnabled: () => !widget || widget.isDisposed || !widget.isAttached || !widget.isVisible,
      execute: args => {
        const text = args && (args.text as string);
        const refresh = args && (args.refresh as boolean);
        if (isPapyriOpen() && refresh) {
          widget.content.source?.onEditorChange(text)
        } else {
          openPapyri(text)
        }
      },
    });

    // Add papyri:close to the command registry
    app.commands.addCommand(CommandIDs.close, {
      label: 'Close papyri browser',
      isEnabled: () => isPapyriOpen(),
      execute: () => closePapyri(),
    })

    // Add papyri:toggle to the command registry
    app.commands.addCommand(CommandIDs.toggle, {
      isToggled: () => isPapyriOpen(),
      execute: args => {
        if (isPapyriOpen()) {
          closePapyri()
        } else {
          const text = args && (args.text as string);
          openPapyri(text)
        }
      }
    })

    // Add the open command to the palette, if the palette is available.
    if (palette) {
      palette.addItem({ command: CommandIDs.toggle, category: 'Papyri' });
    }

    // Add the c
    if (restorer) {
      void restorer.restore(tracker, {
        command: CommandIDs.toggle,
        name: () => 'papyri',
      });
    }
  },
};

const notebooks: JupyterFrontEndPlugin<void> = {
  id: 'papyri-lab:notebooks',
  autoStart: true,
  requires: [IInspector, INotebookTracker, ILabShell],
  activate: (
    app: JupyterFrontEnd,
    manager: IInspector,
    notebooks: INotebookTracker,
    labShell: ILabShell,
  ): void => {
    // Each notebook has a corresponding handler; these are kept here.
    const handlers: { [id: string]: PapyriInspectionHandler } = {}

    // Each time a notebook is created, a new handler is assigned to it.
    notebooks.widgetAdded.connect((sender: any, parent: any) => {
      const sessionContext = parent.sessionContext;
      const rendermime = parent.content.rendermime;
      const connector = new KernelConnector({ sessionContext });
      const handler = new PapyriInspectionHandler({ connector, rendermime });

      // Associate the handler to the widget.
      handlers[parent.id] = handler;

      // Set the initial editor.
      const cell = parent.content.activeCell;
      handler.editor = cell && cell.editor;

      // Listen for active cell changes.
      parent.content.activeCellChanged.connect((sender: any, cell: any) => {
        handler.editor = cell && cell.editor;
      });

      // Listen for parent disposal.
      parent.disposed.connect(() => {
        delete handlers[parent.id];
        handler.dispose();
      });
    });

    // Keep track of notebook instances and set inspector source.
    labShell.currentChanged.connect((sender, args) => {
      const widget = args.newValue;
      if (!widget || !notebooks.has(widget)) {
        return;
      }
      const source = handlers[widget.id];
      if (source) {
        manager.source = source;
      }
    });
  }
}

const plugins = [papyri, notebooks]

export default plugins;
