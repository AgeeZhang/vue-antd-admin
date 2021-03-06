import axios from 'axios'
import { Modal, Message } from 'ant-design-vue'
import store from '@/store'
import { getToken } from '@/utils/auth'

//不需要鉴权的接口过滤
const notAuthUrl = ["/account/login"]

// 创建axios实例
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API,
  withCredentials: true, // 跨域请求时发送cookies
  timeout: 5000, // 超时时间
  headers: { 'Content-Type': 'application/json;charset=UTF-8' },
})

// request 拦截器（发出请求前处理）
service.interceptors.request.use(
  config => {
    if (store.getters.token && notAuthUrl.indexOf(config.url.request) == -1) {
      config.headers['Authorization'] = getToken()
    }
    return config
  },
  error => {
    console.log(error) // for debug
    return Promise.reject(error)
  }
)

// response 拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    // 状态码判定
    if (res.code !== 200) {
      if (res.code === 401) {
        Message.error("没有访问权限", 5)
      } else if (res.code === 403) {
        Modal.confirm({
          title: '确认注销',
          content: '您已注销，您可以取消以停留在此页，或重新登录',
          okText: '重新登录',
          cancelText: '取消',
          type: 'warning'
        }).then(() => {
          store.dispatch('user/resetToken').then(() => {
            location.reload()
          })
        })
      } else {
        Message.error(res.msg || 'Error', 5)
      }
      return Promise.reject(new Error(res.msg || 'Error'))
    } else {
      return res
    }
  },
  error => {
    console.log('err' + error) // for debug
    Message.error("服务器异常", 5)
    return Promise.reject(error)
  }
)

export default service
