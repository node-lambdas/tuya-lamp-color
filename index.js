import TuyAPI from "tuyapi";

export default {
  version: 2,
  async handler(request, response) {
    const deviceId = request.options.id;
    const localKey = request.credentials.key;
    const device = new TuyAPI({ deviceId, localKey });

    await device.find();
    await device.connect();

    device.on("connected", async () => {
      console.log("Connected to device " + deviceId);

      await device.set({ dps: 1, set: true });
      console.log("Lamp turned on");

      await device.set({ dps: 2, set: "colour" });
      console.log("Set lamp to colour mode");

      const color = { r: 255, g: 0, b: 0, ...request.options };
      await device.set({ dps: 5, set: color });
      console.log("Lamp color changed to rgb", color);

      device.disconnect();
      response.send("OK");

      console.log(await device.get());
    });

    device.on("error", (error) => response.reject(String(error)));
    device.on("data", console.log);
    device.on("dp-refresh", console.log);
  },
};
