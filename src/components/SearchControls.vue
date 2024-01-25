<template>
  <div class="search-container">
    <div class="text search-text">
      Search within display
    </div>
    <el-autocomplete class="search-box" placeholder="Search"
      v-model="searchText"
      :fetch-suggestions="fetchSuggestions"
      @keyup.enter.native="$emit('search', searchText)"
      @select="$emit('search', $event.value)"
      :teleported=false
      popper-class="autocomplete-popper">
    </el-autocomplete>
    <map-svg-icon icon="magnifyingGlass" class="magnify"
      @click.native="$emit('search', searchText)"/>
    <div v-if="failedSearch" class="text not-found-text">
      '{{failedSearch}}' not found
    </div>
  </div>
</template>

<script>
/* eslint-disable no-alert, no-console */
import { MapSvgIcon } from '@abi-software/svg-sprite';
import { 
  ElAutocomplete as Autocomplete
} from "element-plus";

export default {
  name: "SearchControls",
  props: {
    failedSearch: undefined,
  },
  components: {
    Autocomplete,
    MapSvgIcon,
  },
  methods: {
    fetchSuggestions: function(term, cb) {
      if (term === "") {
        cb([]);
      } else {
        this.$emit('fetch-suggestions', { term, cb });
      }
    },
  },
  data: function () {
    return {
      searchText: "",
    };
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@use "element-plus/theme-chalk/src/autocomplete";

.search-container {
  display:flex;
  flex-direction: row;

  .text {
    margin-left: 8px;
    margin-top: 7px;
    font-weight: 500;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
    user-select: none;
    line-height:18px;
  }
  .search-text {
    margin-top: 8px;
    color: $grey;
    font-size: 14px;
    margin-left: 1rem;
  }
  .not-found-text {
    margin-top: 8px;
    color: $warning;
    font-size: 0.8rem;
    margin-left: 0.5rem;
  }
  .search-box {
    margin-top: 2px;
    margin-left:0.5rem;
    height:28px;
    width:137px;
    :deep(.el-input__inner) {
      background-color: $background;
      height:28px;
      line-height:28px;
      border: 1px solid rgb(144, 147, 153);
      border-radius: 4px;
      &:focus {
        border-color: $app-primary-color;
      }
    }
  }
  .magnify {
    margin-top: 2px;
    margin-left:0.5rem;
    background: $app-primary-color;
    border-radius: 4px;
    height:28px;
    width:28px;
    cursor: pointer;
    &:hover {
      box-shadow: -3px 2px 4px 0 rgba(0,0,0,0.25);
    }
  }
  :deep(.autocomplete-popper) {
    min-width:137px!important;
    width: auto!important;
  }
}

</style>
