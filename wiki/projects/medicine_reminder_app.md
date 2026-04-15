---
title: Medicine Reminder App
type: projects
created: 2026-03-14
last_updated: 2026-04-02
related: ["[[Android Development]]", "[[Development Tools]]"]
sources: ["cd657152c5b1"]
---

# Medicine Reminder App

The Medicine Reminder App (药不能停) is an Android medication-management application developed by the subject. All data is stored locally on the device with no network upload.

## Features

- **Medication management** — add or remove medicines with name, dosage, and daily reminder time.
- **Daily reminders** — repeating alarms trigger at the configured time each day.
- **History log** — view a record of all reminders and confirmed doses.
- **Data backup** — local backup and restore to prevent data loss during reinstallation.

## Requirements

- Minimum Android 8.0 (API 26).

## Common Issues

- **Reminders stop after one occurrence** — usually caused by the system killing the background process. The recommended fix is to enable auto-start, allow background running, and disable battery optimization for the app.
- **No notifications received** — check that app notification permissions are granted and that the device is not in silent or Do-Not-Disturb mode.
- **Reminders lost after reboot** — the app supports automatically restoring all alarms on boot.
- **Data missing after upgrade** — normal覆盖 upgrades preserve data; if lost, use the restore feature from the latest backup.

## Change Log

### v1.0.1 (2026-04-02)

- Integrated Baidu mobile analytics SDK.
- Added multi-language support and internationalized UI strings.
- Added future-reminder functionality and refined the interface.
- Fixed dosage labels to use localized resource strings.

### v1.0.0 (2026-03-14)

- Initial release with local medication and dose-record storage, history query, and push reminders.
