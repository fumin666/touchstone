<!--
 * @Description: In User Settings Edit
 * @Author: your name
 * @Date: 2019-09-27 19:13:52
 * @LastEditTime: 2020-08-25 14:27:25
 * @LastEditors: mybells
 -->
<!-- 资产账户 -->
<template>
  <div class="accountList">
    <s-row class="left-btn" v-show="!assetName" style="margin-bottom:10px;">
      <s-button icon="plus" @click="add"
                v-if="judgeRoleBtn('assetsManage_addAssetAccount') || judgeRoleBtn('assetsManage_omaAddAssetAccount')">
        添加
      </s-button>
      <s-button icon="batch-del" @click="del"
                v-if="judgeRoleBtn('assetsManage_batchDelAssetAccount') || judgeRoleBtn('assetsManage_omaBatchDelAccount')">
        批量删除
      </s-button>
      <s-button @click="batchImport" icon="import"
                v-if="judgeRoleBtn('assetsManage_importAssetAccount') || judgeRoleBtn('assetsManage_omaImportAssetAccount')">
        批量导入
      </s-button>
      <s-button @click="batchExport" icon="export"
                v-if="judgeRoleBtn('assetsManage_exportAssetAccount') || judgeRoleBtn('assetsManage_omaExportAssetAccount')">
        批量导出
      </s-button>
      <s-button @click="batchAsync" icon="union"
                v-if="judgeRoleBtn('assetsManage_batchSysnAssetAccount') || judgeRoleBtn('assetsManage_omaBatchSysnAssetAccount')">
        批量同步
      </s-button>
    </s-row>
    <s-table-page :data="filterAccountList"
                  max-height="500"
                  :row-actions='rowActionsDef()'
                  actions-col-width="250"
                  :row-class-name="tableRowClassName"
                  @selection-change="selectionChange">
      <s-table-column type="selection" width="45" show-overflow-tooltip v-if="!assetName">
      </s-table-column>
      <s-table-column prop="accountName" label="账号名称" show-overflow-tooltip>
      </s-table-column>
      <s-table-column prop="accountTypeStr" label="角色" show-overflow-tooltip>
      </s-table-column>
      <s-table-column prop="accountClassifyStr" label="账号分类" show-overflow-tooltip>
      </s-table-column>
      <s-table-column prop="attributeName" label="账号类型" show-overflow-tooltip>
      </s-table-column>
      <s-table-column prop="isAd" label="是否AD域账户" show-overflow-tooltip>
        <template slot-scope="scope">
          {{scope.row.isAd === 0 ? '否' : '是'}}
        </template>
      </s-table-column>
      <s-table-column prop="status" label="状态" show-overflow-tooltip>
        <template slot-scope="scope">
          {{getStatus(scope.row.status)}}
        </template>
      </s-table-column>
      <s-table-column label="操作" width="180" v-if="assetName">
        <template slot-scope="scope">
          <i class="iconfont icon-eye" @click="rowView(scope.row)" title="查看"></i>
        </template>
      </s-table-column>
    </s-table-page>

    <account-add-dialog v-if="addDialogFlag" v-model="addDialogFlag" ref="addAccount" :uuid='assUuid'
                        :asset-uuid="assetUuid" :cur-account="curAccount"
                        @accountSave="accountSave">
    </account-add-dialog>
    <!--添加资产账号-->
    <asset-account-dialog ref="assetAccountDialog"
                          v-model="assetAccountDialogFlag"
                          v-if="assetAccountDialogFlag"
                          :accountUuid="accountUuid"
                          :accountRow="accountRow"
                          @saveAsset="saveAsset"
                          :passKeyTitle="passKeyTitle">
    </asset-account-dialog>
    <!--查看资产账号-->
    <account-view-dialog v-model="accountViewDialogFlag"
                         v-if="accountViewDialogFlag"
                         :assetUuid="assetUuid"
                         @reload="reload"
                         :accountClassify="accountClassify"
                         :accountUuid="accountUuid">
    </account-view-dialog>
    <!--账号关联弹窗-->
    <s-dialog v-model="associatedDialogFlag" v-if="associatedDialogFlag" :title="associatedTitle" width="650px"
              ref="associatedDialog" append-to-body>
      <account-associated-dialog :associated="associated" :accountData="accountData"
                                 @closeAssociatedDialog="closeAssociatedDialog">
      </account-associated-dialog>
    </s-dialog>

    <s-dialog v-model="changePwdDialog" v-if="changePwdDialog" title="手动改密" width="650px" ref="changePwdDialog"
              append-to-body>
      <account-change-pwd :account="curAccount" @closeActChgPwdDialog="closeActChgPwdDialog"></account-change-pwd>
    </s-dialog>
    <import-dialog v-model="importOrgDialog" v-if="importOrgDialog" :uploadObj="uploadObj" :downObj="downObj"
                   :fileTypes='fileType'
                   @reload="getList"></import-dialog>
    <export-dialog v-if="exportDialogFlag" v-model="exportDialogFlag" @exportDialogOk="exportDialogOk"
                   @cancelDialog="cancelDialog"></export-dialog>
  </div>
