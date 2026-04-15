---
title: Android Development
type: techniques
created: 2014-04-23
last_updated: 2014-07-17
related: ["[[Android Device Rooting]]", "[[Linux Shell Commands]]"]
sources: ["b0a3c18b1568", "67a21eb9a584", "db56428b5cf5"]
---

# Android Development

## SharedPreferences

In April 2014, the subject documented Android's `android.content.SharedPreferences` API for storing application configuration. `SharedPreferences` is accessible from Activities, Services, BroadcastReceivers, and ContentProviders.

### Reading Values

Direct getters include `getString`, `getBoolean`, `getInt`, `getLong`, and `getFloat`.

### Writing Values

Modifications require an `Editor` obtained via `edit()`. Changes are persisted with `commit()`.

### PreferenceActivity

`PreferenceActivity` with `addPreferencesFromResource` can automatically generate a settings UI from an XML resource. After a user changes a setting, the summary can be updated programmatically via `findPreference()` and `setSummary()`.

### ListPreference

`ListPreference` provides a drop-down selection similar to an HTML select element, with separate arrays for display labels and stored values.

### Change Listener

Implement `OnSharedPreferenceChangeListener` and register it with `registerOnSharedPreferenceChangeListener()`. Unregister with `unregisterOnSharedPreferenceChangeListener()` to avoid leaks.

## System Images and Flashing

In July 2014, the subject installed the Android L preview on a Nexus 7 (2013). The process involved downloading the factory image for the "razor" variant, rebooting into fastboot with `adb reboot bootloader`, extracting the image, and running `./flash-all.sh`. The subject found the installation straightforward but encountered app compatibility issues: Weibo failed to launch and QQ displayed rendering problems. Battery life improved noticeably, but the overall stability fell short of expectations, leading the subject to revert to Android 4.4 the same day.

## Emulator Camera

Also in July 2014, the subject configured camera support for the Android emulator on Linux Mint. After trying several outdated tutorials, the working configuration required selecting an Intel CPU/ABI and adding an SD card to the virtual device.
