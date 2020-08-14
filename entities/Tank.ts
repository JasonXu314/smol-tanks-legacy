import { Ray, Segment } from '@/math/lines';
import { DirectionVector, PositionVector, Vector } from '@/math/vectors';
import { draw, is, line, PointCollection, rotate } from 'utils/utils';
import Game from './Game';
import Shell from './Shell';

const templates: Record<'chassis' | 'barrel' | 'turret' | 'flag', RawVector[]> = {
	chassis: [
		[15, 10],
		[15, -10],
		[-15, -10],
		[-15, 10]
	],
	barrel: [
		[25, 2.5],
		[25, -2.5],
		[0, -2.5],
		[0, 2.5]
	],
	turret: [
		[8, -4],
		[2.5, -6.5],
		[-5, -6.5],
		[-7, -4.5],
		[-8, -2.5],
		[-8, 2.5],
		[-7, 4.5],
		[-5, 6.5],
		[2.5, 6.5],
		[8, 4]
	],
	flag: [
		[-1, 4],
		[-5, 4],
		[-5, -4],
		[-1, -4]
	]
};

const tankSpeed = 2;
const rotateSpeed = 2;
const tankRange = 400;
const muzzleVelocity = 50;
const reloadTime = 7500;
const gunError = 1;

export default class Tank implements IUnit {
	public type: EntityType = 'tank';
	public moveTarget: PositionVector | null = null;
	public fireTarget: PositionVector | null = null;
	public selected: boolean = false;
	// private left: DirectionVector;
	// private right: DirectionVector;
	private damaged: boolean = false;
	private dir: DirectionVector;
	private pos: PositionVector;
	private lastFireTime: number = Date.now();
	private cooldown: number = 0;

	constructor(pos: RawVector, dir: RawVector, private ctx: CanvasRenderingContext2D, private game: Game, public team: Team, public readonly id: string) {
		this.dir = new DirectionVector(...dir);
		this.pos = new PositionVector(...pos);
		// this.left = new DirectionVector(-dir[1], dir[0]);
		// this.right = new DirectionVector(dir[1], -dir[0]);
	}

	public render(): void {
		if (this.fireTarget && this.selected) {
			const [tx, ty] = this.fireTarget;
			const [x, y] = this.pos;

			line(
				this.ctx,
				new PointCollection([
					[tx, ty],
					[x, y]
				]).map(this.game.gameToCanvas.bind(this.game)).points,
				'red',
				[2, 6],
				1.5,
				false
			);
		}
		if (this.moveTarget && this.selected) {
			const [tx, ty] = this.moveTarget;
			const [x, y] = this.pos;

			line(
				this.ctx,
				new PointCollection([
					[tx, ty],
					[x, y]
				]).map(this.game.gameToCanvas.bind(this.game)).points,
				'white',
				[2, 6],
				1.5,
				false
			);
		}

		draw(
			this.ctx,
			new PointCollection(templates.chassis).rotate(this.dir).translate(this.pos).map(this.game.gameToCanvas.bind(this.game)).points,
			'#186606'
		);
		if (this.selected) {
			line(
				this.ctx,
				new PointCollection(templates.chassis).rotate(this.dir).translate(this.pos).map(this.game.gameToCanvas.bind(this.game)).points,
				'white',
				[],
				1,
				true
			);
		}
		draw(
			this.ctx,
			new PointCollection(templates.barrel).rotate(this.dir).translate(this.pos).map(this.game.gameToCanvas.bind(this.game)).points,
			'#0e4002'
		);
		draw(
			this.ctx,
			new PointCollection(templates.turret).rotate(this.dir).translate(this.pos).map(this.game.gameToCanvas.bind(this.game)).points,
			'#1c8503'
		);
		draw(this.ctx, new PointCollection(templates.flag).rotate(this.dir).translate(this.pos).map(this.game.gameToCanvas.bind(this.game)).points, this.team);
	}

