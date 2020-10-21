import Wall from 'game/entities/obstacles/Wall';
import { DirectionVector, PositionVector } from './math/vectors';

export function degToRad(deg: number): number {
	return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
	return (rad * 180) / Math.PI;
}

export function sin(deg: number): number {
	return Math.sin(degToRad(deg));
}

export function cos(deg: number): number {
	return Math.cos(degToRad(deg));
}

export function sameSign(a: number, b: number): boolean {
	return (a < 0 && b < 0) || (a > 0 && b > 0);
}

export function draw(ctx: CanvasRenderingContext2D, pts: RawVector[], color: string): void {
	const [[x, y], ...rest] = pts;

	ctx.fillStyle = color;
	ctx.strokeStyle = color;
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.moveTo(x, ctx.canvas.height - y);
	rest.forEach(([x, y]) => {
		ctx.lineTo(x, ctx.canvas.height - y);
	});
	ctx.fill();
}

export function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string | CanvasGradient) {
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(x, ctx.canvas.height - y, r, 0, Math.PI * 2);
	ctx.fill();
}

export function line(
	ctx: CanvasRenderingContext2D,
	pts: RawVector[],
	color: string,
	lineDash: number[] = [],
	width: number = 1,
	closePath: boolean = false
): void {
	const [[x, y], ...rest] = pts;

	ctx.strokeStyle = color;
	ctx.lineWidth = width;
	ctx.setLineDash(lineDash);
	ctx.beginPath();
	ctx.moveTo(x, ctx.canvas.height - y);
	rest.forEach(([x, y]) => {
		ctx.lineTo(x, ctx.canvas.height - y);
	});
	if (closePath) {
		ctx.closePath();
	}
	ctx.stroke();
}

export function rotate([x, y]: PositionVector, dir: DirectionVector): PositionVector {
	const theta = dir.reflexAngle;

	return new PositionVector(x * cos(theta) - y * sin(theta), x * sin(theta) + y * cos(theta));
}

export function intersection([[x0, y0], [x1, y1]]: [RawVector, RawVector], [[x2, y2], [x3, y3]]: [RawVector, RawVector]): RawVector | null {
	const a = (y1 - y0) / (x1 - x0);
	const b = (y3 - y2) / (x3 - x2);
	const c = y0 - a * x0;
	const d = y2 - b * x2;

	const x = (d - c) / (a - b);
	const y = a * x + c;

	if (Math.abs(a - b) <= 0.01 || (!isFinite(a) && !isFinite(b))) {
		return null;
	} else if (!isFinite(a)) {
		return [x0, b * x0 + d];
	} else if (!isFinite(b)) {
		return [x2, a * x2 + c];
	}
	return [x, y];
}

export function pointToLine([x, y]: RawVector, [[x0, y0], [x1, y1]]: [RawVector, RawVector]) {
	return Math.abs((y1 - y0) * x - (x1 - x0) * y + x1 * y0 - y1 * x0) / Math.sqrt((y1 - y0) ** 2 + (x1 - x0) ** 2);
}

export function inLineBoundary([x, y]: RawVector, [[x0, y0], [x1, y1]]: [RawVector, RawVector]) {
	const xWithin = (x0 > x && x1 < x) || (x1 > x && x0 < x);
	const yWithin = (y0 > y && y1 < y) || (y1 > y && y0 < y);
	return xWithin && yWithin;
}

export function isWall(entity: IEntity): entity is Wall {
	return entity.type === 'wall';
}

export function is<T extends Construct2D>(construct: Construct2D | any, type: ConstructType): construct is T {
	return construct.type === type;
}

export function random(lBound: number, uBound: number): number;
export function random(bound: number, signed: boolean): number;
export function random(a1: number, a2: number | boolean): number {
	if (typeof a2 === 'boolean') {
		const bound = a1;
		const signed = a2;

		return Math.random() * bound * (signed ? (Math.random() < 0.5 ? -1 : 1) : 1);
	} else {
		const lBound = a1;
		const uBound = a2;

		return Math.random() * (uBound - lBound) + lBound;
	}
}

export class PointCollection {
	constructor(public points: RawVector[]) {}

	public scale(s: number): this {
		this.points = this.points.map(([x, y]) => [x * s, y * s]);
		return this;
	}

	public rotate([x, y]: Vector | RawVector): this {
		this.points = this.points.map(([ox, oy]) => rotate(new PositionVector(ox, oy), new DirectionVector(x, y)).raw);
		return this;
	}

	public translate([x, y]: Vector | RawVector): this {
		this.points = this.points.map(([ox, oy]) => new PositionVector(ox, oy).add(new DirectionVector(x, y)).raw);
		return this;
	}

	public map(fn: (pt: RawVector) => RawVector): this {
		this.points = this.points.map((pt) => fn(pt));
		return this;
	}
}
