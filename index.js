import TuyAPI from "tuyapi";

const makeDelay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
  version: 2,
  actions: {
    default: {
      input: "text",
      async handler(request, response) {
        const deviceId = request.options.id;
        const deviceIp = request.options.ip ?? '';
        const localKey = request.credentials.key || request.options.key;
        const instructions = request.body.trim();

        if (!deviceId) {
          return response.reject("Missing option: --id");
        }

        if (!localKey) {
          return response.reject("Missing option: --key");
        }

        if (!instructions) {
          return response.reject("Missing instructions: input is empty");
        }

        const device = new TuyAPI({ id: deviceId, key: localKey, ip: deviceIp });
        const delay = Number(request.options.delay);

        try {
          await changeColor(device, deviceId, instructions, delay);
          response.send("OK");
        } catch (error) {
          response.reject(error);
        }
      },
    },
  },
};

async function changeColor(device, deviceId, input, delay) {

  return new Promise(async (resolve, reject) => {
    device.on("connected", async () => {
      console.log("Connected to device " + deviceId);

      await device.set({
        multiple: true,
        data: {
          1: true,
          2: "colour",
        },
      });

      console.log("Lamp turned on in colour mode");

      const colors = input.split("/n");
      const spaces = /\s+/;

      for (const color of colors) {
        let [r = 0, g = 0, b = 0] = color.split(spaces);
        await device.set({ dps: 5, set: { r, g, b } });
        console.log(`Lamp ${deviceId} changed to rgb ${r},${g},${b}`);

        if (delay) {
          await makeDelay(delay);
        }
      }

      console.log(await device.get({ schema: true }));
      device.disconnect();
      resolve();
    });

    device.on("error", (error) => reject(String(error)));
    device.on("data", console.log);
    device.on("dp-refresh", console.log);

    
    await device.find();
    await device.connect();

  });
}
