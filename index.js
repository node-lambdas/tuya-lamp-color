import TuyAPI from "tuyapi";

const makeDelay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
  version: 2,
  input: "text",
  async handler(request, response) {
    const deviceId = request.options.id;
    const localKey = request.credentials.key || request.options.key;
    const device = new TuyAPI({ deviceId, localKey });
    const delay = Number(request.options.delay);

    await device.find();
    await device.connect();

    device.on("connected", async () => {
      console.log("Connected to device " + deviceId);

      await device.set({ dps: 1, set: true });
      console.log("Lamp turned on");

      await device.set({ dps: 2, set: "colour" });
      console.log("Set lamp to colour mode");

      const colors = request.body.trim().split("/n");
      const spaces = /\s+/;

      for (const color of colors) {
        let [r = 0, g = 0, b = 0] = color.split(spaces);
        await device.set({ dps: 5, set: { r, g, b } });
        console.log(`Lamp ${deviceId} changed to rgb ${r},${g},${b}`);

        if (delay) await makeDelay(delay);
      }

      console.log(await device.get());
      device.disconnect();
      response.send("OK");
    });

    device.on("error", (error) => response.reject(String(error)));
    device.on("data", console.log);
    device.on("dp-refresh", console.log);
  },
};
