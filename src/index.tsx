import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { PapyriWidget } from './widget';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import {
  ICommandPalette,
  MainAreaWidget,
  WidgetTracker
} from '@jupyterlab/apputils';

/**
 * Initialization data for the papyri-lab extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'papyri-lab:plugin',
  autoStart: true,
  optional: [ICommandPalette, ISettingRegistry, ILayoutRestorer],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    settingRegistry: ISettingRegistry,
    restorer: ILayoutRestorer
  ) => {
    console.log('JupyterLab extension papyri-lab is activated!');

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('papyri-lab settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for papyri-lab.', reason);
        });
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
      }
    });
    // Add the command to the palette.

    palette.addItem({ command, category: 'Papyri' });
    // Track and restore the widget state
    const tracker = new WidgetTracker<MainAreaWidget<PapyriWidget>>({
      namespace: 'papyri'
    });
    restorer.restore(tracker, {
      command,
      name: () => 'papyri'
    });
  }
};

export default plugin;
