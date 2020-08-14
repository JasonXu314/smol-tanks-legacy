import { degToRad, is, radToDeg } from '@/utils';
import { Line, Ray, Segment } from './lines';

export class Vector implements Construct2D {
	public readonly type = 'vector';

	constructor(public x: number, public y: number) {}

	public add(other: Vector): Vector {
		return new Vector(this.x + other.x, this.y + other.y);
	}

	public subtract(other: Vector): Vector {
		return new Vector(this.x - other.x, this.y - other.y);
	}

	public scale(s: number): Vector {
		return new Vector((this.x * s) / this.magnitude, (this.y * s) / this.magnitude);
	}

	public dot(other: Vector): number {
		return this.x * other.x + this.y * other.y;
	}

	public asPosition(): PositionVector {
		return new PositionVector(this.x, this.y);
	}

	public asDirection(): DirectionVector {
		return new DirectionVector(this.x, this.y);
	}

	public normalize(): Vector {
		return this.scale(1);
	}

	public clone(): Vector {
		return new Vector(this.x, this.y);
	}

	public equals(other: Vector): boolean {
		return this.x === other.x && this.y === other.y;
	}

	public get inverse(): Vector {
		return new Vector(-this.x, -this.y);
	}

	public get magnitude(): number {
		return Math.sqrt(this.x ** 2 + this.y ** 2);
	}

	public get raw(): RawVector {
		return [this.x, this.y];
	}

	*[Symbol.iterator]() {
		yield* [this.x, this.y];
	}
}

export class PositionVector extends Vector {
	public static readonly ORIGIN: PositionVector = new PositionVector(0, 0);

	public add(other: DirectionVector): PositionVector {
		return super.add(other).asPosition();
	}

	public subtract(other: PositionVector): PositionVector {
		return super.subtract(other).asPosition();
	}

	public scale(s: number): PositionVector {
		return super.scale(s).asPosition();
	}

	public normalize(): PositionVector {
		return super.normalize().asPosition();
	}

	public clone(): PositionVector {
		return new PositionVector(this.x, this.y);
	}

	public distanceTo(other: PositionVector): number {
		return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
	}

	public vectorTo(other: PositionVector): DirectionVector {
		return new DirectionVector(other.x - this.x, other.y - this.y);
	}

	public leftOf(construct: Construct2D): boolean {
		if (is<Line>(construct, 'line')) {
			const [x0, y0] = construct.p1;
			const [x1, y1] = construct.p2;

			const m = (y1 - y0) / (x1 - x0);

			if (!isFinite(m)) {
				return this.x < x0;
			} else {
				const b = y0 - m * x0;
				const lineX = (this.y - b) / m;

				return this.x < lineX;
			}
		} else if (is<Ray>(construct, 'ray')) {
			return (
				this.leftOf(new Line(construct.vx, construct.vx.add(construct.dir))) &&
				!this.leftOf(new Line(construct.vx, construct.vx.add(new DirectionVector(construct.dir.y, -construct.dir.x))))
			);
		} else if (is<Segment>(construct, 'segment')) {
			console.log('leftOf on segment');
		}
		console.log('leftOf on', construct.type);
		return false;
	}

	public above(construct: Construct2D): boolean {
		if (is<Line>(construct, 'line')) {
			const [x0, y0] = construct.p1;
			const [x1, y1] = construct.p2;

			const m = (y1 - y0) / (x1 - x0);

			if (!isFinite(m)) {
				return this.x < x0;
			} else {
				const b = y0 - m * x0;
				const lineY = m * this.x + b;

				return this.y > lineY;
			}
		} else if (is<Ray>(construct, 'ray')) {
			return (
				this.leftOf(new Line(construct.vx, construct.vx.add(construct.dir))) &&
				!this.leftOf(new Line(construct.vx, construct.vx.add(new DirectionVector(construct.dir.y, -construct.dir.x))))
			);
		} else if (is<Segment>(construct, 'segment')) {
			console.log('above on segment');
		}
		console.log('above on', construct.type);
		return false;
	}

	public asDirection(): never {
		throw new Error('Position vectors can never be directions');
	}

	public asVector(): Vector {
		return new Vector(this.x, this.y);
	}

	public get inverse(): PositionVector {
		return new PositionVector(-this.x, -this.y);
	}
}

export class DirectionVector extends Vector {
	public add(other: DirectionVector): DirectionVector {
		return super.add(other).asDirection();
	}

	public subtract(other: DirectionVector): DirectionVector {
		return super.subtract(other).asDirection();
	}

	public scale(s: number): DirectionVector {
		return super.scale(s).asDirection();
	}

	public normalize(): DirectionVector {
		return super.normalize().asDirection();
	}

	public clone(): DirectionVector {
		return new DirectionVector(this.x, this.y);
	}

	public angleBetween(other: DirectionVector): number {
		const res = this.reflexAngle - other.reflexAngle;

		return res > 180 ? res - 360 : res < -180 ? res + 360 : res;
	}

	public rotateBy(deg: number): DirectionVector {
		const originalAngle = this.reflexAngle;
		const newAngle = originalAngle - deg;

		if (newAngle === 90) {
			return new DirectionVector(0, 1);
		} else if (newAngle === -90) {
			return new DirectionVector(0, -1);
		} else {
			const x = newAngle > 90 || newAngle < -90 ? -1 : 1;

			return new DirectionVector(x, x * Math.tan(degToRad(newAngle))).normalize();
		}
	}

	public asPosition(): never {
		throw new Error('Direction vectors can never be positions');
	}

	public get reflexAngle(): number {
		if (this.y === 0) {
			return this.x >= 0 ? 0 : 180;
		} else {
			if (this.x === 0) {
				return this.y >= 0 ? 90 : -90;
			}
			return radToDeg(Math.atan(this.y / this.x) + (this.x < 0 ? Math.sign(this.y) * Math.PI : 0));
		}
	}

	public get inverse(): DirectionVector {
		return new DirectionVector(-this.x, -this.y);
	}
}
