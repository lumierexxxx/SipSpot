// ============================================
// SipSpot - 数据验证工具
// 使用 Joi 进行输入验证
// ============================================

const Joi = require('joi');
const ExpressError = require('./ExpressError');

// ============================================
// 用户验证模式
// ============================================

exports.userRegisterSchema = Joi.object({
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

exports.userLoginSchema = Joi.object({
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

exports.userUpdateSchema = Joi.object({
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

exports.passwordUpdateSchema = Joi.object({
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

exports.cafeSchema = Joi.object({
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
        .messages({
            'any.required': '请提供地址'
        }),
    
    city: Joi.string()
        .required()
        .messages({
            'any.required': '请提供城市'
        }),
    
    geometry: Joi.object({
        type: Joi.string()
            .valid('Point')
            .default('Point'),
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
        .default(2)
        .messages({
            'number.min': '价格等级必须在1-4之间',
            'number.max': '价格等级必须在1-4之间'
        }),
    
    amenities: Joi.array()
        .items(Joi.string().valid(
            'WiFi',
            'Power Outlets',
            'Quiet',
            'Outdoor Seating',
            'Pet Friendly',
            'Non-Smoking',
            'Air Conditioning',
            'Parking Available',
            'Wheelchair Accessible',
            'Laptop Friendly',
            'Good for Groups',
            'Good for Work'
        ))
        .optional(),
    
    specialty: Joi.string()
        .valid('Espresso', 'Pour Over', 'Cold Brew', 'Latte Art', 'Specialty Beans', 'Desserts', 'Light Meals')
        .optional(),
    
    phoneNumber: Joi.string()
        .pattern(/^[\d\s\-\+\(\)]+$/)
        .optional()
        .allow('', null)
        .messages({
            'string.pattern.base': '请提供有效的电话号码'
        }),
    
    website: Joi.string()
        .uri()
        .optional()
        .allow('', null)
        .messages({
            'string.uri': '请提供有效的网址'
        }),
    
    openingHours: Joi.array()
        .items(Joi.object({
            day: Joi.string()
                .valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
                .required(),
            open: Joi.string()
                .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
                .optional(),
            close: Joi.string()
                .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
                .optional(),
            closed: Joi.boolean()
                .default(false)
        }))
        .optional()
});

exports.cafeUpdateSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .optional(),
    
    description: Joi.string()
        .min(10)
        .max(2000)
        .optional(),
    
    address: Joi.string()
        .optional(),
    
    city: Joi.string()
        .optional(),
    
    price: Joi.number()
        .integer()
        .min(1)
        .max(4)
        .optional(),
    
    amenities: Joi.array()
        .items(Joi.string())
        .optional(),
    
    specialty: Joi.string()
        .optional(),
    
    phoneNumber: Joi.string()
        .pattern(/^[\d\s\-\+\(\)]+$/)
        .optional()
        .allow('', null),
    
    website: Joi.string()
        .uri()
        .optional()
        .allow('', null),
    
    openingHours: Joi.array()
        .optional(),
    
    isActive: Joi.boolean()
        .optional()
});

// ============================================
// 评论验证模式
// ============================================

exports.reviewSchema = Joi.object({
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
            // 确保是0.5的倍数
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
    
    detailedRatings: Joi.object({
        coffee: Joi.number().min(1).max(5).optional(),
        ambience: Joi.number().min(1).max(5).optional(),
        service: Joi.number().min(1).max(5).optional(),
        value: Joi.number().min(1).max(5).optional()
    }).optional(),
    
    visitDate: Joi.date()
        .max('now')
        .optional()
        .messages({
            'date.max': '访问日期不能是未来'
        })
});

exports.reviewUpdateSchema = Joi.object({
    content: Joi.string()
        .min(10)
        .max(2000)
        .optional(),
    
    rating: Joi.number()
        .min(1)
        .max(5)
        .optional()
        .custom((value, helpers) => {
            if (value % 0.5 !== 0) {
                return helpers.error('number.multiple', { multiple: 0.5 });
            }
            return value;
        }),
    
    detailedRatings: Joi.object({
        coffee: Joi.number().min(1).max(5).optional(),
        ambience: Joi.number().min(1).max(5).optional(),
        service: Joi.number().min(1).max(5).optional(),
        value: Joi.number().min(1).max(5).optional()
    }).optional()
});

// ============================================
// 验证中间件工厂函数
// ============================================

/**
 * 创建验证中间件
 * @param {Joi.Schema} schema - Joi验证模式
 * @param {string} property - 要验证的属性（body, query, params）
 */
exports.validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false, // 返回所有错误，而不是第一个
            stripUnknown: true // 移除未定义的字段
        });
        
        if (error) {
            const errorMessages = error.details.map(detail => detail.message);
            return next(new ExpressError(errorMessages.join(', '), 400));
        }
        
        // 用验证后的值替换原始值（已清理和转换）
        req[property] = value;
        next();
    };
};

// ============================================
// 查询参数验证
// ============================================

exports.paginationSchema = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .default(1),
    
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(20),
    
    sort: Joi.string()
        .optional()
});

exports.searchQuerySchema = Joi.object({
    q: Joi.string()
        .min(1)
        .required()
        .messages({
            'any.required': '请提供搜索关键词'
        }),
    
    city: Joi.string()
        .optional(),
    
    minRating: Joi.number()
        .min(0)
        .max(5)
        .optional(),
    
    maxPrice: Joi.number()
        .integer()
        .min(1)
        .max(4)
        .optional(),
    
    amenities: Joi.alternatives()
        .try(
            Joi.string(),
            Joi.array().items(Joi.string())
        )
        .optional(),
    
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(20)
});

exports.coordinatesSchema = Joi.object({
    lng: Joi.number()
        .min(-180)
        .max(180)
        .required()
        .messages({
            'any.required': '请提供经度',
            'number.min': '经度必须在-180到180之间',
            'number.max': '经度必须在-180到180之间'
        }),
    
    lat: Joi.number()
        .min(-90)
        .max(90)
        .required()
        .messages({
            'any.required': '请提供纬度',
            'number.min': '纬度必须在-90到90之间',
            'number.max': '纬度必须在-90到90之间'
        }),
    
    distance: Joi.number()
        .integer()
        .min(100)
        .max(50000)
        .default(5000),
    
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(20)
});