	public update(): void {
		// const dirRay: Ray = new Ray(this.pos, this.dir);

		if (this.moveTarget && this.pos.distanceTo(this.moveTarget) > 15) {
			let leftTread: TreadState = 'none';
			let rightTread: TreadState = 'none';

			const difAngle = this.dir.angleBetween(this.pos.vectorTo(this.moveTarget));
			// let colliding: boolean = false;
			// let collisionPoint: PositionVector | null = null;

			// for (const wall of this.game.obstacles) {
			// 	if (isWall(wall)) {
			// 		const wallLine = wall.getAsSegment();
			// 		for (const point of templates.chassis
			// 			.map((pt) => rotate(new PositionVector(...pt), this.dir))
			// 			.map<RawVector>(([ox, oy]) => [ox + this.pos.x, oy + this.pos.y])) {
			// 			if (inLineBoundary(point, wallLine.raw) && pointToLine(point, wallLine.raw) <= 3) {
			// 				colliding = true;
			// 				break;
			// 			}
			// 		}
			// 		collisionPoint = dirRay.intersection(wallLine);
			// 		if (colliding) {
			// 			break;
			// 		}
			// 	}
			// }

			// if (collisionPoint) {
			// 	if (Math.abs(this.dir.reflexAngle) <= 45 ? collisionPoint.above(dirRay) : collisionPoint.leftOf(dirRay)) {
			// 		leftTread = 'for';
			// 	} else {
			// 		rightTread = 'for';
			// 	}
			// } else {
			if (Math.abs(difAngle) <= 30) {
				if (Math.abs(difAngle) <= 2.5) {
					rightTread = 'for';
					leftTread = 'for';
					this.dir = this.pos.vectorTo(this.moveTarget);
				} else if (difAngle < 0) {
					rightTread = 'for';
				} else {
					leftTread = 'for';
				}
			} else {
				if (difAngle < 0) {
					rightTread = 'for';
					leftTread = 'back';
				} else {
					rightTread = 'back';
					leftTread = 'for';
				}
			}
			// }

			this.move(leftTread, rightTread);
		} else {
			if (this.moveTarget) {
				this.moveTarget = null;
			}
			if (this.fireTarget) {
				if (this.pos.distanceTo(this.fireTarget) > tankRange) {
					let leftTread: TreadState = 'none';
					let rightTread: TreadState = 'none';

					const difAngle = this.dir.angleBetween(this.pos.vectorTo(this.fireTarget));

					if (Math.abs(difAngle) <= 30) {
						if (Math.abs(difAngle) <= 2.5) {
							rightTread = 'for';
							leftTread = 'for';
							this.dir = this.pos.vectorTo(this.fireTarget);
						} else if (difAngle < 0) {
							rightTread = 'for';
						} else {
							leftTread = 'for';
						}
					} else {
						if (difAngle < 0) {
							rightTread = 'for';
							leftTread = 'back';
						} else {
							rightTread = 'back';
							leftTread = 'for';
						}
					}

					this.move(leftTread, rightTread);
				} else {
					let leftTread: TreadState = 'none';
					let rightTread: TreadState = 'none';

					const difAngle = this.dir.angleBetween(this.pos.vectorTo(this.fireTarget));

					if (Math.abs(difAngle) < 1) {
						if (this.cooldown === 0) {
							this.fire();
						}
					} else if (Math.abs(difAngle) <= 30) {
						if (Math.abs(difAngle) <= 2.5) {
							this.dir = this.pos.vectorTo(this.fireTarget);
						} else if (difAngle < 0) {
							rightTread = 'for';
							leftTread = 'back';
						} else {
							leftTread = 'for';
							rightTread = 'back';
						}
					} else {
						if (difAngle < 0) {
							rightTread = 'for';
							leftTread = 'back';
						} else {
							rightTread = 'back';
							leftTread = 'for';
						}
					}

					this.move(leftTread, rightTread);
				}
			}
		}

		if (this.cooldown !== 0) {
			this.cooldown = reloadTime - (Date.now() - this.lastFireTime);

			if (this.cooldown < 0) {
				this.cooldown = 0;
			}
		}
	}

	cleanup(): void {}

	public selectedBy(selection: Vector | [RawVector, RawVector]): boolean {
		if (is<Vector>(selection, 'vector')) {
			const m = selection;
			const a = rotate(new PositionVector(...templates.chassis[0]), this.dir)
				.add(new DirectionVector(this.pos.x, this.pos.y))
				.asVector();
			const b = rotate(new PositionVector(...templates.chassis[1]), this.dir)
				.add(new DirectionVector(this.pos.x, this.pos.y))
				.asVector();
			const d = rotate(new PositionVector(...templates.chassis[3]), this.dir)
				.add(new DirectionVector(this.pos.x, this.pos.y))
				.asVector();

			const am = m.subtract(a);
			const ab = b.subtract(a);
			const ad = d.subtract(a);

			return 0 < am.dot(ab) && am.dot(ab) < ab.dot(ab) && 0 < am.dot(ad) && am.dot(ad) < ad.dot(ad);
		} else {
			const [[x0, y0], [x1, y1]] = selection;
			const m = this.pos.asVector();
			const a = new Vector(x0, y1);
			const b = new Vector(x0, y0);
			const d = new Vector(x1, y1);

			const am = m.subtract(a);
			const ab = b.subtract(a);
			const ad = d.subtract(a);

			return 0 < am.dot(ab) && am.dot(ab) < ab.dot(ab) && 0 < am.dot(ad) && am.dot(ad) < ad.dot(ad);
		}
	}

