const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const Project = require('./models/Project');
const User = require('./models/user');

const MONGO_URI = 'mongodb+srv://pratyushranjan551:sag8Dwhjunxilw89@cluster0.juxe8yi.mongodb.net/collab_platform?retryWrites=true&w=majority&appName=Cluster0';

async function seed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');

    // Optional: Clear existing projects
    await Project.deleteMany({});
    console.log('🗑️ Existing projects cleared');

    const users = await User.find();
    if (users.length === 0) {
      console.log('⚠️ No users found. Please create some users first.');
      process.exit(1);
    }

    const projects = [];
    for (let i = 0; i < 5; i++) {
      // Pick random members
      const memberCount = Math.floor(Math.random() * users.length) + 1;
      const members = faker.helpers.shuffle(users).slice(0, memberCount);

      const project = new Project({
        name: faker.company.name(), // ✅ updated for new Faker API
        description: faker.lorem.sentence(),
        members: members.map((m) => m._id),
        createdBy: members[0]._id, // First member as creator
      });

      await project.save();
      projects.push(project);
      console.log(`✅ Project created: ${project.name}`);
    }

    console.log(`🎉 ${projects.length} projects seeded successfully!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
