<template>
  <div class="dataset-title-container" ref="container">
     <div class="dataset-link">
        <el-link href="url">{{title}}<i class="el-icon-connection el-icon--right"></i> </el-link>
    </div>
  </div>
</template>


<script>
/* eslint-disable no-alert, no-console */
import Vue from "vue";
import { Link, Icon } from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import lang from "element-ui/lib/locale/lang/en";
import locale from "element-ui/lib/locale";

locale.use(lang);
Vue.use(Link);
Vue.use(Icon);

export default {
  name: "DatasetHeader",
  components: {},
  props: ["title", "url"],
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
