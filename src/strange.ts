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

  const { Player } = window.Vimeo;

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
  
  const clicky = (player) => {
	okRevealIt(player);
  }


  const rnd = () => {
    const has = [
		"John", "Mohammed", "Ali", "Chen", "Makoto", "Ahmed", "Mohammad", "Ravi", "Sophie", "Fernando", "Abdul", "Yuki", "Elena", "Lucas", "Aisha", "David", "Lina", "Eva", "Gabriel", "Javier", "Yusuf", "Mia", "Katja", "Johannes", "Cristina", "Sebastian", "Mariusz", "Anastasia", "Marko", "Juan", "Andrei", "Irina", "José", "Leila", "Jorge", "Olivia", "Amir", "Laura", "Emma", "Ana", "Katarina", "Andrzej", "Nadia", "Nils", "Marija", "Julia", "Antonio", "Hiroshi", "Arun", "Rosa", "Johan", "Elif", "Tomasz", "Maria", "Vladimir", "Emily", "Lena", "Sofia", "Giovanni", "Andreas", "Felipe", "Anusha", "Fátima", "Josef", "Hans", "Omar", "Giorgio", "Luis", "Aya", "Hassan", "Oleksandr", "Ali", "Josip", "Olga", "Juan", "Koji", "Sven", "Mehmet", "Michel", "Zhang", "Viktor", "Sarah", "Lars", "Choi", "Carlos", "Ivan", "Hafiz", "Leonardo", "Mohamed", "Amira", "Alex", "Masahiro", "Utku", "Fatima", "Konstantin", "Anton", "Igor", "Georgios", "Jie", "Alexei", "Abdullah", "Karolina", "Simone", "Mikael", "Yuri", "Olena", "Markus", "Pietro", "Viktoriya", "Vladislav", "Roman", "Prakash", "Petra", "Martina", "Monika", "Mateusz", "Kamal", "Siobhán", "Andrés", "Alexey", "Viktoria", "Meera", "Alessandro", "Vasilisa", "Dmitri", "Youssef", "Stanislav", "Jelena", "Ziad", "Oleksandra", "Alina", "Max", "Marta", "Róisín", "Théo", "Anastasia", "Olaf", "Maksym", "Nina", "Aleksei", "Nabil", "Valentina", "Tariq", "Timur", "Natalia", "Shams", "Bogdan", "Oksana", "Nikolay", "Sami", "Anastasiia", "Mikhail", "Alex", "Ekaterina", "Yaroslav", "Sergey", "Anna", "Alisa"
	];
    return has[Math.floor(Math.random() * has.length)];
}

  // biome-ignore lint/suspicious/noExplicitAny: there is no types for it ok?
  const okRevealIt = (player: any) => {
	if (!entered) {
		player.setCurrentTime(ROOM_NUMBER).then(() => player.play()).then(() => {
			player.on('ended', () => {
				player.setCurrentTime(ROOM_NUMBER).then(() => {
					okRevealIt(player);
				});
			});
		});
		keepAllCalm(player, 1);
		player.play();
	 	entered = true;

		console.log(`${rnd()}, reveal control`);
		const duke = document.getElementById("duke");
		duke.classList.add("revelation");
	} else {
		console.log(`${rnd()}, it's already revealed`);
	}
  }

  const keepAllCalm = async (
	// biome-ignore lint/suspicious/noExplicitAny: no type, I told ya
	player: any,
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
	console.info(`but ${rnd()}, this has to fade`);

    const originalVolume = await player.setVolume(0);
	const delta = newVolume - originalVolume;



    const ticks = Math.floor(duration / interval);
    let tick = 1;

    return new Promise(resolve => {
        const timer = setInterval(() => {
			console.info(`${rnd()}, we set volume to ${originalVolume + easing(tick / ticks) * delta}`);
        	 player.setVolume(originalVolume + (easing(tick / ticks) * delta));

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

const setupVimeo = () => {
	const options = {
		id: 952597836,
		width: 640
	};
	const player = new Player('vimeo-player', options);
	

	// When the player is ready, set up event handlers
	player.on('loaded', () => {
		console.log(`${rnd()}, vimeo is loaded`);
		const loadingOverlay = document.getElementById('loadingOverlay');	
		loadingOverlay.style.opacity = '0';
		setTimeout(() => {
			loadingOverlay.style.display = 'none';
		}, 1000);

		document.addEventListener('click', () => {
			clicky(player);
		});
	
		document.getElementById('forward').addEventListener('click', () => {
			player.getCurrentTime().then((seconds: number) => {
				player.setCurrentTime(seconds + 10); // Move forward by 10 seconds
			});
		});
	
		document.getElementById('backward').addEventListener('click', () => {
			player.getCurrentTime().then((seconds: number) => {
				player.setCurrentTime(Math.max(seconds - 10, 0)); // Move backward by 10 seconds, but not before the start
			});
		});
	}); 
}

setupVimeo();

