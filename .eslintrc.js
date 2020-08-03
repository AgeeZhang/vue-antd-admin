module.exports = {
    "env": {
        "browser": true,
        "es2020": true,
        "node": true,
        "es6": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:vue/essential"
    ],
    "parserOptions": {
        "ecmaVersion": 11,
        "sourceType": "module"
    },
    "plugins": [
        "vue"
    ],
    "rules": {
        "no-unused-vars": 'off' //参数未使用报警处理
    }
};
