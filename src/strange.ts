import {
	Scene,
	 WebGLRenderer,
	 PerspectiveCamera,
	  Group,
	  Sprite,
	  SpriteMaterial,
	  CanvasTexture
	} from "three";
  
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
  
  interface StarrySkyOptions {
	container: HTMLElement;
	numberOfStars?: number;
	starSpeed?: number;
	control?: boolean;
  }
  
  const ROOM_NUMBER = 1408;
  
  
  class StarrySky {
	private numberOfStars: number;
	private starSpeed: number;
	private canUserControl: boolean;
	private rafID: number | null;
	private mouse: { x: number; y: number };
	private container: {
	  el: HTMLElement;
	  width: number;
	  height: number;
	  halfWidth: number;
	  halfHeight: number;
	};
	private scene: Scene;
	private renderer: WebGLRenderer;
	private camera: PerspectiveCamera;
	private controls: OrbitControls; // OrbitControls type can be used if installed
	private stars: Group;
  
	constructor({ container, numberOfStars = 1000, starSpeed = 200, control = false }: StarrySkyOptions) {
	  this.numberOfStars = numberOfStars;
	  this.starSpeed = starSpeed / 1000;
	  this.canUserControl = control;
	  this.rafID = null;
  
	  this.mouse = {
		x: 0,
		y: 0,
	  };
  
	  this.container = {
		el: container,
		width: window.innerWidth,
		height: window.innerHeight,
		halfWidth: window.innerWidth / 2,
		halfHeight: window.innerHeight / 2,
	  };
  
	  this._init();
	}
  
	private _init() {
	  this._initScene();
	  this._initRenderer();
	  this._initCamera();
	  if (this.canUserControl) this._initControls();
	  this._createStars();
	  this._bindMethods();
	  this._addListeners();
	  this._render();
	}
  
	private _initScene() {
	  this.scene = new Scene();
	}
  
	private _initRenderer() {
	  this.renderer = new WebGLRenderer({ alpha: true });
  
	  this.renderer.setPixelRatio(window.devicePixelRatio);
	  this.renderer.setSize(this.container.width, this.container.height);
  
	  this.container.el.appendChild(this.renderer.domElement);
	}
  
	private _initCamera() {
	  this.camera = new PerspectiveCamera(
		75,
		this.container.width / this.container.height,
		0.001,
		4000
	  );
	  this.camera.position.set(0, 0, 1500);
	}
  
	private _initControls() {
	  this.controls = new OrbitControls(this.camera, this.renderer.domElement);
	  this.controls.minDistance = 10;
	  this.controls.maxDistance = 1600;
	}
  
	private _createStars() {
	  const material = new SpriteMaterial({
		map: new CanvasTexture(this._createTexture({})),
	  });
  
	  this.stars = new Group();
	  this.scene.add(this.stars);
  
	  for (let i = 0; i < this.numberOfStars; i++) {
		const star = new Sprite(material);
  
		star.position.x = (2 * Math.random() - 1) * 1000;
		star.position.y = (2 * Math.random() - 1) * 1000;
		star.position.z = (2 * Math.random() - 1) * 1000;
  
		star.scale.x = star.scale.y = 5 + 5 * Math.random();
  
		this.stars.add(star);
	  }
	}
  
	private _onMouseMove(event: MouseEvent) {
	  this.mouse.x = event.clientX - this.container.halfWidth;
	  this.mouse.y = event.clientY - this.container.halfHeight;
	}
  
	private _onMouseLeave() {
	  this.mouse.x = 0;
	  this.mouse.y = 0;
	}
  
	private _bindMethods() {
	  this._resize = this._resize.bind(this);
	  this._render = this._render.bind(this);
	  this._onMouseMove = this._onMouseMove.bind(this);
	  this._onMouseLeave = this._onMouseLeave.bind(this);
	}
  
	private _addListeners() {
	  window.addEventListener("resize", this._resize);
	  window.addEventListener("mousemove", this._onMouseMove);
	  document.body.addEventListener("mouseleave", this._onMouseLeave);
	}
  
	private _render() {
	  this._animate();
	  this.renderer.render(this.scene, this.camera);
  
	  this.rafID = requestAnimationFrame(this._render);
	}
  
	private _rotateStars() {
	  this.stars.rotation.x += this.starSpeed;
	  this.stars.rotation.y += this.starSpeed;
	}
  
	private _lookAround() {
	  this.scene.position.x = this._lerp(this.scene.position.x, -this.mouse.x / 15, 0.03);
	  this.scene.position.y = this._lerp(this.scene.position.y, this.mouse.y / 15, 0.03);
	}
  
	private _animate() {
	  this._rotateStars();
	  this._lookAround();
	  if (this.canUserControl) this.controls.update();
	}
  
	private _createTexture({ size = 32 }: { size?: number }) {
	  const canvas = document.createElement("canvas");
	  const ctx = canvas.getContext("2d");
  
	  if (!ctx) {
		throw new Error("Canvas context is null");
	  }
  
	  canvas.width = size;
	  canvas.height = size;
  
	  const halfSize = size / 2;
	  const gradient = ctx.createRadialGradient(halfSize, halfSize, 0, halfSize, halfSize, halfSize);
  
	  const spikes = 6;
	  const step = Math.PI / spikes;
	  let rotation = (Math.PI / 2) * 3;
  
	  gradient.addColorStop(0.3, "rgba(255,255,255,0.8)");
	  gradient.addColorStop(0.6, "rgba(255,255,255,0.4)");
	  gradient.addColorStop(1.0, "rgba(5,30,150,0)");
  
	  ctx.beginPath();
	  ctx.moveTo(halfSize, 0);
	  for (let i = 0; i < spikes; i++) {
		// Outer
		ctx.lineTo(halfSize + halfSize * Math.cos(rotation), halfSize + halfSize * Math.sin(rotation));
  
		rotation += step;
  
		// Inner
		ctx.lineTo(halfSize + (halfSize / 2) * Math.cos(rotation), halfSize + (halfSize / 2) * Math.sin(rotation));
  
		rotation += step;
	  }
	  ctx.closePath();
  
	  ctx.fillStyle = gradient;
	  ctx.fill();
  
	  return canvas;
	}
  
	private _resize() {
	  const width = window.innerWidth;
	  const height = window.innerHeight;
  
	  this.container.width = width;
	  this.container.height = height;
	  this.container.halfWidth = width / 2;
	  this.container.halfHeight = height / 2;
  
	  this.renderer.setSize(width, height);
  
	  this.camera.aspect = width / height;
	  this.camera.updateProjectionMatrix();
	}
  
	/**
	 * Linear interpolation
	 * @param {number} v0 - The starting value
	 * @param {number} v1 - The destination value
	 * @param {number} t - The normal value (between 0 and 1) to control the Linear Interpolation
	 * @return {number} - A value between two numbers at a specified, decimal midpoint
	 */
	private _lerp(v0: number, v1: number, t: number): number {
	  return (1 - t) * v0 + t * v1;
	}
  }
  
  new StarrySky({
	container: document.getElementById("stranger-sky"),
	numberOfStars: 1700,
	starSpeed: 2,
	control: true,
  });
  
  
  let entered = false;
  
  const clicky = () => {
	document.addEventListener('click', () => {
	  okReveal();
	});
  }
  
  const okReveal = () => {
	console.log("");
	const tune = document.getElementById("tune") as HTMLAudioElement;
	if (!entered) {
		tune.currentTime = ROOM_NUMBER - 2;
		tune.volume = 0;
		keepCalm(tune, 1);
		tune.currentTime = ROOM_NUMBER - 2;
		tune.play();
	 	entered = true;
	}
	const duke = document.getElementById("duke");
	duke.classList.add("revelation");
  }
  
  const keepCalm = async (
	element: HTMLMediaElement,
	newVolume: number,
	{
		duration = 3000,
		easing = swing,
		interval = 13,
	}: {
		duration?: number,
		easing?: typeof swing,
		interval?: number,
	} = {},
  ): Promise<void> => {
	const originalVolume = element.volume;
	const delta = newVolume - originalVolume;
  
	if (!delta || !duration || !easing || !interval) {
		element.volume = newVolume;
		return Promise.resolve();
	}
  
	const ticks = Math.floor(duration / interval);
	let tick = 1;
  
	return new Promise(resolve => {
		const timer = setInterval(() => {
			element.volume = originalVolume + (
				easing(tick / ticks) * delta
			);
  
			if (++tick === ticks + 1) {
				clearInterval(timer);
				resolve();
			}
		}, interval);
	});
  }
  
  const swing = (p: number) => {
	return 0.5 - Math.cos(p * Math.PI) / 2;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const audio = document.getElementById('tune') as HTMLAudioElement;
    const audioSource = document.getElementById('audioSource') as HTMLSourceElement;
    const loadingOverlay = document.getElementById('loadingOverlay');

    // Create a new audio element to preload the audio file
    const preloader = new Audio();
    preloader.src = audioSource.src;

    preloader.addEventListener('canplaythrough', () => {
        // The audio is fully loaded and can be played through without buffering
        loadingOverlay.style.opacity = '0'; // Fade out the overlay
        setTimeout(() => {
            loadingOverlay.style.display = 'none'; // Hide the overlay after the transition
        }, 1000); // Match the duration of the CSS transition
        audio.load(); // Load the audio in the main audio element
    });

    preloader.addEventListener('error',  (e: Event) => {
        console.error('Error loading audio:', e);
        loadingOverlay.textContent = 'Failed to load audio.';
    });
});
  
  clicky();

  
  