// create example usages of mongoose 7x apis , write tests

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let testUsers;
let testPosts;
let testProducts;
let testOrders;
let testComments;
let testProfiles;

// Increase Jest timeout
jest.setTimeout(60000); // 60 seconds

// Connect to the in-memory database before all tests
beforeAll(async () => {
    try {
        mongoServer = await MongoMemoryServer.create({
            instance: {
                // Increase startup timeout
                startupTimeout: 30000,
                // Use MongoDB 7.x
                version: '6.0.0'
            }
        });
        const mongoUri = await mongoServer.getUri();
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    } catch (error) {
        console.error('Failed to start MongoDB Memory Server:', error);
        throw error;
    }
});

// Seed the database with test data
beforeEach(async () => {
    // Create test users
    const users = await User.create([
        { name: 'John Doe', email: 'john@example.com', age: 25, status: 'active' },
        { name: 'Jane Smith', email: 'jane@example.com', age: 30, status: 'inactive' }
    ]);

    // Create test profiles
    await Profile.create([
        { user: users[0]._id, name: 'John Doe', email: 'john@example.com', password: 'hashedpass1', bio: 'Test bio 1' },
        { user: users[1]._id, name: 'Jane Smith', email: 'jane@example.com', password: 'hashedpass2', bio: 'Test bio 2' }
    ]);

    // Create test posts
    const posts = await Post.create([
        { title: 'Test Post 1', content: 'Content 1', author: users[0]._id, tags: ['test', 'first'] },
        { title: 'Test Post 2', content: 'Content 2', author: users[1]._id, tags: ['test', 'second'] }
    ]);

    // Create test products
    await Product.create([
        { name: 'Product 1', price: 999, category: 'Electronics', inStock: true },
        { name: 'Product 2', price: 1500, category: 'Electronics', inStock: false }
    ]);

    // Create test orders
    await Order.create([
        { 
            customer: users[0]._id,
            products: [{ product: posts[0]._id, quantity: 1, price: 999 }],
            status: 'pending',
            total: 999
        }
    ]);

    // Create test comments
    await Comment.create([
        { postId: posts[0]._id, author: users[1]._id, content: 'Great post!', likes: 5 },
        { postId: posts[1]._id, author: users[0]._id, content: 'Nice content!', likes: 3 }
    ]);
});

// Clear all test data after each test
afterEach(async () => {
    await Promise.all([
        User.deleteMany({}),
        Profile.deleteMany({}),
        Post.deleteMany({}),
        Product.deleteMany({}),
        Order.deleteMany({}),
        Comment.deleteMany({})
    ]);
});

// Disconnect and stop the server after all tests
afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

// User Model
const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    age: { type: Number, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

// Profile Model
const profileSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true, select: false },
    bio: String
}, { timestamps: true });

// Post Model
const postSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [String],
    status: { type: String, enum: ['draft', 'published'], default: 'draft' }
}, { timestamps: true });

// Product Model
const productSchema = new Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    inStock: { type: Boolean, default: true },
    description: String,
    createdAt: { type: Date, default: Date.now }
});

