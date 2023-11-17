# Noodle Mono-repo

Welcome to Noodle, a purely functional programming language designed to make learning functional and high-level programming possible without the need to write any code. Noodle gives you access to the javascript and Node.js ecosystem in a visual web-based editor. The power fine-grained lazy evaluation and a strong type system gives you the right tools for writing secure and concise scripts.

## Table of Contents
- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Contribution and Usage](#contribution-and-usage)
- [License](#license)

## Introduction
Noodle follows similar semantics to Haskell, where each expression is only run when needed. Further, Noodle features a generic type system, which eases the development process and allows for concise reusable functions definitions.

Noodle is also highly customizable. A custom editor can be built on top of the language package, or the existing editor can be added into any react application. Custom modules and compilers can be built to create any type of language while keeping the core functionality.

## Getting Started
To get started by using Noodle, try out the [online demo](https://desidename).

## Contribution and Usage
This pnpm mono-repo contains:
- The [language package](/packages/language/). Type definitions, validators and compilers for noodle.
- The [editor package](/packages/editor/). An example for a noodle editor built in react.

## License
MIT