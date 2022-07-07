import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';
import { PapyriPanel } from './widget';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { INotebookTracker } from '@jupyterlab/notebook';

import { Token } from '@lumino/coreutils';

import {
  ICommandPalette,
  MainAreaWidget,
  WidgetTracker,
} from '@jupyterlab/apputils';

import { KernelSpyModel } from './kernelspy';

namespace CommandIDs {
  export const open = 'papyri:open';
  export const close = 'papyri:close';
  export const toggle = 'papyri:toggle';
}

const IPapyriExtension = new Token<IPapyriExtension>('papyri-lab');

export interface IPapyriExtension {
  kernelSpy: KernelSpyModel;
}

class PapyriExtension implements IPapyriExtension {
  constructor(notebookTracker: INotebookTracker) {
    this.kernelSpy = new KernelSpyModel(notebookTracker);
  }

  kernelSpy: KernelSpyModel;
}

/**
 * Initialization data for the papyri-lab extension.
 */
const plugin: JupyterFrontEndPlugin<IPapyriExtension> = {
  id: 'papyri-lab:plugin',
  autoStart: true,
  requires: [INotebookTracker],
  optional: [ICommandPalette, ISettingRegistry, ILayoutRestorer],
  provides: IPapyriExtension,
  activate: async (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    palette: ICommandPalette | null,
    settingRegistry: ISettingRegistry,
    restorer: ILayoutRestorer | null,
  ): Promise<IPapyriExtension> => {
    if (settingRegistry) {
      try {
        const settings = (await settingRegistry.load(plugin.id)).composite;
        console.log('papyri-lab settings loaded:', settings.composite);
      } catch (reason) {
        console.error('Failed to load settings for papyri-lab.', reason);
      }
    }

    let widget: MainAreaWidget<PapyriPanel>;
    const datasetKey = 'papyriInspector';
    const extension = new PapyriExtension(notebookTracker);

    // Track and restore the widget state
    const tracker = new WidgetTracker<MainAreaWidget<PapyriPanel>>({
      namespace: 'papyri',
    });

    function isPapyriOpen() {
      return widget && !widget.isDisposed;
    }

    function openPapyri(args: any): MainAreaWidget<PapyriPanel> {
      console.log('openPapyri:');
      if (!isPapyriOpen()) {
        widget = new MainAreaWidget({
          content: new PapyriPanel(),
        });
        void tracker.add(widget);
      }
      if (!widget.isAttached) {
        app.shell.add(widget, 'main', {
          activate: false,
          mode: 'split-right',
        });
      }
      app.shell.activateById(widget.id);
      document.body.dataset[datasetKey] = 'open';
      console.log('WCCC:', widget.content.comp.current);
      console.log('WCCL:', widget.content.comp.current.loadPage);
      if (Object.keys(args).length !== 0) {
        console.log('AA:', args);

        widget.content.comp.current.loadPage({
          moduleName: '*',
          version: '*',
          kind: 'api',
          path: args.qualname,
        });
      }
      return widget;
    }

    function closePapyri(): void {
      widget.dispose();
      delete document.body.dataset[datasetKey];
    }

    // Add papyri:open to the command registry
    app.commands.addCommand(CommandIDs.open, {
      label: 'Open papyri browser',
      isEnabled: () =>
        !widget || widget.isDisposed || !widget.isAttached || !widget.isVisible,
      execute: args => openPapyri(args),
    });

    // Add papyri:close to the command registry
    app.commands.addCommand(CommandIDs.close, {
      label: 'Close papyri browser',
      isEnabled: () => isPapyriOpen(),
      execute: () => closePapyri(),
    });

    // Add papyri:toggle to the command registry
    app.commands.addCommand(CommandIDs.toggle, {
      label: 'Toggle papyri browser',
      isToggled: () => isPapyriOpen(),
      execute: args => {
        if (isPapyriOpen()) {
          closePapyri();
        } else {
          openPapyri(args);
        }
      },
    });

    // Add the commands above to the command palette, if available.
    if (palette) {
      Object.values(CommandIDs).forEach(command =>
        palette.addItem({ command, category: 'Papyri' }),
      );
    }

    if (restorer) {
      void restorer.restore(tracker, {
        command: CommandIDs.toggle,
        name: () => 'papyri',
      });
    }

    extension.kernelSpy.questionMarkSubmitted.connect((_, args) => {
      console.info('KSpy questionMarkSubmitted args:', args);
      openPapyri(args);
    });

    return extension;
  },
};

export default plugin;
