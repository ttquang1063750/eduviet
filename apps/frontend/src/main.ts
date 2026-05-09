import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

import * as marked from 'marked';
import hljs from 'highlight.js';
import katex from 'katex';

declare global {
  interface Window {
    marked: typeof marked;
    hljs: typeof hljs;
    katex: typeof katex;
  }
}

window.marked = marked;
window.hljs = hljs;
window.katex = katex;

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
