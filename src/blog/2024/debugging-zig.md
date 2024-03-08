---
title: Debugging Zig executables and tests in VS Code
summary:
date: 2024-03-07
tags:
  - coding
  - zig
  - vscode
  - debugging
layout: post
---
Step debugging is one of those things that I know is great and can save you hours of headaches when tackling problems, but I too often find I am too lazy to set it up espcially in a new environment. I've been using Zig for a good few months now and I finally decided to take the plunge and break the habit of reaching for `std.debug.print()` every time I wanted to debug something. Here are some notes (for if nothing else my own keeping) on setting VS Code debugging for Zig, on MacOS.

Although I have moved to trying out [Zed](https://zed.dev/) as my daily driver editor, it doesn't seem to have any in-built support for step debugging so it was back to VS Code I went for this task. Much of the work setting this up was scraped from various small examples and snippets I found on Medium / Reddit, just all compiled here into one solution.

### Debugging Executables

First, we look at debugging executables. This is pretty straightforward - we just need a task to build the file, which we can define in `.vscode/tasks.json`:
```json
{
	"version": "2.0.0",
	"tasks": [
		{
			"label": "build",
			"type": "shell",
			"command": "zig build",
		}
	]
}

```

and then a configuration to run the build task and launch the debugger, which we add in `.vscode/launch.json`:
```json
{
	"version": "0.2.0",
	"configurations": [
		{
			"name": "Debug Main",
			"type": "cppdbg",
			"request": "launch",
			"program": "${workspaceFolder}/zig-out/bin/main",
			"preLaunchTask": "build",
			"MIMode": "lldb",
			"cwd": "${workspaceFolder}"
		}
	]
}
```
Where the `preLaunchTask` is the name of the build task you defined in `tasks.json`, and `zig-out/bin/main` is the path to the executable built by your Zig project.

### Debugging Tests
Zig comes with a custom format for defining `test` blocks inside source code files. These are built into a seperate binary when the `zig test` command is run, which we can use to debug these test blocks.

First, we add a new task to `.vscode/tasks.json`:
```json
{
	"label": "build-test",
	"type": "shell",
	"command": "zig test --test-no-exec -femit-bin=zig-out/bin/${fileBasenameNoExtension}-test ${file}",
}
```
We use the `-test-no-exec` to skip the actual running of the tests here and just build the binary, and the `-femit-bin` to control where that binary is output. The `${fileBasenameNoExtension}` and `${file}` inputs are defined by VS Code and relate to the currently open file when the task is run.

With this, we can add a corresponding launch configuration for debugging tests:
```json
{
	"name": "Debug Test",
	"type": "cppdbg",
	"request": "launch",
	"program": "${workspaceFolder}/zig-out/bin/${fileBasenameNoExtension}-test",
	"preLaunchTask": "build-test",
	"MIMode": "lldb",
	"cwd": "${workspaceFolder}"
}
```
Again, using the name of the build task in the `preLaunchTask` field, and making sure we match up the file paths for the outputted binary.

And with that, we are done! Just add breakpoints in your code or tests, and run the corresponding launch files within VS Code.