</template>

<script>
  import $axios from 'sunflower-ajax';
  import {cloneDeep, isEmpty} from 'lodash';
  import {Download} from 'sunflower-common-utils'
  import accountAddDialog from '../AssetOtherDialog/AccountAddDialog';
  import accountViewDialog from '../AssetOtherDialog/AccountViewDialog';
  import assetAccountDialog from '../AssetOtherDialog/AssetAccountDialog';
  import accountAssociatedDialog from '../AssetOtherDialog/AccountAssociateDialog';
  import accountChangePwd from '../AssetOtherDialog/AccountChangePwd';
  import ImportDialog from 'sicap-import-dialog';
  import exportDialog from '../../../home/exportDialog';

  export default {
    data() {
      return {
        addDialogFlag: false,
        assUuid: '',
        exportDialogFlag: false,
        associatedDialogFlag: false, // 账号关联弹窗
        changePwdDialog: false,     // 手动(单次)改密弹框
        importOrgDialog: false,
        assetAccountDialogFlag: false, // 添加资产账号
        accountViewDialogFlag: false, // 查看资产账号
        accountList: [],
        selections: [],
        curAccount: {},
        associated: [], // 关联data
        accountData: {}, // 关联data
        associatedTitle: '', // 关联title
        roleOptions: [],
        assetInfo: {},
        assetUuid: '',
        fileType: ['xls', 'xlsx'],
        uploadObj: {
          url: '/assetsAccountInfo/importAccountInfo',
          type: 'get'
        },
        downObj: {
          url: '/assetsAccountInfo/importAccountInfoTemplate',
          text: '批量导入资产账户模板'
        },
        arr: [],
        accountUuid: '',
        accountRow: {},
        accountClassify: '', // 账号类型
        passKeyTitle: ''
      }
    },
    props: {
      isOma: {
        type: Boolean,
        default: false
      },
      assetName: {
        type: Boolean,
        default: false
      },
      addAssetUuid: {
        type: String,
        default: ''
      },
      curAsset: {
        type: Object,
        default() {
          return {}
        }
      },
      permission: {   // 表示是否有操作按钮的权限
        type: Boolean,
        default: false
      }
    },
    computed: {
      editAssetUuid() {
        if (this.$route.name === 'AssetsAll_assetEdit') {
          return this.$route.params.assetUuid;
        } else {
          return ''
        }
      },
      selectionUuids() {
        return this.selections.map(item => {
          return item.uuid;
        });
      },
      filterAccountList() {
        return this.accountList.filter(item => {
          return !(item.snmpCWordOr || item.snmpCWordRw);
        }).map(item => {
          item.attribute = item.attribute ? item.attribute + '' : '1';
          item.isBund = item.isBund ? item.isBund + '' : '0';
          return item;
        });
      }
    },
    watch: {
      assetUuid(val) {
        if (!val) return null;
        this.getAccountList(val);
        this.getAssetsInfo(val);
      }
    },
    created() {
      if (this.$route.name === 'AssetsAll_assetEdit') {
        this.assetUuid = this.editAssetUuid
      } else {
        this.assetUuid = this.addAssetUuid
      }
    },
    methods: {
      reload() {
        this.getList();
      },
      tableRowClassName(row) { // 操作按钮是否显示
        // let className = '';
        // if (row.accountTypeStr !== '数据库Linker') { // 数据库Linker
        //   className += 'dis-association '
        // }
        // if (row.passwordType === 1 || row.accountName === 'root_su') {
        //   className += 'dis-account-asset '
        // }
        // if (row.passwordType === 1 && row.keyType === 1) {
        //   className += 'show-download-key '
        // }
        // return className
      },
      // 是否显示下载密钥按钮
      showDownloadKey(row) {
        return (row.passwordType === 1 && row.keyType === 1);
      },
      // 是否显示密钥设置按钮
      showPasswordKeySet(row) {
        return (row.passwordType === 1);
      },
      getList() {
        this.getAccountList(this.assetUuid);
      },
      onchange(data) {
        this.$emit('onchange', data);
      },
      getStatus(status) {
        let name = '';
        switch (status) {
          case 0:
            name = '未激活'
            break;
          case 1:
            name = '激活'
            break;
          case 2:
            name = '锁定'
            break;
          case 3:
            name = '注销'
            break;
          default:
            break;
        }
        return name
      },
      saveAsset(again) {
        if (again) {
          this.handlerAdd();
        }
        this.getAccountList(this.assetUuid)
      },
      accountSave(param, isEdit, assetInfo, accountForm, isShowPassWord) {
        let urlTail = isEdit ? 'editAssetsAccountInfo' : 'saveAssetsAccountInfo';
        let option = {
          data: [{
            controlAdderss: assetInfo.controlAdderss ? assetInfo.controlAdderss + '/' + assetInfo.itcompName : assetInfo.itcompName,
            accountName: accountForm.accountName
          }],
          logTemplate: (isEdit ? '编辑' : '添加') + '|资产(#controlAdderss#)>资产账号(#accountName#)'
        }
        let vm = this;
        $axios.post(`/assetsAccountInfo/${urlTail}`, param, option).then(({data}) => {
          if (data.state === true) {
            if (isShowPassWord) {
              vm.$message({showClose: true, message: '保存成功', type: 'success'});
            } else {
              vm.accountUuid = data.errormsg
              vm.passKeyTitle = '添加资产账号'
              vm.assetAccountDialogFlag = true;
            }
            vm.getAccountList(this.assetUuid)
          } else {
            vm.$message({showClose: true, message: '保存失败', type: 'error'});
          }
          if (vm.$refs['addAccount']) {
            vm.$refs['addAccount'].isLoading = false;
            vm.$refs['addAccount'].$refs['accountForm'].clearValidate();
          }
        });
      },
      getAccountList(uuid) {
        // 获取资产账号列表
        $axios.get(`/assetsAccountInfo/viewAssetsAccountInfo/${uuid}`).then(({data}) => {
          this.accountList = data;
        });
      },
      getAssetsInfo(uuid) {
        // 获取账号角色下拉选项与资产详情
        $axios.get(`/assetsAccountInfo/getAssetsInfo/${uuid}`).then(({data}) => {
          this.assetInfo = data.assetsInfo;
          this.assetUuid = data.assetsInfo.uuid;
          this.roleOptions = data.assetsAccountTypeInit;
        });
      },
      // 顶部操作-------------------------------------------------------
      add() {
        if (this.addAssetUuid === '') {
          this.$message({showClose: true, message: '请先正确填写资产信息', type: 'warning'});
          return
        }
        this.handlerAdd();
      },
      handlerAdd() {
        this.curAccount = {};
        this.accountRow = {};
        this.addDialogFlag = true;
        this.assUuid = ''
      },
      del() {
        if (this.selections.length === 0) {
          this.$message({showClose: true, message: '请先选择资产账号', type: 'info'});
          return;
        }
        this.$confirm('确定删除?', '提示', {confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'}).then(() => {
          let arr = [];
          let newArr = [];
          this.selections.map((item) => {
            arr.push(item.uuid);
            let param = {
              controlAdderss: this.curAsset['controlAdderss'] ? this.curAsset['controlAdderss'] + '/' + item.assetName : item.assetName,
              accountName: item.accountName
            }
            newArr.push(param)
          })
          let option = {
            data: newArr,
            logTemplate: '删除|资产(#controlAdderss#)>资产账号(#accountName#)'
          }
          $axios.post('/assetsAccountInfo/batchDelAssetsAccountInfo', arr, option).then(({data}) => {
            if (data.result === 'success') {
              this.$message({showClose: true, message: '删除成功', type: 'success'});
              this.getAccountList(this.assetUuid)
            } else {
              this.$message({showClose: true, message: data.err, type: 'error'});
              this.getAccountList(this.assetUuid)
            }
          })
        }).catch(() => {
        });
      },
      // 表格相关--------------------------------------------------------------
      rowActionsDef() {
        let vm = this;
        if (this.assetName) {
          return [];
        }
        if (!this.isOma) {
          return [
            {
              icon: 'eye',
              name: '查看',
              show: (row) => {
                return vm.judgeRoleBtn('assetsManage_viewAssetAccount')
              },
              click: this.rowView
            },
            {
              icon: 'association',
              name: '关联',
              show: (row) => {
                return row.accountTypeStr === '数据库Linker'
              },
              click: this.rowAssociation
            },
            {
              icon: 'not-pass',
              name: '验证密码',
              click: this.notPass
            },
            {
              icon: 'edit',
              name: '编辑',
              show: (row) => {
                return vm.judgeRoleBtn('assetsManage_editAssetAccount')
              },
              click: this.rowEdit
            },
            {
              icon: 'account-asset',
              name: '手动改密',
              show: (row) => {
                return vm.judgeRoleBtn('assetsManage_manualModifyPw') && row.passwordType !== 1 && row.accountName !== 'root_su'
              },
              click: this.rowChangePwd
            },
            {
              icon: 'download',
              name: '下载公钥',
              show: (row) => {
                return vm.showDownloadKey(row) && vm.judgeRoleBtn('assetsManage_downloadKey')
              },
              click: this.rowDownloadKey
            },
            {
              icon: 'change-psw',
              name: '密钥设置',
              show: (row) => {
                return vm.showPasswordKeySet(row) && vm.judgeRoleBtn('assetsManage_keySet')
              },
              click: this.rowPasswordKeySet
            },
            {
              icon: 'union',
              name: '同步',
              show: (row) => {
                return vm.judgeRoleBtn('assetsManage_sysnAssetAccount')
              },
              click: this.rowAsync
            }, {
              icon: 'delete',
              name: '删除',
              show: (row) => {
                return vm.judgeRoleBtn('assetsManage_delAssetAccount')
              },
              click: this.rowDel
            }];
        } else {
          return [
            {
              icon: 'eye',
              name: '查看',
              show: (row) => {
                return vm.judgeRoleBtn('assetsManage_omaViewAssetAccount')
              },
              click: this.rowView
            },
            {
              icon: 'association',
              name: '关联',
              show: (row) => {
                return row.accountTypeStr === '数据库Linker'
              },
              click: this.rowAssociation
            },
            {
              icon: 'edit',
              name: '编辑',
              show: (row) => {
                return vm.judgeRoleBtn('assetsManage_omaEditAssetAccount')
              },
              click: this.rowEdit
            },
            {
              icon: 'account-asset',
              name: '手动改密',
              show: (row) => {
                return vm.judgeRoleBtn('assetsManage_omaManualModifyPw') && row.passwordType !== 1 && row.accountName !== 'root_su'
              },
              click: this.rowChangePwd
            },
            {
              icon: 'download',
              name: '下载公钥',
              show: (row) => {
                return vm.showDownloadKey(row) && vm.judgeRoleBtn('assetsManage_omaDownloadKey')
              },
              click: this.rowDownloadKey
            },
            {
              icon: 'change-psw',
              name: '密钥设置',
              show: (row) => {
                return vm.showPasswordKeySet(row) && vm.judgeRoleBtn('assetsManage_omaSecretKeySet')
              },
              click: this.rowPasswordKeySet
            },
            {
              icon: 'union',
              name: '同步',
              show: (row) => {
                return vm.judgeRoleBtn('assetsManage_omaSysnAssetAccount')
              },
              click: this.rowAsync
            }, {
              icon: 'delete',
              name: '删除',
              show: (row) => {
                return vm.judgeRoleBtn('assetsManage_omaDelAssetAccount')
              },
              click: this.rowDel
            }];
        }
      },
      nullFunc() {
        return null
      },
      notPass(row) {
        let loadingMsg = this.$message({
          type: 'info',
          duration: 0,
          showClose: false,
          message: '验证中，请稍候...'
        })
        $axios.get(`/assetsAccountInfo/checkAccountPwd/${row.uuid}`).then(({data}) => {
          loadingMsg.close()
          if (data.state === true) {
            this.$message.success(data.errormsg)
          } else {
            this.$message.error(data.errormsg)
          }
        });
      },
      selectionChange(selections) {
        this.selections = selections;
      },
      // 行内操作--------------------------------------------------------------
      rowEdit(row) {
        this.curAccount = Object.assign({}, row);
        this.assUuid = row.uuid
        this.addDialogFlag = true;
      },
      rowView(row) {
        this.accountClassify = row.accountClassify;
        this.accountUuid = row.uuid;
        this.accountViewDialogFlag = true;
      },
      rowAssociation(row) { // 打开关联窗口
        let vm = this
        $axios.get(`/linkAccount/getAllDatabaseProtoclByAccount/${row.uuid}`).then((res) => {
          $axios.get(`linkAccount/getDeviceAccountLinkByAccount/${row.uuid}`).then((result) => {
            if (isEmpty(result.data) === false) {
              vm.associated = cloneDeep(result.data);
              let portArr = {
                portOptions: res.data
              };
              vm.associated = Object.assign({}, result.data, portArr)
              vm.associatedTitle = `编辑${' '}数据库Linker账号关联操作 (Linker账号的账号名 : ${row.accountName})`;
            } else {
              this.associated = cloneDeep(res.data);
              vm.associatedTitle = `添加${' '}数据库Linker账号关联操作 (Linker账号的账号名 : ${row.accountName})`;
            }
          });
          vm.accountData = cloneDeep(row);
          vm.associatedDialogFlag = true;
        });
      },
      // 同步
      rowAsync(row) {
        this.$message({
          type: 'warning',
          message: '暂无对接资产'
        })
      },
      // 手动(单次)改密
      rowChangePwd(row) {
        this.curAccount = cloneDeep(row);
        this.changePwdDialog = true;
      },
      // 下载公钥
      rowDownloadKey(row) {
        this.$confirm('确定下载密钥?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          Download(`/assetsAccountInfo/downSshPublicKey/${row.uuid}`, {logTemplate: '资产账号|下载密钥(accountInfo.xls)'})
        }).catch(() => {
        });
      },
      rowPasswordKeySet(row) {
        this.accountUuid = row.uuid;
        this.accountRow = row;
        this.passKeyTitle = '密钥设置';
        this.assetAccountDialogFlag = true
      },
      // 关闭手动(单次)改密弹框
      closeActChgPwdDialog() {
        this.getAccountList(this.assetUuid);
        this.changePwdDialog = false;
      },
      // 关闭账号关联弹窗
      closeAssociatedDialog() {
        this.associatedDialogFlag = false;
        this.associatedTitle = ''
      },
      rowDel(row) {
        this.$confirm('确定删除?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          let option = {
            data: [{
              controlAdderss: this.curAsset['controlAdderss'] ? this.curAsset['controlAdderss'] + '/' + row.assetName : row.assetName,
              accountName: row.accountName
            }],
            logTemplate: '删除|资产(#controlAdderss#)>资产账号>账号(#accountName#)'
          }
          $axios.get(`/assetsAccountInfo/deleteAssetsAccountInfo/${row.uuid}`, option).then((res) => {
            if (res.data.result === 'success') {
              this.$message({showClose: true, message: '删除成功', type: 'success'});
              this.getAccountList(this.assetUuid)
            } else if (res.data.result === 'fail') {
              this.$message({showClose: true, message: res.data.err, type: 'error'});
            }
          });
        }).catch(() => {
        });
      },
      /* 批量同步 */
      batchAsync() {
        this.$message({
          type: 'warning',
          message: '暂无对接资产'
        })
      },
      batchImport() {
        if (this.addAssetUuid === '') {
          this.$message({showClose: true, message: '请先正确填写资产信息', type: 'warning'});
          return
        }
        this.importOrgDialog = true;
      },
      batchExport() {
        if (this.selections.length === 0) {
          this.$message({
            type: 'error',
            message: '请至少选择一条数据'
          })
        } else {
          this.exportDialogFlag = true
        }
      },
      exportDialogOk(form) {
        let params = {}
        params.assetUuidList = this.selections.map(item => item.uuid)
        $axios.post(`/assetsAccountInfo/exportAccountInfo`, params).then(({data}) => {
          if (data) {
            Download(`/assetsAccountInfo/exportAccountInfoTwo/${form.password}`);
            this.exportDialogFlag = false
          }
        });
      },
      cancelDialog() {
        this.exportDialogFlag = false
      }
    },
    components: {
      accountAddDialog,
      accountChangePwd,
      ImportDialog,
      accountAssociatedDialog,
      assetAccountDialog,
      accountViewDialog,
      exportDialog
    }
  }
</script>

<style lang="stylus">
  .accountList {
    .tool-bar {
      margin-top: 10px;
    }

    .underLine {
      text-decoration: underline;
      cursor: pointer;
    }

    .left-btn {
      margin-bottom: 10px;
    }

    .s-search-group {
      .s-select, .s-date-editor-datetimerange.s-input {
        width: 175px;
      }

      .s-form-item-label {
        text-align: center;
      }
    }

    /*不显示改按钮*/

    // .dis-association .icon-association {
    //   display: none;
    // }

    // .dis-account-asset .icon-account-asset {
    //   display: none;
    // }
  }
</style>
