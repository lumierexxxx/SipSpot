// ============================================
// SipSpot - 数据验证工具
// 使用 Joi 进行输入验证
// ============================================

import Joi from 'joi'
import ExpressError from './ExpressError'

// ============================================
// 用户验证模式
// ============================================

export const userRegisterSchema = Joi.object({
    username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required()
        .messages({
            'string.alphanum': '用户名只能包含字母和数字',
            'string.min': '用户名至少需要3个字符',
            'string.max': '用户名最多30个字符',
            'any.required': '请提供用户名'
        }),

    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': '请提供有效的邮箱地址',
            'any.required': '请提供邮箱'
        }),

    password: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.min': '密码至少需要6个字符',
            'any.required': '请提供密码'
        })
});

export const userLoginSchema = Joi.object({
    identifier: Joi.string()
        .required()
        .messages({
            'any.required': '请提供邮箱或用户名'
        }),

    password: Joi.string()
        .required()
        .messages({
            'any.required': '请提供密码'
        })
});

export const userUpdateSchema = Joi.object({
    username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .optional(),

    email: Joi.string()
        .email()
        .optional(),

    avatar: Joi.string()
        .uri()
        .optional(),

    bio: Joi.string()
        .max(500)
        .optional()
        .allow('', null)
});

export const passwordUpdateSchema = Joi.object({
    currentPassword: Joi.string()
        .required()
        .messages({
            'any.required': '请提供当前密码'
        }),

    newPassword: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.min': '新密码至少需要6个字符',
            'any.required': '请提供新密码'
        })
});

// ============================================
// 咖啡店验证模式
// ============================================

export const cafeSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.min': '咖啡店名称至少2个字符',
            'string.max': '咖啡店名称最多100个字符',
            'any.required': '请提供咖啡店名称'
        }),

    description: Joi.string()
        .min(10)
        .max(2000)
        .required()
        .messages({
            'string.min': '描述至少10个字符',
            'string.max': '描述最多2000个字符',
            'any.required': '请提供描述'
        }),

    address: Joi.string()
        .required()
        .messages({ 'any.required': '请提供地址' }),

    city: Joi.string()
        .required()
        .messages({ 'any.required': '请提供城市' }),

    geometry: Joi.object({
        type: Joi.string().valid('Point').default('Point'),
        coordinates: Joi.array()
            .items(Joi.number())
            .length(2)
            .required()
            .messages({
                'array.length': '坐标必须包含经度和纬度',
                'any.required': '请提供坐标'
            })
    }).required(),

    price: Joi.number()
        .integer()
        .min(1)
        .max(4)
        .default(2),

    amenities: Joi.array()
        .items(Joi.string().valid(
            'WiFi', '电源插座', '安静环境', '户外座位',
            '宠物友好', '禁烟', '空调',
            '提供停车位', '无障碍通行（轮椅可进入）',
            '适合使用笔记本电脑', '适合团体聚会', '适合工作 / 办公'
        ))
        .optional(),

    specialty: Joi.string()
        .valid('意式浓缩 Espresso', '手冲咖啡 Pour Over', '冷萃咖啡 Cold Brew', '拉花咖啡 Latte Art',
               '精品咖啡豆 Specialty Beans', '甜点 Desserts', '轻食 Light Meals')
        .optional(),

    vibe: Joi.string()
        .valid('Specialty', 'Cozy Vibes', 'Work-Friendly', 'Outdoor', 'Hidden Gems', 'New Openings')
        .optional()
        .allow('', null),

    phoneNumber: Joi.string()
        .pattern(/^[\d\s\-\+\(\)]+$/)
        .optional()
        .allow('', null),

    website: Joi.string()
        .uri()
        .optional()
        .allow('', null),

    openingHours: Joi.array()
        .items(Joi.object({
            day: Joi.string()
                .valid('周一', '周二', '周三', '周四', '周五', '周六', '周日')
                .required(),
            open: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
            close: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
            closed: Joi.boolean().default(false)
        }))
        .optional()
});

export const cafeUpdateSchema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().min(10).max(2000).optional(),
    address: Joi.string().optional(),
    city: Joi.string().optional(),
    price: Joi.number().integer().min(1).max(4).optional(),
    amenities: Joi.array().items(Joi.string()).optional(),
    specialty: Joi.string().optional(),
    vibe: Joi.string().valid('Specialty', 'Cozy Vibes', 'Work-Friendly', 'Outdoor', 'Hidden Gems', 'New Openings').optional().allow('', null),
    phoneNumber: Joi.string().pattern(/^[\d\s\-\+\(\)]+$/).optional().allow('', null),
    website: Joi.string().uri().optional().allow('', null),
    openingHours: Joi.array().optional(),
    isActive: Joi.boolean().optional()
});

