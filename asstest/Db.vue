<template>
  <s-scrollbar wrap-style="max-height: 600px;">
    <s-table ref="dblist" :data="allList" @selection-change="handleChange">
      <s-table-column type="selection" width="55px" :selectable="isSelectable" v-if="conditionObj.type !==2 && conditionObj.type !==3"></s-table-column>
      <s-table-column label="数据库/实例名" show-overflow-tooltip>
        <template slot-scope="scope">
          {{scope.row}}
        </template>
      </s-table-column>
    </s-table>
  </s-scrollbar>
</template>

<script>
  import $axios from 'sunflower-ajax'

  export default {
    props: {
      data: Object,
      isView: {
        type: Boolean,
        default: false
      },
      conditionObj: {
        type: Object,
        default: null
      }
    },
    data() {
      return {
        allList: [],
        selectedDb: []
      }
    },
    methods: {
      getAll() {
        $axios.get(`/authInfo/getDbserverNameList/${this.data.portUuid}`).then((res) => {
          if (res.data && res.data instanceof Array) {
            this.allList = res.data;
            this.getHave();
          }
        });
      },
      getHave() {
        let params = {
          authUuid: this.data.authUuid,
          tempUuid: this.data.tempUuid,
          uniqueUuid: this.data.uuid
        };
        $axios.post(`/operationAuth/getAuthedDbnames/`, params).then((res) => {
          if (res.data && res.data instanceof Array) {
            for (let i = 0; i < res.data.length; i++) {
              for (let j = 0; j < this.allList.length; j++) {
                if (res.data[i] === this.allList[j]) {
                  this.$refs.dblist.toggleRowSelection(this.allList[j]);
                  break;
                }
              }
            }
          }
        });
      },
      handleChange(val) {
        this.selectedDb = val;
      },
      /* 是否可以勾选 */
      isSelectable(row) {
        let flag;
        this.isView ? flag = false : flag = true
        return flag
      }
    },
    created() {
      this.getAll();
    }
  }
</script>
