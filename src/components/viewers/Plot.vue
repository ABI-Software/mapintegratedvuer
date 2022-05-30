<template>
  <PlotVuer
    :data-source="entry.resource.dataSource"
    :metadata="entry.resource.metadata"
    :supplemental-data="entry.resource.supplementalData"
    style="overflow: hidden"
  />
</template>

<script>
/* eslint-disable no-alert, no-console */
import { PlotVuer } from "@abi-software/plotvuer";
import "@abi-software/plotvuer/dist/plotvuer.css";
import ContentMixin from "../../mixins/ContentMixin";

export default {
  name: "Plot",
  mixins: [ ContentMixin ],
  components: {
    PlotVuer,
  }
};
</script>
