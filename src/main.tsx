import { render } from 'preact';
import { App } from './app';
import './ui/tokens.css';
import './ui/app.css';

const root = document.getElementById('root');
if (root) {
  // Clear the prerendered static fallback so landmarks don't duplicate.
  root.replaceChildren();
  render(<App />, root);
}
