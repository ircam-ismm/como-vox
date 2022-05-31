import portfinder from 'portfinder';
import { getWifiInfos } from '@ircam/comote-helpers/wifi-infos.js';
import { Server as CoMoteServer } from '@ircam/comote-helpers/server.js';
import * as CoMoteQRCode from '@ircam/comote-helpers/qrcode.js';

// special logic needed by electron app
export default {
  async init(server, como) {
    portfinder.basePort = 8888;
    const comotePort = await portfinder.getPortPromise();

    // 1. run como.te server
    const wifiInfos = await getWifiInfos();
    const comoteConfig = {
      id: 'como-vox',
      interval: 20, // period in ms
      ws: {
        port: comotePort,
        hostname: wifiInfos.ip,
        autostart: true,
      },
      osc: null,
    };

    const comote = await server.stateManager.create('comote', {
      wifiInfos,
      config: comoteConfig,
    });

    const comoteServer = new CoMoteServer(comoteConfig, { verbose: false });
    await comoteServer.start();

    console.log('[electron] comote connect');
    console.log('+ CoMo.te link:', CoMoteQRCode.rawLink(comoteConfig));
    console.log('');
    console.log(await CoMoteQRCode.terminal(comoteConfig));

    let disconnectTimeout = null
    const disconnect = () => comote.set({ connected: false });

    comoteServer.addWsListener(data => {
      if (data.id === 'como-vox') {
        if ('devicemotion' in data) {
          clearTimeout(disconnectTimeout);

          comote.set({
            devicemotion: data.devicemotion,
            connected: true,
          });

          disconnectTimeout = setTimeout(disconnect, 500);
        }

        if ('buttonA' in data) {
          comote.set({ buttonA: !!data.buttonA });
        }

        if ('buttonB' in data) {
          comote.set({ buttonB: !!data.buttonB });
        }
      }
    });

    console.log('[electron] sending "soundworks:ready" event to electron host');
    process.send(JSON.stringify({
      type: 'soundworks:ready',
      payload: {},
    }));
  }
}
