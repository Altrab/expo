import * as PackageManager from '@expo/package-manager';
import chalk from 'chalk';
import { spawn } from 'child_process';

import { applyPluginsAsync } from './applyPlugins';
import * as Log from '../log';
import { getOperationLog } from '../start/doctor/dependencies/getVersionedPackages';
import { getVersionedDependenciesAsync } from '../start/doctor/dependencies/validateDependenciesVersions';
import { groupBy } from '../utils/array';

/**
 * Given a list of incompatible packages, installs the correct versions of the packages with the package manager used for the project.
 */
export async function fixPackagesAsync(
  projectRoot: string,
  {
    packages,
    packageManager,
    sdkVersion,
    packageManagerArguments,
  }: {
    packages: Awaited<ReturnType<typeof getVersionedDependenciesAsync>>;
    /** Package manager to use when installing the versioned packages. */
    packageManager: PackageManager.NodePackageManager;
    /**
     * SDK to version `packages` for.
     * @example '44.0.0'
     */
    sdkVersion: string;
    /**
     * Extra parameters to pass to the `packageManager` when installing versioned packages.
     * @example ['--no-save']
     */
    packageManagerArguments: string[];
  }
): Promise<void> {
  if (!packages.length) {
    return;
  }

  const { dependencies = [], devDependencies = [] } = groupBy(packages, (dep) => dep.packageType);
  const versioningMessages = getOperationLog({
    othersCount: 0, // All fixable packages are versioned
    nativeModulesCount: packages.length,
    sdkVersion,
  });

  const expoDep = dependencies.find((dep) => dep.packageName === 'expo');
  if (expoDep) {
    Log.log(
      chalk`\u203A Updating expo using {bold ${packageManager.name}} and then running {bold npx expo install --fix} under the updated expo version.`
    );

    spawn(
      `${packageManager.bin} ${packageManager
        .getAddCommandOptions([
          ...packageManagerArguments,
          `expo@${expoDep.expectedVersionOrRange}`,
        ])
        .join(' ')} && npx expo install --fix`,
      {
        ...packageManager.options,
        detached: true,
        shell: true,
      }
    );
    return;
  }

  Log.log(
    chalk`\u203A Installing ${
      versioningMessages.length ? versioningMessages.join(' and ') + ' ' : ''
    }using {bold ${packageManager.name}}`
  );

  if (dependencies.length) {
    const versionedPackages = dependencies.map(
      (dep) => `${dep.packageName}@${dep.expectedVersionOrRange}`
    );

    await packageManager.addAsync([...packageManagerArguments, ...versionedPackages]);

    await applyPluginsAsync(projectRoot, versionedPackages);
  }

  if (devDependencies.length) {
    await packageManager.addDevAsync([
      ...packageManagerArguments,
      ...devDependencies.map((dep) => `${dep.packageName}@${dep.expectedVersionOrRange}`),
    ]);
  }
}
