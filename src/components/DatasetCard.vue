<template>
  <div class="dataset-card-container">
    <div class="dataset-card">
      <div class="seperator-path"></div>
      <div class="card">
        <span class="card-left">
          
          <div class="title">{{entry.description}}</div>
        </span>
        <span class="card-right">
          <img class="banner-img" src="../.././assets/example-banner.jpg"/>
        </span>
      </div>
    </div>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import Vue from "vue";
import { Link, Icon, Card, Button, Select, Input } from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import lang from "element-ui/lib/locale/lang/en";
import locale from "element-ui/lib/locale";

locale.use(lang);
Vue.use(Link);
Vue.use(Icon);
Vue.use(Card);
Vue.use(Button);
Vue.use(Select);
Vue.use(Input);

export default {
  name: "SideBar",
  props: {
    /**
     * Object containing information for
     * the required viewing.
     */
    entry: Object,
  },
  data: function () {
    return {};
  },
  methods: {},
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.dataset-card {
  height: 257px;
  padding-left: 16px;
}
.seperator-path {
  width: 486px;
  height: 0px;
  border: solid 1px var(--pale-grey);
  background-color: var(--pale-grey);
}
.title {
  width: 338px;
  height: 36px;
  font-family: Arial;
  font-size: 16px;
  font-weight: bold;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: 1.2px;
  color: #484848;
}
.card{
  padding-top: 22px;
}
.card-right{
  padding-left: 374px;
  padding-top: 22px;
}
.banner-img{
  width: 128px;
  height: 128px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.25);
  background-color: #ffffff;
}
</style>
