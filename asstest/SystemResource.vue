<!--
 * @Author: mybells
 * @Version://Q1IAM模块功能增强
 * @Description:业务权限管理-》应用系统资源管理
 * @Date: 2020-02-12 09:41:00
 * @LastEditors: mybells
 -->

<template>
  <div class="assetProtocol">
    <s-row style="margin-bottom: 15px;">
      <s-form :inline="true" :model="form" class="search_form">
        <div>
          <s-form-item label="应用系统名称：">
            <s-input v-model="form.appName" placeholder="请输入" @keyup.enter.native="searchList"></s-input>
          </s-form-item>
          <s-form-item label="Client_Id：">
            <s-input v-model="form.clientId" placeholder="请输入" @keyup.enter.native="searchList"></s-input>
          </s-form-item>
        </div>
        <div class="search_btn">
          <s-button icon="magnifier" title="查询" @click="searchList">查询</s-button>
        </div>
      </s-form>
    </s-row>
    <s-row style="margin-bottom: 10px;">
      <s-button @click="add" >添加</s-button>
      <s-button @click="batchDel" >批量删除</s-button>
    </s-row>
    <s-row>
      <RealPageTable :ajax-obj="ajaxObj" @selection-change="selection" :callback="handleData">
        <s-table-column type="selection" width="45"></s-table-column>
        <s-table-column label="应用系统名称" prop='appName'></s-table-column>
        <s-table-column label="Client_Id" prop="clientId" show-overflow-tooltip></s-table-column>
        <s-table-column label="授权范围" prop="scope" show-overflow-tooltip></s-table-column>
        <s-table-column label="令牌类型" prop="grantTypes" show-overflow-tooltip></s-table-column>
        <s-table-column label="回调地址" prop="redirectUris" show-overflow-tooltip></s-table-column>
        <s-table-column label="状态" prop="status" show-overflow-tooltip>
          <template slot-scope="scope">
            <s-switch v-model="scope.row.status" @change="statusChange(scope.row)" size="small" :active-value="1" :inactive-value="0"></s-switch>
          </template>
        </s-table-column>
        <s-table-column label="操作" align="center" width="150">
          <template slot-scope="scope">
            <i class="iconfont icon-eye" @click="eye(scope.row)" title="查看" ></i>
            <i class="iconfont icon-edit" @click="rowEdit(scope.row)" title="编辑" ></i>
            <i class="iconfont icon-delete" @click="rowDel(scope.row)" title="删除" ></i>
            <!-- <i class="iconfont icon-protocol" @click="rowGoto(scope.row)" v-if="this.isSystemAdmin" title="访问" :disabled="!scope.row.status"></i> -->
          </template>
        </s-table-column>
      </RealPageTable>
    </s-row>
    <!-- add or edit -->
    <AddResourceDialog v-if="dialogOpenFlag" :dialogOpenFlag.sync="dialogOpenFlag" :currentRow="currentRow" @reload="axiosList"></AddResourceDialog>
    <!-- eye -->
    <EyeResourceDialog v-if="viewDialog" :viewDialog.sync="viewDialog" :currentRow="currentRow"></EyeResourceDialog>
  </div>
</template>

<script>
  import AddResourceDialog from './SystemResourceDialog/AddResourceDialog.vue'
  import EyeResourceDialog from './SystemResourceDialog/EyeResourceDialog.vue'
  import $axios from 'sunflower-ajax';
  import RealPageTable from 'sicap-realpage-table'

  export default {
    components: {
      RealPageTable,
      EyeResourceDialog,
      AddResourceDialog
    },
    data() {
      return {
        dialogOpenFlag: false,
        viewDialog: false,
        ajaxObj: {
          type: 'post',
          url: '/oauthClient/getOauthClientList',
          params: {
            condition: {
            }
          }
        },
        form: {
          appName: null,
          clientId: null
        },
        currentRow: null,
        selectionArr: []
      }
    },
    mounted() {
      this.axiosList();
    },
    methods: {
      handleData(data) {
        data.pageList.forEach(item => { item.uuid = item.clientId })
        return data.pageList;// 返回表格数据数组
      },
      statusChange(row) {
        $axios.post(`/oauthClient/updateClientStatus/${row.status}`, [row.clientId], {
          data: [row],
          logTemplate: '编辑|应用系统资源管理>应用系统(#appName#)状态'
        }).then(res => {
          if (res.data.state) {
            this.$message({message: '状态修改成功', type: 'success'})
            this.axiosList()
          } else {
            this.$message({message: res.data.errormsg, type: 'error'})
          }
        })
      },
      selection(arr) {
        this.selectionArr = arr;
      },
      /* 获取列表 */
      axiosList() {
        let params = {
          clientId: this.form.clientId,
          appName: this.form.appName
        }
        this.ajaxObj.params.condition = params;// 请求接口
      },
      /* 查询 */
      searchList() {
        this.axiosList();
      },
      add() {
        this.currentRow = null;
        this.dialogOpenFlag = true;
      },
      rowEdit(row) {
        this.currentRow = row;
        this.dialogOpenFlag = true;
      },
      eye(row) {
        this.currentRow = row;
        this.viewDialog = true
      },
      batchDel() {
        this.axiosDel(this.selectionArr);
      },
      rowDel(row) {
        this.axiosDel([row]);
      },
      axiosDel(arr) {
        if (arr.length) {
          this.$confirm('确定删除?', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }).then(() => {
            $axios.post('/oauthClient/deleteOauthClient', arr.map(item => item.clientId), {
              data: arr,
              logTemplate: '删除|应用系统资源管理>应用系统(#appName#)'
            }).then(({data}) => {
              if (data.state) {
                this.$message({message: '删除成功!', type: 'success'});
                this.axiosList();
              } else {
                this.$message({message: data.errormsg, type: 'error'});
              }
            });
          }).catch(() => {});
        } else {
          this.$message({
            message: '请选择要删除的数据！',
            type: 'warning'
          });
        }
      },
      rowGoto(row) { // 访问
        // this.viewDialog = true
        // this.businnessForm = cloneDeep(row)
      }
    }
  }
</script>

<style lang="stylus">
</style>

