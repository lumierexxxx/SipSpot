import { Response } from 'express'

export const successResponse = (res: Response, data: any, message = '操作成功', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data })
}

export const errorResponse = (res: Response, message = '操作失败', statusCode = 500, errors: any = null) => {
  const response: any = { success: false, message }
  if (errors) response.errors = errors
  return res.status(statusCode).json(response)
}

export const paginatedResponse = (res: Response, data: any[], total: number, page: number, limit: number, message = '获取成功') => {
  const pages = Math.ceil(total / limit)
  return res.status(200).json({
    success: true, message, data,
    pagination: {
      total, count: data.length, page: parseInt(String(page)),
      pages, limit: parseInt(String(limit)),
      hasNext: page < pages, hasPrev: page > 1
    }
  })
}

export const createdResponse = (res: Response, data: any, message = '创建成功') => {
  return res.status(201).json({ success: true, message, data })
}

export const deletedResponse = (res: Response, message = '删除成功', sendData = true) => {
  if (sendData) return res.status(200).json({ success: true, message, data: {} })
  return res.status(204).send()
}

export const notFoundResponse = (res: Response, message = '资源不存在') => {
  return res.status(404).json({ success: false, message })
}

export const unauthorizedResponse = (res: Response, message = '请先登录') => {
  return res.status(401).json({ success: false, message })
}

export const forbiddenResponse = (res: Response, message = '您没有权限访问此资源') => {
  return res.status(403).json({ success: false, message })
}

export const validationErrorResponse = (res: Response, errors: any, message = '数据验证失败') => {
  return res.status(400).json({ success: false, message, errors: Array.isArray(errors) ? errors : [errors] })
}

export const conflictResponse = (res: Response, message = '资源已存在') => {
  return res.status(409).json({ success: false, message })
}

export const rateLimitResponse = (res: Response, message = '请求过于频繁，请稍后再试') => {
  return res.status(429).json({ success: false, message })
}

export const serverErrorResponse = (res: Response, message = '服务器内部错误', error: any = null) => {
  const response: any = { success: false, message }
  if (process.env.NODE_ENV !== 'production' && error) {
    response.error = { message: error.message, stack: error.stack }
  }
  return res.status(500).json(response)
}
