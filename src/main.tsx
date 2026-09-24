import { render } from 'preact';
import { App } from './app';
import './ui/tokens.css';
import './ui/app.css';

const root = document.getElementById('root');
if (root) render(<App />, root);
