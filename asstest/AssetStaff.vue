<template>
  <s-row type="flex" :gutter="20" class="people-manage-box" style="height: calc(100vh - 250px);">
    <s-col :span="4" class="left-border">
      <section class="left-nav tree-box">
        <div class="tree-title" style="margin-bottom: 5px;">
          <i class="iconfont icon-organ"></i>
          <span>组织机构</span>
        </div>
        <s-scrollbar wrap-style="maxHeight:calc(100vh - 285px);" key="it" ref="treeScrollbar">
          <s-tree
                  :data="treeData"
                  :props="defaultProps"
                  node-key="uuid"
                  ref="stree"
                  default-expand-all
                  @node-click="handleNodeClick"
                  :expand-on-click-node="false"
                  :current-node-key="curNodeUuid"
                  :highlight-current="true">
          </s-tree>
        </s-scrollbar>
      </section>
    </s-col>
    <s-col class="right-table" :span="20">
      <s-scrollbar wrap-class="tab-scroll-height">
        <section class="fileList" style="margin-bottom: 20px">
          <s-form :inline="true" :model="searchForm" class="search_form" style="margin:10px 0" label-width='75px'>
            <div>
              <s-form-item label="真实姓名：">
                <s-input @keyup.enter.native="search" v-model="searchForm.userRealName"></s-input>
              </s-form-item>
              <s-form-item label="账号名称：">
                <s-input @keyup.enter.native="search" v-model="searchForm.userLoginName"></s-input>
              </s-form-item>
              <s-form-item label="所属机构：">
                <s-select v-model="searchForm.selectDepartUuid" filterable clearable>
                  <s-option v-for="i in departOptions" :key="i.uuid" :value="i.uuid" :label="i.departName"></s-option>
                </s-select>
              </s-form-item>
            </div>
            <div class="search_btn">
              <s-button icon='magnifier' @click="search">查询</s-button>
            </div>
          </s-form>
          <div style="margin-bottom: 10px">
            <s-button icon="plus" @click="add" v-noBtn="'accountManage_addUser'">添加</s-button>
            <s-dropdown>
              <s-button icon="backup" v-noBtn="'accountManage_batchOperation'">
                批量操作<i class="iconfont icon-bottom"></i>
              </s-button>
              <s-dropdown-menu slot="list">
                <s-dropdown-item @click.native="editBatch" v-noBtn="'accountManage_batchEditUser'">编辑</s-dropdown-item>
                <s-dropdown-item @click.native="del" v-noBtn="'accountManage_delUser'">删除</s-dropdown-item>
                <s-dropdown-item @click.native="importBatch" v-noBtn="'accountManage_importUser'">导入</s-dropdown-item>
                <s-dropdown-item @click.native="exportBatch" v-noBtn="'accountManage_exportUser'">导出</s-dropdown-item>
                <s-dropdown-item @click.native="batchDownloadCert" v-if="hasWebCerDownload">证书下载</s-dropdown-item>
              </s-dropdown-menu>
            </s-dropdown>
            <s-button icon="protocol" @click="batchCreate" v-noBtn="'accountManage_generateAccount'">一键生成账号</s-button>
            <s-button icon="account-audit" @click="openCreateAccount" v-noBtn="'accountManage_AccountGenerateConf'">
              账号生成规则配置
            </s-button>
            <s-button icon="import" @click="goto('AD')" v-noBtn="'accountManage_importAD'">AD域导入</s-button>
            <s-button icon="import" @click="goto('LDAP')" v-noBtn="'accountManage_importLDAP'">LDAP导入</s-button>
            <div class="fr">
              <!-- 动态列设置 -->
              <dynamic-column-set :dynamicData="setData" :option="option" @save="saveSetForm"
                                  style="display:inline-block">
                <s-button icon="nav-system-set" title="列设置" type="cancel" slot="click"></s-button>
              </dynamic-column-set>
            </div>
          </div>
          <s-row>
            <s-col :span="24">
              <RealPageTable id="peopleManageTable"
                             :ajax-obj="ajaxObj"
                             @selection-change="selectionChange"
                             @filter-change="filterType">
                <s-table-column type="selection" width="45" :selectable="isSelectable"></s-table-column>
                <s-table-column :key='index' v-for='(item, index) in setData'
                                v-if="item.viewFlag"
                                :label="item.columnName" show-overflow-tooltip>
                  <template slot-scope="scope">
                    <template v-if="item.columnKey.split('_')[0] === 'custom'">
                      <span v-text="scope.row.customProperty[item.columnKey]"></span>
                    </template>
                    <template v-else>
                      <span v-if="item.columnKey ==='userGender'">{{scope.row[item.columnKey] | filtersGender}}</span>
                      <span v-else-if="item.columnKey ==='idCard'">{{scope.row[item.columnKey] | capitalizeIdCard}}</span>
                      <span v-else-if="item.columnKey ==='userCellphone'">{{scope.row[item.columnKey] | capitalize}}</span>
                      <span v-else-if="item.columnKey ==='userAddress'">{{scope.row[item.columnKey] | capitalizeUserAddress}}</span>
                      <span v-else-if="item.columnKey ==='userWechat'">{{scope.row[item.columnKey] | capitalizeUserWechat}}</span>
                      <span v-text="scope.row[item.columnKey]" v-else></span>
                    </template>
                  </template>
                </s-table-column>
                <s-table-column label="操作" width="160" fixed="right">
                  <template slot-scope="scope">
                    <button-set :scope="scope" :btnData="btnData()" :option="tableOption"></button-set>
                  </template>
                </s-table-column>
              </RealPageTable>
            </s-col>
          </s-row>
        </section>
      </s-scrollbar>
    </s-col>

    <!--新增弹框-->
    <staff-add-dialog v-if="addDialogFlag"
                      :curUuid="curUuid"
                      v-model="addDialogFlag"
                      :staff="curStaff"
                      @reload="axiosList">
    </staff-add-dialog>
    <!--导入-->
    <import-dialog
      v-if="importDialogFlag"
      v-model="importDialogFlag"
      :upload-obj="uploadObj"
      :saveLog="true"
      :down-obj="downObj"
      @reload="axiosList"
      :fileTypes="['xls', 'xlsx']">
    </import-dialog>
    <!--权限弹出-->
    <s-dialog
      v-model="permissionDialog"
      v-if="permissionDialog"
      width="850px"
      title="权限视图">
      <permission-dialog :uuid="rowUuid"></permission-dialog>
    </s-dialog>
    <!--查看-->
    <s-dialog
      v-model="viewDialog"
      v-if="viewDialog"
      width="700px"
      title="查看">
      <view-dialog :viewObj="viewObj"></view-dialog>
    </s-dialog>
    <!--编辑-->
    <s-dialog
      v-model="editDialog"
      v-if="editDialog"
      width="700px"
      title="编辑">
      <edit-dialog :editObj="viewObj" ref="editDia"></edit-dialog>
      <template slot="footer" class="dialog-footer">
        <s-button @click="saveEdit">确定</s-button>
        <s-button type="cancel" @click="editDialog=false">取消</s-button>
      </template>
    </s-dialog>
    <s-dialog
      v-model="userExportDialog"
      v-if="userExportDialog"
      width="700px"
      title="设置导出的附件密码">
      <s-form :model="form" :rules="rules" ref="passwordForm" label-width="130px">
        <s-form-item label="附件密码" prop="password">
          <s-input v-model="form.password" type="password" placeholder="请输入附件密码"></s-input>
        </s-form-item>
        <s-form-item label="确认密码" prop="repassword">
          <s-input v-model="form.repassword" type="password" placeholder="请再输入一次附件密码"></s-input>
        </s-form-item>
      </s-form>
      <template slot="footer" class="dialog-footer">
        <s-button @click="dialogOk">确定</s-button>
        <s-button type="cancel" @click="userExportDialog=false">取消</s-button>
      </template>
    </s-dialog>
    <!--修改角色-->
    <s-dialog
      v-model="editRoleDialog"
      v-if="editRoleDialog"
      width="700px"
      title="角色选择">
      <edit-role-dialog :editObj="viewObj" ref="editRoleDia" :isUserIn="isUserIn"></edit-role-dialog>
      <template slot="footer" class="dialog-footer">
        <s-button @click="saveRoleEdit">确定</s-button>
        <s-button type="cancel" @click="editRoleDialog=false">取消</s-button>
      </template>
    </s-dialog>
    <!--批量编辑-->
    <s-dialog
      v-model="editBatchDialog"
      v-if="editBatchDialog"
      width="700px"
      title="批量编辑">
      <edit-batch ref="editBatchForm" :selections="selections"></edit-batch>
      <template slot="footer" class="dialog-footer">
        <s-button @click="batchEditSave">确定</s-button>
        <s-button type="cancel" @click="editBatchDialog=false">取消</s-button>
      </template>
    </s-dialog>
    <!--角色选择-->
    <s-dialog
      v-model="roleSelectDialog"
      v-if="roleSelectDialog"
      width="700px"
      title="角色选择">
      <role-select :userUuidList="uuidList" ref="roleDialog" :isUserIn="isUserIn"></role-select>
      <template slot="footer" class="dialog-footer">
        <s-button @click="createAccount">确定</s-button>
        <s-button type="cancel" @click="roleSelectDialog=false">取消</s-button>
      </template>
    </s-dialog>
    <!--账号生成规则配置-->
    <s-dialog
      v-model="createAccountDialog"
      v-if="createAccountDialog"
      width="700px"
      title="账号生成规则配置">
      <create-account @createAccountHandle="createAccountHandle"></create-account>
    </s-dialog>
  </s-row>
