// ============================================
// SipSpot - Cafe Model (migrated from YelpCamp Campground)
// Coffee shop data model with geospatial features
// ============================================

const mongoose = require('mongoose');
const Review = require('./review');
const Schema = mongoose.Schema;
// ============================================
// Image Sub-Schema
// ============================================
const ImageSchema = new Schema({
    url: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    publicId: String, // Cloudinary public_id for deletion
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

// Virtual property: Generate thumbnail URL
ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200,h_200,c_fill');
});

// Virtual property: Generate card-sized image
ImageSchema.virtual('cardImage').get(function () {
    return this.url.replace('/upload', '/upload/w_400,h_300,c_fill');
});

// Virtual property: Generate full-sized image
ImageSchema.virtual('fullImage').get(function () {
    return this.url.replace('/upload', '/upload/w_1200,h_800,c_fill,q_auto');
});

// ============================================
// Opening Hours Sub-Schema (optional feature)
// ============================================
const OpeningHoursSchema = new Schema({
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    open: String,  // e.g., "08:00"
    close: String, // e.g., "22:00"
    closed: {
        type: Boolean,
        default: false
    }
}, { _id: false });

// ============================================
// Main Cafe Schema
// ============================================
const opts = { 
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true 
};

const CafeSchema = new Schema({
    // ============================================
    // Basic Information
    // ============================================
    name: {
        type: String,
        required: [true, 'Please provide cafe name'],
        trim: true,
        maxlength: [100, 'Cafe name cannot exceed 100 characters']
    },
    
    description: {
        type: String,
        required: [true, 'Please provide cafe description'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    
    images: {
        type: [ImageSchema],
        validate: {
            validator: function(v) {
                return v.length <= 10;
            },
            message: 'Maximum 10 images allowed'
        }
    },
    
    // ============================================
    // Location Information (GeoJSON Format)
    // ============================================
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: [true, 'Please provide coordinates'],
            validate: {
                validator: function(v) {
                    return v.length === 2 && 
                           v[0] >= -180 && v[0] <= 180 && // longitude
                           v[1] >= -90 && v[1] <= 90;     // latitude
                },
                message: 'Invalid coordinates format'
            }
        }
    },
    
    address: {
        type: String,
        required: [true, 'Please provide address'],
        trim: true
    },
    
    city: {
        type: String,
        required: [true, 'Please provide city'],
        trim: true,
        index: true
    },
    
    location: String, // Legacy field for backward compatibility (can be neighborhood/district)
    
    // ============================================
    // Cafe Specific Features
    // ============================================
    price: {
        type: Number,
        min: [1, 'Price level must be between 1-4'],
        max: [4, 'Price level must be between 1-4'],
        default: 2,
        required: true
    },
    
    amenities: [{
        type: String,
        enum: [
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
        ]
    }],
    
    specialty: {
        type: String,
        enum: ['Espresso', 'Pour Over', 'Cold Brew', 'Latte Art', 'Specialty Beans', 'Desserts', 'Light Meals'],
        default: 'Espresso'
    },
    
    openingHours: [OpeningHoursSchema],
    
    phoneNumber: {
        type: String,
        match: [/^[\d\s\-\+\(\)]+$/, 'Please provide a valid phone number']
    },
    
    website: {
        type: String,
        match: [/^https?:\/\/.+/, 'Please provide a valid URL']
    },
    
    // ============================================
    // Rating and Reviews
    // ============================================
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
        set: function(val) {
            return Math.round(val * 10) / 10; // Round to 1 decimal place
        }
    },
    
    reviewCount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: 'Review'
    }],
    
    // ============================================
    // Ownership and Management
    // ============================================
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        alias: 'owner' // Allow using 'owner' or 'author'
    },
    
    // ============================================
    // Status and Metadata
    // ============================================
    isActive: {
        type: Boolean,
        default: true
    },
    
    isVerified: {
        type: Boolean,
        default: false
    },
    
    viewCount: {
        type: Number,
        default: 0
    },
    
    favoriteCount: {
        type: Number,
        default: 0
    },
    
    tags: [String],
    
}, opts);

