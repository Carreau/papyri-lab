import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';
import { PapyriPanel } from './widget';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import {
  INotebookTracker,
  NotebookPanel
} from '@jupyterlab/notebook'

import {
  ICommandPalette,
  MainAreaWidget,
  WidgetTracker,
} from '@jupyterlab/apputils';


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
  requires: [INotebookTracker],
  optional: [ICommandPalette, ISettingRegistry, ILayoutRestorer],
  activate: async (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
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
    const tracker = new WidgetTracker<MainAreaWidget<PapyriPanel>>({
      namespace: 'papyri',
    });

    function isPapyriOpen() {
      return widget && !widget.isDisposed;
    }

    let widget: MainAreaWidget<PapyriPanel>;
    const datasetKey = 'papyriInspector'

    function openPapyri(args: any): MainAreaWidget<PapyriPanel> {
      let notebook: NotebookPanel | null;
      if (args.path) {
        notebook = notebookTracker.find(nb => nb.context.path === args.path) ?? null
      } else {
        notebook = notebookTracker.currentWidget
      }

      if (!isPapyriOpen() && notebook) {
        widget = new MainAreaWidget({
          content: new PapyriPanel(notebook.context.sessionContext?.session?.kernel)
        })
        void tracker.add(widget)

        notebook.context.sessionContext.kernelChanged.connect((_, args) => {
          widget.content.model.kernel = args.newValue
        })

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
      execute: args => openPapyri(args),
    });

    // Add papyri:close to the command registry
    app.commands.addCommand(CommandIDs.close, {
      label: 'Close papyri browser',
      isEnabled: () => isPapyriOpen(),
      execute: () => closePapyri(),
    })

    // Add papyri:toggle to the command registry
    app.commands.addCommand(CommandIDs.toggle, {
      label: 'Toggle papyri browser',
      isToggled: () => isPapyriOpen(),
      execute: args => {
        if (isPapyriOpen()) {
          closePapyri()
        } else {
          openPapyri(args)
        }
      }
    })

    // Add the commands above to the command palette, if available.
    if (palette) {
      Object.values(CommandIDs).forEach(command => palette.addItem({ command, category: 'Papyri' }))
    }

    if (restorer) {
      void restorer.restore(tracker, {
        command: CommandIDs.toggle,
        name: () => 'papyri',
      });
    }
  },
};

const plugins = [papyri]

export default plugins;
