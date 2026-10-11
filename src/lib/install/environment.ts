// Works out what kind of device and mode the app is running in. Pure: the
// browser values are passed in, so this can be tested without a browser.

export type EnvironmentInput = {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
  displayModeStandalone: boolean; // matchMedia("(display-mode: standalone)")
  navigatorStandalone: boolean | undefined; // iOS-only navigator.standalone
};

export type Environment = {
  isIos: boolean; // iPhone, iPad or iPod
  isStandalone: boolean; // running as an installed Home Screen app
};

export function detectEnvironment(input: EnvironmentInput): Environment {
  // Newer iPads pretend to be Macs ("MacIntel") but have a touch screen, which
  // real Macs don't, so that combination means iPad.
  const isIos =
    /iPhone|iPad|iPod/.test(input.userAgent) ||
    (input.platform === "MacIntel" && input.maxTouchPoints > 1);

  const isStandalone =
    input.displayModeStandalone || input.navigatorStandalone === true;

  return { isIos, isStandalone };
}
