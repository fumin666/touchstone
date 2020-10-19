# 试金石
> SiCAP单元测试代码编写辅助工具
# 思路整理
1. 读取整个vue文件进入程序
2. 通过cheerio读取script中代码
3. 通过cheerio读取template中代码
4. 通过正则匹配出所有ajax路径、获取其所有props、components
5. 判断一些特殊处理 
import buttonSet from 'sicap-tablebtn-set';           
import RealPageTable from 'sicap-realpage-table'      找到了
* 需要去template中找到 :ajax-obj="ajaxObjPass" 属性中的值 完成
* 在template中确定judgeRoleBtn是否使用
judgeRoleBtn('accountManage_accessRules')
* 在template中确定v-noBtn是否使用
v-noBtn => 
localVue.directive('noBtn', {
    inserted: function (el) {
    }
})
* 在script中确定 this.tabIndexName 是否使用 ✅

7. 将所有ajax请求打印出来。
8. 通过模板把数据打印出来。


node index.js -f /Users/suninfo/git_main_workspace/sicap-account-manage-page/src/pages/Account_ChangePassword/EditChangePassBase.vue

执行后，会在对应的目录中生成一个单元测试文件