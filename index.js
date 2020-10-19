const cheerio = require('cheerio')
const fs = require('fs');
const _ = require('lodash');
const parse = require('./lib/parsevue');
const utils = require('./lib/checks');
const ArgumentParser = require('argparse').ArgumentParser;

function checkValue(value) {
  let result = '\'\'';
  if(_.isArray(value) && value.length === 0) {
    result = '[]';
  }
  if(_.isPlainObject(value)) {
    result = '{}';
  }
  if(_.isNull(value)) {
    result = 'null';
  }
  if(_.isNumber(value)) {
    result = String(value);
  }
  if(_.isBoolean(value)){
    result = String(value);
  }
  return result;
}
function getTemplateData(_configContent) {
  const $ = cheerio.load(_configContent);
  let scriptStr = $('script').html();
  let templateStr = $('template').html();
  // 用于传给模板的数据
  let templateData = {};
  let vueObject = parse(scriptStr);
  if (vueObject.props) {
    let props = {}
    Object.keys(vueObject.props).forEach((item) => {
      if (!vueObject.props[item].type) {
        props[item] = checkValue(vueObject.props[item]());
      } else {
        props[item] = checkValue(vueObject.props[item].type());
        if(vueObject.props[item].default) {
          if (_.isFunction(vueObject.props[item].default)) {
            props[item] = checkValue(vueObject.props[item].default());
          } else {
            props[item] = checkValue(vueObject.props[item].default);
          }
        }
      }
    });
    templateData.props = props;
  }
  if (vueObject.components) {
    templateData.components = vueObject.components; // 所有组件
  }
  let comp = utils.checkComp(templateStr, vueObject);
  templateData = _.merge(templateData, comp);
  templateData.tabIndexNameFlag = utils.checkTabIndexName(vueObject); //是否有tabIndexName方法
  templateData.noBtnFlag = utils.checkNoBtn(templateStr);
  templateData.judgeRoleBtnFlag = utils.checkJudgeRoleBtn(templateStr);
  let useData = utils.checkStoreUserData(scriptStr);
  templateData = _.merge(templateData, useData);
  let ajaxUrl = utils.checkAjaxUrl(scriptStr);
  templateData = _.merge(templateData, ajaxUrl);
  return templateData;
}

var parser = new ArgumentParser({
  add_help: true,
  description: 'SiCAP单元测试代码编写辅助程序'
});

parser.add_argument(
  '-f',
  '--file',
  {
    help: '传入文件名',
    type: 'str'
  }
);
var args = parser.parse_args();
if (!args.file) {
  console.error(`请在执行命令时传入文件名 示例如下：
  node index.js -f filename`);
} else {
  let fileAry = args.file.split('.');
  if (fileAry[1] === 'vue') {
    let ary = [];
    let basePathLength = args.file.split('/src/')[1].split('/').length;
    for (let i = 0; i < basePathLength; i++) {
      ary.push('../');
    }
    let basePath = ary.join('');
    let filename = fileAry[0].split('/').pop();
    let testPath = fileAry[0].replace(filename, '__test__');
    let _configContent = fs.readFileSync(args.file, 'utf-8');
    let templateString = fs.readFileSync('./template.spac.js', 'utf-8')
    let compiled = _.template(templateString);
    let result = compiled({ basePath: basePath, 'filename': filename, 'data': getTemplateData(_configContent) });
    var reg = /\n(\n)*( )*(\n)*\n/g;
    // 清理空行
    var resultStr = result.replace(reg,"\n").replace(/<!---->/g, "\n");
    // console.log(resultStr);
    if (fs.existsSync(testPath)) {
      console.info('单元测试目录存在');
    } else {
      fs.mkdirSync(testPath);
      console.info('单元测试目录创建成功！');
    }
    fs.writeFileSync(testPath + `/${filename}.spec.js`, resultStr)
    console.info('单元测试文件创建成功！');
  } else {
    console.error('请传入正确的vue文件路径');
  }
}


