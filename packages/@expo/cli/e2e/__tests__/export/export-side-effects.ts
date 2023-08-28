/* eslint-env jest */
declare const process: {
  env: {
    NODE_ENV: string;
    /** Used in `@expo/metro-runtime`. */
    EXPO_DEV_SERVER_ORIGIN?: string;

    FORCE_COLOR?: string;
    CI?: string;
    EXPO_USE_PATH_ALIASES?: string;
    EXPO_USE_STATIC?: string;
    E2E_ROUTER_SRC?: string;
    _EXPO_ASSET_PREFIX?: string;
  };
  [key: string]: any;
};

const originalForceColor = process.env.FORCE_COLOR;
const originalCI = process.env.CI;

function clearEnv() {
  process.env.FORCE_COLOR = '0';
  process.env.CI = '1';
  process.env.EXPO_USE_PATH_ALIASES = '1';
  delete process.env.EXPO_USE_STATIC;
  delete process.env._EXPO_ASSET_PREFIX;
}

function restoreEnv() {
  process.env.FORCE_COLOR = originalForceColor;
  process.env.CI = originalCI;
  delete process.env.EXPO_USE_PATH_ALIASES;
}

export function runExportSideEffects() {
  beforeAll(async () => {
    clearEnv();
  });

  afterAll(() => {
    restoreEnv();
  });
}
