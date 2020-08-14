import { intersection, is, sameSign } from '@/utils';
import { DirectionVector, PositionVector } from './vectors';

export class Line implements Construct2D {
	public type: ConstructType = 'line';

	constructor(public p1: PositionVector, public p2: PositionVector) {}

	public intersection(other: Construct2D): PositionVector | null {
		if (is<Line>(other, 'line')) {
			const res = intersection([this.p1.raw, this.p2.raw], [other.p1.raw, other.p2.raw]);

			return res ? new PositionVector(...res) : res;
		} else if (is<Ray>(other, 'ray')) {
			const res = intersection([this.p1.raw, this.p2.raw], [other.vx.raw, other.vx.add(other.dir).raw]);

			if (!res) {
				return res;
			} else {
				const resVec = new PositionVector(...res);
				const dirToIntersection = other.vx.vectorTo(resVec);

				return sameSign(other.dir.x, dirToIntersection.x) && sameSign(other.dir.y, dirToIntersection.y) ? resVec : null;
			}
		} else if (is<Segment>(other, 'segment')) {
			const res = intersection([this.p1.raw, this.p2.raw], [other.p1.raw, other.p2.raw]);

			if (!res) {
				return res;
			} else {
				const resVec = new PositionVector(...res);

				return other.containsPoint(resVec) ? resVec : null;
			}
		}
		return null;
	}
}

export class Ray implements Construct2D {
	public type: ConstructType = 'ray';

	constructor(public vx: PositionVector, public dir: DirectionVector) {}

	public intersection(other: Construct2D): PositionVector | null {
		if (is<Line>(other, 'line')) {
			const res = intersection([other.p1.raw, other.p2.raw], [this.vx.raw, this.vx.add(this.dir).raw]);

			if (!res) {
				return res;
			} else {
				const resVec = new PositionVector(...res);
				const dirToIntersection = this.vx.vectorTo(resVec);

				return sameSign(this.dir.x, dirToIntersection.x) && sameSign(this.dir.y, dirToIntersection.y) ? resVec : null;
			}
		} else if (is<Ray>(other, 'ray')) {
			const res = intersection([this.vx.raw, this.vx.add(this.dir).raw], [other.vx.raw, other.vx.add(other.dir).raw]);

			if (!res) {
				return res;
			} else {
				const resVec = new PositionVector(...res);
				const thisDirToIntersection = this.vx.vectorTo(resVec);
				const otherDirToIntersection = other.vx.vectorTo(resVec);

				return sameSign(thisDirToIntersection.x, this.dir.x) &&
					sameSign(thisDirToIntersection.y, this.dir.y) &&
					sameSign(otherDirToIntersection.x, other.dir.x) &&
					sameSign(otherDirToIntersection.y, other.dir.y)
					? resVec
					: null;
			}
		} else if (is<Segment>(other, 'segment')) {
			const res = intersection([this.vx.raw, this.vx.add(this.dir).raw], [other.p1.raw, other.p2.raw]);

			if (!res) {
				return res;
			} else {
				const resVec = new PositionVector(...res);
				const dirToIntersection = this.vx.vectorTo(resVec);

				return sameSign(dirToIntersection.x, this.dir.x) && sameSign(dirToIntersection.y, this.dir.y) && other.containsPoint(resVec) ? resVec : null;
			}
		}
		return null;
	}
}

export class Segment implements Construct2D {
	public type: ConstructType = 'segment';

	constructor(public p1: PositionVector, public p2: PositionVector) {}

	public containsPoint(pt: PositionVector) {
		return (
			(this.p1.x <= this.p2.x ? pt.x >= this.p1.x && pt.x <= this.p2.x : pt.x >= this.p2.x && pt.x <= this.p1.x) &&
			(this.p1.y <= this.p2.y ? pt.y >= this.p1.y && pt.y <= this.p2.y : pt.y >= this.p2.y && pt.y <= this.p1.y) &&
			Math.abs((this.p2.y - pt.y) / (this.p2.x - pt.x) - (pt.y - this.p1.y) / (pt.x - this.p1.x)) <= 0.01
		);
	}

	public get raw(): [RawVector, RawVector] {
		return [this.p1.raw, this.p2.raw];
	}
}
