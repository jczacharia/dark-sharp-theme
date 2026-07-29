# Dark Sharp Variants 1 & 2 — Design

Date: 2026-07-29
Status: Approved

## Goal

Two new theme variants that merge the most granular Angular/.NET semantic token
coverage found in the wild (Codemos-Modern, dark-modern-plus, BugFrag, Ruzzy,
gasrulle, Darculish research) onto the existing Dark Sharp palette. Colors are
locked to the current scheme; scopes and font styles are rewritten from scratch.

Also: remove all automated screenshot/asset-generation tooling (owner generates
images manually from now on).

## Variant workflow

Each iteration ships as a new theme variant with an incrementing integer suffix
so versions can be compared side-by-side via the theme picker:

- `themes/dark-sharp-1-color-theme.json` → label **Dark Sharp 1** (Approach A)
- `themes/dark-sharp-2-color-theme.json` → label **Dark Sharp 2** (Approach C)
- Original `themes/dark-sharp-color-theme.json` (**Dark Sharp**) is untouched.

All three registered in `package.json` `contributes.themes`.

## Locked palette

Only these colors (already present in the current scheme) may be used:

| Role family | Colors |
|---|---|
| Keywords | `#569CD6` blue, `#CE93D8` purple, `#F48FB1` pink, `#EC407A` hot-pink |
| Operators | `#FFD54F` amber |
| Callables | `#FFECB3` pale-yellow |
| Literals | `#CDA48C` tan (strings), `#AEEA00` lime (numbers), `#FFAB40` orange (language constants), `#D16969` dusty-red (regex), `#D7BA7D` gold (escapes/quantifiers/CSS selectors) |
| Types | `#4EC9B0` teal, `#86C691` green, `#B8D7A3` pale-green, `#ABB7FF` periwinkle, `#D7BA7D` gold |
| Values | `#9CDCFE` light-blue, `#4FC1FF` bright-blue, `#26C6DA` cyan, `#92DDE2` pale-cyan |
| Neutral | `#D4D4D4` fg, `#C8C8C8` silver, `#757882` comment, `#5A5D66` excluded, `#808080` tag punctuation, `#F44747` invalid |
| XML doc ladder | `#8A8E99`, `#6B87A0`, `#7FA3BF`, `#616875`, `#94806E` |
| Output tokens | `#6796E6`, `#CD9731`, `#B267E6` |

Workbench `colors` block: the 16 active keys copied verbatim from the original.
The ~700 commented-out reference lines do NOT carry over.

## Shared foundation (both variants)

Restored darkpp-italic muscle-memory traits the current file lost:

- `entity.other.attribute-name` → `#9CDCFE` italic
- `keyword.control.flow` → `#F48FB1` (pink `return`/`await`/`yield`)
- `keyword.operator.logical`, `punctuation.accessor.optional` → `#EC407A`

Deliberate departure: the blanket rule painting whole `{{ }}` Angular
expressions lime (`#AEEA00`) is removed. Expression contents are tokenized
granularly (variables blue, properties cyan, pipes yellow); `{{ }}` delimiters
get `#F48FB1` bold (same "escape into code" concept as `${}` in TS templates).
Lime is reserved for numbers.

Full Razor/Blazor semantic set (token names are globally unique — no language
suffix needed):

| Token | Color / style |
|---|---|
| razorComponentElement, razorTagHelperElement | `#4EC9B0` bold |
| razorComponentAttribute, razorTagHelperAttribute | `#26C6DA` italic |
| razorDirective, razorDirectiveAttribute | `#CE93D8` italic |
| razorDirectiveColon | `#808080` |
| razorTransition | `#F48FB1` bold |
| razorComment | `#757882` |

## Dark Sharp 1 — three-layer, language-scoped (Approach A)

### Font-style channels (orthogonal)

- **italic** = compile-time / meta: control keywords, decorators, parameters,
  type parameters, `defaultLibrary`, type aliases, delegates, directives,
  HTML attribute names, Angular bindings, pipes
- **bold** = declaration / structural anchor: fields, constants, enums,
  records, extension methods, events, component tags, control blocks,
  interpolation delimiters
- **underline** = `static` (new channel)
- **strikethrough** = `deprecated`

### Layer 1 — semantic tokens

Global: `*.deprecated` strikethrough, `*.static` underline, `*.defaultLibrary`
italic, `namespace` `#C8C8C8`, `comment` `#757882`, `string` `#CDA48C`,
`number` `#AEEA00`, `regexp` `#D16969`, `operator` `#FFD54F`,
`keyword` `#569CD6`.

`:csharp`-scoped (Roslyn) — cannot bleed into TS:

| Token | Color / style |
|---|---|
| class | `#4EC9B0` |
| recordClass | `#4EC9B0` bold |
| struct | `#86C691` |
| recordStruct | `#ABB7FF` bold |
| interface | `#B8D7A3` |
| enum | `#B8D7A3` bold |
| type | `#B8D7A3` italic |
| typeParameter | `#D7BA7D` italic |
| delegate | `#FFECB3` italic |
| variable | `#9CDCFE` (readonly `#4FC1FF`) |
| parameter | `#9CDCFE` italic |
| field | `#9CDCFE` bold (readonly `#4FC1FF` bold) |
| constant | `#4FC1FF` bold |
| property | `#26C6DA` |
| enumMember | `#4EC9B0` |
| event | `#CE93D8` bold |
| method, function | `#FFECB3` |
| extensionMethod | `#FFECB3` bold |
| controlKeyword | `#CE93D8` italic |
| operatorOverloaded | `#FFD54F` italic |
| stringVerbatim | `#CDA48C` italic |
| stringEscapeCharacter | `#D7BA7D` |
| excludedCode | `#5A5D66` |
| preprocessorText | `#CDA48C` |
| label | `#C8C8C8` |
| xmlDocComment* (10 tokens) | grey-blue ladder, unchanged from current |
| regex* (9 tokens) | unchanged from current |
| json* (6 tokens) | unchanged from current |

