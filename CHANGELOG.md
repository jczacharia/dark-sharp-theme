# Changelog

All notable changes to the Dark Sharp theme are documented here. The format
follows [Keep a Changelog](https://keepachangelog.com/); versions follow
[Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-11-12

### Added

- **Rust** support via rust-analyzer semantic tokens, with roles mapped onto
  the existing C#/TypeScript palette (struct ≈ class, trait ≈ interface,
  lifetimes and macros italic as compile-time constructs, `unsafe` flagged).
- TextMate fallback rules so Rust looks consistent before rust-analyzer loads.
- **TOML** support for Even Better TOML: table headers and table-valued keys
  stand out from plain keys; dates read as literals.

### Fixed

- rust-analyzer's default `mutable` → underline fallback is suppressed.

## [1.0.0] - 2026-07-29

### Added

- Initial release of **Dark Sharp**, a dark theme built for Angular and .NET
  developers.
- Full semantic token support with shared color customizations across C#/.NET
  and Angular/TypeScript.
- Angular template highlighting tuned for both inline and separate-file
  templates: semantic HTML, input/attribute bindings, structural directives,
  and interpolation are visually distinct.
