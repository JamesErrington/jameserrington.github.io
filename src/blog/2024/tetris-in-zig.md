---
title: Compiling Tetris for SDL2 and Web Assembly with Zig
summary: Notes on building a basic Tetris game in Zig, with support for both SDL2 and Web Assembly runtimes.
date: 2024-02-14
tags:
  - coding
  - zig
  - wasm
layout: post
---
I've recently been playing around with Web Assembly, inspired by [Tsoding's snake-c-wasm project](https://github.com/tsoding/snake-c-wasm/) and the [no-Emscripten approach](https://surma.dev/things/c-to-webassembly/) to WASM compilation. As someone with a web development background that is looking to expand their knowledge into new domains, the idea of being able to practice writing languages like C, Zig, Go, or Rust, to create web applications was very appealing.

Here are some notes on making a simple Tetris clone in Zig, that can be compiled to run as both a native app via SDL2, and a web app via WASM. You can test the [web version here](https://jameserrington.github.io/zig-tetris/) - it's basic, but it works.

<img src="{{ '/img/tetris.png' | url }}" class="img__full-width" style="width: 80%;" />

### Zig setup

I used [Zig](https://ziglang.org/) for this project as it is a language I am enjoying writing a lot at the moment. I have also used C for WASM, and you may well be able to use Go or Rust (I am not sure about how well they work without Emscripten).

I first started with the SDL version of the game. Following Andrew Kelley's own [zig-sdl-demo](https://github.com/andrewrk/sdl-zig-demo), I made the change from relying on Andrew's Zig-SDL2 package and instead just link the system library (this of course requires SDL2 to be installed on your system). The Zig build system really comes into its own here, saving the need for complex Makefiles or CMakeLists in favour just... writing some Zig code:

```zig
const std = @import("std");

pub fn build(b: *std.Build) void {
	const target = b.standardTargetOptions(.{});
	const optimize = b.standardOptimizeOption(.{});

	const exe = b.addExecutable(.{
		.name = "main",
		.root_source_file = .{ .path = "src/main.zig" },
		.target = target,
		.optimize = optimize,
	});
	// The important bit - we link the system version of SDL2, and libC
	exe.linkSystemLibrary("sdl2");
	exe.linkLibC();

	b.installArtifact(exe);
}
```

And with that, we have SDL2 ready to use in our Zig code! Following Andrew's demo, we can see how Zig again makes using C libraries a breeze, with new features like `defer` and `orelse` working seamlessly with C code:

```zig
const c = @cImport({
	@cInclude("SDL2/SDL.h");
});

pub fn main() !void {
	if (c.SDL_Init(c.SDL_INIT_VIDEO) != 0) {
		c.SDL_Log("Unable to initialize SDL: %s", c.SDL_GetError());
		return error.SDLInitFailed;
	}
	defer c.SDL_Quit();
	// And so on...
}
```

### SDL2 version

With our environment all set up, it was time to implement the game. To help me along, I found Howard Price's [sdl2-tetris](https://github.com/howprice/sdl2-tetris) , which is written in C++ and structured very differently to how I intended to write my Zig project; it did however help greatly with the game logic and rendering code.

The game itself is a basic Tetris clone, with SPACE key to start or restart, arrow keys to rotate or move the pieces, and a tracked score of how many full rows have been cleared. I used Zig's `enum` type a lot in the codebase, which I found to be both useful and at times annoying: the type safety and encapsulation is nice, but having to keep remembering to use `@enumToInt` and `@intToEnum` did get tiring. I also found that having to switch between `usize` for Zig array indexing and `c_int` for interacting with SDL2 code was frustrating. It's quite likely I've not done this the best way in this project and will be looking out in the future for better ways of solving these issues.

With the core logic built, linking up to run on SDL2 was very straightforward; I used Tsoding's approach of defining `platform-` specific rendering methods, with this game requiring 3:

```zig
extern fn platform_draw_rect(x: i32, y: i32, width: i32, height: i32, rgba: u32) void;
extern fn platform_fill_rect(x: i32, y: i32, width: i32, height: i32, rgba: u32) void;
extern fn platform_fill_text(x: i32, y: i32, text: [*c]const u8, rgba: u32) void;
```

It is just a case of defining the SDL2 specific implementations of these, alongside a `main` entrypoint that initializes everything and starts the game loop. In Zig, these implementations must be marked with `export`:

```zig
export fn platform_draw_rect(x: i32, y: i32, width: i32, height: i32, rgba: u32) void {
	// Function body...
}
```

### Web Assembly version

The Web Assembly version is a bit more involved, as we have to cross the boundary into the browser for some of the implementation. To start, I added an `index.html` file with a `<canvas>` tag, which loads some Javascript that will be used to instantiate the WASM file and start the game.

But first, we need to be able to generate the WASM file. Since Zig 0.11.0 (the version used here) is on LLVM, this is simple - however, as [Zig is intending to remove LLVM completely](https://github.com/ziglang/zig/issues/16270) from the toolchain, it is possible WASM support may go backwards for a while.

Providing you are on Zig 0.11.0, building for WASM can be achieved with a small alteration to the `build.zig` file, by adapting the cli commands used in [zigtoys](https://github.com/sleibrock/zigtoys) :

```zig
pub fn build(b: *std.Build) void {
	const lib = b.addSharedLibrary(.{
		.name = "game",
		.root_source_file = .{ .path = "src/game.zig" },
		.target = .{
			.cpu_arch = .wasm32,
			.os_tag = .freestanding,
		},
		.optimize = .ReleaseSmall,
	});
	// Important! This must be set in order to export the symbols
	lib.rdynamic = true;

	b.installArtifact(lib);
}
```

A neat feature of Zig's build system is that we can define our own new options for the build command; here, we can add a 'platform' option which will allow users to specify which version they want to build:

```zig
const Platform = enum {
	sdl,
	wasm,
	all,
};

pub fn build(b: *std.Build) void {
	const platform = b.option(Platform, "platform", "platform to build for") orelse .all;
	// We can now use the `platform` variable to alter the build graph as required
}
```

This will generate a `game.wasm` file. But, we haven't actually told Zig what we want it to include in the WASM file as functions to expose to the browser! To do this, we need to make sure we have a couple of things set up: the first is that the functions we want to export must use the C call convention, and the second is that we have marked them for export:

```zig
pub fn Game_Init(seed: u64) callconv(.C) void {
	// Function body...
}

comptime {
	@export(Game_Init, .{ .name = "Game_Init" });
}
```

Again, there is likely a much better way to do this, but this worked for me. Now when we build for WASM we will have the symbols exported correctly. All that is left is to write the Javascript glue that will set up the web side and hand off to Zig / WASM.

For that, we need to make sure we define the three external functions that are used for drawing, and tell Web Assembly how to find them:

```js
function platform_draw_rect(x, y, width, height, rgba) {
	// Function body...
}

function platform_fill_rect(x, y, width, height, rgba) {
	// Function body...
}

function platform_fill_text(x, y, text_ptr, rgba) {
	// Function body...
}

const imports = {
	env: {
		platform_draw_rect,
		platform_fill_rect,
		platform_fill_text,
	}
}

window.document.body.onload = function() {
	WebAssembly
		.instantiateStreaming(fetch("zig-out/lib/game.wasm"), imports)
		.then(source => {
			// Our exported Zig functions can be found in
			// source.instance.exports
			// e.g source.instance.exports.Game_Init()
		})
}
```

I filled in the rest of the code with help from Tsoding's [snake-wasm ](https://github.com/tsoding/snake-c-wasm/blob/master/wasm_main.js) project, and that's that! I used Python to serve the page as it is quick and simple and I can remember the command:

```bash
> python3 -m http.server 8080
```

Perhaps in the future I could integrate a Zig HTTP server as part of the build process to serve the site, but for now this works well.

### Hosting

As I have been using GitHub to host the repository it's easy to host the site publicly by simply enabling GitHub pages on the master branch:

<img src="{{ '/img/github-pages.png' | url }}" class="img__full-width" />

### Summary

In all, this was a very fun project and I learnt a lot - it's always great to write Zig, and I think I am now convinced I want to take on my next big project using it as opposed to the false starts I've had in C, C++, Go, and Rust. Being able to interface so seamlessly with C code, as well as the WASM compilation, on top of all the awesome features Zig has like the build system and in the language makes it a great tool.

I might take a break from WASM for now though - a lot of this has been adapting other people's examples and demos, and I want to get on now with some original work. I will probably come back in the future though, as it is an exciting technology with lots of potential.
