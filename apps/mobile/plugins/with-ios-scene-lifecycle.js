const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

/**
 * iOS 26 and later refuse to launch an app that never adopts the UIScene life
 * cycle — `_UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption` traps
 * with SIGTRAP before any JavaScript runs.
 *
 * Expo SDK 57 ships the scene delegate that handles this (`EXExpoAppSceneDelegate`,
 * in `expo/ios/AppDelegates/ExpoAppSceneDelegate.swift`), but its prebuild template
 * still generates the older window-based AppDelegate and no scene manifest. This
 * plugin wires the two together:
 *
 *  - the AppDelegate conforms to `ExpoReactNativeFactoryProvider` and stops
 *    creating the window itself, leaving that to the scene delegate;
 *  - Info.plist declares a scene configuration pointing at the scene delegate.
 *
 * Drop this plugin once an Expo release generates the scene-based template.
 */

const SCENE_DELEGATE_CLASS = 'EXExpoAppSceneDelegate';

const CLASS_DECLARATION = 'class AppDelegate: ExpoAppDelegate {';
const CLASS_DECLARATION_WITH_PROVIDER =
  'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {';

// The scene delegate creates the UIWindow from the connecting UIWindowScene and
// starts React Native into it, so the app delegate must not do it as well.
const WINDOW_STARTUP = `#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

`;

function withSceneAppDelegate(config) {
  return withAppDelegate(config, (mod) => {
    if (mod.modResults.language !== 'swift') {
      throw new Error(
        `with-ios-scene-lifecycle expects a Swift AppDelegate, got "${mod.modResults.language}".`,
      );
    }

    let contents = mod.modResults.contents;

    if (!contents.includes(CLASS_DECLARATION_WITH_PROVIDER)) {
      if (!contents.includes(CLASS_DECLARATION)) {
        throw new Error(
          'with-ios-scene-lifecycle could not find the AppDelegate class declaration. ' +
            'The Expo template has changed — check whether this plugin is still needed.',
        );
      }
      contents = contents.replace(CLASS_DECLARATION, CLASS_DECLARATION_WITH_PROVIDER);
    }

    if (contents.includes(WINDOW_STARTUP)) {
      contents = contents.replace(WINDOW_STARTUP, '');
    } else if (contents.includes('factory.startReactNative(')) {
      throw new Error(
        'with-ios-scene-lifecycle found a React Native startup block it does not recognise. ' +
          'The Expo template has changed — update this plugin before building.',
      );
    }

    mod.modResults.contents = contents;
    return mod;
  });
}

function withSceneManifest(config) {
  return withInfoPlist(config, (mod) => {
    mod.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: SCENE_DELEGATE_CLASS,
          },
        ],
      },
    };
    return mod;
  });
}

module.exports = function withIosSceneLifecycle(config) {
  return withSceneManifest(withSceneAppDelegate(config));
};
