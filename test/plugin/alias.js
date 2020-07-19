const {join} = require("path");

exports.default = ({initWebpack}, {pro}) => {
    if (pro)
        initWebpack("*", config => {
            config.resolve.alias = {'firejsx/Hot': join(__dirname, "../../src/components/Hot.js")}
        })
}