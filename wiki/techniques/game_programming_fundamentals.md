---
title: Game Programming Fundamentals
type: techniques
created: 2010-12-29
last_updated: 2010-12-29
related: ["[[DirectX Programming]]", "[[Windows Concurrency]]", "[[Animation and Film Language]]"]
sources: ["cbf9c974b44e"]
---

# Game Programming Fundamentals

## Object-Oriented Programming in Games

An entry from December 2010 summarized core software engineering concepts relevant to game development. The four pillars of object-oriented programming are abstraction, encapsulation, inheritance, and polymorphism. Templates provide a higher level of abstraction when data member types need to remain flexible at compile time.

## C++ for PC Games

C++ is the dominant language for PC game development because it is a compiled language that combines high-level abstraction with low-level hardware access. Unlike C# or Java, C++ does not require a virtual machine, eliminating the overhead of interpretation. Games demand high frame rates, rapid input response, and high-throughput network communication, making the efficiency of native compilation critical.

## Windows Programming

Windows applications are driven by a message mechanism. Key concepts include:

- **Window handle (`HWND`)** — identifies a window.
- **Device context (`HDC`)** — represents the display surface.
- **Handle** — a variable that abstracts access to a system resource.
- **Double buffering** — a technique to eliminate screen flicker by drawing to an off-screen buffer before copying the completed frame to the display.
- **Key messages** — `WM_KEYDOWN` for keyboard input, `WM_MOUSEMOVE` for mouse movement, `WM_CREATE` for one-time initialization.

## Game Engine Role

A game engine orchestrates game resources and subsystems, including the renderer, physics engine, collision detection, audio, scripting, animation, AI, networking, and scene management. By encapsulating low-level details and exposing higher-level interfaces and tools, an engine accelerates development, reduces difficulty, and enables effects that would be impractical to implement from scratch for each project.