// ============================================
// Indexes for Performance
// ============================================

// Geospatial index for location-based queries
CafeSchema.index({ geometry: '2dsphere' });

// Text search index
CafeSchema.index({ 
    name: 'text', 
    description: 'text', 
    city: 'text',
    tags: 'text'
});

// Common query indexes
CafeSchema.index({ city: 1, rating: -1 });
CafeSchema.index({ author: 1, createdAt: -1 });
CafeSchema.index({ rating: -1, reviewCount: -1 });
CafeSchema.index({ isActive: 1, isVerified: 1 });

// ============================================
// Virtual Properties
// ============================================

// Map popup markup for frontend display
CafeSchema.virtual('properties.popUpMarkup').get(function () {
    const stars = '⭐'.repeat(Math.round(this.rating));
    return `
        <div class="map-popup">
            <strong><a href="/cafes/${this._id}">${this.name}</a></strong>
            <p>${stars} ${this.rating.toFixed(1)} (${this.reviewCount} reviews)</p>
            <p>${this.description.substring(0, 50)}${this.description.length > 50 ? '...' : ''}</p>
        </div>
    `;
});

// Price level display
CafeSchema.virtual('priceDisplay').get(function () {
    return '$'.repeat(this.price);
});

// Average rating category
CafeSchema.virtual('ratingCategory').get(function () {
    if (this.rating >= 4.5) return 'Excellent';
    if (this.rating >= 4.0) return 'Very Good';
    if (this.rating >= 3.5) return 'Good';
    if (this.rating >= 3.0) return 'Average';
    return 'Below Average';
});

// Check if cafe is currently open (requires openingHours to be set)
CafeSchema.virtual('isOpen').get(function () {
    if (!this.openingHours || this.openingHours.length === 0) return null;
    
    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = dayNames[now.getDay()];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const todayHours = this.openingHours.find(h => h.day === today);
    if (!todayHours || todayHours.closed) return false;
    
    return currentTime >= todayHours.open && currentTime <= todayHours.close;
});

// ============================================
// Instance Methods
// ============================================

/**
 * Calculate and update average rating
 */
CafeSchema.methods.calculateAverageRating = async function() {
    const Review = mongoose.model('Review');
    const stats = await Review.aggregate([
        { $match: { cafe: this._id } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                reviewCount: { $sum: 1 }
            }
        }
    ]);
    
    if (stats.length > 0) {
        this.rating = Math.round(stats[0].averageRating * 10) / 10;
        this.reviewCount = stats[0].reviewCount;
    } else {
        this.rating = 0;
        this.reviewCount = 0;
    }
    
    await this.save();
};

/**
 * Increment view count
 */
CafeSchema.methods.incrementViewCount = async function() {
    this.viewCount += 1;
    await this.save({ validateBeforeSave: false });
};

/**
 * Add amenity if not already present
 */
CafeSchema.methods.addAmenity = async function(amenity) {
    if (!this.amenities.includes(amenity)) {
        this.amenities.push(amenity);
        await this.save();
    }
};

/**
 * Remove amenity
 */
CafeSchema.methods.removeAmenity = async function(amenity) {
    this.amenities = this.amenities.filter(a => a !== amenity);
    await this.save();
};

/**
 * Get public cafe info (safe for API responses)
 */
CafeSchema.methods.getPublicInfo = function() {
    return {
        id: this._id,
        name: this.name,
        description: this.description,
        images: this.images,
        location: {
            address: this.address,
            city: this.city,
            coordinates: this.geometry.coordinates
        },
        price: this.price,
        priceDisplay: this.priceDisplay,
        amenities: this.amenities,
        rating: this.rating,
        ratingCategory: this.ratingCategory,
        reviewCount: this.reviewCount,
        specialty: this.specialty,
        viewCount: this.viewCount,
        favoriteCount: this.favoriteCount,
        createdAt: this.createdAt
    };
};

