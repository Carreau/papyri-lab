import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';


import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { requestAPI } from './handler';
import { ICommandPalette, MainAreaWidget } from '@jupyterlab/apputils';

import { Widget } from '@lumino/widgets';

/**
 * Initialization data for the papyri-lab extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'papyri-lab:plugin',
  autoStart: true,
  optional: [ICommandPalette, ISettingRegistry],
  activate: (app: JupyterFrontEnd, palette: ICommandPalette, settingRegistry: ISettingRegistry) => {
    console.log('JupyterLab extension papyri-lab is activated!');
    console.log('ICommandPalette PPLab:', palette);
    console.log('SettingRegistry PPLab:', settingRegistry);

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

    const content = new Widget();
    const widget = new MainAreaWidget({ content });
    widget.id = 'papyri-browser';
    widget.title.label = 'Papyri browser';
    widget.title.closable = true;

    const command: string = 'papyri:open';
    app.commands.addCommand(command, {
      label: 'Open papyri browser',
      execute: () => {
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

    requestAPI<any>('get_example')
      .then(data => {
        console.log(data);
      })
      .catch(reason => {
        console.error(
          `The papyri_lab server extension appears to be missing.\n${reason}`
        );
      });
  }
};

export default plugin;
