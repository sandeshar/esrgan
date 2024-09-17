import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgpu";
import Img from "./image";
import upscale from "./upscale";

self.addEventListener("message", async (e) => {
  const { data } = e;

  let model_url = "";
  if (data?.model === "anime_4x") {
    model_url = `https://raw.githubusercontent.com/sandeshar/esrgan/main/realesrgan/anime_4x/model.json`;
  }
  if (data?.model === "anime_4x_plus") {
    model_url = `https://raw.githubusercontent.com/sandeshar/esrgan/main/realesrgan/anime_4x_plus/model.json`;
  }
  if (data?.model === "general") {
    model_url = `https://raw.githubusercontent.com/sandeshar/esrgan/main/realesrgan/general/model.json`;
  }
  if (data?.model === "realx4plus") {
    model_url = `https://raw.githubusercontent.com/sandeshar/esrgan/main/realesrgan/realx4plus/model.json`;
  }
  if (!(await tf.setBackend(data?.backend || "webgl"))) {
    postMessage({
      alertmsg: `${data?.backend} is not supported in your browser.`,
    });
    return;
  }
  let model;
  try {
    model = await tf.loadGraphModel(`indexeddb://${data?.model}`);
    console.log("Model loaded successfully");
    // self.postMessage({ info: "Model loaded from cache" });
  } catch (error) {
    self.postMessage({ info: "Downloading model" });
    model = await (async () => {
      const fetchedModel = await tf.loadGraphModel(model_url);
      await fetchedModel.save(`indexeddb://${data?.model}`);
      return fetchedModel;
    })();
  }
  if (!model) {
    return;
  }
  const input = new Img(data.width, data.height, new Uint8Array(data.input));
  let hasAlpha = data.hasAlpha;
  function sendprogress(progress) {
    if (hasAlpha) {
      self.postMessage({
        progress: progress,
        info: `Processing Alpha ${progress.toFixed(2)}%`,
      });
      return;
    }
    self.postMessage({
      progress: progress,
      info: `Processing ${progress.toFixed(2)}%`,
    });
  }
  async function enlargeImageWithFixedInput(
    model,
    inputImg,
    factor = 4,
    input_size = 64,
    min_lap = 12
  ) {
    const width = inputImg.width;
    const height = inputImg.height;
    const output = new Img(width * factor, height * factor);
    let num_x = 1;
    for (; (input_size * num_x - width) / (num_x - 1) < min_lap; num_x++);
    let num_y = 1;
    for (; (input_size * num_y - height) / (num_y - 1) < min_lap; num_y++);
    const locs_x = new Array(num_x);
    const locs_y = new Array(num_y);
    const pad_left = new Array(num_x);
    const pad_top = new Array(num_y);
    const pad_right = new Array(num_x);
    const pad_bottom = new Array(num_y);
    const total_lap_x = input_size * num_x - width;
    const total_lap_y = input_size * num_y - height;
    const base_lap_x = Math.floor(total_lap_x / (num_x - 1));
    const base_lap_y = Math.floor(total_lap_y / (num_y - 1));
    const extra_lap_x = total_lap_x - base_lap_x * (num_x - 1);
    const extra_lap_y = total_lap_y - base_lap_y * (num_y - 1);
    locs_x[0] = 0;
    for (let i = 1; i < num_x; i++) {
      if (i <= extra_lap_x) {
        locs_x[i] = locs_x[i - 1] + input_size - base_lap_x - 1;
      } else {
        locs_x[i] = locs_x[i - 1] + input_size - base_lap_x;
      }
    }
    locs_y[0] = 0;
    for (let i = 1; i < num_y; i++) {
      if (i <= extra_lap_y) {
        locs_y[i] = locs_y[i - 1] + input_size - base_lap_y - 1;
      } else {
        locs_y[i] = locs_y[i - 1] + input_size - base_lap_y;
      }
    }
    pad_left[0] = 0;
    pad_top[0] = 0;
    pad_right[num_x - 1] = 0;
    pad_bottom[num_y - 1] = 0;
    for (let i = 1; i < num_x; i++) {
      pad_left[i] = Math.floor((locs_x[i - 1] + input_size - locs_x[i]) / 2);
    }
    for (let i = 1; i < num_y; i++) {
      pad_top[i] = Math.floor((locs_y[i - 1] + input_size - locs_y[i]) / 2);
    }
    for (let i = 0; i < num_x - 1; i++) {
      pad_right[i] = locs_x[i] + input_size - locs_x[i + 1] - pad_left[i + 1];
    }
    for (let i = 0; i < num_y - 1; i++) {
      pad_bottom[i] = locs_y[i] + input_size - locs_y[i + 1] - pad_top[i + 1];
    }
    const total = num_x * num_y;
    let current = 0;
    let useModel = new Array(total).fill(false);
    if (hasAlpha) {
      for (let i = 0; i < num_x; i++) {
        for (let j = 0; j < num_y; j++) {
          const x1 = locs_x[i];
          const y1 = locs_y[j];
          const x2 = locs_x[i] + input_size;
          const y2 = locs_y[j] + input_size;
          const tile = new Img(input_size, input_size);
          tile.getImageCrop(0, 0, inputImg, x1, y1, x2, y2);
          let scaled;
          for (let k = 4; k < tile.data.length; k += 4) {
            if (tile.data[k + 3] !== tile.data[3]) {
              useModel[current] = true;
              break;
            }
          }
          if (useModel[current]) {
            current++;
            continue;
          }
          scaled = new Img(tile.width * factor, tile.height * factor);
          for (let k = 0; k < scaled.data.length; k += 4) {
            scaled.data[k] = tile.data[3];
            scaled.data[k + 1] = tile.data[3];
            scaled.data[k + 2] = tile.data[3];
          }
          output.getImageCrop(
            (x1 + pad_left[i]) * factor,
            (y1 + pad_top[j]) * factor,
            scaled,
            pad_left[i] * factor,
            pad_top[j] * factor,
            scaled.width - pad_right[i] * factor,
            scaled.height - pad_bottom[j] * factor
          );
          current++;
        }
      }
      current = 0;
      for (let i = 0; i < num_x; i++) {
        for (let j = 0; j < num_y; j++) {
          if (!useModel[current]) {
            current++;
            let progress = (current / total) * 100;
            sendprogress(progress);
            continue;
          }
          const x1 = locs_x[i];
          const y1 = locs_y[j];
          const x2 = locs_x[i] + input_size;
          const y2 = locs_y[j] + input_size;
          const tile = new Img(input_size, input_size);
          tile.getImageCrop(0, 0, inputImg, x1, y1, x2, y2);
          let scaled = await upscale(tile, model, true);
          output.getImageCrop(
            (x1 + pad_left[i]) * factor,
            (y1 + pad_top[j]) * factor,
            scaled,
            pad_left[i] * factor,
            pad_top[j] * factor,
            scaled.width - pad_right[i] * factor,
            scaled.height - pad_bottom[j] * factor
          );
          current++;
          let progress = (current / total) * 100;
          sendprogress(progress);
        }
      }
    } else {
      for (let i = 0; i < num_x; i++) {
        for (let j = 0; j < num_y; j++) {
          const x1 = locs_x[i];
          const y1 = locs_y[j];
          const x2 = locs_x[i] + input_size;
          const y2 = locs_y[j] + input_size;
          const tile = new Img(input_size, input_size);
          tile.getImageCrop(0, 0, inputImg, x1, y1, x2, y2);
          let scaled = await upscale(tile, model);
          output.getImageCrop(
            (x1 + pad_left[i]) * factor,
            (y1 + pad_top[j]) * factor,
            scaled,
            pad_left[i] * factor,
            pad_top[j] * factor,
            scaled.width - pad_right[i] * factor,
            scaled.height - pad_bottom[j] * factor
          );
          current++;
          let progress = (current / total) * 100;
          sendprogress(progress);
        }
      }
    }
    return output;
  }
  let factor = data?.factor || 4;
  const start = Date.now();
  let output;
  try {
    output = await enlargeImageWithFixedInput(model, input, factor);
  } catch (e) {
    postMessage({ alertmsg: e.toString() });
  }
  const end = Date.now();
  console.log("Time:", end - start);
  await new Promise((resolve) => setTimeout(resolve, 10));
  postMessage({
    progress: 100,
    info: `Processing image...`,
  });
  postMessage(
    {
      progress: 100,
      done: true,
      output: output.data.buffer,
      info: `Processing image...`,
    },
    [output.data.buffer]
  );
});
