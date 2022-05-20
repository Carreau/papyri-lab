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

/**
 * Initialization data for the papyri-lab extension.
 */
const display: JupyterFrontEndPlugin<void> = {
  id: 'papyri-lab:plugin',
  autoStart: true,
  optional: [ICommandPalette, ISettingRegistry, ILayoutRestorer],
  activate: async (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    settingRegistry: ISettingRegistry,
    restorer: ILayoutRestorer,
  ) => {
    console.log('JupyterLab extension papyri-lab is activated!');

    if (settingRegistry) {
      try {
        const settings = (await settingRegistry.load(display.id)).composite;
        console.log('papyri-lab settings loaded:', settings.composite);
      } catch (reason) {
        console.error('Failed to load settings for papyri-lab.', reason);
      }
    }

    let widget: MainAreaWidget<PapyriWidget>;

    const command = 'papyri:open';
    app.commands.addCommand(command, {
      label: 'Open papyri browser',
      execute: () => {
        if (!widget) {
          const content = new PapyriWidget();
          widget = new MainAreaWidget<PapyriWidget>({ content });
          widget.id = 'papyri-browser';
          widget.title.label = 'Papyri browser';
          widget.title.closable = true;
        }
        if (!tracker.has(widget)) {
          // Track the state of the widget for later restoration
          tracker.add(widget);
        }
        if (!widget.isAttached) {
          // Attach the widget to the main work area if it's not there
          app.shell.add(widget, 'main');
        }
        // Activate the widget
        app.shell.activateById(widget.id);
      },
    });
    // Add the command to the palette.

    palette.addItem({ command, category: 'Papyri' });
    // Track and restore the widget state
    const tracker = new WidgetTracker<MainAreaWidget<PapyriWidget>>({
      namespace: 'papyri',
    });
    restorer.restore(tracker, {
      command,
      name: () => 'papyri',
    });
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
    notebooks.widgetAdded.connect((sender, parent) => {
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
      parent.content.activeCellChanged.connect((sender, cell) => {
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

const plugins = [display, notebooks]

export default plugins;