	public pointInside(m: Vector): boolean {
		const a = rotate(new PositionVector(...templates.chassis[0]), this.dir)
			.add(new DirectionVector(this.pos.x, this.pos.y))
			.asVector();
		const b = rotate(new PositionVector(...templates.chassis[1]), this.dir)
			.add(new DirectionVector(this.pos.x, this.pos.y))
			.asVector();
		const d = rotate(new PositionVector(...templates.chassis[3]), this.dir)
			.add(new DirectionVector(this.pos.x, this.pos.y))
			.asVector();

		const am = m.subtract(a);
		const ab = b.subtract(a);
		const ad = d.subtract(a);

		return 0 < am.dot(ab) && am.dot(ab) < ab.dot(ab) && 0 < am.dot(ad) && am.dot(ad) < ad.dot(ad);
	}

	public registerHit(impact: PositionVector, trajectory: DirectionVector): void {
		if (impact.distanceTo(this.pos) < 5) {
			this.game.destroyUnit(this);
		} else {
			if (this.damaged) {
				this.game.destroyUnit(this);
			} else {
				this.damaged = true;
			}
		}
	}

	private move(leftTread: TreadState, rightTread: TreadState): void {
		if (leftTread === 'for' && rightTread === 'for') {
			this.pos = this.pos.add(this.dir.scale(tankSpeed));
		} else if (leftTread === 'for' && rightTread === 'none') {
			this.dir = this.dir.rotateBy(rotateSpeed / 2);
			this.pos = this.pos.add(this.dir.scale(tankSpeed));
		} else if (rightTread === 'for' && leftTread === 'none') {
			this.dir = this.dir.rotateBy(-rotateSpeed / 2);
			this.pos = this.pos.add(this.dir.scale(tankSpeed));
		} else if (leftTread === 'for' && rightTread === 'back') {
			this.dir = this.dir.rotateBy(rotateSpeed);
		} else if (rightTread === 'for' && leftTread === 'back') {
			this.dir = this.dir.rotateBy(-rotateSpeed);
		} else if (rightTread === 'back' && leftTread === 'back') {
			this.pos = this.pos.add(this.dir.scale(tankSpeed));
		} else {
			// console.log('no treads');
		}

		// this.left = new DirectionVector(-this.dir.y, this.dir.x).normalize();
		// this.right = new DirectionVector(this.dir.y, -this.dir.x).normalize();
	}

	private fire(): void {
		this.lastFireTime = Date.now();
		this.cooldown = reloadTime;

		const shell = new Shell(this.pos, this.dir, this.fireTarget!, muzzleVelocity, this.ctx, this.game);
		this.game.fireShell(shell);

		const audioCtx = new AudioContext();
		const audio = new Audio('shot.mp3');
		audio.volume = 0.5;
		const source = audioCtx.createMediaElementSource(audio);
		const panNode = audioCtx.createStereoPanner();
		panNode.pan.value = 0;
		source.connect(panNode);
		panNode.connect(audioCtx.destination);
		audio.play();
	}

	public hitBy(ray: Ray): boolean {
		const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = templates.chassis;
		const a = new PositionVector(x0, y0),
			b = new PositionVector(x1, y1),
			c = new PositionVector(x2, y2),
			d = new PositionVector(x3, y3);
		const ab = new Segment(a, b),
			bc = new Segment(b, c),
			cd = new Segment(c, d),
			da = new Segment(d, a);

		return ray.intersection(ab) !== null || ray.intersection(bc) !== null || ray.intersection(cd) !== null || ray.intersection(da) !== null;
	}

	public inFov([x, y]: RawVector, height: number, width: number): boolean {
		const maxX = x + width / 2 + 20;
		const minX = x - width / 2 - 20;
		const maxY = y + height / 2 + 20;
		const minY = y - height / 2 - 20;

		return minX <= this.pos.x && this.pos.x <= maxX && minY <= this.pos.y && this.pos.y <= maxY;
	}

	public snapshot(): BareEntity {
		return {
			type: 'tank',
			pos: this.pos.raw,
			dir: this.dir.raw,
			team: this.team,
			id: this.id
		};
	}
}
