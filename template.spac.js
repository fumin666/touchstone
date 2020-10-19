import {shallowMount, createLocalVue, mount, config} from '@vue/test-utils'
import flushPromises from 'flush-promises'
import Sunflower from 'vue-sunflower'
import { merge } from 'lodash'
import <%=filename%> from '../<%=filename%>';
import axios from '<%=basePath%>__mocks__/sunflower-ajax'
<%if(data.realPageTableUrls.length !== 0) {%>import realPageTable from '<%=basePath%>__mocks__/RealPageTable'<%}%>
<%if(data.buttonSetFlag) {%>import buttonSetMock from '<%=basePath%>__mocks__/buttonSetMock'<%}%>

// 保证.toBeXX方法可用
import '@testing-library/jest-dom'
// 初始化
config.stubs.transition = false
// 关闭警告
config.showDeprecationWarnings = false
const localVue = createLocalVue();
localVue.use(Sunflower)
<%if (data.tabIndexNameFlag) {%>
function tabIndexName(tabNameArr) {
    let tabIndex = 0;
    return `pane${tabIndex + 1}`;
}
localVue.prototype.tabIndexName = tabIndexName;
<%}%>
<%if (data.judgeRoleBtnFlag) {%>
// 角色权限判断
function judgeRoleBtn(val) {
    return true;
}
localVue.prototype.judgeRoleBtn = judgeRoleBtn;
<%}%>
<%if (data.noBtnFlag) {%>
localVue.directive('noBtn', {
    inserted: function (el) {
    }
})
<%}%>
<!---->
function createWrapper(overrides) {
    const defaultMountingOptions = {
        propsData: {        // vue的属性
            <%if (data.props) {%>
            <%=JSON.stringify(data.props).replace(/\{/, '').slice(0, JSON.stringify(data.props).length - 2).replace(/\"/g, '').replace(/,/g, ',\n\t')%> 
            <%}%>
        },
        stubs: <%if (data.components) {%><%=JSON.stringify(data.components).replace(/\{/g, '{\n\t\t').replace(/\}/g, '\n\t},').replace(/\"/g, '').replace(/,/g, ',\n\t\t').replace(/RealPageTable:true/g,'RealPageTable:realPageTable(axios, \'' + data.realPageTableUrls[0] + '\')')%><%} else {%>{},<%}%>
        mocks: {
            <%if (data.storeUserDataFlag) {%>
            $store: {
                getters: {
                    userData: {
                        registerModelList: ["IAM_EXTEND","OMA","IMP","DBA","SIEM","WORKFLOW","AUTO","THREED"],
                        uuid: "829bf0c0-1d41-469d-90f3-a2e1bf9e7bb5"<%if(data.storeUserDataRoleUuids){%>,
                        roleUuidsStr: "tsecondroleinfo00000000000000001,tsecondroleinfo00000000000000002,tsecondroleinfo00000000000000003,tsecondroleinfo00000000000000004,tsecondroleinfo00000000000000005,tsecondroleinfo00000000000000008,tsecondroleinfo00000000000000009,tsecondroleinfo00000000000000010,tsecondroleinfo00000000000000012,tsecondroleinfo00000000000000014,tsecondroleinfo00000000000000015,tsecondroleinfo00000000000000016,tsecondroleinfo00000000000000017,tsecondroleinfo00000000000000018,tsecondroleinfo00000000000000019,tsecondroleinfo00000000000000020,tsecondroleinfo00000000000000021,tsecondroleinfo00000000000000026,tsecondroleinfo00000000000000027,tsecondroleinfo00000000000000028,tsecondroleinfo00000000000000029,tsecondroleinfo00000000000000030,tsecondroleinfo00000000000000031,tsecondroleinfo00000000000000032,tsecondroleinfo00000000000000037,tsecondroleinfo00000000000000038,tsecondroleinfo00000000000000039,tsecondroleinfo00000000000000040,tsecondroleinfo00000000000000041,tsecondroleinfo00000000000000042,tsecondroleinfo00000000000000043,tsecondroleinfo00000000000000044"
                        <%}%>
                    }
                }
            }
            <%}%>
        },
      localVue
    };
    return mount(<%=filename%>, merge(defaultMountingOptions, overrides))
}
<!---->
describe('<%=filename%>.vue', () => {
    beforeEach(() => {
        <%if(data.postAjaxAry.length !== 0){%>
        axios.post.mockImplementation((url) => {
            <%_.each(data.postAjaxAry, function (item) { %>
            if (url.indexOf('<%=item%>') !== -1) {
                return Promise.resolve({
                    status: 200,
                    data: {}
                });
            }
            <% });%>
        });
        <%}%>
        <%if(data.getAjaxAry.length !== 0){%>
        axios.get.mockImplementation((url) => {
            <%_.each(data.getAjaxAry, function (item) { %>
            if (url.indexOf('<%=item%>') !== -1) {
                return Promise.resolve({
                    status: 200,
                    data: {}
                });
            }
            <% });%>
        });
        <%}%>
    })
    <!---->    
    it('初始化', async () => {
        const wrapper = createWrapper({});
        await flushPromises();
        console.log(wrapper.html());
    });
});