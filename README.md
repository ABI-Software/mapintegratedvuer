# mapintegratedvuer

This project aims to provide an application to visually navigate anatomical entities to  discover functional and physiological datasets
from organ-specific neural circuitry.

## Components in mapintegratedvuer

Mapintegratedvuer includes multiple components for visualising data, the list of viewers can be found below:

### [Flatmapvuer](https://github.com/ABI-Software/flatmapvuer)

### [Scaffoldvuer](https://github.com/ABI-Software/scaffoldvuer)

### [Simulationvuer](https://github.com/ABI-Software/simulationvuer)

### [Plotvuer](https://github.com/ABI-Software/plotvuer)

### [Sidebar](https://github.com/ABI-Software/map-sidebar.git)


## mapintegratedvuer on NPM

mapintegratedvuer is available on npm and can be installed into your project with the following command:
```bash
npm i @abi-software/mapintegratedvuer
```

## Project setup
```
npm install
```

### Compiles and minifies for production
```
npm run build-bundle
```

## How to use
Install the package in your vue app project with the following command "npm i @abi-software/mapintegratedvuer".
Import the package in your script as followed:
```javascript
import '@abi-software/mapintegratedvuer';
import '@abi-software/mapintegratedvuer/dist/mapintegratedvuer.css';
```

The codes above register the MapContent component in the global scope.
You can now use the MapContent in your vue template as followed:
```html
<MapContent />
```

## Project setup from Github

The source code is available from Github, it can be found here: https://github.com/ABI-Software/mapintegratedvuer .

### Clone the respositroy
```bash
git clone https://github.com/ABI-Software/mapintegratedvuer
```

### Setup
```bash
npm install
```

### Create an instance
```bash
npm run serve
```

### Compiles and minifies for production
```bash
npm run build-bundle
```

## Example
The following pagedemonstrates the mapintegratedapp in action: https://mapcore-demo.org/current/sparc-app/maps


## Testing mapintegratedvuer dependencies in [sparc-app](https://github.com/nih-sparc/sparc-app/)
We will cover three options for updating nested dependencies.

### 1. Copy build files from `npm run build-bundle`
This works by directly changing files in `node-modules/`, where node will look to resolve dependencies.

```
cd <your-dependency>
npm run build-bundle
cp /dist <mapintegratedvuer-path>/node_modules/@<your-npmhandle>/<your-dependency>/dist
cd <mapintegratedvuer-path>
npm run build-bundle
cp /dist <sparc-app-path>/node_modules/@abi-software/mapintegratedvuer/dist
yarn dev
```
*Note: this assumes assets in the static folders shipped with the npm package will remain unchanged*
### 2. Use `yarn link`
This is a variant of option 1, where we use `yarn link` to create a symbolic link from mapintegratedvuer->spar-app
It reduces the number of copies to 1, but still requires 3 builds
```
cd <your-dependency>
npm run build-bundle
cp /dist <mapintegratedvuer-path>/node_modules/@<your-npmhandle>/<your-dependency>/dist
cd <mapintegratedvuer-path>
npm run build-bundle
yarn link
cd sparc-app
yarn link @abi-software/mapintegratedvuer
yarn dev
```
(npm link does not work without disabling es-lint, which we won't go into)

### 3. Publish own version of mapintegratedvuer
This method is the most time consuming and has the downside of populating the npm package's version history with builds.
Since it mimics the way `sparc-app` will use it, it's gauranteed to work.

```
cd <your-dependency>
npm run build-bundle
npm publish --tag alpha
cd mapintegratedvuer
npm install @<your-npmhandle>/<your-dependency>@alpha
```

Edit mapintegratedvuer/package.json:
Change `@abi-software/mapintegratedvuer` to `@<your-npm-handle>/mapintegratedvuer`

```
cd mapintegratedvuer
npm run build-bundle
npm publish --tag alpha
```

Edit sparc-app/pages/maps/index.vue
Change `@abi-software/mapintegratedvuer` to `@<your-npm-handle>/mapintegratedvuer`

```
cd sparc-app
yarn add @<your-npm-handle>/mapintegratedvuer@alpha
yarn dev
```

## API Documentation

The API documentation is developed with `vitepress` and `vuese`. The API documentation pages are in the `docs` folder.

### To run in local development mode
```bash
npm run docs:watch
```
This will start the documentation server with `vitepress` on port `:5173` and watch the `FlatmapVuer` and `MultiFlatmapVuer` components changes.


## The HelpModeDialog

The `HelpModeDialog` is used to show help tooltips individually and one by one. This is available on Flatmap, MultiFlatmap, and Scaffold views.
To use `HelpModeDialog`, set `useHelpModeDialog` to `true`. The default value is `false`.

```HTML
<MapContent
  ...
  :useHelpModeDialog="true"
/>
```
