import Vue from 'vue';
import App from './App.vue';
import VueRouter from 'vue-router';
import {MapSvgSprite, MapSvgIcon, MapSvgSpriteColor} from '@abi-software/svg-sprite';

Vue.component('map-svg-icon', MapSvgIcon);
Vue.component('map-svg-sprite', MapSvgSprite);
Vue.component('map-svg-sprite-color', MapSvgSpriteColor);
Vue.use(VueRouter);
Vue.config.productionTip = false;

const routes = [
];

// 3. Create the router instance and pass the `routes` option
// You can pass in additional options here, but let's
// keep it simple for now.
const router = new VueRouter({
  mode: 'history',
  routes // short for `routes: routes`
});

new Vue({
  router,
  render: h => h(App),
}).$mount('#app');
