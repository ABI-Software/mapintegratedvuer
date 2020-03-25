<template>
  <div class="nav-item-container" ref="container">
    <div style="padding: 70px">
      <el-row type="flex" :gutter="25">
        <el-col :span="4">
          <img :src="image" class="image" />
        </el-col>
        <el-col :span="20">
          <span class="title">{{title}}</span>
          <div class="description">{{description}}</div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import Vue from "vue";
import { Button, Card, Row, Col } from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import lang from "element-ui/lib/locale/lang/en";
import locale from "element-ui/lib/locale";

locale.use(lang);

Vue.use(Button);
Vue.use(Card);
Vue.use(Row);
Vue.use(Col);

export default {
  name: "NavDropDownItem",
  components: {},
  props: ["image", "title", "description"],
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.title {
  font-family: "HelveticaMedium";
  font-size: 14px;
  font-weight: bold;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: 1.05px;
  text-align: center;
  color: var(--vibrant-purple);;
}
.description {
  padding-top: 0.2em;
  font-family: "Helvetica";
  font-size: 14px;
  font-weight: normal;
  font-stretch: normal;
  font-style: normal;
  line-height: 130%;
  letter-spacing: 1.35px;
  color: var(--brownish-grey);
}
.image {
  width: 92px;
  display: block;
  float: right;
  margin-top: 1.5em;
}
</style>