// ============================================
// 评论验证模式
// 多维度评分：taste(口味), price(价格), environment(环境),
//             service(服务), workspace(办公适宜度)
// ============================================

export const reviewSchema = Joi.object({
    content: Joi.string()
        .min(10)
        .max(2000)
        .required()
        .messages({
            'string.min': '评论内容至少10个字符',
            'string.max': '评论内容最多2000个字符',
            'any.required': '请提供评论内容'
        }),

    rating: Joi.number()
        .min(1)
        .max(5)
        .required()
        .custom((value, helpers) => {
            if (value % 0.5 !== 0) {
                return helpers.error('number.multiple', { multiple: 0.5 });
            }
            return value;
        })
        .messages({
            'number.min': '评分必须在1-5之间',
            'number.max': '评分必须在1-5之间',
            'number.multiple': '评分必须是0.5的倍数',
            'any.required': '请提供评分'
        }),

    // 多维度评分（与 Review model 一致）
    ratings: Joi.object({
        taste: Joi.number().min(1).max(5).required()
            .messages({ 'any.required': '请提供口味评分' }),
        price: Joi.number().min(1).max(5).required()
            .messages({ 'any.required': '请提供价格评分' }),
        environment: Joi.number().min(1).max(5).required()
            .messages({ 'any.required': '请提供环境评分' }),
        service: Joi.number().min(1).max(5).required()
            .messages({ 'any.required': '请提供服务评分' }),
        workspace: Joi.number().min(1).max(5).required()
            .messages({ 'any.required': '请提供办公适宜度评分' })
    }).required()
        .messages({ 'any.required': '请提供多维度评分' }),

    visitDate: Joi.date()
        .max('now')
        .optional()
        .messages({ 'date.max': '访问日期不能是未来' })
});

export const reviewUpdateSchema = Joi.object({
    content: Joi.string().min(10).max(2000).optional(),

    rating: Joi.number().min(1).max(5).optional()
        .custom((value, helpers) => {
            if (value % 0.5 !== 0) {
                return helpers.error('number.multiple', { multiple: 0.5 });
            }
            return value;
        }),

    ratings: Joi.object({
        taste: Joi.number().min(1).max(5).optional(),
        price: Joi.number().min(1).max(5).optional(),
        environment: Joi.number().min(1).max(5).optional(),
        service: Joi.number().min(1).max(5).optional(),
        workspace: Joi.number().min(1).max(5).optional()
    }).optional()
});

// ============================================
// 验证中间件工厂函数
// ============================================

export const validate = (schema: Joi.ObjectSchema, property = 'body') => {
    return (req: any, res: any, next: any) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errorMessages = error.details.map(detail => detail.message);
            return next(new ExpressError(errorMessages.join(', '), 400));
        }

        req[property] = value;
        next();
    };
};

// ============================================
// 查询参数验证
// ============================================

export const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().optional()
});

export const searchQuerySchema = Joi.object({
    q: Joi.string().min(1).required().messages({ 'any.required': '请提供搜索关键词' }),
    city: Joi.string().optional(),
    minRating: Joi.number().min(0).max(5).optional(),
    maxPrice: Joi.number().integer().min(1).max(4).optional(),
    amenities: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
    limit: Joi.number().integer().min(1).max(100).default(20)
});

export const coordinatesSchema = Joi.object({
    lng: Joi.number().min(-180).max(180).required(),
    lat: Joi.number().min(-90).max(90).required(),
    distance: Joi.number().integer().min(100).max(50000).default(5000),
    limit: Joi.number().integer().min(1).max(100).default(20)
});

// ============================================
// AI 搜索解释验证
// ============================================

export const explainSearchSchema = Joi.object({
    query: Joi.string().trim().max(200).required()
        .messages({
            'string.max': '查询文本不能超过200个字符',
            'any.required': '请提供查询文本'
        }),
    cafeNames: Joi.array()
        .items(Joi.string().trim().max(100))
        .max(5)
        .required()
        .messages({
            'array.max': '最多提供5个咖啡馆名称',
            'any.required': '请提供咖啡馆名称列表'
        })
});
