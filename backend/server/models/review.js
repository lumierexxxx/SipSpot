// ============================================
// SipSpot - Review Model (migrated from YelpCamp)
// Enhanced review system with AI analysis
// ============================================

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// ============================================
// Image Sub-Schema for Review Photos
// ============================================
const ReviewImageSchema = new Schema({
    url: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    publicId: String,
    uploadedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// Virtual: Generate thumbnail
ReviewImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_150,h_150,c_fill');
});

// ============================================
// AI Analysis Sub-Schema
// ============================================
const AIAnalysisSchema = new Schema({
    sentiment: {
        type: String,
        enum: ['positive', 'negative', 'neutral'],
        required: true
    },
    keywords: [{
        type: String,
        maxlength: 50
    }],
    summary: {
        type: String,
        maxlength: 200
    },
    confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.8
    },
    analyzedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// ============================================
// Main Review Schema
// ============================================
const reviewSchema = new Schema({
    // ============================================
    // Core Review Content
    // ============================================
    content: {
        type: String,
        required: [true, 'Please provide review content'],
        trim: true,
        minlength: [10, 'Review must be at least 10 characters'],
        maxlength: [2000, 'Review cannot exceed 2000 characters']
    },
    
    rating: {
        type: Number,
        required: [true, 'Please provide a rating'],
        min: [1, 'Rating must be between 1 and 5'],
        max: [5, 'Rating must be between 1 and 5'],
        validate: {
            validator: function(v) {
                // Allow half ratings (1, 1.5, 2, 2.5, etc.)
                return v % 0.5 === 0;
            },
            message: 'Rating must be in increments of 0.5'
        }
    },
    
    // ============================================
    // References
    // ============================================
    cafe: {
        type: Schema.Types.ObjectId,
        ref: 'Cafe',
        required: true,
        index: true
    },
    
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    // ============================================
    // Media
    // ============================================
    images: {
        type: [ReviewImageSchema],
        validate: {
            validator: function(v) {
                return v.length <= 5;
            },
            message: 'Maximum 5 images allowed per review'
        },
        default: []
    },
    
    // ============================================
    // AI Analysis Results
    // ============================================
    aiAnalysis: {
        type: AIAnalysisSchema,
        default: null
    },
    
    // ============================================
    // Detailed Ratings (Optional)
    // ============================================
    detailedRatings: {
        coffee: {
            type: Number,
            min: 1,
            max: 5
        },
        ambience: {
            type: Number,
            min: 1,
            max: 5
        },
        service: {
            type: Number,
            min: 1,
            max: 5
        },
        value: {
            type: Number,
            min: 1,
            max: 5
        }
    },
    
    // ============================================
    // User Engagement
    // ============================================
    helpfulCount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    notHelpfulCount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    helpfulVotes: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        vote: {
            type: String,
            enum: ['helpful', 'not-helpful']
        }
    }],
    
    // ============================================
    // Status and Moderation
    // ============================================
    isEdited: {
        type: Boolean,
        default: false
    },
    
    editedAt: Date,
    
    isReported: {
        type: Boolean,
        default: false
    },
    
    reportCount: {
        type: Number,
        default: 0
    },
    
    isVerifiedVisit: {
        type: Boolean,
        default: false
    },
    
    visitDate: Date,
    
    // ============================================
    // Owner/Staff Response
    // ============================================
    ownerResponse: {
        content: String,
        respondedAt: Date,
        respondedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    }
    
}, {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ============================================
// Indexes
// ============================================

// Compound index for cafe reviews
reviewSchema.index({ cafe: 1, createdAt: -1 });

// User's reviews
reviewSchema.index({ author: 1, createdAt: -1 });

// Ensure one review per user per cafe
reviewSchema.index({ cafe: 1, author: 1 }, { unique: true });

// Helpful reviews
reviewSchema.index({ cafe: 1, helpfulCount: -1 });

// Recent reviews
reviewSchema.index({ createdAt: -1 });

// ============================================
// Virtual Properties
// ============================================

// Calculate helpfulness percentage
reviewSchema.virtual('helpfulPercentage').get(function() {
    const total = this.helpfulCount + this.notHelpfulCount;
    if (total === 0) return 0;
    return Math.round((this.helpfulCount / total) * 100);
});

// Get sentiment emoji
reviewSchema.virtual('sentimentEmoji').get(function() {
    if (!this.aiAnalysis) return null;
    
    const emojiMap = {
        'positive': '😊',
        'negative': '😞',
        'neutral': '😐'
    };
    
    return emojiMap[this.aiAnalysis.sentiment] || null;
});

// Get rating stars display
reviewSchema.virtual('ratingDisplay').get(function() {
    const fullStars = Math.floor(this.rating);
    const hasHalfStar = this.rating % 1 !== 0;
    
    return {
        full: fullStars,
        half: hasHalfStar,
        empty: 5 - fullStars - (hasHalfStar ? 1 : 0)
    };
});

// Time since posted
reviewSchema.virtual('timeAgo').get(function() {
    const now = new Date();
    const diff = now - this.createdAt;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    const weeks = Math.floor(diff / 604800000);
    const months = Math.floor(diff / 2592000000);
    const years = Math.floor(diff / 31536000000);
    
    if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
});

// ============================================
// Instance Methods
// ============================================

/**
 * Add AI analysis results to review
 */
reviewSchema.methods.addAIAnalysis = async function(analysisData) {
    this.aiAnalysis = {
        sentiment: analysisData.sentiment,
        keywords: analysisData.keywords || [],
        summary: analysisData.summary,
        confidence: analysisData.confidence || 0.8,
        analyzedAt: new Date()
    };
    
    await this.save();
    return this.aiAnalysis;
};

/**
 * Vote review as helpful or not helpful
 */
reviewSchema.methods.addHelpfulVote = async function(userId, voteType) {
    // Check if user already voted
    const existingVoteIndex = this.helpfulVotes.findIndex(
        vote => vote.user.toString() === userId.toString()
    );
    
    if (existingVoteIndex !== -1) {
        const oldVote = this.helpfulVotes[existingVoteIndex].vote;
        
        // Update existing vote
        if (oldVote !== voteType) {
            // Change vote
            if (oldVote === 'helpful') this.helpfulCount--;
            else this.notHelpfulCount--;
            
            if (voteType === 'helpful') this.helpfulCount++;
            else this.notHelpfulCount++;
            
            this.helpfulVotes[existingVoteIndex].vote = voteType;
        }
    } else {
        // New vote
        this.helpfulVotes.push({ user: userId, vote: voteType });
        
        if (voteType === 'helpful') this.helpfulCount++;
        else this.notHelpfulCount++;
    }
    
    await this.save({ validateBeforeSave: false });
};

/**
 * Remove helpful vote
 */
reviewSchema.methods.removeHelpfulVote = async function(userId) {
    const existingVoteIndex = this.helpfulVotes.findIndex(
        vote => vote.user.toString() === userId.toString()
    );
    
    if (existingVoteIndex !== -1) {
        const vote = this.helpfulVotes[existingVoteIndex].vote;
        
        if (vote === 'helpful') this.helpfulCount--;
        else this.notHelpfulCount--;
        
        this.helpfulVotes.splice(existingVoteIndex, 1);
        await this.save({ validateBeforeSave: false });
    }
};

/**
 * Report review
 */
reviewSchema.methods.report = async function() {
    this.isReported = true;
    this.reportCount++;
    await this.save({ validateBeforeSave: false });
};

/**
 * Add owner response
 */
reviewSchema.methods.addOwnerResponse = async function(content, responderId) {
    this.ownerResponse = {
        content,
        respondedAt: new Date(),
        respondedBy: responderId
    };
    await this.save();
};

/**
 * Mark as edited
 */
reviewSchema.methods.markAsEdited = async function() {
    this.isEdited = true;
    this.editedAt = new Date();
    await this.save({ validateBeforeSave: false });
};

/**
 * Get public review info
 */
reviewSchema.methods.getPublicInfo = function() {
    return {
        id: this._id,
        content: this.content,
        rating: this.rating,
        ratingDisplay: this.ratingDisplay,
        author: this.author,
        cafe: this.cafe,
        images: this.images,
        aiAnalysis: this.aiAnalysis,
        detailedRatings: this.detailedRatings,
        helpfulCount: this.helpfulCount,
        helpfulPercentage: this.helpfulPercentage,
        isEdited: this.isEdited,
        isVerifiedVisit: this.isVerifiedVisit,
        visitDate: this.visitDate,
        ownerResponse: this.ownerResponse,
        createdAt: this.createdAt,
        timeAgo: this.timeAgo
    };
};

// ============================================
// Static Methods
// ============================================

/**
 * Get reviews for a specific cafe
 */
reviewSchema.statics.getByCafe = function(cafeId, options = {}) {
    const {
        page = 1,
        limit = 10,
        sort = '-createdAt'
    } = options;
    
    const skip = (page - 1) * limit;
    
    return this.find({ cafe: cafeId })
        .populate('author', 'username avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit);
};

/**
 * Get user's reviews
 */
reviewSchema.statics.getByUser = function(userId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;
    
    return this.find({ author: userId })
        .populate('cafe', 'name images rating city')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit);
};

/**
 * Get most helpful reviews
 */
reviewSchema.statics.getMostHelpful = function(cafeId, limit = 5) {
    return this.find({ cafe: cafeId })
        .populate('author', 'username avatar')
        .sort('-helpfulCount -createdAt')
        .limit(limit);
};

/**
 * Calculate average rating for cafe
 */
reviewSchema.statics.calculateAverageRating = async function(cafeId) {
    const stats = await this.aggregate([
        { $match: { cafe: cafeId } },
        {
            $group: {
                _id: '$cafe',
                averageRating: { $avg: '$rating' },
                reviewCount: { $sum: 1 }
            }
        }
    ]);
    
    return stats.length > 0 ? stats[0] : { averageRating: 0, reviewCount: 0 };
};

/**
 * Get sentiment distribution for cafe
 */
reviewSchema.statics.getSentimentStats = async function(cafeId) {
    const stats = await this.aggregate([
        { $match: { cafe: cafeId, aiAnalysis: { $exists: true } } },
        {
            $group: {
                _id: '$aiAnalysis.sentiment',
                count: { $sum: 1 }
            }
        }
    ]);
    
    const result = {
        positive: 0,
        negative: 0,
        neutral: 0
    };
    
    stats.forEach(stat => {
        result[stat._id] = stat.count;
    });
    
    return result;
};

// ============================================
// Middleware
// ============================================

// Pre-save: Round rating to nearest 0.5
reviewSchema.pre('save', function(next) {
    if (this.isModified('rating')) {
        this.rating = Math.round(this.rating * 2) / 2;
    }
    next();
});

// Post-save: Update cafe's average rating
reviewSchema.post('save', async function(doc) {
    try {
        const Cafe = mongoose.model('Cafe');
        const cafe = await Cafe.findById(doc.cafe);
        
        if (cafe) {
            await cafe.calculateAverageRating();
        }
    } catch (error) {
        console.error('Error updating cafe rating:', error);
    }
});

// Post-remove: Update cafe's average rating
reviewSchema.post('deleteOne', { document: true, query: false }, async function(doc) {
    if (doc) {
        try {
            const Cafe = mongoose.model('Cafe');
            const cafe = await Cafe.findById(doc.cafe);
            if (cafe) {
                await cafe.calculateAverageRating();
            }
        } catch (error) {
            console.error('Error updating cafe rating:', error);
        }
    }
});

// Post-delete (for findOneAndDelete)
reviewSchema.post('findOneAndDelete', async function(doc) {
    if (doc) {
        try {
            const Cafe = mongoose.model('Cafe');
            const cafe = await Cafe.findById(doc.cafe);
            
            if (cafe) {
                await cafe.calculateAverageRating();
            }
        } catch (error) {
            console.error('Error updating cafe rating after review deletion:', error);
        }
    }
});

// ============================================
// Export Model
// ============================================
module.exports = mongoose.model('Review', reviewSchema);