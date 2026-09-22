# Repayly for iOS

The Expo (React Native) app. It shares every repayment calculation with the web
app through [`@repayly/core`](../../packages/core) — only the interface is
written twice.

## Running it

From the repo root, `npm install` once, then:

```bash
npm run ios --workspace @repayly/mobile
```

The first run generates the native `ios/` project, installs pods and compiles,
which takes a few minutes. After that, `npm start --workspace @repayly/mobile`
launches Metro and reloads on save.

If CocoaPods fails with `Unicode Normalization not appropriate for ASCII-8BIT`,
your shell has no UTF-8 locale. Run the command with one:

```bash
LANG=en_US.UTF-8 npm run ios --workspace @repayly/mobile
```

## How it's put together

`ios/` and `android/` are generated from `app.json` and are not committed
(Expo's continuous native generation). Change native config there, not in Xcode,
and re-run `npx expo prebuild --clean`.

| Path                                 | What's in it                                       |
| ------------------------------------ | -------------------------------------------------- |
| `src/app/`                           | Expo Router screens — one file per tab              |
| `src/components/`                    | Chart, schedule and the screen shell                |
| `src/components/ui/`                 | Cards, form rows and inputs                         |
| `src/constants/theme.ts`             | Light and dark palettes, mirroring the web app's CSS variables |

The chart is drawn with `react-native-svg` rather than ported from the web app's
DOM-and-CSS version. The schedule collapses to one row per year, because 360
monthly rows at once doesn't read on a phone.

## Before submitting to the App Store

Apple enforces guideline 4.2 (minimum functionality) against simple calculators.
Plan on something the web app can't do — saved scenarios, a Home Screen widget,
share sheet export — before a review.