`:typescript`-scoped (Angular class code) — members read as members, cyan is
reserved for data-shape keys (object literals, via TextMate):

| Token | Color / style |
|---|---|
| class | `#4EC9B0` |
| interface | `#B8D7A3` |
| enum | `#B8D7A3` bold |
| enumMember | `#4EC9B0` |
| type | `#B8D7A3` italic |
| typeParameter | `#D7BA7D` italic |
| variable | `#9CDCFE` (readonly `#4FC1FF`) |
| parameter | `#9CDCFE` italic |
| property | `#9CDCFE` (readonly `#4FC1FF`) |
| function, method | `#FFECB3` |
| decorator | `#FFECB3` italic |

### Layer 2 — Angular template TextMate

| Scope | Color / style |
|---|---|
| `entity.other.ng-binding-name.property` | `#4FC1FF` italic |
| `entity.other.ng-binding-name.event` | `#FFECB3` italic |
| `entity.other.ng-binding-name.two-way` | `#92DDE2` italic |
| `entity.other.ng-binding-name.template` | `#CE93D8` italic bold |
| `entity.other.ng-binding-name.attribute` | `#9CDCFE` italic |
| `entity.other.ng-binding-name.class`, `.style` | `#D7BA7D` italic |
| `punctuation.definition.ng-binding-name.*` | `#FFD54F` |
| `entity.name.function.pipe.ng` | `#FFECB3` italic |
| `keyword.control.block.kind.ng`, `storage.type.ng`, `keyword.control.track.ng` | `#CE93D8` italic bold |
| `keyword.control.block.transition.ng` | `#F48FB1` bold |
| `control.block.ng punctuation.definition.block` | bold |
| interpolation delimiters (`punctuation.definition.interpolation`, `expression.ng meta.brace`) | `#F48FB1` bold |
| `meta.tag.custom entity.name.tag`, `meta.tag.other.unrecognized entity.name.tag` | `#4EC9B0` bold |
| `hostbinding.static.ng entity.other.attribute-name.html` | `#9CDCFE` italic |
| `hostbindings.ng entity.other.attribute-name.html` | `#4FC1FF` italic |
| `variable.other.constant.ng` | `#4FC1FF` |
| `meta.attribute.unrecognized entity.other.attribute-name.html` | `#4FC1FF` italic |

### Layer 3 — darkpp-faithful fallback

The generic TextMate ruleset from Dark++ Italic (strings, numbers, keywords,
storage italics, CSS, markdown, regex, diff, git-rebase, C#/Go/Java storage
types) carried over, minus the lime-expression rules, plus the restored traits
listed in Shared foundation.

## Dark Sharp 2 — maximum differentiation (Approach C)

Same TextMate layers (2 and 3) as Dark Sharp 1. The semantic block pushes every
category to a unique color+style combination. **Deltas from Dark Sharp 1:**

| Token | Dark Sharp 2 | Rationale |
|---|---|---|
| interface:csharp | `#B8D7A3` italic | contracts are meta |
| type:csharp (alias) | `#C8C8C8` italic | frees pale-green for interface/enum |
| constant:csharp | `#FFAB40` bold | const ≠ readonly at a glance |
| enumMember:csharp | `#92DDE2` | no longer shares teal with class |
| function:csharp | `#FFECB3` italic | local functions ≠ methods |
| operatorOverloaded:csharp | `#EC407A` italic | overloaded operators pop hot-pink |
| stringEscapeCharacter:csharp | `#D7BA7D` bold | escapes anchor inside strings |
| decorator:typescript | `#F48FB1` italic | Angular decorators = framework magic |
| property:typescript | `#26C6DA` | VS-style cyan members (contrast v1) |
| property.readonly:typescript | `#4FC1FF` | unchanged pairing |

Everything not listed is identical to Dark Sharp 1 (including underline=static,
bold=declaration, Razor set, Angular template layer).

## Screenshot automation removal

- Delete `scripts/screenshots.mjs` (and `scripts/` dir).
- `package.json`: remove `scripts.screenshots`, remove devDeps `playwright`
  and `@vscode/test-electron`; regenerate `package-lock.json`.
- README: Screenshots section keeps the images, drops the automation
  instructions.
- `.gitignore`: remove `.screenshot-workbench/` entry.
- `images/*.png` and `samples/` are kept — images will be regenerated manually;
  samples remain useful for manual screenshots and theme testing.

## Validation

- Both theme files parse as JSONC (comments allowed, no trailing commas).
- Check script: strip `//` comments, `JSON.parse`, verify every `foreground`
  is in the locked palette. Run once at build time; not committed as tooling.
- `vsce package` dry run must succeed with three registered themes.
