//require('jsdom-global')();

//global.expect = require('chai').expect;
//global.DOMParser = require('dom-parser');

//import { Window } from 'happy-dom';
import { vi } from 'vitest'
import DOMParser from 'dom-parser';

//const window = new Window({ url: 'https://localhost:8080' });
vi.stubGlobal('DOMParser', DOMParser)

