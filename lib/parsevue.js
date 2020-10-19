module.exports = function parse(scriptStr) {
    let ValidatersSourceStr = `
        let Validaters = {
            Max(num) {
                return { required: true, trigger: 'change' };
            },    
            NotNull: { required: true, trigger: 'blur' },
            SelectValNotNull: { required: true, trigger: 'change' },
            SelectArrNotNull: { required: true, trigger: 'change' },
            SelectNumNotNull: { required: true, trigger: 'change' },
            IpHybridRange: { required: true, trigger: 'change' },
            MobilePhone: { required: true, trigger: 'blur' },
            TelePhone: { required: true, trigger: 'blur' },
            Email: { required: true, trigger: 'blur' },
            omaIPV6: { required: true, trigger: 'blur' },
            OMAIP: { required: true, trigger: 'blur' }
        };
        `;
    // 获取组件，具体内容
    let componentsRegex = /(?<=components: {)[\s\S]*?(?=})/;
    let componentsAry = [];

    if (componentsRegex.test(scriptStr)) {
        let matchStr = scriptStr.match(componentsRegex)[0];
        let componentsSrouceAry = matchStr.split('\n');
        // 清理被注释掉的行
        let matchStrAry = componentsSrouceAry.filter((item) => {
            return (item.trim().length > 0 && item.trim().indexOf('//') === -1);
        });
        matchStrAry.forEach((item) => {
            componentsAry.push(item.replace(/\ +/g, "").replace(/[\r\n]/g, '').replace(/,/g, '').trim());
        });
    }
    // 说明vue中有使用到组件, 准备生成obj需要的变量
    let componentsAryStr = [];
    if (componentsAry.length > 0) {
        componentsAry.forEach((item) => {
            componentsAryStr.push(`let ${item}= true`)
        });
    }
    // mixin处理
    let mixinsRegex = /(?<=mixins: \[)[\s\S]*?(?=\])/;
    let mixinAry = [];
    if (mixinsRegex.test(scriptStr)) {
        mixinAry = scriptStr.match(mixinsRegex)[0].replace(/\ +/g, "").replace(/[\r\n]/g, '').trim().split(',')
    }
    let mixinAryStr = [];
    if (mixinAry.length > 0) {
        mixinAry.forEach((item) => {
            mixinAryStr.push(`let ${item}= true`)
        });
    }

    function cutsomJsonParse(obj) {
        return Function(`"use strict";${mixinAryStr.join(';') + ';'}${componentsAryStr.join(';') + ';'}${ValidatersSourceStr}return (` + obj + `)`)();
    }
    let vueRegex = /(?<=export default\s*{)[\s\S]*(?=})/g;

    let vueScriptStr = '{' + scriptStr.match(vueRegex)[0] + '}';
    // 生成一个对象
    try {
        return cutsomJsonParse(vueScriptStr);
    } catch (error) {
        console.log(error);
        return {};
    }
}