<template>
  <section id="association">
    <s-scrollbar wrap-class="scrollMaxH">
      <s-row>
        <s-table-page
          id="associationTable"
          v-loading="dataLoading"
          element-loading-text="数据加载中....."
          ref="associationTable"
          :data="assetsList"
          :header-search="defListSearchDef()"
          :show-header-checkbox="true">
          <s-table-column type="selection" width="50" :selectable="isSelectable"></s-table-column>
          <s-table-column prop="accountName" label="账号名称" sortable width="100" show-overflow-tooltip>
            <!--<template slot-scope="scope" >
              <span
                class="look-detail" v-text="scope.row.accountName"
                @click="lookAssInfoDetail(scope.row)"></span>
            </template>-->
          </s-table-column>
          <s-table-column prop="assetIp" label="IP地址" width="125" sortable show-overflow-tooltip></s-table-column>
          <s-table-column prop="accountTypeStr" label="账号类型" width="80" show-overflow-tooltip></s-table-column>
          <s-table-column prop="thischangePswDateStr" label="上次改密时间" width="110" sortable show-overflow-tooltip></s-table-column>
          <s-table-column :render-header="renderHeader" v-if="taskType===0" prop="assistAccountList" width="100">
            <template slot-scope="scope" >
              <s-input class="sinput" v-if="!tempAssistAccountList[scope.row.uuid]" v-model="scope.row.additionalAccountName" icon="bottom" readonly @focus="inputClick1($event,scope.row)" @click="inputClick1($event,scope.row)" placeholder="请选择">
              </s-input>
              <s-select v-else autoOpen v-model="scope.row.additionalAccountUuid" :ref="scope.row.uuid" class="table-select" @visible-change="visibleChange1($event,scope.row)" clearable>
                <s-option
                  v-for="item in scope.row.assistAccountList"
                  :key="item.value"
                  :label="item.name"
                  :value="item.value">
                </s-option>
              </s-select>
            </template>
          </s-table-column>
          <s-table-column label="协议" prop="protocolPortList" width="130">
            <template slot-scope="scope" >
              <s-input class="sinput" v-if="!tempProtocolPortList[scope.row.uuid]" readonly v-model="scope.row.portName" icon="bottom" @focus="inputClick2($event,scope.row)" @click="inputClick2($event,scope.row)" placeholder="请选择">
              </s-input>
              <s-select v-else v-model="scope.row.portUuid" :ref="scope.row.uuid" autoOpen class="table-select" @visible-change="visibleChange2($event,scope.row)" clearable>
                <s-option
                  v-for="item in scope.row.protocolPortList"
                  :key="item.value"
                  :label="item.name"
                  :value="item.value">
                </s-option>
              </s-select>
            </template>
          </s-table-column>
          <s-table-column :render-header="renderHeaderTask" width="110">
            <template slot-scope="scope">
              <s-input-number v-model="scope.row.taskGroup" :min="0" :max="256" style="width: 90px"></s-input-number>
            </template>
          </s-table-column>
          <s-table-column prop="taskName" label="关联改密任务"></s-table-column>
        </s-table-page>
      </s-row>
    </s-scrollbar>
  </section>
</template>

