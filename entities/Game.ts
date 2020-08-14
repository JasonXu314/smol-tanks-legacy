import { PositionVector, Vector } from '@/math/vectors';
import { CursorType } from 'utils/constants';
import { line, PointCollection } from 'utils/utils';
import Crater from './Crater';
import Cursor from './Cursor';
import Wall from './obstacles/Wall';
import Shell from './Shell';
import Tank from './Tank';

export default class Game {
	private afId: number | null = null;
	private richEntities: IEntity[];
	private units: IUnit[];
	private selectedUnits: IUnit[] = [];
	private cursor: Cursor;
	private dragListener: ((evt: MouseEvent) => void) | null = null;
	private navListener: ((evt: MouseEvent) => void) | null = null;
	private attacking: boolean = false;
	private shells: Shell[] = [];
	private staticEntities: IEntity[] = [];
	private navStart: RawVector | null = null;
	private navStartViewPos: RawVector | null = null;
	public viewPos: RawVector = [0, 0];
	public zoom: number = 1;
	public obstacles: IEntity[];
	public target: PositionVector | null = null;
	public selectBox: [RawVector, RawVector | null] | null = null;

	constructor(
		entities: BareEntity[],
		private ctx: CanvasRenderingContext2D,
		private gameId: string,
		public socket: SocketIOClient.Socket,
		public myTeam: Team
	) {
		this.socket.on('ISSUE_ORDER', (order: ServerOrder) => {
			const units = this.units.filter((unit) => order.ids.includes(unit.id));
			const [x, y] = order.target;

			if (order.type === 'ATTACK') {
				units.forEach((unit) => {
					unit.fireTarget = new PositionVector(x, y);
					unit.moveTarget = null;
				});
			} else {
				units.forEach((unit) => {
					unit.moveTarget = new PositionVector(x, y);
					unit.fireTarget = null;
				});
			}
		});

		// Preparing event listeners
		document.addEventListener('keydown', (evt) => {
			if (evt.key === 'Control') {
				this.attacking = true;
			}
		});

		document.addEventListener('keyup', (evt) => {
			if (evt.key === 'Control') {
				this.attacking = false;
			}
		});

		document.addEventListener('wheel', (evt: WheelEvent) => {
			if (this.zoom + evt.deltaY / 1000 >= 0.1) {
				this.zoom += evt.deltaY / 1000;
			}
		});

		ctx.canvas.addEventListener('mousemove', (evt) => {
			this.cursor.x = evt.clientX;
			this.cursor.y = ctx.canvas.height - evt.clientY;
		});

		ctx.canvas.addEventListener('mousedown', (evt) => {
			if (evt.button !== 2) {
				this.selectBox = [this.canvasToGame([evt.clientX, ctx.canvas.height - evt.clientY]), null];

				this.dragListener = (evt) => {
					const evtPos = this.canvasToGame([evt.clientX, ctx.canvas.height - evt.clientY]);

					this.selectBox![1] = evtPos;
				};

				ctx.canvas.addEventListener('mousemove', this.dragListener);
			} else if (this.selectedUnits.length === 0) {
				this.navStart = [
					(evt.clientX - ctx.canvas.width / 2) * this.zoom + this.viewPos[0],
					(ctx.canvas.height / 2 - evt.clientY) * this.zoom + this.viewPos[1]
				];
				this.navStartViewPos = [...this.viewPos];

				this.navListener = (evt) => {
					const [vox, voy] = this.navStartViewPos;
					const [x, y]: RawVector = [(evt.clientX - ctx.canvas.width / 2) * this.zoom + vox, (ctx.canvas.height / 2 - evt.clientY) * this.zoom + voy];
					const [ox, oy] = this.navStart;

					this.viewPos = [vox - (x - ox) / this.zoom, voy - (y - oy) / this.zoom];
				};

				ctx.canvas.addEventListener('mousemove', this.navListener);
			}
		});

		ctx.canvas.addEventListener('mouseup', (evt) => {
			if (evt.button !== 2) {
				if (!evt.shiftKey) {
					this.selectedUnits.forEach((unit) => {
						unit.selected = false;
					});
					this.selectedUnits = [];
				}
				if (this.selectBox) {
					ctx.canvas.removeEventListener('mousemove', this.dragListener!);
					this.dragListener = null;

					if (this.selectBox[1]) {
						this.units.forEach((unit) => {
							if (myTeam === unit.team && unit.selectedBy(this.selectBox as [RawVector, RawVector])) {
								this.selectedUnits.push(unit);
								unit.selected = true;
							}
						});
					} else {
						const point = new Vector(
							(evt.clientX - ctx.canvas.width / 2) * this.zoom - this.viewPos[0],
							(ctx.canvas.height / 2 - evt.clientY) * this.zoom - this.viewPos[1]
						);
						this.units.forEach((unit) => {
							if (myTeam === unit.team && unit.selectedBy(point)) {
								this.selectedUnits.push(unit);
								unit.selected = true;
							}
						});
					}

					this.selectBox = null;
				}
			} else if (!this.navListener) {
				const rawPt: RawVector = [evt.clientX, ctx.canvas.height - evt.clientY];
				const target = this.canvasToGame(rawPt);

				// this.setTarget(tx, ty);
				this.socket.emit('ISSUE_ORDER', {
					ids: this.selectedUnits.map((unit) => unit.id),
					type: this.attacking ? 'ATTACK' : 'MOVE',
					target,
					gameId
				} as Order);
			} else {
				ctx.canvas.removeEventListener('mousemove', this.navListener);
				this.navListener = null;
				this.navStart = null;
				this.navStartViewPos = null;
				console.log(this.viewPos);
			}
		});
		// End preparing event listeners

		// Populating entities
		this.richEntities = [];
		this.obstacles = [];
		this.units = [];
		entities.forEach((entity) => {
			switch (entity.type) {
				case 'tank':
					const { pos, dir, team, id } = entity;
					this.units.push(new Tank(pos, dir, ctx, this, team, id));
					break;
				case 'wall':
					const { start, end } = entity;
					this.obstacles.push(new Wall(new PositionVector(...start), new PositionVector(...end), ctx, 6, '#424541'));
					break;
				// case 'tree':
				// 	this.obstacles.push(new Tree(Math.random() * 1200, Math.random() * ctx.canvas.height, ctx, (Math.random() + 3) * 4, '#422007'));
				// 	break;
			}
		});
		this.cursor = new Cursor(0, 0, ctx, CursorType.MOVE, 0);

		// For Debug
		(window as any).units = this.units;
		(window as any).shells = this.shells;
		(window as any).staticEntities = this.staticEntities;
		(window as any).game = this;
	}

