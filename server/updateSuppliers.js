require('dotenv').config();
const mongoose = require('mongoose');
const Supplier = require('./src/models/Supplier.model');

const updateSuppliers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const suppliers = await Supplier.find();
        console.log(`\n📦 Found ${suppliers.length} suppliers to update\n`);

        // Sample data for each supplier
        const supplierUpdates = [
            {
                name: 'Fresh Farm Suppliers',
                category: 'Vegetables',
                contractExpiryDate: new Date('2026-08-15'),
                paymentTerms: 'Net 30',
                businessRegistrationNo: 'BR/2020/12345',
                vatNumber: 'VAT-FFS-001',
                rating: {
                    deliverySpeed: 5,
                    quality: 5,
                    communication: 4,
                    pricing: 4
                }
            },
            {
                name: 'Ocean Seafood Co.',
                category: 'Seafood',
                contractExpiryDate: new Date('2026-11-30'),
                paymentTerms: 'Net 60',
                businessRegistrationNo: 'BR/2019/67890',
                vatNumber: 'VAT-OSC-002',
                rating: {
                    deliverySpeed: 4,
                    quality: 5,
                    communication: 5,
                    pricing: 3
                }
            },
            {
                name: 'Spice Garden',
                category: 'Spices',
                contractExpiryDate: new Date('2026-09-20'),
                paymentTerms: 'Net 90',
                businessRegistrationNo: 'BR/2018/44556',
                vatNumber: 'VAT-SG-003',
                rating: {
                    deliverySpeed: 4,
                    quality: 5,
                    communication: 4,
                    pricing: 5
                }
            },
            {
                name: 'Dairy Fresh',
                category: 'Dairy',
                contractExpiryDate: new Date('2025-05-10'),
                paymentTerms: 'COD',
                businessRegistrationNo: 'BR/2020/77889',
                vatNumber: 'VAT-DF-004',
                rating: {
                    deliverySpeed: 5,
                    quality: 4,
                    communication: 5,
                    pricing: 4
                }
            },
            {
                name: 'Golden Harvest',
                category: 'Grains',
                contractExpiryDate: new Date('2027-01-31'),
                paymentTerms: 'Advance Payment',
                businessRegistrationNo: 'BR/2021/99001',
                vatNumber: 'VAT-GH-005',
                rating: {
                    deliverySpeed: 5,
                    quality: 5,
                    communication: 5,
                    pricing: 5
                }
            }
        ];

        for (let i = 0; i < suppliers.length; i++) {
            const supplier = suppliers[i];
            
            // Find matching update data or use default
            let updateData = supplierUpdates.find(u => u.name === supplier.name);
            
            if (!updateData) {
                // Default data for any additional suppliers
                updateData = {
                    category: 'Other',
                    contractExpiryDate: new Date('2026-12-31'),
                    paymentTerms: 'Net 30',
                    businessRegistrationNo: `BR/2024/${10000 + i}`,
                    vatNumber: `VAT-SUP-${String(i + 1).padStart(3, '0')}`,
                    rating: {
                        deliverySpeed: 4,
                        quality: 4,
                        communication: 4,
                        pricing: 4
                    }
                };
            }

            // Update supplier
            await Supplier.findByIdAndUpdate(supplier._id, updateData);
            
            console.log(`✅ Updated: ${supplier.name}`);
            console.log(`   Category: ${updateData.category}`);
            console.log(`   Payment Terms: ${updateData.paymentTerms}`);
            console.log(`   Contract Expiry: ${updateData.contractExpiryDate.toLocaleDateString()}`);
            console.log(`   BR No: ${updateData.businessRegistrationNo}`);
            console.log(`   VAT No: ${updateData.vatNumber}`);
            console.log(`   Avg Rating: ${((updateData.rating.deliverySpeed + updateData.rating.quality + updateData.rating.communication + updateData.rating.pricing) / 4).toFixed(1)} ⭐\n`);
        }

        console.log('✅ All suppliers updated successfully!');
        
        // Display updated suppliers
        const updatedSuppliers = await Supplier.find();
        console.log('\n📋 Updated Supplier List:\n');
        updatedSuppliers.forEach((s, idx) => {
            const avgRating = ((s.rating.deliverySpeed + s.rating.quality + s.rating.communication + s.rating.pricing) / 4).toFixed(1);
            console.log(`${idx + 1}. ${s.name}`);
            console.log(`   📦 Category: ${s.category}`);
            console.log(`   💳 Payment: ${s.paymentTerms}`);
            console.log(`   📅 Contract Expires: ${new Date(s.contractExpiryDate).toLocaleDateString()}`);
            console.log(`   📄 BR: ${s.businessRegistrationNo} | VAT: ${s.vatNumber}`);
            console.log(`   ⭐ Rating: ${avgRating}/5.0\n`);
        });

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

updateSuppliers();