</template>

<script type="text/babel">
  import {roleCheckMixin} from 'sicap-mixins'
  import buttonSet from 'sicap-tablebtn-set';
  import RealPageTable from 'sicap-realpage-table'
  import dynamicColumnSet from 'sicap-dynamic-column-dialog'
  import $axios from 'sunflower-ajax';
  import staffAddDialog from './StaffAddDialog';
  import importDialog from '../Account_Organization/ImportDialog';
  import PermissionDialog from '../Account_Organization/AccountPermission';
  import viewDialog from './StaffViewDialog'
  import editDialog from './StaffEditDialog'
  import editRoleDialog from './StaffEditRoleDialog'
  import editBatch from './StaffBatchEditDialog'
  import roleSelect from './StaffRoleDialog'
  import CreateAccount from '../Account_SecuritySet/CreateAccountConfig.vue'
  import {cloneDeep} from 'lodash'
  import { Validaters, base64, Download } from 'sunflower-common-utils';

  export default {
    mixins: [roleCheckMixin],
    data() {
      return {
        addDialogFlag: false,
        permissionDialog: false,
        importDialogFlag: false,
        userExportDialog: false,
        editDialog: false,
        editRoleDialog: false,
        viewDialog: false,
        editBatchDialog: false,
        roleSelectDialog: false,
        createAccountDialog: false,
        rowUuid: '',
        treeData: [],
        curUuid: '',
        form: {
          password: '',
          repassword: ''
        },
        rules: {
          password: [Validaters.NotNull, Validaters.Max(999)],
          repassword: [Validaters.NotNull, Validaters.Max(999)]
        },
        defaultProps: {
          children: 'childrenList',
          label: 'name',
          id: 'uuid'
        },
        curNodeUuid: '',
        selections: [],
        searchForm: {
          userRealName: '',
          departUuid: '',
          selectDepartUuid: null,
          userWorkPosition: '',
          userLoginName: ''
        },
        curStaff: {},
        uploadObj: {},
        downObj: {},
        nowUserUuid: '',
        batchUuids: [],
        viewObj: {},
        departOptions: [],
        uuidList: [],
        userDataList: [],
        hasWebCerDownload: false,
        isUserIn: false, // 是否是应用人员
        ajaxObj: {
          type: 'post',
          url: '/iamUserInfo/getUserManagerListByCritia',
          params: {
            condition: {
              departUuid: '', // 树形机构
              selectDepartUuid: '', // 所属机构
              userRealName: '', // 真实姓名
              userLoginName: '' // 登录姓名
            }
          }
        },
        userGenderList: [0, 1, 2],
        option: {
          title: '列显示设置',
          key: 'uuid', // key
          nameKey: 'columnName', // 名字key
          showKey: 'viewFlag', // 是否显示key
          sortKey: 'columnIndex', // 排序key
          disabledKey: 'editFlag', // 能否编辑key
          width: '300',
          height: '500'
        },
        setData: [], // 动态列数据
        tableOption: {// 操作栏配置项
          isHidden: true, // 是否开启隐藏
          appendId: '#peopleManageTable',
          showNum: 3// 超过3ge隐藏
        }
      }
    },
    beforeDestroy() {
      this.$eventBus.$off('refreshManList');
    },
    created() {
      this.$eventBus.$on('refreshManList', () => {
        this.axiosList();
      });
      this.nowUserUuid = this.$store.getters.userData.uuid
      this.axiosTree(() => {
        this.axiosList();
      });
      $axios.get(`/iamUserInfo/getDepartList`).then(({data}) => {
        this.departOptions = data;
      });
      this.getHasWebCerDownload();
      this.getColData()
    },
    filters: {
      filtersGender(data) {
        switch (data) {
          case 0:
            return '保密'
          case 1:
            return '男'
          case 2:
            return '女'
        }
      },
      capitalize: (value) => {
        if (!value) return ''
        if (value.length > 3) {
          return value.substring(0, 3) + '****' + value.substring((value.length - 4), value.length)
        } else {
          return value
        }
      },
      capitalizeUserAddress: (value) => {
        if (!value) return ''
        if (value.length > 0) {
          return value.substring(0, 1) + '******'
        } else {
          return value
        }
      },
      capitalizeUserWechat: (value) => {
        if (!value) return ''
        if (value.length > 0) {
          return value.substring(0, 1) + '******'
        } else {
          return value
        }
      },
      capitalizeIdCard: (value) => {
        if (!value) return ''
        if (value.length > 0) {
          return value.substring(0, 1) + '****************' + value.substring(17, 18)
        } else {
          return value
        }
      }
    },
    methods: {
      isAdminAndSelf(uuid) {
        return this.isSystemAdmin && this.$store.getters.userData.uuid === uuid
      },
      isSelectable(row) {
        let flag;
        row.isAuthedAdmin === 1 ? flag = false : flag = true
        return flag
      },
      btnData() {
        let vm = this;
        return [
          {
            icon: 'eye',
            name: '查看',
            v_noBtn: 'accountManage_viewUser',
            handler: function (row, scope) {
              vm.rowView(row)
            }
          },
          {
            icon: 'edit',
            name: '编辑',
            v_noBtn: 'accountManage_editUser',
            handler: function (row, scope) {
              vm.rowEdit(row)
            }
          },
          {
            icon: 'delete',
            name: '删除',
            v_noBtn: 'accountManage_delUser',
            handler: function (row, scope) {
              vm.rowDel(row)
            },
            v_if: function (row, scope) {
              return row.uuid !== 'cu2704bbea9847d1b745e9e5d33d8732' && !vm.isAdminAndSelf(row.uuid)
            }
          },
          {
            icon: 'magnifier',
            name: '修改角色',
            v_noBtn: 'accountManage_editRole',
            handler: function (row, scope) {
              vm.rowEditRole(row);
            },
            v_if: function (row, scope) {
              return row.isUser !== null
            }
          },
          {
            icon: 'protocol',
            name: '生成账号',
            v_noBtn: 'accountManage_generateAccount',
            handler: function (row, scope) {
              vm.rowCreate(row);
            },
            v_if: function (row, scope) {
              return row.isUser === null
            }
          },
          {
            icon: 'psw-reset',
            name: '重置密码',
            v_noBtn: 'accountManage_repeatPw',
            handler: function (row, scope) {
              vm.resetPassWordHandler(row);
            },
            v_if: function (row, scope) {
              return row.isUser === 1
            }
          },
          {
            icon: 'view-authority',
            name: '权限视图',
            v_noBtn: 'accountManage_permView',
            handler: function (row, scope) {
              vm.viewPermissionHandler(row);
            },
            v_if: function (row, scope) {
              return row.isUser === 1
            }
          },
          {
            icon: 'download',
            name: '证书下载',
            handler: function (row, scope) {
              vm.downloadCert(row)
            },
            v_if: function (row, scope) {
              return this.hasWebCerDownload
            }
          }

        ]
      },
      // 获取动态列配置
      getColData() {
        $axios.get('/userDynamicList/getAll').then((res) => {
          this.setData = res.data;
        })
      },
      saveSetForm(data) {
        this.setData = data;
        $axios.post('/userDynamicList/updateColumnIndexs', {dynamicList: this.setData}, {
          logTemplate: '编辑|人员管理>动态列设置'
        }).then((res) => {
          if (res.data) {
            this.getColData()
            this.axiosList()
            this.$message({message: '保存成功', type: 'success'});
          } else {
            this.$message({message: '保存失败', type: 'error'});
          }
        });
      },
      filterType(obj) {
        this.userGenderList = obj.userGender;
        this.axiosList();
      },
      resetPassWordHandler(row) {
        this.$confirm('是否重置密码?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          $axios.get(`/iamUserInfo/passwordReset/${row.uuid}`, {
            data: [{userLoginName: row.userLoginName}],
            logTemplate: '重置密码|人员管理>账号(#userLoginName#)'
          }).then((res) => {
            if (res.data === 'true') {
              this.$message({
                type: 'success',
                message: '重置密码成功,当前密码:p@ssw0rd',
                duration: 5000
              });
            }
          });
        }).catch(() => {
        });
      },
      viewPermissionHandler(row) {
        this.permissionDialog = true;
        this.rowUuid = row.uuid;
      },
      goto(name) {
        if (this.$route.name === 'gradeProtect_dbRuleSet') {
          this.$router.push(`/GradeProtect/gradeProtect_dbRuleSet/importList/${name}`)
        } else {
          this.$router.push(`/AccountManage/orgTopo/importList/${name}`)
        }
      },
      handleNodeClick(nodeData) {
        this.curNodeUuid = nodeData.uuid;
        this.searchForm.userRealName = '';
        this.searchForm.userLoginName = '';
        this.searchForm.selectDepartUuid = null;
        this.axiosList();
      },
      search() {
        this.curNodeUuid = this.searchForm.selectDepartUuid ? this.searchForm.selectDepartUuid : this.treeData[0].uuid;
        this.$refs.stree.setCurrentKey(this.curNodeUuid);
        this.axiosList();
      },
      selectionChange(selections) {
        this.selections = selections;
        this.batchUuids = selections.map(item => item.uuid)
      },
      axiosList() {
        let params = {
          departUuid: this.curNodeUuid, // 树形机构
          selectDepartUuid: this.searchForm.selectDepartUuid, // 所属机构
          userRealName: this.searchForm.userRealName, // 真实姓名
          userLoginName: this.searchForm.userLoginName, // 账号名称
          userGenderList: this.userGenderList
        };
        this.ajaxObj.params.condition = cloneDeep(params);
      },
      axiosTree(callback = () => {
      }) {
        $axios.get('/departmentInfo/getAllDepartmentInfoForTree').then(({data}) => {
          this.treeData = data.treeNodeList;
          this.curNodeUuid = data.treeNodeList[0].uuid;
          this.$nextTick(function () {
            this.$refs.stree.setCurrentKey(data.treeNodeList[0].uuid)
          });
          callback();
        });
      },
      axiosDel(param, logData, logUser) {
        logUser.forEach(item => {
          this.$confirm('确定删除?', '提示', {confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'}).then(() => {
            $axios.post('/iamUserInfo/deleteUserInfoIncludeAccount', param, {
              data: logData,
              logTemplate: '删除|人员管理>人员(#userRealName#)'
            }).then(({data}) => {
              data.result = 'success';
              data.data.map(item => {
                if (!item.state) {
                  data.result = 'fail';
                  data.err = item.errormsg;
                }
              })
              if (data.result === 'success') {
                this.$message({type: 'success', message: '删除成功!'});
                this.selections = []
                this.axiosList();
              } else {
                if (data.result === 'fail') {
                  this.$message({type: 'error', message: data.err});
                  this.axiosList();
                }
              }
            });
          }).catch(() => {
          });
        })
      },
      // 顶部操作----------------------------------
      add() {
        this.curStaff = {};
        this.addDialogFlag = true;
        this.curUuid = this.curNodeUuid
      },
      del() {
        if (this.selections.length === 0) {
          this.$message({type: 'info', message: '请先选择人员!'});
          return;
        }
        let param = this.selections.map(item => {
          return item.uuid;
        });
        if (param.length === 1 && param[0] === this.$store.getters.userData.uuid) {
          this.$message({type: 'info', message: '不能删除自己的账号！'});
          return;
        }
        if (param.includes(this.$store.getters.userData.uuid)) {
          param.splice(this.$store.getters.userData.uuid, 1)
        }
        let logData = this.selections.map(list => {
          return {userRealName: list.userRealName, uuid: list.uuid};
        });
        let logUser = this.selections.map(list => {
          return {isUser: list.isUser};
        });
        this.axiosDel(param, logData, logUser);
      },
      importBatch() {
        this.uploadObj = {
          type: 'post',
          url: '/iamUserInfo/importUserInfo'
        };
        this.downObj = {
          text: '批量导入人员模板',
          url: '/iamUserInfo/importuserTemplate'
        };
        this.importDialogFlag = true;
      },
      exportBatch() {
        if (this.selections.length === 0) {
          this.$message({showClose: true, message: '请先选择人员', type: 'info'});
          return;
        }
        for (let key in this.form) {
          this.form[key] = ''
        }
        this.userExportDialog = true
      },
      dialogOk() {
        let encrypt = new base64()
        let form = this.$refs['passwordForm'];
        form.validate((valid) => {
          if (!valid) {
            return false;
          }
          let form = {...this.form};
          if (form.password !== form.repassword) {
            this.$message({showClose: true, message: '两次输入的密码必须一样', type: 'error'});
            return false;
          }
          let params = {
            userUuidList: []
          }
          params.userUuidList = this.selections.map(item => {
            return item.uuid;
          })
          form.password === '' ? form.password = '' : form.password = encrypt.encode(form.password)
          $axios.post('/iamUserInfo/exportUserInfoFirst', params).then(({data}) => {
            if (data) {
              Download(`/iamUserInfo/exportUserInfoSecond/${form.password}`)
              this.userExportDialog = false
            }
          });
        })
      },
      // 批量编辑
      editBatch() {
        if (this.selections.length === 0) {
          this.$message({message: '请先选择人员', type: 'info'});
          return;
        }
        this.editBatchDialog = true
      },
      batchCreate() {
        if (this.selections.length === 0) {
          this.$message({type: 'info', message: '请先选择人员!'});
          return;
        }
        this.uuidList = this.selections.map(list => list.uuid)
        this.userDataList = this.selections
        let isUserInArr = this.selections.filter(list => {
          return list.userClassify === 4
        })  // 是应用人员的数组
        if (isUserInArr.length) {
          this.isUserIn = true;
        } else {
          this.isUserIn = false;
        }

        let isUserArr = this.selections.filter(list => {
          return list.isUser === 1
        }) // 有账号的人员
        if (isUserArr.length) {
          this.$message({type: 'info', message: '所选行中不能包含已有账号的人员！'});
          return;
        }
        this.roleSelectDialog = true
      },
      rowCreate(arr) {
        this.uuidList = [arr.uuid];
        this.userDataList = [arr];
        if (arr.userClassify === 4) {
          this.isUserIn = true;
        } else {
          this.isUserIn = false;
        }
        this.roleSelectDialog = true
      },
      openCreateAccount() {
        this.createAccountDialog = true;
      },
      createAccountHandle() {
        this.createAccountDialog = false;
      },
      // 行内操作----------------------------------
      rowEdit(row) {
        $axios.post(`/iamUserInfo/getUserInfoDetailByUuid`, {userUuid: row.uuid}).then((res) => {
          this.viewObj = res.data;
          this.viewObj['isAdminAndSelf'] = this.isAdminAndSelf(row.uuid);
          this.editDialog = true;
        })
      },
      // 修改角色
      rowEditRole(row) {
        this.viewObj = row
        if (row.userClassify === 4) {
          this.isUserIn = true;
        } else {
          this.isUserIn = false;
        }
        this.viewObj['isAdminAndSelf'] = this.isAdminAndSelf(row.uuid);
        this.editRoleDialog = true;
      },
      rowDel(row) {
        this.axiosDel([row.uuid], [{userRealName: row.userRealName, uuid: row.uuid}], [{isUser: row.isUser}]);
      },
      rowView(row) {
        $axios.post(`/iamUserInfo/getUserInfoDetailByUuid`, {userUuid: row.uuid}).then((res) => {
          this.viewObj = res.data
          this.viewDialog = true;
        })
      },
      createAccount() {
        let arr = this.$refs['roleDialog'].staffForm
        let roleForm = this.$refs['roleDialog'].$refs['roleForm'];
        let form = {
          uuidList: this.uuidList,
          roleList: arr.sysRole,
          businessRoles: Object.keys(arr.sysRole1).length ? Object.values(arr.sysRole1).filter(function (item) {
            return item.roles.length
          }) : null
        }
        roleForm.validate((valid) => {
          if (!valid) {
            return false;
          }
          $axios.post('/iamUserInfo/getAutoAccount', form, {
            data: this.userDataList,
            logTemplate: '一键生成账号|人员管理>人员(#userRealName#)'
          }).then((res) => {
            if (res.data.result) {
              this.$message.success(res.data.message)
              this.axiosList()
            } else {
              this.$message.error(res.data.message)
            }
            this.roleSelectDialog = false
          })
        })
      },
      saveEdit() {
        let vm = this;
        let form = vm.$refs['editDia']
        let param = cloneDeep(form.staffForm)
        if (param.entryTime !== null) {
          param.entryTime = Date.parse(new Date(param.entryTime)) / 1000;
        }
        if (form.$refs['staffForm1'] && !form.$refs['staffForm2'] && !form.$refs['staffForm3']) {
          form.$refs['staffForm1'].validate(valid1 => {
            if (!valid1) {
              form.activeName = '1';
              vm.$message({message: '请正确填写信息!', type: 'warning'});
              return;
            }
            this.saveEditUrl(param)
          })
        } else if (form.$refs['staffForm1'] && !form.$refs['staffForm2'] && form.$refs['staffForm3']) {
          form.$refs['staffForm1'].validate(valid1 => {
            if (!valid1) {
              form.activeName = '1';
              vm.$message({message: '请正确填写信息!', type: 'warning'});
              return;
            } else {
              form.$refs['staffForm3'].validate(valid3 => {
                if (!valid3) {
                  form.activeName = '3';
                  vm.$message({message: '请正确填写信息!', type: 'warning'});
                  return;
                }
                this.saveEditUrl(param)
              })
            }
          })
        } else if (form.$refs['staffForm1'] && form.$refs['staffForm2'] && !form.$refs['staffForm3']) {
          form.$refs['staffForm1'].validate(valid1 => {
            if (!valid1) {
              form.activeName = '1';
              vm.$message({message: '请正确填写信息!', type: 'warning'});
              return;
            } else {
              form.$refs['staffForm2'].validate(valid2 => {
                if (!valid2) {
                  form.activeName = '2';
                  vm.$message({message: '请正确填写信息!', type: 'warning'});
                  return;
                }
                this.saveEditUrl(param)
              })
            }
          })
        } else {
          form.$refs['staffForm1'].validate(valid1 => {
            if (!valid1) {
              form.activeName = '1';
              vm.$message({message: '请正确填写信息!', type: 'warning'});
              return;
            } else {
              form.$refs['staffForm2'].validate(valid2 => {
                if (!valid2) {
                  form.activeName = '2';
                  vm.$message({message: '请正确填写信息!', type: 'warning'});
                  return;
                } else {
                  form.$refs['staffForm3'].validate(valid3 => {
                    if (!valid3) {
                      form.activeName = '3';
                      vm.$message({message: '请正确填写信息!', type: 'warning'});
                      return;
                    } else {
                      this.saveEditUrl(param)
                    }
                  })
                }
              })
            }
          })
        }
      },
      saveEditUrl(param) {
        $axios.post(`/iamUserInfo/updateUserInfo`, param, {
          data: [{name: param.userRealName}],
          logTemplate: '编辑|人员管理>人员(#name#)'
        }).then(({data}) => {
          if (data === 'true') {
            this.$message({message: '保存成功!', type: 'success'});
            this.axiosList()
            this.editDialog = false;
          } else {
            this.$message({message: '保存失败!', type: 'error'});
          }
        });
      },
      // 修改角色保存
      saveRoleEdit() {
        let form = this.$refs['editRoleDia']
        let arr = form.staffForm;
        form.$refs['staffForm'].validate(valid => {
          if (!valid) {
            return;
          }
          let param = {
            userRoles: arr.sysRole,
            businessRoles: Object.values(arr.sysRole1).filter(function (item) {
              return item.roles.length
            })
          }
          $axios.post(`/iamUserInfo/setUserAndBusinessRole/${arr.useruuid}`, param, {
            data: [{name: this.viewObj.userLoginName}],
            logTemplate: '编辑|人员管理>账号(#name#)'
          }).then(({data}) => {
            if (data.state === true) {
              this.$message({message: data.errormsg, type: 'success'});
              this.axiosList()
              this.editRoleDialog = false;
            } else {
              this.$message({message: data.errormsg, type: 'error'});
            }
          });
        });
      },
      batchEditSave() {
        let vm = this
        let uuids = this.selections.map(list => list.uuid)
        let logData = this.selections.map(list => {
          return {userRealName: list.userRealName};
        });
        let addForm = vm.$refs['editBatchForm'].staffForm;
        if (addForm.userExpiryDateStr === 1) {
          addForm.userExpiryDateStr = null
        }
        let chooseObject = vm.$refs['editBatchForm'].chooseEditItem
        let infoForm = Object.assign({}, {stamp: 1}, addForm)
        for (let key in chooseObject) {
          if (!chooseObject[key]) {
            if (key.split('_')[0] === 'custom') {
              infoForm.customProperty[key] = undefined
            } else {
              infoForm[key] = undefined
            }
          }
        }
        if (infoForm.entryTime) {
          infoForm.entryTime = new Date(infoForm.entryTime).getTime() / 1000
        }
        if (infoForm.userGender) {
          infoForm.userGender = parseInt(infoForm.userGender)
        }
        let formDialog = this.$refs['editBatchForm']
        if (formDialog.$refs['staffForm3']) {
          formDialog.$refs['staffForm1'].validate(valid1 => {
            if (!valid1) {
              formDialog.activeName = '1';
              vm.$message({message: '请正确填写信息!', type: 'warning'});
              return;
            } else {
              formDialog.$refs['staffForm2'].validate(valid2 => {
                if (!valid2) {
                  formDialog.activeName = '2';
                  vm.$message({message: '请正确填写信息!', type: 'warning'});
                  return;
                } else {
                  formDialog.$refs['staffForm3'].validate(valid3 => {
                    if (!valid3) {
                      formDialog.activeName = '3';
                      vm.$message({message: '请正确填写信息!', type: 'warning'});
                      return;
                    } else {
                      $axios.post('/iamUserInfo/batchUpdateUserInfo', {
                        uuids: uuids,
                        iamUserInfo: infoForm
                      }, {
                        data: logData,
                        logTemplate: '编辑|人员管理>人员(#userRealName#)'
                      }).then((res) => {
                        if (res.data === 'true') {
                          vm.$message({
                            type: 'success',
                            message: '批量编辑成功!'
                          });
                          this.selections = []
                          this.editBatchDialog = false
                          vm.axiosList();
                        }
                      });
                    }
                  })
                }
              })
            }
          })
        } else {
          formDialog.$refs['staffForm1'].validate(valid1 => {
            if (!valid1) {
              formDialog.activeName = '1';
              vm.$message({message: '请正确填写信息!', type: 'warning'});
              return;
            } else {
              formDialog.$refs['staffForm2'].validate(valid2 => {
                if (!valid2) {
                  formDialog.activeName = '2';
                  vm.$message({message: '请正确填写信息!', type: 'warning'});
                  return;
                } else {
                  $axios.post('/iamUserInfo/batchUpdateUserInfo', {
                    uuids: uuids,
                    iamUserInfo: infoForm
                  }, {
                    data: logData,
                    logTemplate: '编辑|人员管理>人员(#userRealName#)'
                  }).then((res) => {
                    if (res.data === 'true') {
                      vm.$message({
                        type: 'success',
                        message: '批量编辑成功!'
                      });
                      this.selections = []
                      this.editBatchDialog = false
                      vm.axiosList();
                    }
                  });
                }
              })
            }
          })
        }
      },
      // 用户证书单个下载
      downloadCert(row) {
        Download(`webcert/downloadUserCert/${row.uuid}`)
      },
      // 批量下载用户证书
      batchDownloadCert() {
        let vm = this
        if (!vm.batchUuids || vm.batchUuids.length === 0) {
          vm.$message({
            type: 'warning',
            message: '请至少选择一位用户！'
          })
        } else {
          vm.$confirm('确定下载所选项？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            Download(`webcert/downloadUserCerts/${vm.batchUuids.join(',')}`)
          }).catch(() => {
            vm.$message({
              type: 'info',
              message: '已取消！'
            })
          })
        }
      },
      getHasWebCerDownload() {
        $axios.get('/webcert/hasCert').then(({data}) => {
          this.hasWebCerDownload = data
        })
      }
    },
    components: {
      RealPageTable,
      // SearchBox,
      staffAddDialog,
      importDialog,
      PermissionDialog,
      viewDialog,
      editDialog,
      editBatch,
      roleSelect,
      editRoleDialog,
      CreateAccount,
      buttonSet,
      dynamicColumnSet
    }
  }
</script>
<style lang="stylus">
  .tab-scroll-height
    max-height: calc(100vh - 200px)
    padding-right 15px
  .tree-box
    height: calc(100vh - 150px)
    margin-top 10px

    .s-tree-node-content
      line-height 30px

    .tree-title
      font-size 14px
      padding 12px


</style>

