let $axios = {};$axios.basePath = () => {return 'locahost:8080'};
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
let checkInt = (rule, value, callback) => {
    let reg = /^[1-9]\d*$/
    if (value && !reg.test(value)) {
        callback(new Error('请输入1-20的正整数'))
    } else if (value < 1 || value > 20) {
        callback(new Error('请输入1-20的正整数'))
    } else {
        callback()
    }
};