// ============================================
// Static Methods
// ============================================

/**
 * Find cafes near a location
 * @param {Number} longitude
 * @param {Number} latitude
 * @param {Number} maxDistance - in meters (default: 5000m = 5km)
 * @param {Number} limit - number of results
 */
CafeSchema.statics.findNearby = function(longitude, latitude, maxDistance = 5000, limit = 20) {
    return this.find({
        geometry: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                $maxDistance: maxDistance
            }
        },
        isActive: true
    })
    .limit(limit)
    .populate('author', 'username avatar')
    .select('-reviews'); // Exclude reviews array for performance
};

/**
 * Find cafes within a specific area (bounding box)
 */
CafeSchema.statics.findInArea = function(southWest, northEast) {
    return this.find({
        geometry: {
            $geoWithin: {
                $box: [southWest, northEast]
            }
        },
        isActive: true
    }).populate('author', 'username avatar');
};

/**
 * Get top-rated cafes
 */
CafeSchema.statics.getTopRated = function(limit = 10, city = null) {
    const query = { isActive: true, reviewCount: { $gte: 5 } };
    if (city) query.city = new RegExp(city, 'i');
    
    return this.find(query)
        .sort({ rating: -1, reviewCount: -1 })
        .limit(limit)
        .populate('author', 'username avatar');
};

/**
 * Search cafes by text
 */
CafeSchema.statics.searchCafes = function(searchTerm, options = {}) {
    const query = {
        $text: { $search: searchTerm },
        isActive: true
    };
    
    // Add filters
    if (options.city) query.city = new RegExp(options.city, 'i');
    if (options.minRating) query.rating = { $gte: options.minRating };
    if (options.maxPrice) query.price = { $lte: options.maxPrice };
    if (options.amenities && options.amenities.length > 0) {
        query.amenities = { $all: options.amenities };
    }
    
    return this.find(query)
        .sort({ score: { $meta: 'textScore' }, rating: -1 })
        .populate('author', 'username avatar');
};

/**
 * Get cafes by specific amenities
 */
CafeSchema.statics.findByAmenities = function(amenities, city = null) {
    const query = {
        amenities: { $all: amenities },
        isActive: true
    };
    
    if (city) query.city = new RegExp(city, 'i');
    
    return this.find(query)
        .sort({ rating: -1 })
        .populate('author', 'username avatar');
};

// ============================================
// Middleware
// ============================================

// Pre-save: Ensure coordinates are in correct order [lng, lat]
CafeSchema.pre('save', function(next) {
    if (this.isModified('geometry.coordinates')) {
        const [lng, lat] = this.geometry.coordinates;
        if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
            return next(new Error('Invalid coordinates: longitude must be -180 to 180, latitude must be -90 to 90'));
        }
    }
    next();
});

// Pre-save: Convert city to title case
CafeSchema.pre('save', function(next) {
    if (this.isModified('city')) {
        this.city = this.city
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    next();
});

// Post-delete: Cascade delete all reviews
CafeSchema.post('findOneAndDelete', async function (doc) {
    if (doc && doc.reviews && doc.reviews.length > 0) {
        await Review.deleteMany({
            _id: { $in: doc.reviews }
        });
        console.log(`Deleted ${doc.reviews.length} reviews associated with cafe: ${doc.name}`);
    }
});

// Post-delete: Also handle remove() method
CafeSchema.post('remove', async function (doc) {
    if (doc && doc.reviews && doc.reviews.length > 0) {
        await Review.deleteMany({
            _id: { $in: doc.reviews }
        });
    }
});

// ============================================
// Export Model
// ============================================
module.exports = mongoose.model('Cafe', CafeSchema);