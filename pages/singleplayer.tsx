import Canvas from '$/Canvas/Canvas';
import { random } from '@/utils';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { uuid } from 'short-uuid';
import styles from '../sass/Game.module.scss';

const Singleplayer: NextPage = () => {
	const router = useRouter();
	const screenRef = useRef<HTMLDivElement | null>(null);
	const [height, setHeight] = useState<number>(0);
	const [width, setWidth] = useState<number>(0);
	const entities = useMemo(() => {
		const entities: BareEntity[] = [];

		if (typeof router.query.tanks === 'string' && typeof router.query.walls === 'string') {
			const tankCount = parseInt(router.query.tanks);

			const tanks: BareTank[] = new Array(tankCount)
				.fill(null)
				.map((_, i) => ({ dir: [0, 1], pos: [100 * (i + 1) + 1000, 1000], type: 'tank', team: 'red', id: uuid() }));

			const wallCount = parseInt(router.query.walls);

			const walls: BareWall[] = new Array(wallCount).fill(null).map(() => ({
				start: [random(1500, false), random(1000, false)],
				end: [random(1500, false), random(1000, false)],
				type: 'wall'
			}));

			entities.push(...tanks, ...walls);
		} else if (typeof router.query.tanks === 'string') {
			const tankCount = parseInt(router.query.tanks);

			const tanks: BareTank[] = new Array(tankCount)
				.fill(null)
				.map((_, i) => ({ dir: [0, 1], pos: [100 * (i + 1) + 1000, 1000], type: 'tank', team: 'red', id: uuid() }));

			entities.push(...tanks);
		}

		return entities;
	}, [router.query]);

	useEffect(() => {
		if (screenRef.current) {
			const computedStyles = getComputedStyle(screenRef.current);

			setHeight(parseInt(computedStyles.height));
			setWidth(parseInt(computedStyles.width));
		} else {
			console.log('no screenref');
		}
	}, []);

	useEffect(() => {
		const listener = (evt: MouseEvent) => evt.preventDefault();
		const resizeListener = (evt: UIEvent) => {
			evt.preventDefault();
			if (screenRef.current) {
				const computedStyles = getComputedStyle(screenRef.current);

				setHeight(parseInt(computedStyles.height));
				setWidth(parseInt(computedStyles.width));
			} else {
				console.log('no screenref');
			}
		};

		window.addEventListener('contextmenu', listener);
		window.addEventListener('resize', resizeListener);

		return () => {
			window.removeEventListener('contextmenu', listener);
			window.removeEventListener('resize', resizeListener);
		};
	}, []);

	return (
		<div className={styles.main} ref={screenRef}>
			<Head>
				<style>{`
					* {
						margin: 0;
						padding: 0;
						box-sizing: border-box;
					}
				`}</style>
			</Head>
			<Canvas entities={entities} height={height} width={width} multiplayer={false} />
		</div>
	);
};

export default Singleplayer;
