import './ui/hud.css';
import { App } from './App';

const canvas = document.getElementById('app') as HTMLCanvasElement | null;
if (!canvas) throw new Error('Canvas #app not found');

const app = new App(canvas);
app.start();
