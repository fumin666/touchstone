const cheerio = require('cheerio')
var fs = require('fs');
const configFilePath = 'asstest/AssetAccount.vue';
let _configContent = fs.readFileSync(configFilePath, 'utf-8')
let html_content = _configContent;
const $ = cheerio.load(html_content);
let scriptStr = $('script').html();
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
// 获取所有post请求接口
console.log('获取所有post请求接口');
console.log(postAjaxAry);
console.log('----');
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
// 获取所有get请求接口
console.log('获取所有get请求接口');
console.log(getAjaxAry);
console.log('----');