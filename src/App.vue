<template>
  <div>
    <!-- Navbar -->
    <nav class="navbar">
      <div class="logo">
        <img
          style="border-radius: 100%"
          src="/src/assets/salogo.jpg"
          alt="Logo"
        />
      </div>
      <ul class="nav-links">
        <li><a href="https://www.aryalsandesh.com.np/">Home</a></li>
        <li><a href="#samples">Samples</a></li>
        <li>
          <a href="https://www.aryalsandesh.com.np/#projects">Projects</a>
        </li>
        <li><a href="https://www.aryalsandesh.com.np/#contact">Contact</a></li>
      </ul>
    </nav>

    <!-- Main Landing Section (Visible before image upload) -->
    <section class="hero" v-if="!imgLoaded">
      <h1>Enhance Your Images with AI Super-Resolution</h1>
      <p>
        Upload your image to experience cutting-edge image enhancement
        technology.
      </p>
      <button class="upload-button" @click="handleClick">Upload Image</button>
    </section>

    <!-- Samples Section (Visible before image upload) -->
    <section class="samples" id="samples" v-if="!imgLoaded">
      <h2>Explore Sample Images</h2>
      <div class="sample-gallery">
        <div class="sample-item">
          <img class="demoimg" src="/demo/1.jpg" alt="demo" @click="testdemo" />
        </div>
        <div class="sample-item">
          <img class="demoimg" src="/demo/2.jpg" alt="demo" @click="testdemo" />
        </div>
        <div class="sample-item">
          <img class="demoimg" src="/demo/3.jpg" alt="demo" @click="testdemo" />
        </div>
      </div>
    </section>

    <div
      class="dragLine"
      ref="dragLine"
      v-show="isDone"
      @mousedown.stop="startDraggingLine"
      @mousemove.stop="dragLine"
    >
      <div class="dragBall">
        <svg width="30" viewBox="0 0 27 20">
          <path fill="#ff3484" d="M9.6 0L0 9.6l9.6 9.6z"></path>
          <path fill="#5fb3e5" d="M17 19.2l9.5-9.6L16.9 0z"></path>
        </svg>
      </div>
    </div>

    <!-- Image Upload and Processing Section (Visible after image upload) -->
    <div
      ref="canvasContainer"
      class="canvas-container"
      :class="{ visible: imgLoaded }"
      @drop.prevent="handleDrop"
      @dragover.prevent
      @mousedown="startDragging"
      @mouseup="stopDragging"
      @mousemove="dragImage"
      @wheel="resizeImage"
      @touchstart="touchStart"
      @touchmove="touchMove"
      @touchend="touchEnd"
    >
      <button v-show="imgLoaded" class="goback" @click="reloadPage">
        <svg width="24" height="24" viewBox="0 0 1024 1024">
          <g
            fill="rgba(255, 255, 255, 1)"
            stroke-width="50"
            stroke="rgba(255, 255, 255, 1)"
          >
            <path
              d="M511.4 175.3l-31.6 31.6-74.8 74.8-87.7 87.7-71.5 71.5-20.1 20.1c-7.1 7.1-13.9 14.3-18.1 23.7-11.2 25.4-6 53.9 13.6 73.7l13.2 13.2 62.7 62.7 86.8 86.8 80.8 80.8 44.7 44.7 2.1 2.1c6.7 6.7 18.9 7.2 25.5 0 6.6-7.2 7.1-18.3 0-25.5l-30.9-30.9-73.8-73.8-87.1-87.1-71.7-71.7-21.1-21.1-5.3-5.3-1.1-1.1-0.1-0.1c-0.3-0.3-3.9-4.4-2.4-2.6 1.3 1.7-0.1-0.2-0.3-0.5-0.8-1.2-1.5-2.4-2.2-3.6-0.3-0.6-0.7-1.2-1-1.9-0.3-0.6-1.3-3.3-0.5-1 0.7 2.3-0.7-2.4-0.9-3.1-0.4-1.4-1.7-6-0.7-2-0.5-1.9-0.3-4.2-0.3-6.2 0-0.1 0.3-4.8 0.3-4.8 0.5 0.1-0.7 3.6 0 0.7l0.6-2.7c0.3-1.2 2.3-6.2 0.5-2.2 0.8-1.7 1.6-3.4 2.6-5 0.6-0.9 4-5.1 1.3-2.2 1-1.1 1.9-2.2 3-3.3l0.2-0.2 1.2-1.2 14.3-14.3 63.6-63.6 86-86 79.8-79.8 44-44 2.1-2.1c6.7-6.7 7.2-18.9 0-25.5-7.4-6.3-18.6-6.8-25.7 0.3z"
            ></path>
            <path
              d="M804.6 494H432.9c-17.2 0-34.5-0.5-51.7 0h-0.7c-9.4 0-18.4 8.3-18 18 0.4 9.8 7.9 18 18 18h371.7c17.2 0 34.5 0.5 51.7 0h0.7c9.4 0 18.4-8.3 18-18-0.5-9.8-8-18-18-18z"
            ></path>
          </g>
        </svg>
      </button>
      <canvas ref="canvas"></canvas>
      <canvas ref="imgCanvas" style="display: none"></canvas>
      <div class="floating-menu" v-if="imgLoaded" @mousedown.stop>
        <div>
          <div class="info" v-if="info">{{ info }}</div>
          <div class="progressbar" v-if="isProcessing || isDone">
            <progress max="100" :value="progress"></progress>
          </div>
        </div>
        <div class="opt" v-if="!isProcessing && !isDone">
          <div>
            <span class="description">Model</span>
            <select v-model="model">
              <option value="general">General</option>
              <option value="anime_4x">Anime</option>
              <!-- <option value="anime_4x_plus">Anime (plus)</option> -->
              <!-- <option value="realx4plus">General (plus)</option> -->
            </select>
          </div>
          <div style="display: none">
            <span class="description">Run on</span>
            <select v-model="backend">
              <option value="webgl">WebGL</option>
            </select>
          </div>
        </div>
        <button
          class="run-button"
          v-if="!isProcessing && !isDone"
          @click="startTask"
        >
          <svg viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" fill="rgba(255, 255, 255, 1)"></path>
          </svg>
          Run
        </button>
        <button class="save-button" v-if="isDone" @click="saveImage">
          <svg width="22" viewBox="0 -4 23.9 30.5">
            <path
              d="M21 24H2c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h19c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2zM2 6c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h19c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H2zm8 13h3v3h-3zm0-5h3v3h-3zm4 5h3v3h-3zm0-5h3v3h-3zm4 5h3v3h-3zm0-5h3v3h-3zm-8-5h3v3H6zm0-5h3v3H6z"
              fill="rgba(255, 255, 255, 1)"
            ></path>
          </svg>
          Save
        </button>
      </div>
    </div>
    <div class="footer-container">
      <h3 class="footer-text">Copyright © 2023 @ Sandesh Aryal</h3>
      <div class="social-links">
        <ul>
          <li>
            <a href="https://facebook.com/sandesh131" target="_blank">
              <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill-rule="evenodd"
                  d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </a>
          </li>
          <li>
            <a href="#" target="_blank">
              <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill-rule="evenodd"
                  d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </a>
          </li>
          <li>
            <a href="#" target="_blank">
              <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"
                ></path>
              </svg>
            </a>
          </li>
          <li>
            <a href="https://github.com/sandeshar" target="_blank">
              <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill-rule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.012-1.704-2.782.605-3.369-1.344-3.369-1.344-.454-1.153-1.11-1.46-1.11-1.46-.908-.621.069-.608.069-.608 1.003.07 1.532 1.03 1.532 1.03.892 1.53 2.341 1.088 2.912.832.091-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.983 1.03-2.682-.103-.254-.446-1.272.099-2.65 0 0 .84-.269 2.75 1.025a9.564 9.564 0 012.504-.337 9.568 9.568 0 012.504.337c1.909-1.294 2.748-1.025 2.748-1.025.546 1.378.203 2.396.1 2.65.641.7 1.03 1.591 1.03 2.682 0 3.842-2.338 4.687-4.566 4.935.36.309.679.918.679 1.851 0 1.337-.012 2.417-.012 2.747 0 .268.18.579.688.48C19.134 20.194 22 16.442 22 12.017 22 6.484 17.523 2 12 2z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
