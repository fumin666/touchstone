<template>
  <section class="fileList">
    <s-form :inline="true" :model="AuditSearchForm" class="search_form" style="margin-bottom: 15px;" label-width='105px'>
      <div>
        <s-form-item label="稽核任务名称：">
          <s-input @keyup.enter.native="search" v-model="AuditSearchForm.taskName"></s-input>
        </s-form-item>
        <s-form-item label="稽核任务周期：">
          <s-input v-model="AuditSearchForm.taskPeriodName"></s-input>
        </s-form-item>
        <s-form-item label="创建者：">
          <s-input v-model="AuditSearchForm.userName"></s-input>
        </s-form-item>
        <s-form-item label="上次执行时间：">
          <date-range v-model="AuditSearchForm.lastTimeString.value"></date-range>
        </s-form-item>
        <s-form-item label="下次执行时间：">
          <date-range v-model="AuditSearchForm.nextTimeString.value"></date-range>
        </s-form-item>
        <s-form-item label=" 创建时间：">
          <date-range v-model="AuditSearchForm.creatTme.value"></date-range>
        </s-form-item>
      </div>
      <div class="search_btn">
        <s-button icon='magnifier' @click="search()">查询</s-button>
      </div>
    </s-form>
    <s-button icon="plus" @click="openAuditAddDialog">添加</s-button>
    <s-button icon="batch-del" @click="handleDeletes">批量删除</s-button>
    <s-table-page
      style="margin-top:10px;"
      :data="tableData"
      @selection-change="handleSelection"
      :row-actions="getRowActionsDef()"
      actions-col-width="120"
    >
      <s-table-column type="selection" width="45"></s-table-column>
      <s-table-column label="稽核任务名称" prop="taskName"></s-table-column>
      <s-table-column label="稽核任务周期" prop="taskPeriodName">
        <template slot-scope="scope">
          <span>{{scope.row.isPeriod === 0 ? '-' : scope.row.taskPeriodName}}</span>
        </template>
      </s-table-column>
      <!--<s-table-column label="是否立即同步" prop="isSynchro">-->
      <!--<template slot-scope="scope">-->
      <!--<span v-if="scope.row.isSynchro === 0">否</span>-->
      <!--<span v-else>是</span>-->
      <!--</template>-->
      <!--</s-table-column>-->
      <s-table-column label="上次执行时间" width="180">
        <template slot-scope="scope">
          <span>{{scope.row.lastTimeString}}</span>
        </template>
      </s-table-column>
      <s-table-column label="下次执行时间" prop="nextTime" width="180">
        <template slot-scope="scope">
          <span>{{scope.row.nextTimeString}}</span>
        </template>
      </s-table-column>
      <s-table-column label="创建者" prop="userName"></s-table-column>
      <s-table-column label="创建时间" prop="creatTme" width="180"></s-table-column>
    </s-table-page>
    <!--新增定时稽核-->
    <s-dialog
      v-model="bloomAdd"
      v-if="bloomAdd"
      width="950px"
      title="新增稽核任务">
      <audit-add-dialog :selectObjects="selectObjectsCache" @open-object="openBloomAddObjectDialog"
                        @showEmailM="bloomMyEmail = true" @showEmail="bloomLink = true" :data="selectedEmailList"
                        ref="auditAdd"></audit-add-dialog>
      <template slot="footer" class="dialog-footer">
        <s-button @click="addOk">保存</s-button>
        <s-button type="cancel" @click="bloomAdd = false">取消</s-button>
      </template>
    </s-dialog>
    <!--编辑定时稽核-->
    <s-dialog
      v-model="editDialog"
      v-if="editDialog"
      width="950px"
      title="编辑稽核任务">
      <audit-add-dialog :defaultData="editCache" :selectObjects="selectObjectsCache"
                        @open-object="openBloomAddObjectDialog" @showEmailM="bloomMyEmail = true"
                        @showEmail="bloomLink = true" :data="selectedEmailList"
                        ref="auditEdit"></audit-add-dialog>
      <template slot="footer" class="dialog-footer">
        <s-button @click="editOk">保存</s-button>
        <s-button type="cancel" @click="editDialog = false">取消</s-button>
      </template>
    </s-dialog>
    <!--稽核对象列表-->
    <s-dialog
      v-model="bloomAddObjectDialog"
      v-if="bloomAddObjectDialog"
      width="950px"
      title="稽核对象列表">
      <object-list ref="objectCom" :selectedObjectList="selectedObjectList"></object-list>
      <template slot="footer" class="dialog-footer">
        <s-button @click="addObject">保存</s-button>
        <s-button type="cancel" @click="bloomAddObjectDialog = false">取消</s-button>
      </template>
    </s-dialog>
    <!--删除稽核任务-->
    <s-dialog
      v-if="delDialog"
      v-model="delDialog"
      width="400px"
      title="删除稽核任务">
      确定要删除吗？
      <template slot="footer" class="dialog-footer">
        <s-button @click="submitDelete">确定</s-button>
        <s-button type="cancel" @click="delDialog = false">取消</s-button>
      </template>
    </s-dialog>
    <!--手动增加邮件-->
    <s-dialog
      v-model="bloomMyEmail"
      v-if="bloomMyEmail"
      title="手动添加邮件">
      <add-email-m ref="addMyEmail"></add-email-m>
      <template slot="footer" class="dialog-footer">
        <s-button @click="addMyEmailOK">确定</s-button>
        <s-button type="cancel" @click="bloomMyEmail = false">取消</s-button>
      </template>
    </s-dialog>
    <!--引用邮件-->
    <s-dialog
      v-model="bloomLink"
      v-if="bloomLink"
      title="增加引用"
      width="800px">
      <s-scrollbar wrap-style="max-height: 600px;">
        <add-email ref="linkEmail" :data="selectedEmailList"></add-email>
      </s-scrollbar>
      <template slot="footer" class="dialog-footer">
        <s-button @click="linkEmailOK">确定</s-button>
        <s-button type="cancel" @click="bloomLink = false">取消</s-button>
      </template>
    </s-dialog>
  </section>
