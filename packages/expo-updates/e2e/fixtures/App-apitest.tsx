/**
 * Test app that shows some features of the Updates API
 */
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function App() {
  const [updateMessage, setUpdateMessage] = React.useState('');
  const [updateEvents, setUpdateEvents] = React.useState<string[]>([]);
  const [updateAvailable, setUpdateAvailable] = React.useState(false);

  // Displays a message showing whether or not the app is running
  // a downloaded update
  const runTypeMessage = Updates.isEmbeddedLaunch
    ? 'This app is running from built-in code'
    : 'This app is running an update';

  const checkAutomaticallyMessage = `Automatic check setting = ${Updates.checkAutomatically}`;

  const pushEventType = (event: Updates.UpdateEvent) => {
    setUpdateEvents((updateEvents) => {
      const events = [...updateEvents];
      if (event.type === Updates.UpdateEventType.DOWNLOAD_ASSET) {
        events.unshift(
          `${event.type}: ${JSON.stringify(event.assetInfo, null, 2)}`,
        );
      } else {
        events.unshift(event.type);
      }
      return events.slice(0, 5);
    });
  };

  /**
   * Async function to manually check for an available update from EAS.
   */
  const checkManuallyForUpdate = async () => {
    // set a few extra params to test extra params
    setUpdateMessage('Calling setExtraParamAsync...');
    await Updates.setExtraParamAsync('testsetnull', 'testvalue');
    await Updates.setExtraParamAsync('testsetnull', null);
    await Updates.setExtraParamAsync('testparam', 'testvalue');

    setUpdateMessage('Calling checkForUpdateAsync...');
    const checkResult = await Updates.checkForUpdateAsync();
    if (checkResult.isAvailable) {
      setUpdateMessage(
        `checkForUpdateAsync found a new update: manifest = \n${manifestToString(
          checkResult.manifest,
        )}...`,
      );
    } else {
      setUpdateMessage('No new update available');
    }
    setUpdateAvailable(checkResult.isAvailable);
  };

  /**
   * Async function to fetch and load the most recent update from EAS.
   */
  const downloadAndRunUpdate = async () => {
    setUpdateMessage('Downloading the new update...');
    await Updates.fetchUpdateAsync();
  };

  /**
   * Sample UpdateEvent listener that handles all three event types.
   * These events occur during app startup, when expo-updates native code
   * automatically checks for available updates from EAS.
   * @param {} event The event to handle
   */
  const eventListener = (event: Updates.UpdateEvent) => {
    pushEventType(event);
    if (event.type === Updates.UpdateEventType.ERROR) {
      setUpdateMessage(`Error: ${event.message}`);
    } else if (event.type === Updates.UpdateEventType.NO_UPDATE_AVAILABLE) {
      setUpdateMessage('No new update available');
    } else if (event.type === Updates.UpdateEventType.UPDATE_AVAILABLE) {
      setUpdateMessage(
        `New update available\n${manifestToString(event.manifest)}`,
      );
      setUpdateAvailable(true);
    }
  };
  Updates.useUpdateEvents(eventListener);

  const runNow = async () => {
    let countdown = 10;
    while (countdown > 0) {
      setUpdateMessage(
        `Downloaded update... launching it in ${countdown} seconds.`,
      );
      countdown = countdown - 1;
      await delay(1000);
    }
    await Updates.reloadAsync();
  };

  const handleCheckButtonPress = () => {
    checkManuallyForUpdate().catch((error) => {
      setUpdateMessage(`Error checking for updates: ${error.message}`);
    });
  };

  const handleDownloadButtonPress = () => {
    downloadAndRunUpdate().catch((error) => {
      setUpdateMessage(
        `Error downloading and running update: ${error.message}`,
      );
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>Updates JS API test</Text>
      <Text> </Text>
      <Text>{runTypeMessage}</Text>
      <Text>{checkAutomaticallyMessage}</Text>
      <Text> </Text>
      <Text style={styles.titleText}>Status</Text>
      <Text style={styles.updateMessageText}>{updateMessage}</Text>
      <Text style={styles.titleText}>Last 5 UpdateEvents received</Text>
      <Text style={styles.updateMessageText}>{updateEvents.join('\n')}</Text>
      <Pressable style={styles.button} onPress={handleCheckButtonPress}>
        <Text style={styles.buttonText}>Check manually for updates</Text>
      </Pressable>
      {updateAvailable ? (
        <Pressable style={styles.button} onPress={handleDownloadButtonPress}>
          <Text style={styles.buttonText}>Download update</Text>
        </Pressable>
      ) : null}
      {updateAvailable ? (
        <Pressable style={styles.button} onPress={runNow}>
          <Text style={styles.buttonText}>Run update</Text>
        </Pressable>
      ) : null}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: '#4630EB',
  },
  buttonText: {
    color: 'white',
  },
  updateMessageText: {
    margin: 10,
    height: 150,
    paddingVertical: 12,
    paddingHorizontal: 32,
    width: '90%',
    borderColor: '#4630EB',
    borderWidth: 1,
    borderRadius: 4,
  },
  titleText: {
    fontWeight: 'bold',
  },
});

///////////////////////////

/**
 * Promise wrapper for setTimeout()
 * @param {delay} timeout Timeout in ms
 * @returns a Promise that resolves after the timeout has elapsed
 */
const delay = (timeout: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
};

const manifestToString = (manifest?: Updates.Manifest) => {
  return manifest
    ? JSON.stringify(
        {
          id: manifest.id,
          createdAt: manifest.createdAt,
          metadata: manifest.metadata,
        },
        null,
        2,
      )
    : 'null';
};