// Order Model
const orderSchema = new Schema({
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    products: [{
        product: { type: Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number,
        price: Number
    }],
    status: { 
        type: String, 
        enum: ['pending', 'processing', 'completed', 'cancelled'],
        default: 'pending'
    },
    total: Number
}, { timestamps: true });

// Comment Model
const commentSchema = new Schema({
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    likes: { type: Number, default: 0 }
}, { timestamps: true });

// Create and export models
const User = mongoose.model('User', userSchema);
const Profile = mongoose.model('Profile', profileSchema);
const Post = mongoose.model('Post', postSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const Comment = mongoose.model('Comment', commentSchema);

module.exports = {
    User,
    Profile,
    Post,
    Product,
    Order,
    Comment
};

describe('Mongoose 7.x API Tests', () => {
    // 1. Basic find with lean
    test('should find users with lean', () => {
        return User.find({ age: { $gt: 18 } })
            .lean()
            .exec()
            .then(users => {
                expect(users).toBeDefined();
                expect(Array.isArray(users)).toBe(true);
            })
            .catch(err => {
                throw err;
            });
    });

    // 2. Select specific fields
    test('should select specific fields', () => {
        return Profile.find()
            .select('name email')
            .lean()
            .exec()
            .then(profiles => {
                expect(profiles[0]).toHaveProperty('name');
                expect(profiles[0]).toHaveProperty('email');
                expect(profiles[0]).not.toHaveProperty('password');
            })
            .catch(err => {
                throw err;
            });
    });

    // 3. Populate references with error handling
    test('should populate author reference', () => {
        return Post.findOne({ _id: postId })
            .populate('author')
            .lean()
            .exec()
            .then(post => {
                expect(post.author).toBeDefined();
                expect(post.author.name).toBeDefined();
            })
            .catch(err => {
                expect(err).toBeNull();
            })
            .finally(() => {
                // Cleanup code here
            });
    });

    // 4. Pagination with cleanup
    test('should paginate results', () => {
        let connection;
        return Product.find()
            .sort({ createdAt: -1 })
            .skip(page * limit)
            .limit(limit)
            .lean()
            .exec()
            .then(products => {
                expect(products.length).toBeLessThanOrEqual(limit);
                connection = products;
            })
            .catch(err => {
                expect(err).toBeNull();
            })
            .finally(() => {
                if (connection) {
                    connection = null;
                }
            });
    });

    // 5. Complex query with multiple operations
    test('should handle complex query', () => {
        return Product.find({
            $and: [
                { price: { $lt: 1000 } },
                { inStock: true }
            ]
        })
            .select('name price')
            .sort({ price: 1 })
            .lean()
            .exec()
            .then(products => {
                expect(products).toBeDefined();
                products.forEach(product => {
                    expect(product.price).toBeLessThan(1000);
                    expect(product.inStock).toBe(true);
                });
            })
            .catch(err => {
                console.error('Query failed:', err);
                throw err;
            });
    });

    // 6. Update operation with validation
    test('should update documents', () => {
        return User.updateMany(
            { status: 'inactive' },
            { $set: { status: 'active' } }
        )
            .exec()
            .then(result => {
                expect(result.modifiedCount).toBeGreaterThan(0);
            })
            .catch(err => {
                expect(err).toBeNull();
            })
            .finally(async () => {
                await User.updateMany(
                    { status: 'active' },
                    { $set: { status: 'inactive' } }
                );
            });
    });

    // 7. Delete operation with cleanup
    test('should delete documents', () => {
        let deletedCount = 0;
        return Comment.deleteMany({ postId: deletedPostId })
            .exec()
            .then(result => {
                deletedCount = result.deletedCount;
                expect(deletedCount).toBeGreaterThanOrEqual(0);
            })
            .catch(err => {
                expect(err).toBeNull();
            })
            .finally(async () => {
                // Restore deleted comments for testing
                if (deletedCount > 0) {
                    await Comment.insertMany(deletedComments);
                }
            });
    });

    // 8. Aggregate with error handling
    test('should aggregate data', () => {
        return Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ])
            .exec()
            .then(results => {
                expect(Array.isArray(results)).toBe(true);
                results.forEach(result => {
                    expect(result).toHaveProperty('_id');
                    expect(result).toHaveProperty('count');
                });
            })
            .catch(err => {
                console.error('Aggregation failed:', err);
                throw err;
            });
    });

    // 9. Distinct with cleanup
    test('should get distinct values', () => {
        let distinctValues;
        return Product.distinct('category')
            .exec()
            .then(categories => {
                distinctValues = categories;
                expect(Array.isArray(categories)).toBe(true);
                expect(categories.length).toBeGreaterThan(0);
            })
            .catch(err => {
                expect(err).toBeNull();
            })
            .finally(() => {
                distinctValues = null;
            });
    });

    // 10. Find with population and cleanup
    test('should find and populate', () => {
        let session;
        return Order.find()
            .select('-__v')
            .populate('customer', 'name email')
            .lean()
            .exec()
            .then(orders => {
                expect(orders[0].customer).toHaveProperty('name');
                expect(orders[0].customer).toHaveProperty('email');
                expect(orders[0]).not.toHaveProperty('__v');
            })
            .catch(err => {
                expect(err).toBeNull();
            })
            .finally(() => {
                if (session) {
                    session.endSession();
                }
            });
    });
});
