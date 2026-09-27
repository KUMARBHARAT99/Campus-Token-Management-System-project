export {};

declare global {
  interface ZXingResultLike {
    getText(): string;
  }

  interface ZXingControlsLike {
    stop(): void;
  }

  interface ZXingQRCodeReaderLike {
    decodeFromConstraints(
      constraints: MediaStreamConstraints,
      videoElement: HTMLVideoElement,
      callback: (result: ZXingResultLike | undefined, error: unknown, controls: ZXingControlsLike) => void,
    ): Promise<ZXingControlsLike>;
  }

  interface ZXingBrowserGlobal {
    BrowserQRCodeReader: new () => ZXingQRCodeReaderLike;
  }

  interface Window {
    ZXingBrowser?: ZXingBrowserGlobal;
  }
}
