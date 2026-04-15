---
title: Android Device Rooting
type: techniques
created: 2014-02-01
last_updated: 2014-02-01
related: ["[[Linux Shell Commands]]", "[[Linux Gaming with Dota 2]]"]
sources: ["b0d709e93430"]
---

# Android Device Rooting

In February 2014, the subject attempted to root a Nexus 7 (2013) tablet under Linux Mint in order to enable circumvention tools. The process took several days due to missing documentation about Linux-specific driver configuration and fastboot mode requirements.

## Process

The subject followed a guide for rooting the Nexus 7 on Ubuntu/Linux, substituting a TWRP recovery image downloaded from Baidu Netdisk when the original link was unavailable.

The final step stalled with a `<wait for devices>` error. The cause was missing udev rules for the Android device under Linux. Unlike Windows, which requires manufacturer drivers, or macOS, which often works without configuration, Linux relies on udev for USB device management.

## udev Configuration

The subject created a rules file at `/etc/udev/rules.d/51-android.rules`. The steps were:

1. Use `lsusb` to identify the device's bus, device, vendor ID, and product ID.
2. Check the permissions of the corresponding `/dev/bus/usb/XXX/YYY` file.
3. Write a rule matching the vendor and product IDs, setting the mode, owner, and group to match the observed permissions.

After reloading the rules and reconnecting the device, an `android*` symlink appeared in `/dev`, and `adb devices` listed the tablet.

## fastboot Mode

A second obstacle was that some steps required fastboot mode rather than recovery mode. The subject discovered this after consulting a Stack Overflow question about `fastboot devices` not returning results. After switching to fastboot mode with `adb reboot bootloader`, the `fastboot devices` command successfully detected the tablet and the rooting process completed.
