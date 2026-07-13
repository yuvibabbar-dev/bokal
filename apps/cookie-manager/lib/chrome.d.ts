declare namespace chrome.permissions {
  interface PermissionsAddedEvent {
    removeListener(callback: (permissions: Permissions) => void): void;
  }

  interface PermissionsRemovedEvent {
    removeListener(callback: (permissions: Permissions) => void): void;
  }
}
