import axios from 'axios';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import styles from '../sass/Index.module.scss';

const Index: NextPage = () => {
	const [tankCount, setTankCount] = useState<number>(1);
	const [wallCount, setWallCount] = useState<number>(0);
	const screenRef = useRef<HTMLDivElement | null>(null);
	const router = useRouter();

	useEffect(() => {
		axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/wakeup`).catch(() => {});
	}, []);

	return (
		<div className={styles.main} ref={screenRef}>
			<div className={styles.modal}>
				<div className={styles.col}>
					<div className={styles.group}>
						<label htmlFor="num-tanks">Tank Count</label>
						<input
							type="text"
							onChange={(evt) => {
								try {
									setTankCount(parseInt(evt.target.value));
								} catch (err) {}
							}}
							value={tankCount}
							id="num-tanks"
						/>
					</div>
					<div className={styles.group}>
						<label htmlFor="num-walls">Wall Count</label>
						<input
							type="text"
							onChange={(evt) => {
								try {
									setWallCount(parseInt(evt.target.value));
								} catch (err) {}
							}}
							value={wallCount}
							id="num-walls"
						/>
					</div>
					<div className={styles.btnGroup}>
						<button
							className={styles.btn}
							onClick={() => {
								axios
									.post<{ id: string }>(`${process.env.NEXT_PUBLIC_BACKEND_URL!}/games`, { tankCount, wallCount })
									.then((res) => {
										router.push('/[gameId]', '/' + res.data.id);
									});
							}}>
							Multiplayer
						</button>
						<Link href={`/singleplayer?tanks=${tankCount}&walls=${wallCount}`}>
							<a className={styles.btn}>Singleplayer</a>
						</Link>
					</div>
				</div>
				<div className={styles.col}></div>
			</div>
			<Head>
				<style>{`
					* {
						margin: 0;
						padding: 0;
						box-sizing: border-box;
					}
				`}</style>
			</Head>
		</div>
	);
};

export default Index;
