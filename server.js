var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if (!port) {
  console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
  process.exit(1)
}

var server = http.createServer(function (request, response) {
  var parsedUrl = url.parse(request.url, true)
  var pathWithQuery = request.url
  var queryString = ''
  if (pathWithQuery.indexOf('?') >= 0) { queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
  var path = parsedUrl.pathname
  var query = parsedUrl.query
  var method = request.method

  /******** 从这里开始看，上面不要看 ************/

  console.log('有个傻子发请求过来啦！路径（带查询参数）为：' + pathWithQuery)
  //下面设置一个静态服务器，只要是支持的fileType，都可以在页面正确的显示以及正确设置Content-Type

  const session = JSON.parse(fs.readFileSync('./session.json').toString())

  if (path === "/sign_in" && method === 'POST') {
    const userArray = JSON.parse(fs.readFileSync('./db/users.json'))
    const array = []
    request.on('data', (chunk) => {
      array.push(chunk)
    })
    //声明一个空数组，监听request(请求)的data事件（上传事件）。每上传一点数据，就往array中push一小段数据。
    request.on('end', () => {
      const string = Buffer.concat(array).toString()
      //Buffer.concat()方法用于将给定数组中的所有缓冲区对象合并为一个缓冲区对象。
      const obj = JSON.parse(string)//string变成object
      const user = userArray.find((user) => user.name === obj.name && user.password === obj.password)
      if (user === undefined) {
        response.statusCode = 400
        response.setHeader('Content-Type', 'text/json;charset=utf-8')
      } else {
        response.statusCode = 200
        const random = Math.random()
        session[random] = { user_id: user.id }
        fs.writeFileSync('./session.json', JSON.stringify(session))
        response.setHeader("Set-Cookie", `session_id=${random}; HttpOnly`)
        //cookie是服务器下发给浏览器的一段字符串。当用户发起二级域名请求时，浏览器必须附上cookie才能成功跳转。
        //意思是用户用账号密码登录打开home页面和不使用账号密码打开home页面的Request URL是一样的都能进入，这是不行的。服务器用cookie作为门票来判断，有门票才能进。
        //HttpOnly是为了使前端无法操作cookie。防止前端扰乱cookie也防止用户篡改
      }
      response.end()
    })
  } else if (path === '/home.html') {
    const cookie = request.headers['cookie']
    let sessionId
    try {
      sessionId = cookie
        .split(';')
        .filter(s => s.indexOf('session_id=') >= 0)[0]
        .split('=')[1]
    } catch (error) { }
    if (sessionId && session[sessionId]) {
      const userId = session[sessionId].user_id
      const userArray = JSON.parse(fs.readFileSync('./db/users.json'))
      const user = userArray.find(user => user.id === userId)
      const homeHtml = fs.readFileSync('./public/home.html').toString()
      let string = ''
      if (user) {
        string = homeHtml.replace("{ { loginStatus } }", "已登录")
          .replace('{ { user.name } }', user.name)
      }
      response.write(string)
    } else {
      const homeHtml = fs.readFileSync('./public/home.html').toString()
      const string = homeHtml.replace("{ { loginStatus } }", "未登录")
        .replace('{ { user.name } }', '')
      response.write(string)
    }
    response.end()
  } else if (path === "/register" && method === 'POST') {
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    const userArray = JSON.parse(fs.readFileSync('./db/users.json'))
    const array = []
    request.on('data', (chunk) => {
      array.push(chunk)
    })
    //声明一个空数组，监听request(请求)的data事件（上传事件）。每上传一点数据，就往array中push一小段数据。
    request.on('end', () => {
      const string = Buffer.concat(array).toString()
      //Buffer.concat()方法用于将给定数组中的所有缓冲区对象合并为一个缓冲区对象。
      const obj = JSON.parse(string)//string变成object
      const lastUser = userArray
      [userArray.length - 1]
      const newUser = {
        id: lastUser ? lastUser.id + 1 : 1,//id为最后一个用户的id+1
        name: obj.name,
        password: obj.password
      }
      userArray.push(newUser)
      fs.writeFileSync('./db/users.json', JSON.stringify(userArray))
      response.end()
    })
  } else {
    response.statusCode = 200
    const filePath = path === '/' ? '/index.html' : path
    //默认首页。如果文件路径是 / 。默认是 /index.html，否则是输入的路径
    const index = filePath.lastIndexOf('.')
    //lastIndexOf() 方法返回字符串中指定值最后一次出现的索引（下标）。没有返回 -1
    const suffix = filePath.substring(index)
    //suffix：后缀
    //substring() 方法返回字符串的子字符串
    const fileType = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.png': 'image/png',
      '.jpg': 'image/jpeg'
    }
    //用哈希表将'.js' '.css' '.html'等变成'text/js' 'text/css' 'text/html'...
    response.setHeader('Content-Type', `${fileType[suffix] || 'text/html'};charset=utf-8`)
    let content
    try {
      content = fs.readFileSync(`./public/${filePath}`)
    } catch (error) {
      content = '文件不存在'
      response.statusCode = 404
    }
    response.write(content)
    response.end()
  }


  /******** 代码结束，下面不要看 ************/
})

server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)