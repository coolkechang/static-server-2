//获取数据库内容

const fs = require('fs')
//使用require('fs')载入fs模块.
//fs：文件系统

//读数据库
const usersString = fs.readFileSync('./db/users.json').toString()
const usersArray = JSON.parse(usersString)
console.log(usersArray)

//写数据库
const user3 = { "id": 3, "name": "niu", "password": "zzz" }
usersArray.push(user3)
const string = JSON.stringify(usersArray)
fs.writeFileSync('./db/users.json', string)