---
title: Windows Concurrency
type: techniques
created: 2011-01-11
last_updated: 2011-01-11
related: ["[[C++ Memory and Objects]]", "[[Game Programming Fundamentals]]"]
sources: ["5ebcd15241b1", "7cf2b46de605"]
---

# Windows Concurrency

## Thread Creation

The Win32 API provides `CreateThread` for spawning threads. A thread receives a parameter via `LPVOID`, runs a specified function, and returns a `DWORD` exit code. The caller receives a thread handle and thread ID. After work completes, `WaitForMultipleObjects` can synchronize on thread handles, and `CloseHandle` releases resources.

An experiment documented the relative execution times of bubble sort and selection sort running in parallel on identical randomized arrays of 100,000 integers. Bubble sort was consistently slower than selection sort. When thread priorities were adjusted — bubble sort set to `THREAD_PRIORITY_HIGHEST` and selection sort to `THREAD_PRIORITY_LOWEST` — the higher-priority thread completed faster, demonstrating the effect of scheduler priority on CPU-bound workloads.

## Process Creation

`CreateProcess` launches a new process. The caller provides a `STARTUPINFO` structure and receives a `PROCESS_INFORMATION` structure containing handles to the process and its primary thread. An example entry demonstrated launching `QQ.exe` from a specified path and verifying the result with error handling via `GetLastError` and `FormatMessage`.
