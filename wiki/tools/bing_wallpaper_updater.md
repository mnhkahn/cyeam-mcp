---
title: Bing Wallpaper Updater
type: tools
created: 2014-09-17
last_updated: 2014-10-09
related: ["[[Linux Shell Commands]]", "[[Go JSON Parsing]]"]
sources: ["d3c65f7b206f", "f0304c9d8230"]
---

# Bing Wallpaper Updater

The subject wrote a small utility to fetch Bing's daily wallpaper and set it as the desktop background. An earlier version ran on a Nexus 7 tablet; in September 2014 the subject adapted the idea for Ubuntu desktop use and later ported it to Windows 8.

## Ubuntu Implementation

Rather than interfacing directly with system APIs to set the wallpaper from memory, the script downloads the image to a temporary directory and invokes a shell command to apply it:

```bash
gsettings set org.gnome.desktop.background picture-uri "file:///path/to/image.jpg"
```

The original approach—converting the downloaded image to binary and passing it directly to a wallpaper-setting API—was abandoned because it required platform-specific encoding. Saving to disk and using a system command proved simpler and more portable across Linux environments.

## Windows Implementation

In October 2014, after switching from Ubuntu to Windows 8, the subject re-implemented the updater in Go using cgo to call the Windows API. The key Win32 function is `SystemParametersInfo` with the `SPI_SETDESKWALLPAPER` flag:

```c
SystemParametersInfo(SPI_SETDESKWALLPAPER, 0, file_path, SPIF_UPDATEINIFILE);
```

Because the function expects a `LPWSTR` (wide-character string pointer), the subject had to convert the Go file path to a `[]byte` array and pass the address of its first element (`&path[0]`)—a subtle difference from C where an array name is itself a pointer.

The program fetches Bing's daily wallpaper by sending an HTTP request to retrieve the image RSS feed and parsing the resulting XML. The compiled binary was placed in the Windows startup folder (`C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup`) so the wallpaper updates automatically on boot.

## References

The subject referenced a Python/Qt example for the download-and-save pattern and stored the adapted script in the [python_code](https://github.com/mnhkahn/python_code/blob/master/bing.py) repository. The Go and cgo implementation is stored in the [go_code](https://github.com/mnhkahn/go_code/tree/master/wallpaper) repository.
