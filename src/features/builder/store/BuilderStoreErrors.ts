export class MissingBuilderStoreProviderError extends Error {
  constructor() {
    super("Builder workspace components require BuilderStoreProvider");
    this.name = "MissingBuilderStoreProviderError";
  }
}
