// Workaround: @types/chrome@0.0.287 omits removeListener() on the
// permissions onAdded/onRemoved event interfaces, so lib/permissions.ts's
// unsubscribe() would not type-check. This declaration-merges the missing
// method back in. Remove once @types/chrome ships it upstream (then bump the pin).

declare namespace chrome.permissions {
  interface PermissionsAddedEvent {
    removeListener(callback: (permissions: Permissions) => void): void;
  }

  interface PermissionsRemovedEvent {
    removeListener(callback: (permissions: Permissions) => void): void;
  }
}
