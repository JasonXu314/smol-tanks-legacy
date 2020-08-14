import { DirectionVector, Vector } from '@/math/vectors';
import { random } from '@/utils';

describe('Vectors - Basics', () => {
	const x0 = random(100, true);
	const y0 = random(100, true);
	const x1 = random(100, true);
	const y1 = random(100, true);

	const v0 = new Vector(x0, y0);
	const v1 = new Vector(x1, y1);

	it('Performs Addition Properly', () => {
		const result = v0.add(v1);

		expect(result.x).toEqual(x0 + x1);
		expect(result.y).toEqual(y0 + y1);
	});

	it('Performs Subtraction Properly', () => {
		const result = v0.subtract(v1);

		expect(result.x).toEqual(x0 - x1);
		expect(result.y).toEqual(y0 - y1);
	});

	it('Calculates Magnitude Properly', () => {
		const magnitude = Math.sqrt(x0 ** 2 + y0 ** 2);

		expect(v0.magnitude).toEqual(magnitude);
	});

	it('Scales Properly', () => {
		const magnitude = Math.random() * 200;
		const result = v0.scale(magnitude);

		expect(result.magnitude).toEqual(magnitude);
	});

	it('Dots Properly', () => {
		const result = v0.dot(v1);

		expect(result).toEqual(x0 * x1 + y0 * y1);
	});
});

describe('Direction Vectors - Basics', () => {});

describe('Direction Vectors - Rotation', () => {
	it('Rotates Left & Right', () => {
		const vector = new DirectionVector(1, 0);

		expect(vector.rotateBy(-45).reflexAngle).toEqual(45);
		expect(vector.rotateBy(45).reflexAngle).toEqual(-45);
	});

	it('Rotates Through +90', () => {
		const vector = new DirectionVector(1, 1);

		expect(vector.rotateBy(-90).reflexAngle).toEqual(135);
	});

	it('Rotates Through -90', () => {
		const vector = new DirectionVector(1, -1);

		expect(vector.rotateBy(90).reflexAngle).toEqual(-135);
	});
});