<script type="text/babel">
  import $axios from 'sunflower-ajax'

  export default {
    data() {
      return {
        tempAssistAccountList: {},
        tempProtocolPortList: {},
        dataLoading: false,           // 数据加载遮罩
        assetsList: [],               // 全部资产账号列表
        assetsListOrigin: [],         // 全部资产账号列表原始数据(过滤时使用)
        associatedLists: [],          // 当前改密任务已经关联的所有资产账号列表
        assetsTwoResult: [],          // 已经关联其他改密任务的资产账号(账号设置时，不能再关联其他资产)
        changePassTaskUuid: '',       // 新建的改密任务uuid
        taskType: '',                  // 数据库类型
        agreement: ''
      }
    },
    props: {
      originData: {
        type: Object,
        default() {
          return {}
        }
      }
    },

    methods: {
      inputClick1(e, row) {
        this.tempAssistAccountList[row.uuid] = true;
        this.$refs.associationTable.toggleRowSelection(row, false)
        this.$refs.associationTable.toggleRowSelection(row, false)
      },
      inputClick2(e, row) {
        this.tempProtocolPortList[row.uuid] = true;
        this.$refs.associationTable.toggleRowSelection(row, false)
        this.$refs.associationTable.toggleRowSelection(row, false)
      },
      visibleChange1(flag, row) {
        if (flag === false) {
          this.tempAssistAccountList[row.uuid] = false;
          row.additionalAccountName = this.$refs[row.uuid].selectedLabel
          this.$refs.associationTable.toggleRowSelection(row, false)
          this.$refs.associationTable.toggleRowSelection(row, false)
        }
      },
      visibleChange2(flag, row) {
        if (flag === false) {
          this.tempProtocolPortList[row.uuid] = false;
          row.portName = this.$refs[row.uuid].selectedLabel
          this.$refs.associationTable.toggleRowSelection(row, false)
          this.$refs.associationTable.toggleRowSelection(row, false)
        }
      },
      renderHeader (h, {column}) {
        return (`
          <div>
            <span>辅助账号</span>
            <s-tooltip content='Linux/Unix/Aix用于辅助登录，其他类型用于提权操作' placement="right">
              <i class="iconfont icon-help"></i>
            </s-tooltip>
          </div>
        `);
      },
      renderHeaderTask (h, {column}) {
        return (`
          <div>
            <span>任务组</span>
            <s-tooltip content='支持输入，0到256的数字' placement="right">
              <i class="iconfont icon-help"></i>
            </s-tooltip>
          </div>
        `);
      },
      // 关联策略列表 表格搜索
      defListSearchDef() {
        return {
          width: 12,
          placeholder: '请输入账号名称、IP地址、账号类型、关联改密任务查询',
          searchProps: ['accountName', 'assetIp', 'accountTypeStr', 'taskName'] // can be string or Array
        }
      },
      // 查看呢关联账号详情
      lookAssInfoDetail(row) {
        this.$emit('showAssInfoDialog', row)
      },
      // 关联账号列表是否可选
      isSelectable(row, index) {
        let twoResultUuid = this.assetsTwoResult.map(item => {
          return item.uuid
        })
        if (twoResultUuid.indexOf(row.uuid) === -1) {
          return true
        }
      },
      // 保存关联账号-资产账号验证(至少关联一个资产账号)
      validateAssetsAccount() {
        let assetsListMultiSelects = this.$refs.associationTable.getAllSelectedData();
        return this.originData.uuid || assetsListMultiSelects.length > 0;
      },
      // 保存关联账号-资产账号
      saveAssetsAccount(changeTaskUuid) {
        // 新增时promise.resolve(changeTaskUuid) || 编辑时this.originData.uuid
        this.changePassTaskUuid = changeTaskUuid || this.originData.uuid;
        return new Promise((resolve, reject) => {
          let sendData = []
          let assetsListMultiSelects = this.$refs.associationTable.getAllSelectedData();
          assetsListMultiSelects.forEach((item) => {
            let temp = {
              taskName: item.taskName,
              accountUuid: item.uuid,
              deviceUuid: item.assetsUuid,
              taskUuid: this.changePassTaskUuid,
              portUuid: item.portUuid,
              additionalAccountUuid: item.additionalAccountUuid
            }
            sendData.push(temp)
          });
          $axios.post('/tPasswdChangeTask/saveAccountTask', sendData, {
            data: sendData,
            logTemplate: '编辑|改密任务列表>改密任务(#taskName#)'
          }).then((res) => {
            let resData = res.data
            if (resData.result === 'true') {
              this.saveGroups(resolve, reject);
            } else {
              this.$message.error('账号关联失败，请重试！');
              reject('association');
            }
          })
        });
      },
      // 保存关联账号-任务组
      saveGroups(resolve, reject) {
        let assSendData = []
        let assetsListMultiSelects = this.$refs.associationTable.getAllSelectedData();
        assetsListMultiSelects.forEach((item, index) => {
          let assTem = {
            accountUuid: item.uuid,
            deviceUuid: item.assetsUuid,
            taskGroups: item.taskGroup,
            taskUuid: this.changePassTaskUuid
          }
          assSendData.push(assTem)
        })
        if (assSendData.length === 0) {
          let pwdUuidSend = this.changePassTaskUuid
          $axios.get(`/tPasswdChangeTask/deleteTPasswdChange/${pwdUuidSend}`).then((res) => {
            let resData = res.data
            if (resData === 'true') {
              resolve('association');
            } else {
              this.$message.error('账号关联失败，请重试！');
              reject('association');
            }
          })
        } else {
          $axios.post('/tPasswdChangeTask/savePassword', assSendData).then((res) => {
            let resData = res.data
            if (resData === 'true') {
              resolve('association');
            } else {
              this.$message.error('账号关联失败，请重试！');
              reject('association');
            }
          })
        }
      },
      acceptTaskType (val) {
        this.dataLoading = true;      // 打开数据加载遮罩
        let changPassTaskUuid = this.originData ? this.originData.uuid : null;
        $axios.post(`/tPasswdChangeTask/editAccount/${changPassTaskUuid}/${val}`).then((res) => {
          let accountRes = res.data;
          if (accountRes) {
            // 获取所有资产账号数据
            if (accountRes.allassetsAccountInfo instanceof Array) {
              this.assetsList = accountRes.allassetsAccountInfo
              // 初始化默认选中的协议
              for (let v of this.assetsList) {
                if (v.portUuid == null) {
                  this.$set(v, 'portUuid', v.protocolPortList[0].value)
                }
                if (v.taskGroup == null) {
                  this.$set(v, 'taskGroup', 0)
                }
                let temp1 = v.assistAccountList.filter(item => item.value === v.additionalAccountUuid)[0];
                v.additionalAccountName = temp1 ? temp1['name'] : null;
                let temp2 = v.protocolPortList.filter(item => item.value === v.portUuid)[0];
                v.portName = temp2 ? temp2['name'] : null;
              }
              // 保存所有资产账号原始数据(过滤时使用)
              this.assetsListOrigin = this.assetsList.concat([]);
            }
            // 获取并初始化当前改密任务已关联的资产账号
            if (accountRes.AssetsAccountInfo.length !== 0) {
              this.associatedLists = accountRes.AssetsAccountInfo;
            }
            // 获取已经关联其他改密任务的资产账号
            if (accountRes.assetsAccountInfoTworesult instanceof Array) {
              this.assetsTwoResult = accountRes.assetsAccountInfoTworesult
            }
            // 编辑时，默认选中当前改密任务已关联资产账号
            if (this.originData.uuid) {
              this.$nextTick(() => {
                this.assetsList.forEach((item, i) => {
                  this.associatedLists.forEach((list, j) => {
                    if (item.uuid === list.uuid) {
                      // 编辑时回显关联账号的任务组
                      this.$refs.associationTable.toggleRowSelection(item, true);
                    }
                  })
                })
              });
            }
            this.dataLoading = false;      // 关闭数据加载遮罩
          }
        });
      }
    },
    created() {
      this.$eventBus.$on('handleTaskType', (val) => {
        this.taskType = val;
      });
      setTimeout(() => {
        if (this.originData.uuid) {
          this.taskType = this.originData.taskType
        } else {
          this.taskType = 0;
        }
        // this.acceptTaskType(this.taskType)
      }, 1000)
    },
    beforeDestroy() {
      this.$eventBus.$off('handleTaskType');
    },
    watch: {
      'taskType': {
        // immediate: true,
        handler: function (val) {
          this.acceptTaskType(val)
        }
      }
    }
  }
</script>

<style lang="stylus" rel="stylesheet/stylus">
  #association
    #associationTable
      .look-detail
        cursor pointer
        &:hover
          text-decoration underline
    .table-select
      & .iconfont
        font-size 14px
    .s-table tbody .cell .iconfont{
      margin-right 0!important;
    }
    .sinput
      .icon-bottom
        font-size:14px;
        color:#ccc!important;
</style>
