import { CodeEditor } from '@jupyterlab/codeeditor'
import { Text } from '@jupyterlab/coreutils';
import { IRenderMimeRegistry, MimeModel } from '@jupyterlab/rendermime';
import { URLExt } from '@jupyterlab/coreutils';
import { IDataConnector } from '@jupyterlab/statedb';
import { JSONExt } from '@lumino/coreutils';
import { IDisposable } from '@lumino/disposable';
import { Debouncer } from '@lumino/polling';
import { ISignal, Signal } from '@lumino/signaling';

import { IInspector, InspectionHandler } from '@jupyterlab/inspector';

import { ServerConnection } from '@jupyterlab/services';

/**
 * Call the API extension
 *
 * @param endPoint API REST end point for the extension
 * @param init Initial values for the request
 * @returns The response body interpreted as JSON
 */
export async function requestAPI<T>(
  endPoint = '',
  init: RequestInit = {}
): Promise<T> {
  // Make request to Jupyter API
  const settings = ServerConnection.makeSettings();
  const requestUrl = URLExt.join(
    settings.baseUrl,
    'papyri-lab', // API Namespace
    endPoint
  );

  let response: Response;
  try {
    response = await ServerConnection.makeRequest(requestUrl, init, settings);
  } catch (error) {
    throw new ServerConnection.NetworkError(error);
  }

  let data: any = await response.text();

  if (data.length > 0) {
    try {
      data = JSON.parse(data);
    } catch (error) {
      console.log('Not a JSON response body.', response);
    }
  }

  if (!response.ok) {
    throw new ServerConnection.ResponseError(response, data.message || data);
  }

  return data;
}

export class PapyriInspectionHandler implements IDisposable, IInspector.IInspectable {

  constructor(options: InspectionHandler.IOptions) {
    this._connector = options.connector;
    this._rendermime = options.rendermime;
    this._debouncer = new Debouncer(this.onEditorChange.bind(this), 250);
  }

  get cleared(): ISignal<PapyriInspectionHandler, void> {
    return this._cleared;
  }

  get disposed(): ISignal<PapyriInspectionHandler, void> {
    return this._disposed;
  }

  get inspected(): ISignal<PapyriInspectionHandler, IInspector.IInspectorUpdate> {
    return this._inspected;
  }

  get editor(): CodeEditor.IEditor | null {
    return this._editor;
  }

  set editor(newEditor: CodeEditor.IEditor | null) {
    if (newEditor === this._editor) {
      return;
    }

    Signal.disconnectReceiver(this);

    this._editor = newEditor;

    if (this._editor) {
      this._cleared.emit(void 0);
      this.onEditorChange();
      this._editor.model.selections.changed.connect(this._onChange, this)
      this._editor.model.value.changed.connect(this._onChange, this)
    }
  }

  get standby(): boolean {
    return this._standby;
  }

  set standby(value: boolean) {
    this._standby = value;
  }

  get isDisposed(): boolean {
    return this._isDisposed;
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;
    this._disposed.emit(void 0);
    Signal.clearData(this);
  }

  // Handle a text changed signal from an editor
  onEditorChange(customText?: string): void {
    debugger
    if (this._standby) {
      return;
    }

    const editor = this.editor;

    if (!editor) {
      return;
    }

    const text = customText ? customText : editor.model.value.text;
    const position = editor.getCursorPosition();
    const offset = Text.jsIndexToCharIndex(editor.getOffsetAt(position), text);
    const update: IInspector.IInspectorUpdate = { content: null }

    // Increment the pending request counter
    const pending = ++this._pending;

    console.log({ customText })

    void this._connector.fetch({ offset, text }).then(reply => {
      // If the reply is null, or this handler is disposed, or a new request is pending, bail
      if (!reply || this.isDisposed || pending !== this._pending) {
        this._lastInspectedReply = null;
        this._inspected.emit(update);
        return;
      }

      // If the reply is the same as the last, bail
      const { data } = reply;
      if (
        this._lastInspectedReply &&
        JSONExt.deepEqual(this._lastInspectedReply, data)
      ) {
        return;
      }

      const mimeType = this._rendermime.preferredMimeType(data);
      if (mimeType) {
        const widget = this._rendermime.createRenderer(mimeType);
        const model = new MimeModel({ data });
        void widget.renderModel(model);
        update.content = widget;
      }

      this._lastInspectedReply = reply.data;
      this._inspected.emit(update)
    }).catch(() => {
      this._lastInspectedReply = null;
      this._inspected.emit(update)
    })
  }

  private _onChange(): void {
    void this._debouncer.invoke()
  }

  private _cleared = new Signal<PapyriInspectionHandler, void>(this);
  private _connector: IDataConnector<
    InspectionHandler.IReply,
    void,
    InspectionHandler.IRequest
  >;
  private _disposed = new Signal<this, void>(this);
  private _editor: CodeEditor.IEditor | null = null;
  private _inspected = new Signal<this, IInspector.IInspectorUpdate>(this);
  private _isDisposed = false;
  private _pending = 0; // Number of requests pending
  private _rendermime: IRenderMimeRegistry;
  private _standby = true;
  private _debouncer: Debouncer;
  private _lastInspectedReply: InspectionHandler.IReply['data'] | null = null;
}
