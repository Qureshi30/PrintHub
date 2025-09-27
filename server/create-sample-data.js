const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const PrintJob = require('./src/models/PrintJob');
const User = require('./src/models/User');
const Printer = require('./src/models/Printer');

// Connect to MongoDB
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/PrintHub');
        console.log('📦 Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

// Sample data creation
async function createSampleData() {
    try {
        console.log('🗑️  Cleaning existing sample data...');

        // Clean existing sample data (be careful with this in production!)
        await PrintJob.deleteMany({ 'file.originalName': /^Sample_/ });

        console.log('👤 Finding user to create sample data for...');

        // Get the first user to create sample data for
        const user = await User.findOne();
        if (!user) {
            console.log('❌ No users found. Create a user first.');
            return;
        }

        console.log(`✅ Creating sample data for user: ${user.profile.email}`);

        // Create sample printers if they don't exist
        const printerCount = await Printer.countDocuments();
        if (printerCount === 0) {
            console.log('🖨️ Creating sample printers...');

            const samplePrinters = [
                {
                    name: 'HP LaserJet Pro 1',
                    location: 'Library Floor 1',
                    status: 'online',
                    isActive: true,
                    queue: [],
                    capabilities: {
                        color: false,
                        duplex: true,
                        maxPaperSize: 'A4',
                        supportedFormats: ['PDF', 'DOC', 'DOCX']
                    },
                    resources: {
                        paperLevel: 85,
                        inkLevel: 92,
                        tonerLevel: 78
                    }
                },
                {
                    name: 'Canon PIXMA Color 2',
                    location: 'Computer Lab',
                    status: 'online',
                    isActive: true,
                    queue: [],
                    capabilities: {
                        color: true,
                        duplex: true,
                        maxPaperSize: 'A4',
                        supportedFormats: ['PDF', 'JPG', 'PNG']
                    },
                    resources: {
                        paperLevel: 67,
                        inkLevel: 45,
                        tonerLevel: 89
                    }
                },
                {
                    name: 'Epson EcoTank 3',
                    location: 'Study Hall',
                    status: 'maintenance',
                    isActive: false,
                    queue: [],
                    capabilities: {
                        color: true,
                        duplex: false,
                        maxPaperSize: 'A3',
                        supportedFormats: ['PDF', 'DOC']
                    },
                    resources: {
                        paperLevel: 23,
                        inkLevel: 12,
                        tonerLevel: 56
                    }
                }
            ];

            await Printer.insertMany(samplePrinters);
            console.log('✅ Sample printers created');
        }

        // Get a printer for the sample jobs
        const printer = await Printer.findOne({ status: 'online' });
        if (!printer) {
            console.log('❌ No online printers found');
            return;
        }

        console.log('📄 Creating sample print jobs...');

        // Sample print jobs with different statuses and payment info
        const sampleJobs = [
            {
                clerkUserId: user.clerkUserId,
                printerId: printer._id,
                file: {
                    cloudinaryUrl: 'https://res.cloudinary.com/demo/sample1.pdf',
                    publicId: 'sample1',
                    originalName: 'Sample_Assignment1.pdf',
                    format: 'pdf',
                    sizeKB: 245
                },
                settings: {
                    pages: '1-5',
                    copies: 2,
                    color: false,
                    duplex: true,
                    paperType: 'A4'
                },
                status: 'completed',
                pricing: {
                    costPerPage: 2.5,
                    colorSurcharge: 0,
                    paperTypeSurcharge: 0,
                    totalCost: 25.0,
                    currency: 'INR'
                },
                payment: {
                    status: 'completed',
                    method: 'razorpay',
                    amount: 25.0,
                    paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
                },
                timing: {
                    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                    startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
                    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
                    misprint: false,
                    reprintCount: 0
                }
            },
            {
                clerkUserId: user.clerkUserId,
                printerId: printer._id,
                file: {
                    cloudinaryUrl: 'https://res.cloudinary.com/demo/sample2.pdf',
                    publicId: 'sample2',
                    originalName: 'Sample_Report.pdf',
                    format: 'pdf',
                    sizeKB: 1840
                },
                settings: {
                    pages: '1-12',
                    copies: 1,
                    color: true,
                    duplex: false,
                    paperType: 'A4'
                },
                status: 'completed',
                pricing: {
                    costPerPage: 2.5,
                    colorSurcharge: 1.5,
                    paperTypeSurcharge: 0,
                    totalCost: 48.0,
                    currency: 'INR'
                },
                payment: {
                    status: 'completed',
                    method: 'razorpay',
                    amount: 48.0,
                    paidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
                },
                timing: {
                    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                    startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 1000),
                    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000),
                    misprint: false,
                    reprintCount: 0
                }
            },
            {
                clerkUserId: user.clerkUserId,
                printerId: printer._id,
                file: {
                    cloudinaryUrl: 'https://res.cloudinary.com/demo/sample3.pdf',
                    publicId: 'sample3',
                    originalName: 'Sample_Presentation.pdf',
                    format: 'pdf',
                    sizeKB: 3200
                },
                settings: {
                    pages: '1-20',
                    copies: 3,
                    color: true,
                    duplex: true,
                    paperType: 'A4'
                },
                status: 'queued',
                pricing: {
                    costPerPage: 2.5,
                    colorSurcharge: 1.5,
                    paperTypeSurcharge: 0,
                    totalCost: 240.0,
                    currency: 'INR'
                },
                payment: {
                    status: 'completed',
                    method: 'razorpay',
                    amount: 240.0,
                    paidAt: new Date()
                },
                timing: {
                    submittedAt: new Date(),
                    misprint: false,
                    reprintCount: 0
                }
            },
            {
                clerkUserId: user.clerkUserId,
                printerId: printer._id,
                file: {
                    cloudinaryUrl: 'https://res.cloudinary.com/demo/sample4.pdf',
                    publicId: 'sample4',
                    originalName: 'Sample_Homework.pdf',
                    format: 'pdf',
                    sizeKB: 567
                },
                settings: {
                    pages: '1-3',
                    copies: 1,
                    color: false,
                    duplex: false,
                    paperType: 'A4'
                },
                status: 'printing',
                pricing: {
                    costPerPage: 2.5,
                    colorSurcharge: 0,
                    paperTypeSurcharge: 0,
                    totalCost: 7.5,
                    currency: 'INR'
                },
                payment: {
                    status: 'completed',
                    method: 'razorpay',
                    amount: 7.5,
                    paidAt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
                },
                timing: {
                    submittedAt: new Date(Date.now() - 5 * 60 * 1000),
                    startedAt: new Date(Date.now() - 2 * 60 * 1000),
                    misprint: false,
                    reprintCount: 0
                }
            }
        ];

        await PrintJob.insertMany(sampleJobs);
        console.log('✅ Sample print jobs created');

        // Update user statistics
        console.log('📊 Updating user statistics...');

        const userJobs = await PrintJob.find({ clerkUserId: user.clerkUserId });
        const completedJobs = userJobs.filter(job => job.status === 'completed').length;
        const totalSpent = userJobs
            .filter(job => job.payment && job.payment.status === 'completed')
            .reduce((sum, job) => sum + (job.payment.amount || 0), 0);
        const totalPages = userJobs.reduce((sum, job) => {
            const pages = job.settings.pages.includes('-') ?
                parseInt(job.settings.pages.split('-')[1]) - parseInt(job.settings.pages.split('-')[0]) + 1 :
                parseInt(job.settings.pages) || 1;
            return sum + (pages * job.settings.copies);
        }, 0);

        await User.findByIdAndUpdate(user._id, {
            $set: {
                'statistics.totalPrintJobs': userJobs.length,
                'statistics.totalPagesPrinted': totalPages,
                'statistics.totalAmountSpent': totalSpent,
                'statistics.averageJobSize': totalPages / userJobs.length || 0
            }
        });

        console.log('✅ Sample data creation completed!');
        console.log('📊 Summary:');
        console.log(`   - User: ${user.profile.email}`);
        console.log(`   - Total Jobs: ${userJobs.length}`);
        console.log(`   - Completed Jobs: ${completedJobs}`);
        console.log(`   - Total Spent: ₹${totalSpent.toFixed(2)}`);
        console.log(`   - Total Pages: ${totalPages}`);

    } catch (error) {
        console.error('❌ Error creating sample data:', error);
    }
}

// Main execution
(async () => {
    try {
        await connectDB();
        await createSampleData();

        console.log('\n🎉 Sample data creation completed successfully!');
        console.log('You can now test the dashboard with real data from the database.');

    } catch (error) {
        console.error('💥 Script execution failed:', error);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
})();