</template>

<script>
  import DateRange from 'sicap-date-range';
  import AuditAddDialog from './AuditAdd.vue'
  import ObjectList from './ObjectList.vue'
  import $axios from 'sunflower-ajax';
  import {multiSearch} from 'sunflower-common-utils';
  import {cloneDeep} from 'lodash';
  import AddEmailM from './AddEmailM'
  import AddEmail from './AddEmail'

  export default {
    data() {
      return {
        timingAuditTbData: [],
        tableData: [],
        selectionList: [],
        deleteList: [],
        bloomAdd: false,
        bloomAddObjectDialog: false,
        bloomLink: false,
        editDialog: false,
        delDialog: false,
        selectObjectsCache: [],
        AuditSearchForm: {
          taskName: '',
          taskPeriodName: '',
          lastTimeString: {
            type: 'datetimerange',
            value: []
          },
          nextTimeString: {
            type: 'datetimerange',
            value: []
          },
          userName: '',
          creatTme: {
            type: 'datetimerange',
            value: []
          }
        },
        ResultSearchForm: {},
        editCache: {},
        testForm: {
          value: ''
        },
        selectedObjectList: [],
        bloomMyEmail: false,
        selectedEmailList: []
      }
    },
    components: {
      // SearchBox,

      AuditAddDialog,
      ObjectList,
      AddEmailM,
      AddEmail,
      DateRange
    },
    methods: {
      getRowActionsDef() {
        let vm = this;
        return [{
          icon: 'edit',
          name: '编辑',
          click(row) {
            $axios.get('/collectTask/getCollectTaskByUUid/' + row.uuid).then(function (res) {
              vm.editCache = res.data
              vm.selectedEmailList = res.data.infoSendModeList;
              vm.editDialog = true;
            })
          }
        }, {
          icon: 'delete',
          name: '删除',
          click(row) {
            vm.deleteList = [row]
            vm.delDialog = true;
          }
        }]
      },
      getRowMultiActions() {
        return [
          {name: '稽核名称'},
          {name: '稽核周期'},
          {name: '上次执行时间'},
          {name: '下次执行时间'},
          {name: '创建者'},
          {name: '创建时间'}
        ]
      },
      search() {
        let vm = this
        let form = cloneDeep(vm.AuditSearchForm)
        this.tableData = multiSearch(form, this.timingAuditTbData);
      },
      getList() {
        $axios.post('/collectTask/getTaskList', {}).then((res) => {
          this.timingAuditTbData = res.data;
          this.tableData = cloneDeep(res.data);
        });
      },
      delNotNeedKey(arr, target) {
        for (var key in target) {
          if (arr.indexOf(key) < 0) {
            delete target[key]
          }
        }
        return target
      },
      formattScheduleTime(obj) {
        const notPeriod = ['timeType', 'firstFireTime']
        const dayKeys = ['timeType', 'firstFireTime', 'endFireTime', 'day']
        const dayKeysForever = ['timeType', 'firstFireTime', 'isForever', 'day']
        const weekKeys = ['timeType', 'firstFireTime', 'endFireTime', 'week', 'dayOfWeek']
        const weekKeysForever = ['timeType', 'firstFireTime', 'isForever', 'week', 'dayOfWeek']
        const monthKeys = ['timeType', 'firstFireTime', 'endFireTime', 'month', 'dayOfMonth']
        const monthKeysForever = ['timeType', 'firstFireTime', 'isForever', 'month', 'dayOfMonth']
        const yearKeys = ['timeType', 'firstFireTime', 'endFireTime', 'year', 'dayOfMonth', 'monthOfYear']
        const yearKeysForever = ['timeType', 'firstFireTime', 'isForever', 'year', 'dayOfMonth', 'monthOfYear']
        let newForm = cloneDeep(obj)
        if (newForm.isPeriod === 0) {
          newForm.tScheduleTime = this.delNotNeedKey(notPeriod, newForm.tScheduleTime)
          newForm.tScheduleTime.timeType = 7
        } else {
          let type = newForm.tScheduleTime.timeType
          let forever = newForm.tScheduleTime.isForever
          if (type === 1) {
            if (forever === 1) {
              newForm.tScheduleTime = this.delNotNeedKey(dayKeysForever, newForm.tScheduleTime)
            } else {
              newForm.tScheduleTime = this.delNotNeedKey(dayKeys, newForm.tScheduleTime)
            }
          }
          if (type === 2) {
            if (forever === 1) {
              newForm.tScheduleTime = this.delNotNeedKey(weekKeysForever, newForm.tScheduleTime)
            } else {
              newForm.tScheduleTime = this.delNotNeedKey(weekKeys, newForm.tScheduleTime)
            }
          }
          if (type === 3) {
            if (forever === 1) {
              newForm.tScheduleTime = this.delNotNeedKey(monthKeysForever, newForm.tScheduleTime)
            } else {
              newForm.tScheduleTime = this.delNotNeedKey(monthKeys, newForm.tScheduleTime)
            }
          }
          if (type === 4) {
            if (forever === 1) {
              newForm.tScheduleTime = this.delNotNeedKey(yearKeysForever, newForm.tScheduleTime)
            } else {
              newForm.tScheduleTime = this.delNotNeedKey(yearKeys, newForm.tScheduleTime)
            }
          }
        }
        for (let key in newForm.tScheduleTime) {
          // 转日期为int
          if ((key === 'firstFireTime' || key === 'endFireTime') && newForm.tScheduleTime[key] !== null) {
            newForm.tScheduleTime[key] = parseInt(new Date(newForm.tScheduleTime[key]).getTime() / 1000)
          }
          // 转数组为字符串
          if ((key === 'dayOfWeek' || key === 'dayOfMonth') && newForm.tScheduleTime[key].length > 0) {
            newForm.tScheduleTime[key] = newForm.tScheduleTime[key].join(',')
          }
          // 依据不同情况删除多余字段
        }
        return newForm
      },
      // 添加账号稽核-打开添加弹框
      openAuditAddDialog() {
        // 若系统中不存在同时具有账号和协议的资产，则不允许其创建稽核任务
        $axios.get('/assetsAccountInfo/getAllAccountAndPortWithAssets').then(({data}) => {
          if (data && data.state === true) {
            this.bloomAdd = true;
          } else {
            this.$message.warning('系统中不存在同时具有账号和协议的资产，无法添加稽核任务！');
          }
        });
      },
      addOk() {
        let vm = this;
        let newForm = this.formattScheduleTime(vm.$refs['auditAdd'].collectTask)
        let collectDeviceList = vm.$refs['auditAdd'].collectDeviceList.map(function (value) {
          return {
            accountUuid: value.accountUuid,
            deviceUuid: value.deviceUuid,
            portUuid: value.portUuid
          }
        });
        for (let i = 0; i < collectDeviceList.length; i++) {
          let obj = collectDeviceList[i];
          if (obj.portUuid) {
            if (obj.accountUuid) {
            } else {
              vm.$refs['auditAdd'].activeName = '2';
              this.$message({
                message: '稽核对象的资产账号未选择',
                type: 'error'
              });
              return
            }
          } else {
            vm.$refs['auditAdd'].activeName = '2';
            this.$message({
              message: '稽核对象的协议名未选择',
              type: 'error'
            });
            return
          }
        }
        let infoSendMode = vm.$refs.auditAdd.listEmail;
        if (vm.$refs['auditAdd'].openEmail === false) {
          infoSendMode = [];
        }
        for (let i = 0; i < infoSendMode.length; i++) {
          infoSendMode[i].sendMode = 2;
        }
        let data = {
          collectTask: newForm,
          collectDeviceList: collectDeviceList,
          infoSendModeList: infoSendMode
        };
        this.$refs['auditAdd'].$refs['timeForm'].$refs['periodForm'].validate((validTime) => {
          if (!validTime) {
            vm.$refs['auditAdd'].activeName = '1';
            return false;
          }
          this.$refs['auditAdd'].$refs['addForm'].validate((valid) => {
            if (!valid) {
              vm.$refs['auditAdd'].activeName = '1';
              return false;
            }
            $axios.post('/collectTask/isTrigger', data).then((res) => {
              if (res.data.state) {
                if (data.collectDeviceList && data.collectDeviceList.length > 0) {
                  vm.bloomAdd = false;
                  vm.selectedEmailList = [];
                  $axios.post('/collectTask/saveCollectTask', data, {
                    data: [{name: data.collectTask.taskName}],
                    logTemplate: '添加|定时稽核>稽核任务(#name#)'
                  }).then((res) => {
                    if (res.data === '1') {
                      vm.$message({
                        type: 'info',
                        message: '新增稽核任务成功'
                      });
                      vm.getList();
                    } else {
                      vm.$message.error('新增稽核任务失败');
                    }
                  });
                } else {
                  vm.$refs['auditAdd'].activeName = '2';
                  vm.$message.error('请添加稽核对象')
                }
              } else {
                this.$message.error(res.data.errorMsg);
              }
            })
          })
        })
      },
      editOk () {
        let vm = this
        let collectDeviceList = vm.$refs['auditEdit'].collectDeviceList.map(function (value) {
          return {
            accountUuid: value.accountUuid,
            deviceUuid: value.deviceUuid,
            portUuid: value.portUuid,
            uuid: value.uuid
          }
        })
        for (let i = 0; i < collectDeviceList.length; i++) {
          let obj = collectDeviceList[i];
          if (obj.portUuid) {
            if (obj.accountUuid) {
            } else {
              vm.$refs['auditEdit'].activeName = '2';
              this.$message({
                message: '稽核对象的资产账号未选择',
                type: 'error'
              });
              return
            }
          } else {
            vm.$refs['auditEdit'].activeName = '2';
            this.$message({
              message: '稽核对象的协议名未选择',
              type: 'error'
            });
            return
          }
        }
        let infoSendMode = vm.$refs.auditEdit.listEmail;
        if (vm.$refs.auditEdit.openEmail === false) {
          infoSendMode = [];
        }
        for (let i = 0; i < infoSendMode.length; i++) {
          infoSendMode[i].sendMode = 2;
        }
        let newForm = this.formattScheduleTime(vm.$refs['auditEdit'].collectTask)
        // 格式化
        let data = {
          collectTask: newForm,
          collectDeviceList: collectDeviceList,
          infoSendModeList: infoSendMode
        };
        this.$refs['auditEdit'].$refs['timeForm'].$refs['periodForm'].validate((validTime) => {
          if (!validTime) {
            vm.$refs['auditEdit'].activeName = '1';
            return false;
          }
          this.$refs['auditEdit'].$refs['addForm'].validate((valid) => {
            if (!valid) {
              vm.$refs['auditEdit'].activeName = '1';
              return false;
            }
            $axios.post('/collectTask/isTrigger', data).then((res) => {
              if (res.data.state) {
                if (data.collectDeviceList && data.collectDeviceList.length > 0) {
                  this.editDialog = false;
                  this.selectedEmailList = [];
                  $axios.post('/collectTask/updateCollectTask', data, {
                    data: [{name: data.collectTask.taskName}],
                    logTemplate: '编辑|定时稽核>稽核任务(#name#)'
                  }).then((res) => {
                    if (Number.parseInt(res.data) > 0) {
                      vm.$message.success('编辑稽核任务成功');
                      vm.getList();
                    }
                  });
                } else {
                  vm.$refs['auditEdit'].activeName = '2';
                  vm.$message.error('请添加稽核对象')
                }
              } else {
                this.$message.error(res.data.errorMsg);
              }
            })
          })
        })
      },
      openBloomAddObjectDialog (list) {
        this.bloomAddObjectDialog = true
        this.selectedObjectList = list
      },
      addObject () {
        this.bloomAddObjectDialog = false
        this.selectObjectsCache = this.$refs.objectCom.selectList
      },
      handleSelection (selection) {
        this.selectionList = selection
      },
      handleDeletes () {
        if (this.selectionList.length > 0) {
          this.deleteList = this.selectionList
          this.delDialog = true;
        } else {
          this.$message.warning('请至少选择一条数据')
        }
      },
      submitDelete () {
        let _self = this;
        _self.delDialog = false;
        let data = _self.deleteList.map(function (value) {
          return value.uuid
        })
        $axios.post('/collectTask/deleteCollectTask', data, {
          data: _self.deleteList,
          logTemplate: '删除|定时稽核>稽核任务(#taskName#)'
        }).then(function (response) {
          if (response.data === 'true') {
            _self.$message.success('删除成功')
            _self.getList()
          } else {
            _self.$message.error('删除失败')
          }
        })
      },
      addMyEmailOK() {
        this.$refs.addMyEmail.$refs.myEmailForm.validate((valid) => {
          if (valid) {
            let newEmail = this.$refs.addMyEmail.myEmailForm;
            this.selectedEmailList.push(newEmail);
            this.bloomMyEmail = false;
          } else {
            return false;
          }
        });
      },
      linkEmailOK() {
        this.selectedEmailList = this.$refs.linkEmail.selectedUser;
        for (let i = 0; i < this.selectedEmailList.length; i++) {
          if (!this.selectedEmailList[i].tmp) {
            if (!this.selectedEmailList[i].userName) {
              this.selectedEmailList[i].userName = this.selectedEmailList[i].userRealName;
            }
            if (!this.selectedEmailList[i].userEmail) {
              this.selectedEmailList[i].userEmail = this.selectedEmailList[i].userMail;
            }
            if (!this.selectedEmailList[i].userUuid) {
              this.selectedEmailList[i].userUuid = this.selectedEmailList[i].uuid;
            }
          }
        }
        this.bloomLink = false;
      },
      formatTime (val) {
        function addZero (t) {
          return t > 9 ? t : '0' + t
        }

        if (Object.prototype.toString.apply(val).indexOf('Date') !== -1) {
          let year = val.getFullYear()
          let month = addZero(val.getMonth() + 1)
          let date = addZero(val.getDate())
          let hour = addZero(val.getHours())
          let minutes = addZero(val.getMinutes())
          let second = addZero(val.getSeconds())
          return year + '-' + month + '-' + date + ' ' + hour + ':' + minutes + ':' + second;
        }
        return '';
      }
    },
    created() {
      this.getList()
    },
    watch: {
      bloomAdd(val) {
        if (!val) {
          this.selectedEmailList = [];
        }
      }
    }
  }
</script>
