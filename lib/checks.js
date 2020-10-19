const cheerio = require('cheerio')
// 判断某些特殊组件是否存在
function checkComp(templateStr, vueObject) {
    let $t = cheerio.load(templateStr);
    let realPageTableUrls = [];
    // 判断RealPageTable组件是否存在
    if ($t('RealPageTable').length > 0) {
        let ajaxObj = $t('RealPageTable').eq(0).attr(':ajax-obj');
        realPageTableUrls.push(vueObject.data()[ajaxObj].url);
    }

    let buttonSetFlag = false;
    // 遍历下一级template找到button-set
    if ($t('template').length > 0) {
        for (let i = 0; i < $t('template').length; i++) {
            let oneTempStr = $t('template').eq(i).html();
            let $template = cheerio.load(oneTempStr);
            if ($template('button-set').length > 0) {
                buttonSetFlag = true;
            }
        }
    }
    return {
        realPageTableUrls, // 真分页url
        buttonSetFlag      // button-set
    };
}

// 判断是否有tabIndexName使用了
function checkTabIndexName(vueObject) {
    let tabIndexNameFlag = false;
    if (typeof vueObject.data().activeTab !== 'undefined'
        && vueObject.created && vueObject.created.toLocaleString().indexOf('tabIndexName') !== -1) {
        tabIndexNameFlag = true;
    }
    return tabIndexNameFlag; //是否有tabIndexName方法
}

// 是否有noBtn
function checkNoBtn(templateStr) {
    let noBtnFlag = false;
    let noBtnRegex = /(?<=v-nobtn=").*(?=")/;
    if (noBtnRegex.test(templateStr)) {
        noBtnFlag = true;
    }
    return noBtnFlag;
}

// 是否有judgeRoleBtn('assetsManage_specialAttr')
function checkJudgeRoleBtn(templateStr) {
    let judgeRoleBtnFlag = false;
    if (templateStr.indexOf('judgeRoleBtn(') !== -1) {
        judgeRoleBtnFlag = true;
    }
    return judgeRoleBtnFlag;
}

// 是否有this.$store.getters.userData
function checkStoreUserData(scriptStr) {
    let templateData = {
        storeUserDataFlag: false
    };
    if (scriptStr.indexOf('this.$store.getters.userData') !== -1) {
        templateData.storeUserDataFlag = true;
        if (scriptStr.indexOf('this.$store.getters.userData.roleUuidsStr') !== -1) {
            templateData.storeUserDataRoleUuids = true;
        }
    }
    return templateData;
}

function checkAjaxUrl(scriptStr) {
    // 获取所有ajax
    let postAjaxAry = [];
    let postRegex1 = /(?<=axios\.post\(').*(?=')/g;
    if (scriptStr.match(postRegex1)) {
        postAjaxAry = scriptStr.match(postRegex1);
    }
    let postRegex2 = /(?<=axios\.post\(`).*(?=`)/g;
    if (scriptStr.match(postRegex2)) {
        scriptStr.match(postRegex2).forEach((item) => {
            if (item.indexOf('/${') !== -1) {
                postAjaxAry.push(item.split('/${')[0]);
            } else {
                postAjaxAry.push(item);
            }
        })
    }

    let getAjaxAry = [];
    let getRegex1 = /(?<=axios\.get\(').*(?=')/g;
    if (scriptStr.match(getRegex1)) {
        getAjaxAry = scriptStr.match(getRegex1);
    }
    let getRegex2 = /(?<=axios\.get\(`).*(?=`)/g;
    if (scriptStr.match(getRegex2)) {
        scriptStr.match(getRegex2).forEach((item) => {
            if (item.indexOf('/${') !== -1) {
                getAjaxAry.push(item.split('/${')[0]);
            } else {
                getAjaxAry.push(item);
            }
        })
    }
    
    return {
        postAjaxAry, // 获取所有post请求接口
        getAjaxAry   // 获取所有get请求接口
    }
  }

module.exports = {
    checkComp,
    checkTabIndexName,
    checkNoBtn,
    checkJudgeRoleBtn,
    checkStoreUserData,
    checkAjaxUrl
}