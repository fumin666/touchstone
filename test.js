// let regex = /([\s\S]*)/;
// let reg = /(?<=A)[\s\S]*(?=#A)/;
// let htmlTest= `A
// 123123123</p>
// <p>455tgg#A`;
// console.log(htmlTest.match(reg));
// let jsonTest =`{
//         type: 'post',
//         url: '/operationAuth/getOperationAuthList',
//         params: {
//           condition: {
//             userRealName: '',
//             userLoginName: '',
//             departUuid: '',
//             itcompName: '',
//             itcompIp: '',
//             groupUuid: '',
//             authName: ''
//           }
//         }
//     }`; 
let sPeriod = true;
let objStr = `{
    components: {
      sPeriod,
    },
    data() {
      return {
        showPeriodItem: false,
        nowTimeType: 1,
        value: '',
        activeName: '1',
        collectTask: {
          taskName: '',
          isPeriod: 0,
          remark: '',
          tScheduleTime: {
            timeType: 1,
            day: 1,
            week: 1,
            month: 1,
            year: 1,
            dayOfWeek: [2],
            dayOfMonth: [1],
            monthOfYear: 1,
            isForever: 0,
            firstFireTime: undefined,
            endFireTime: undefined
          }
        },
        openEmail: false,
        listEmail: this.data,
        delEmail: [],
        formClient: {},
        collectDeviceList: [],
        multipleSelection: [],
        rules: {
          taskName: [
            {required: true, message: '不能为空', trigger: 'blur'},
            {max: 32, message: '最大长度为32', trigger: 'blur'}
          ],
          remark: [{max: 120, message: '不能超过120个字符', trigger: 'blur'}]
        },
        edit: false,
        firstPickerOptions: {},
        lastPickerOptions: {},
        wordText: ['日', '周', '月', '年']
      }
    },
    watch: {
      'collectTask.isPeriod': {
        handler: function (val) {
          val === 0 ? this.showPeriodItem = false : this.showPeriodItem = true
        },
        deep: true
      },
      selectObjects (val) {
        let _self = this;
        _self.collectDeviceList = _self.collectDeviceList.concat(val.map(function (item) {
          let value = cloneDeep(item)
          collectTaskFilter(value)
          _self.$set(value, 'accountUuid', value.accountInfoList && value.accountInfoList.length > 0 ? value.accountInfoList[0].uuid : '')
          _self.$set(value, 'deviceUuid', value.monitorItcomp.uuid)
          _self.$set(value, 'portUuid', value.tAssetsPortInfoList && value.tAssetsPortInfoList.length > 0 ? value.tAssetsPortInfoList[0].uuid : '')
          return value
        }));
      },
      defaultData: {
        handler (value) {
          let _self = this
          let val = cloneDeep(value)
          if (val.collectTask) {
            _self.edit = true
            _self.collectTask.uuid = ''
            val.collectTask.firstFireTime = val.collectTask.beginTime
            val.collectTask.beginTime = null
            val.collectTask.endFireTime = val.collectTask.endTime
            val.collectTask.endTime = null
            val.collectTask.creatTmeString = val.collectTask.creatTme
            val.collectTask.creatTme = null
            val.collectTask.lastTimeString = val.collectTask.lastTime
            val.collectTask.lastTime = null
            val.collectTask.nextTimeString = val.collectTask.nextTime
            val.collectTask.nextTime = null
            _self.collectTask = val.collectTask
            if (val.collectDeviceList) {
              _self.collectDeviceList = val.collectDeviceList.map(function (val) {
                collectTaskFilter(val)
                _self.$set(val, 'monitorItcomp', {})
                _self.$set(val.monitorItcomp, 'itcompName', val.deviceName)
                _self.$set(val.monitorItcomp, 'controlAdderss', val.ip)
                _self.$set(val.monitorItcomp, 'citypeName', val.deviceType)
                _self.$set(val.monitorItcomp, 'uuid', val.uuid)
                return val
              })
            } else {
              _self.collectDeviceList = []
            }
          }
          if (val.infoSendModeList && val.infoSendModeList.length > 0) {
            _self.openEmail = true;
            _self.listEmail = val.infoSendModeList;
          }
        },
        immediate: true
      },
      data(val) {
        this.listEmail = val;
      }
    },
    methods: {
      // 定义稽核对象表格查询
      defSearch() {
        return {
          width: 8,
          offset: 8,
          placeholder: '请输入资产名称、类型、IP地址查询',
          searchProps: ['monitorItcomp.itcompName', 'monitorItcomp.controlAdderss', 'monitorItcomp.citypeName']
        }
      },
      // 定义稽核对象表格表头操作
      defAction() {
        let _this = this
        return {
          width: 8,
          actions: [{
            name: '添加',
            icon: 'plus',
            click() {
              _this.handleAddObject()
            }
          }, {
            name: '删除',
            icon: 'delete',
            click() {
              _this.deleteList()
            }
          }]
        }
      },
      toTab(n) {
        this.activeName = n
      },
      isShow(val) {
        if (val.indexOf(this.nowTimeType) > -1) {
          return true
        } else {
          return false
        }
      },
      showNext(val) {
        this.nowTimeType = val
      },
      handleSelectionChange(rows) {
        this.multipleSelection = rows;
      },
      deleteList() {
        if (this.multipleSelection.length === 0) {
          this.$message({type: 'warning', message: '请至少勾选一条数据！'});
          return
        }
        for (let i = this.collectDeviceList.length - 1; i >= 0; i--) {
          let value = this.collectDeviceList[i];
          let index = this.multipleSelection.findIndex(el => {
            return value.deviceUuid === el.deviceUuid
          });
          if (index !== -1) {
            this.collectDeviceList.splice(i, 1)
          }
        }
      },
      handleAddObject () {
        this.$emit('open-object', cloneDeep(this.collectDeviceList));
      },
      getEmailActionsDef() {
        let vm = this;
        return {
          width: 24,
          actions: [{
            name: '手动增加',
            icon: 'plus',
            click() {
              vm.$emit('showEmailM');
            }
          }, {
            name: '添加引用',
            icon: 'link',
            click() {
              vm.$emit('showEmail');
            }
          }, {
            name: '删除引用',
            icon: 'delete',
            click() {
              if (vm.delEmail.length === 0) {
                vm.$message({type: 'info', message: '请选择要删除的引用'});
              } else {
                delDiffArray(vm.listEmail, vm.delEmail);
              }
            }
          }]
        }
      },
      handleEmailChange(val) {
        this.delEmail = val;
      }
    },
    props: {
      selectObjects: {
        type: Array,
        default: function () {
          return []
        }
      },
      defaultData: {
        type: Object,
        default: function () {
          return {}
        }
      },
      data: Array
    }
  }`;

 console.log(eval('(' + objStr + ')')) 