	start(): void {
		this.ctx.canvas.style.cursor = 'none';
		this.animate();
	}

	stop(): void {
		this.ctx.canvas.style.cursor = 'default';
		if (this.afId) {
			cancelAnimationFrame(this.afId);
		}

		this.richEntities.forEach((e) => e.cleanup());
		this.shells.forEach((e) => e.cleanup());
		this.obstacles.forEach((e) => e.cleanup());
		this.staticEntities.forEach((e) => e.cleanup());
		this.units.forEach((e) => e.cleanup());
	}

	public setTarget(x: number, y: number, type: OrderType): void {
		if (type === 'ATTACK') {
			this.selectedUnits.forEach((unit) => {
				unit.fireTarget = new PositionVector(x, y);
				unit.moveTarget = null;
			});
		} else {
			this.selectedUnits.forEach((unit) => {
				unit.moveTarget = new PositionVector(x, y);
				unit.fireTarget = null;
			});
		}
	}

	public addSelected(unit: IUnit): void {
		this.selectedUnits.push(unit);
	}

	public fireShell(shell: Shell): void {
		this.shells.push(shell);
	}

	public removeStatic(staticEntity: IEntity): void {
		const i = this.staticEntities.findIndex((e) => e === staticEntity);
		this.staticEntities.splice(i, 1);
	}

	public destroyUnit(unit: IUnit): void {
		this.units = this.units.filter((u) => u.id !== unit.id);
	}

