import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

import * as marked from 'marked';
import hljs from 'highlight.js';
import katex from 'katex';

(window as any).marked = marked;
(window as any).hljs = hljs;
(window as any).katex = katex;

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