<script>
import Img from "./image";
import Module from "./imghelper";

export default {
  data() {
    return {
      dragging: false,
      touching: false,
      imgX: 0,
      imgY: 0,
      imgScale: 1,
      imgInitScale: 1,
      linePosition: 0,
      drawLine: false,
      draggingLine: false,
      imgLoaded: false,
      dpr: window.devicePixelRatio || 1,
      imgName: "output",
      img: new Image(),
      processedImg: new Image(),
      hasAlpha: false,
      touchStartImgX: null,
      touchStartImgY: null,
      touchStartX: null,
      touchStartY: null,
      touchStartDistance: null,
      imgScaleStart: 1,

      imgLoaded: false,
      input: null,
      output: null,
      isDragOver: false,
      isProcessing: false,
      isDone: false,
      progress: 0,
      model: "anime_4x",
      scale: 4,
      backend: "webgl",
      modelzoo: {
        anime_4x: {
          fixed: true,
          factor: 4,
        },
        anime_4x_plus: {
          fixed: false,
          factor: 4,
        },
        general: {
          fixed: true,
          factor: 4,
        },
        realx2plus: {
          fixed: false,
          factor: 4,
        },
        realx4plus: {
          fixed: false,
          factor: 4,
        },
      },
      info: "",
      worker: new Worker(new URL("./worker.js", import.meta.url), {
        type: "module",
      }),
      wasmModule: null,
    };
  },
  watch: {
    model() {
      localStorage.setItem("model", this.model);
    },
    backend() {
      localStorage.setItem("backend", this.backend);
    },
  },
  mounted() {
    this.model = localStorage.getItem("model") || "anime_4x";
    this.backend = localStorage.getItem("backend") || "webgl";
    window.addEventListener("resize", this.handleResize);
    this.initializeCanvas();
    this.linePosition = this.$refs.canvas.width * 2;
    this.$refs.dragLine.style.left = this.linePosition / this.dpr + "px";
    (async () => {
      await Module();
    })();
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.handleResize);
  },
  methods: {
    initializeCanvas() {
      this.updateCanvasSize();
    },
    updateCanvasSize() {
      const container = this.$refs.canvasContainer;
      const canvas = this.$refs.canvas;
      if (this.imgLoaded) {
        this.imgX =
          ((this.imgX + (this.img.width * this.imgScale) / 2) / canvas.width) *
            container.offsetWidth *
            this.dpr -
          (this.img.width * this.imgScale) / 2;
        this.imgY =
          ((this.imgY + (this.img.height * this.imgScale) / 2) /
            canvas.height) *
            container.offsetHeight *
            this.dpr -
          (this.img.height * this.imgScale) / 2;
        this.linePosition =
          (this.linePosition / canvas.width) * container.offsetWidth * this.dpr;
        this.$refs.dragLine.style.left = this.linePosition / this.dpr + "px";
      }
      canvas.width = container.offsetWidth * this.dpr;
      canvas.height = container.offsetHeight * this.dpr;
      canvas.style.width = `${container.offsetWidth}px`;
      canvas.style.height = `${container.offsetHeight}px`;
      this.drawImage();
    },
    handleResize() {
      this.updateCanvasSize();
    },
    loadImg(src) {
      this.img.src = src;
      this.img.onload = async () => {
        this.imgLoaded = true;
        this.drawLine = true;

        let wasmModule = await Module();
        this.wasmModule = wasmModule;
        const imgCanvas = this.$refs.imgCanvas;
        imgCanvas.width = this.img.width;
        imgCanvas.height = this.img.height;
        const imgCtx = imgCanvas.getContext("2d");
        imgCtx.drawImage(this.img, 0, 0);
        let data = imgCtx.getImageData(
          0,
          0,
          this.img.width,
          this.img.height
        ).data;
        this.input = new Img(this.img.width, this.img.height, data);
        const numPixels = this.input.width * this.input.height;
        const bytesPerImage = numPixels * 4;
        let sourcePtr = wasmModule._malloc(bytesPerImage);
        let targetPtr = wasmModule._malloc(bytesPerImage);
        wasmModule.HEAPU8.set(this.input.data, sourcePtr);
        this.hasAlpha = wasmModule._check_alpha(sourcePtr, numPixels);
        if (this.hasAlpha) {
          this.inputAlpha = new Img(this.img.width, this.img.height);
          wasmModule._copy_alpha_to_rgb(sourcePtr, targetPtr, numPixels);
          this.inputAlpha.data.set(
            wasmModule.HEAPU8.subarray(targetPtr, targetPtr + bytesPerImage)
          );
        }
        wasmModule._free(sourcePtr);
        wasmModule._free(targetPtr);

        const canvas = this.$refs.canvas;
        const containerWidth = canvas.width;
        const containerHeight = canvas.height;

        const scaleX = (0.8 * containerWidth) / this.img.width;
        const scaleY = (0.8 * containerHeight) / this.img.height;
        this.imgScale = Math.min(scaleX, scaleY, 4);
        this.imgInitScale = this.imgScale;

        this.imgX = (containerWidth - this.img.width * this.imgScale) / 2;
        this.imgY = (containerHeight - this.img.height * this.imgScale) * 0.4;

        this.drawImage();
      };
    },
    testdemo(event) {
      const img = event.target;
      this.loadImg(img.src);
    },
    handleDrop(event) {
      if (this.imgLoaded) {
        event.preventDefault();
        return;
      }
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        this.imgName = file.name
          .replace(".jpg", "")
          .replace(".jpeg", "")
          .replace(".png", "");
        const reader = new FileReader();
        reader.onload = (e) => {
          this.loadImg(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    },
    handleClick() {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = e.target.files[0];
        this.imgName = file.name
          .replace(".jpg", "")
          .replace(".jpeg", "")
          .replace(".png", "");
        const reader = new FileReader();
        reader.onload = (e) => {
          this.loadImg(e.target.result);
        };
        reader.readAsDataURL(file);
      };
      input.click();
    },
    drawImage() {
      requestAnimationFrame(() => this.drawImage_());
      // this.drawImage_();
    },
    drawImage_() {
      const canvas = this.$refs.canvas;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(
        this.img,
        this.imgX,
        this.imgY,
        this.img.width * this.imgScale,
        this.img.height * this.imgScale
      );

      if (this.processedImg.src) {
        ctx.drawImage(
          this.processedImg,
          ((this.processedImg.width / this.img.width) *
            (this.linePosition - this.imgX)) /
            this.imgScale,
          0,
          this.processedImg.width -
            ((this.processedImg.width / this.img.width) *
              (this.linePosition - this.imgX)) /
              this.imgScale,
          this.processedImg.height,
          this.linePosition,
          this.imgY,
          this.imgX + this.img.width * this.imgScale - this.linePosition,
          this.img.height * this.imgScale
        );
      }
    },
    startDragging(event) {
      const rect = this.$refs.canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      if (Math.abs(mouseX - this.linePosition / this.dpr) < 12) {
        this.startDraggingLine(event);
        return;
      }
      this.dragging = true;
    },
    stopDragging() {
      if (this.draggingLine) {
        this.stopDraggingLine();
        return;
      }
      this.dragging = false;
    },
    dragImage(event) {
      if (this.dragging) {
        this.imgX += event.movementX * this.dpr;
        this.imgY += event.movementY * this.dpr;
        this.drawImage();
      }
      if (this.draggingLine) {
        this.updateLinePosition(event);
        this.drawImage();
      }
    },
    touchDragImage(event) {
      if (this.touching) {
        const touch = event.touches[0];
        this.imgX += touch.clientX - this.touchStartX;
        this.imgY += touch.clientY - this.touchStartY;
        this.drawImage();
      }
      if (this.draggingLine) {
        this.updateLinePosition(event);
        this.drawImage();
      }
    },
    resizeImage(event) {
      if (!this.imgLoaded) return;
      event.preventDefault();
      const canvas = this.$refs.canvas;
      const rect = canvas.getBoundingClientRect();
      const mouseX = (event.clientX - rect.left) * this.dpr;
      const mouseY = (event.clientY - rect.top) * this.dpr;
      const prevScale = this.imgScale;
      const maxSize = 20 * this.imgInitScale;
      const minSize = 0.05 * this.imgInitScale;
      if (event.deltaY > 0) {
        const newScale = this.imgScale * 0.8;
        this.imgScale = Math.min(Math.max(minSize, newScale), maxSize);
      } else {
        const newScale = this.imgScale * 1.2;
        this.imgScale = Math.min(Math.max(minSize, newScale), maxSize);
      }

      const scaleRatio = this.imgScale / prevScale;
      this.imgX = mouseX - (mouseX - this.imgX) * scaleRatio;
      this.imgY = mouseY - (mouseY - this.imgY) * scaleRatio;

      this.drawImage();
    },
    touchStart(event) {
      this.touching = true;
      this.touchStartImgX = this.imgX;
      this.touchStartImgY = this.imgY;
      if (event.touches.length == 1) {
        if (
          Math.abs(event.touches[0].clientX - this.linePosition / this.dpr) < 12
        ) {
          this.draggingLine = true;
          return;
        }
        this.touchStartX = event.touches[0].clientX * this.dpr;
        this.touchStartY = event.touches[0].clientY * this.dpr;
      } else {
        this.imgScaleStart = this.imgScale;
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        this.touchStartDistance =
          Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
              Math.pow(touch2.clientY - touch1.clientY, 2)
          ) * this.dpr;
        this.touchStartX = ((touch1.clientX + touch2.clientX) / 2) * this.dpr;
        this.touchStartY = ((touch1.clientY + touch2.clientY) / 2) * this.dpr;
      }
    },
    touchMove(event) {
      event.preventDefault();
      if (!this.touching) {
        return;
      }
      if (event.touches.length == 1) {
        const touch = event.touches[0];
        const movementX =
          touch.clientX * this.dpr -
          this.touchStartX +
          this.touchStartImgX -
          this.imgX;
        const movementY =
          touch.clientY * this.dpr -
          this.touchStartY +
          this.touchStartImgY -
          this.imgY;
        if (this.draggingLine) {
          this.updateLinePosition(event.touches[0]);
          this.drawImage();
          return;
        }
        if (this.touching) {
          this.imgX += movementX;
          this.imgY += movementY;
          this.drawImage();
        }
      } else {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const distance =
          Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
              Math.pow(touch2.clientY - touch1.clientY, 2)
          ) * this.dpr;
        const canvas = this.$refs.canvas;
        const rect = canvas.getBoundingClientRect();
        const mouseX = this.touchStartX - rect.left;
        const mouseY = this.touchStartY - rect.top;
        const scaleChange = distance / this.touchStartDistance;
        const prevScale = this.imgScale;
        const maxSize = 20 * this.imgInitScale;
        const minSize = 0.05 * this.imgInitScale;
        const newScale = this.imgScaleStart * scaleChange;
        this.imgScale = Math.min(Math.max(minSize, newScale), maxSize);

        const scaleRatio = this.imgScale / prevScale;
        const movementX =
          ((touch1.clientX + touch2.clientX) / 2) * this.dpr - this.touchStartX;
        const movementY =
          ((touch1.clientY + touch2.clientY) / 2) * this.dpr - this.touchStartY;
        this.imgX = mouseX - (mouseX - this.imgX) * scaleRatio + movementX;
        this.imgY = mouseY - (mouseY - this.imgY) * scaleRatio + movementY;
        this.touchStartX = ((touch1.clientX + touch2.clientX) / 2) * this.dpr;
        this.touchStartY = ((touch1.clientY + touch2.clientY) / 2) * this.dpr;
        this.drawImage();
      }
    },
    touchEnd(event) {
      if (event.touches.length == 2) {
        this.touchStartImgX = this.imgX;
        this.touchStartImgY = this.imgY;
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        this.touchStartDistance =
          Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
              Math.pow(touch2.clientY - touch1.clientY, 2)
          ) * this.dpr;
        this.touchStartX = ((touch1.clientX + touch2.clientX) / 2) * this.dpr;
        this.touchStartY = ((touch1.clientY + touch2.clientY) / 2) * this.dpr;
        return;
      }
      if (event.touches.length == 1) {
        this.touchStartImgX = this.imgX;
        this.touchStartImgY = this.imgY;
        this.touchStartX = event.touches[0].clientX * this.dpr;
        this.touchStartY = event.touches[0].clientY * this.dpr;
        return;
      }
      this.touching = false;
      this.draggingLine = false;
      this.touchStartImgX = null;
      this.touchStartImgY = null;
      this.touchStartX = null;
      this.touchStartY = null;
      this.touchStartDistance = null;
    },
    startDraggingLine(event) {
      event.preventDefault();
      if (!this.isDone) return;
      this.draggingLine = true;
    },
    stopDraggingLine() {
      this.draggingLine = false;
    },
    dragLine(event) {
      event.preventDefault();
      if (this.draggingLine) {
        this.updateLinePosition(event);
        this.drawImage();
      }
    },
    updateLinePosition(event) {
      const rect = this.$refs.canvas.getBoundingClientRect();
      this.linePosition = event.clientX * this.dpr - rect.left;
      const line = this.$refs.dragLine;
      line.style.left = Math.floor(this.linePosition / this.dpr) + "px";
    },
    startTask() {
      if (this.input === null) return;
      this.isProcessing = true;
      let worker = this.worker;
      let start = Date.now();
      worker.addEventListener("message", (e) => {
        const { progress, done, output, alertmsg, info } = e.data;
        if (info) {
          this.info = info;
        }
        if (alertmsg) {
          alert(alertmsg);
          this.isProcessing = false;
          worker.terminate();
          return;
        }
        this.progress = progress;
        if (done) {
          if (!this.hasAlpha || (this.hasAlpha && this.inputAlpha)) {
            let factor = this.modelzoo[this.model].factor;
            this.output = new Img(
              factor * this.input.width,
              factor * this.input.height,
              new Uint8ClampedArray(output)
            );
          }
          this.info = "Processing Image...";
          if (this.inputAlpha) {
            worker.postMessage(
              {
                input: this.inputAlpha.data.buffer,
                fixed: this.modelzoo[this.model].fixed,
                factor: this.modelzoo[this.model].factor,
                width: this.inputAlpha.width,
                height: this.inputAlpha.height,
                model: this.model,
                backend: this.backend,
                hasAlpha: true,
              },
              [this.inputAlpha.data.buffer]
            );
            this.inputAlpha = null;
            return;
          }
          if (this.hasAlpha) {
            let outputArray = new Uint8Array(output);
            let wasmModule = this.wasmModule;
            let sourcePtr = wasmModule._malloc(outputArray.length);
            let targetPtr = wasmModule._malloc(outputArray.length);
            let numPixels = outputArray.length / 4;
            wasmModule.HEAPU8.set(outputArray, sourcePtr);
            wasmModule.HEAPU8.set(this.output.data, targetPtr);
            wasmModule._copy_alpha_channel(sourcePtr, targetPtr, numPixels);
            this.output.data.set(
              wasmModule.HEAPU8.subarray(
                targetPtr,
                targetPtr + outputArray.length
              )
            );
            wasmModule._free(sourcePtr);
            wasmModule._free(targetPtr);
            wasmModule = null;
            this.wasmModule = null;
          }

          const imgCanvas = this.$refs.imgCanvas;
          const imgCtx = imgCanvas.getContext("2d");
          imgCtx.clearRect(0, 0, imgCanvas.width, imgCanvas.height);
          imgCanvas.width = this.output.width;
          imgCanvas.height = this.output.height;
          let outImg = imgCtx.createImageData(
            this.output.width,
            this.output.height
          );
          outImg.data.set(this.output.data);
          this.input = null;
          this.inputAlpha = null;
          this.output = null;
          imgCtx.putImageData(outImg, 0, 0);
          let type = "image/jpeg";
          let quality = 0.92;
          if (this.hasAlpha) type = "image/png";
          imgCanvas.toBlob(
            (blob) => {
              this.processedImg.src = URL.createObjectURL(blob);
            },
            type,
            quality
          );
          this.processedImg.onload = () => {
            this.linePosition = this.$refs.canvas.width * 0.5;
            this.$refs.dragLine.style.left =
              this.linePosition / this.dpr + "px";
            this.drawImage();
            this.info = "Done! Time used: " + (Date.now() - start) / 1000 + "s";
          };
          this.isProcessing = false;
          this.isDone = true;
          worker.terminate();
        }
      });
      worker.postMessage(
        {
          input: this.input.data.buffer,
          fixed: this.modelzoo[this.model].fixed,
          factor: this.modelzoo[this.model].factor,
          width: this.input.width,
          height: this.input.height,
          model: this.model,
          backend: this.backend,
          hasAlpha: false,
        },
        [this.input.data.buffer]
      );
    },
    saveImage() {
      const a = document.createElement("a");
      a.href = this.processedImg.src;
      if (this.hasAlpha) a.download = this.imgName + ".png";
      else a.download = this.imgName + ".jpg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
    reloadPage() {
      this.worker.terminate();
      this.worker = new Worker(new URL("./worker.js", import.meta.url), {
        type: "module",
      });
      //reset
      const canvas = this.$refs.canvas;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.dragging = false;
      this.touching = false;
      this.imgX = 0;
      this.imgY = 0;
      this.imgScale = 1;
      this.imgInitScale = 1;
      this.linePosition = 0;
      this.drawLine = false;
      this.draggingLine = false;
      this.imgLoaded = false;
      this.dpr = window.devicePixelRatio || 1;
      this.img = new Image();
      this.processedImg = new Image();
      this.hasAlpha = false;
      this.touchStartImgX = null;
      this.touchStartImgY = null;
      this.touchStartX = null;
      this.touchStartY = null;
      this.touchStartDistance = null;
      this.imgScaleStart = 1;

      this.imgLoaded = false;
      this.input = null;
      this.inputAlpha = null;
      this.output = null;
      this.isDragOver = false;
      this.isProcessing = false;
      this.isDone = false;
      this.progress = 0;
      this.model = localStorage.getItem("model") || "anime_4x";
      this.scale = 4;
      this.backend = localStorage.getItem("backend") || "webgl";
      this.info = "";
    },
  },
};
</script>