	public removeShell(shell: Shell): void {
		const i = this.shells.findIndex((s) => s.id === shell.id);
		this.shells.splice(i, 1);

		const shellPos = shell.pos;
		let hitUnit: boolean = false;

		this.units.forEach((unit) => {
			if (unit.pointInside(shellPos)) {
				hitUnit = true;
				unit.registerHit(shellPos, shell.dir);
			}
		});

		if (!hitUnit) {
			this.staticEntities.push(new Crater(new PositionVector(shellPos.x, shellPos.y), this.ctx, this));
		}
	}

	public gameToCanvas(point: RawVector | Vector): RawVector {
		const [x, y] = point;
		const [vx, vy] = this.viewPos;

		return [(x - vx) / this.zoom + this.ctx.canvas.width / 2, (y - vy) / this.zoom + this.ctx.canvas.height / 2];
	}

	public canvasToGame(point: RawVector | Vector): RawVector {
		const [x, y] = point;
		const [vx, vy] = this.viewPos;

		return [(x - this.ctx.canvas.width / 2) * this.zoom + vx, (y - this.ctx.canvas.height / 2) * this.zoom + vy];
	}

	private animate(): void {
		this.afId = requestAnimationFrame(this.animate.bind(this));

		try {
			this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

			this.ctx.fillStyle = '#c2864e';
			this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

			if (this.target) {
				this.ctx.fillStyle = 'green';
				this.ctx.beginPath();
				this.ctx.arc(this.target.x, this.ctx.canvas.height - this.target.y, 3, 0, Math.PI * 2);
				this.ctx.fill();
			}

			if (this.selectedUnits.length === 0) {
				this.cursor.cursorType = CursorType.DEFAULT;
			} else {
				if (this.attacking) {
					this.cursor.cursorType = CursorType.ATTACK;
				} else {
					this.cursor.cursorType = CursorType.MOVE;
				}
			}

			this.richEntities.forEach((entity) => entity.update());
			this.richEntities.forEach((entity) => entity.render());
			this.shells.forEach((shell) => shell.update());
			this.shells.forEach((shell) => shell.render());

			this.obstacles.forEach((entity) => entity.render());
			this.staticEntities.forEach((entity) => entity.render());

			this.units.forEach((entity) => entity.update());
			this.units.forEach((entity) => entity.render());

			this.cursor.update();
			this.cursor.render();

			if (this.selectBox && this.selectBox[1]) {
				const [x0, y0] = this.selectBox[0];
				const [x1, y1] = this.selectBox[1];

				line(
					this.ctx,
					new PointCollection([
						[x0, y0],
						[x1, y0],
						[x1, y1],
						[x0, y1]
					]).map(this.gameToCanvas.bind(this)).points,
					'white',
					[],
					1,
					true
				);
			}

			line(
				this.ctx,
				[
					[0, this.ctx.canvas.height],
					[0, 0],
					[this.ctx.canvas.width, 0]
				],
				'white',
				[],
				2,
				false
			);

			// Notches
			for (let i = 0; i * 50 <= this.ctx.canvas.width / 2; i++) {
				line(
					this.ctx,
					[
						[this.ctx.canvas.width / 2 + i * 50, 0],
						[this.ctx.canvas.width / 2 + i * 50, 5]
					],
					'white',
					[],
					2,
					false
				);
				line(
					this.ctx,
					[
						[this.ctx.canvas.width / 2 - i * 50, 0],
						[this.ctx.canvas.width / 2 - i * 50, 5]
					],
					'white',
					[],
					2,
					false
				);
			}
			for (let i = 0; i * 50 <= this.ctx.canvas.height / 2; i++) {
				line(
					this.ctx,
					[
						[0, this.ctx.canvas.height / 2 + i * 50],
						[5, this.ctx.canvas.height / 2 + i * 50]
					],
					'white',
					[],
					2,
					false
				);
				line(
					this.ctx,
					[
						[0, this.ctx.canvas.height / 2 - i * 50],
						[5, this.ctx.canvas.height / 2 - i * 50]
					],
					'white',
					[],
					2,
					false
				);
			}
		} catch (err) {
			console.log(err);
			this.stop();
		}
	}
}
