import Vue from 'vue';
import App from './App.vue';
import VueRouter from 'vue-router';
import {SvgSprite, SvgIcon, SvgSpriteColor} from '@abi-software/svg-sprite';

Vue.component('svg-icon', SvgIcon);
Vue.component('svg-sprite', SvgSprite);
Vue.component('svg-sprite-color', SvgSpriteColor);
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
